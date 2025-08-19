import type { MetaFunction, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, useNavigation, Form, Link } from "@remix-run/react";
import { useState, useEffect } from "react";
import invariant from "tiny-invariant";

import PostCard from "~/components/forum/PostCard";
import CommentThread from "~/components/forum/CommentThread";
import Button from "~/components/Button";
import TextField from "~/components/TextField";
import VoteButtons from "~/components/forum/VoteButtons";
import { getSupabaseClient } from "~/utils/getSupabaseClient";
import { formatDate } from "~/utils/formatDate";
import { getUserIdentifier, generateGuestNumber, generateGuestEmail, isGuestEmail, isSameGuest } from "~/utils/guestUtils";
import type { Post, Comment } from "~/types/forum";

export async function loader({ params }: LoaderFunctionArgs) {
  invariant(params.postId, "Missing postId param");
  
  const supabase = getSupabaseClient();

  // Fetch post with basic data first
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("*")
    .eq("id", params.postId)
    .eq("status", "published")
    .single();

  if (postError || !post) {
    throw new Response("Post not found", { status: 404 });
  }

  // Fetch related data separately
  const [categoryResult, tagsResult] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("id", post.category_id)
      .single(),
    supabase
      .from("post_tags")
      .select("tag:tags(*)")
      .eq("post_id", post.id)
  ]);

  // Add the related data to the post
  const postWithRelations = {
    ...post,
    category: categoryResult.data,
    tags: tagsResult.data?.map((pt: any) => pt.tag).filter(Boolean) || []
  };

  // Fetch comments with nested replies
  const { data: comments, error: commentsError } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", params.postId)
    .eq("status", "published")
    .order("created_at", { ascending: true });

  if (commentsError) {
    throw new Response("Failed to load comments", { status: 500 });
  }

  // Transform post data
  const transformedPost: Post = postWithRelations;

  // Build comment tree
  const commentMap = new Map();
  const rootComments: Comment[] = [];

  // First pass: create all comment objects
  comments.forEach((comment: any) => {
    const transformedComment: Comment = {
      ...comment,
      replies: []
    };
    commentMap.set(comment.id, transformedComment);
  });

  // Second pass: build the tree structure
  comments.forEach((comment: any) => {
    const transformedComment = commentMap.get(comment.id);
    if (comment.parent_id) {
      const parent = commentMap.get(comment.parent_id);
      if (parent) {
        parent.replies = parent.replies || [];
        parent.replies.push(transformedComment);
      }
    } else {
      rootComments.push(transformedComment);
    }
  });

  // Increment view count (fire and forget)
  supabase
    .from("posts")
    .update({ views_count: postWithRelations.views_count + 1 })
    .eq("id", params.postId)
    .then(() => {})
    .catch(() => {});

  return Response.json({ 
    post: transformedPost, 
    comments: rootComments,
    totalComments: comments.length 
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  invariant(params.postId, "Missing postId param");
  
  const formData = await request.formData();
  const intent = formData.get("intent");
  const supabase = getSupabaseClient();
  
  // Get user identifier for guest tracking
  const userIdentifier = getUserIdentifier(request);

  if (intent === "vote") {
    const voteType = formData.get("voteType") as "up" | "down";
    const guestId = formData.get("guestId"); // Could be IP + session for guests
    
    // TODO: Implement voting logic
    return Response.json({ success: true });
  }

  if (intent === "comment") {
    const content = formData.get("content") as string;
    const authorName = formData.get("authorName") as string;
    const authorEmail = formData.get("authorEmail") as string;
    const parentId = formData.get("parentId") as string | null;

    if (!content.trim()) {
      return Response.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Handle guest users
    let finalAuthorName = authorName?.trim();
    let finalAuthorEmail = authorEmail?.trim();

    if (!finalAuthorName || !finalAuthorEmail) {
      // Generate guest number if no name/email provided
      const guestNumber = generateGuestNumber(userIdentifier);
      finalAuthorName = guestNumber;
      finalAuthorEmail = generateGuestEmail(guestNumber);
    }

    const { data: comment, error } = await supabase
      .from("comments")
      .insert({
        post_id: params.postId,
        parent_id: parentId || null,
        content: content.trim(),
        author_name: finalAuthorName,
        author_email: finalAuthorEmail,
        status: "published"
      })
      .select()
      .single();

    if (error) {
      return Response.json(
        { error: "Failed to post comment" },
        { status: 500 }
      );
    }

    return Response.json({ success: true, comment });
  }

  if (intent === "edit") {
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const excerpt = formData.get("excerpt") as string;
    const authorEmail = formData.get("authorEmail") as string;

    // Basic validation
    if (!title?.trim() || !content?.trim() || !authorEmail?.trim()) {
      return Response.json(
        { error: "Title, content, and email are required" },
        { status: 400 }
      );
    }

    // Fetch current post to verify ownership
    const { data: currentPost, error: fetchError } = await supabase
      .from("posts")
      .select("author_email")
      .eq("id", params.postId)
      .single();

    if (fetchError || !currentPost) {
      return Response.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Verify the user can edit this post
    const isAuthorizedToEdit = authorEmail.trim().toLowerCase() === currentPost.author_email?.toLowerCase();
    
    // Additional check: guests can only edit their own posts based on email match
    if (!isAuthorizedToEdit) {
      return Response.json(
        { error: "You can only edit your own posts. Please use the same email address you used when creating the post." },
        { status: 403 }
      );
    }

    // Prevent guests from editing posts created by registered users (and vice versa)
    const isCurrentPostByGuest = isGuestEmail(currentPost.author_email || '');
    const isEditRequestByGuest = isGuestEmail(authorEmail.trim());
    
    if (isCurrentPostByGuest !== isEditRequestByGuest) {
      return Response.json(
        { error: "Guest users can only edit guest posts, and registered users can only edit registered posts." },
        { status: 403 }
      );
    }

    const { data: updatedPost, error } = await supabase
      .from("posts")
      .update({
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt?.trim() || title.trim().substring(0, 150) + "...",
        updated_at: new Date().toISOString()
      })
      .eq("id", params.postId)
      .select()
      .single();

    if (error) {
      return Response.json(
        { error: "Failed to update post" },
        { status: 500 }
      );
    }

    return Response.json({ success: true, post: updatedPost });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.post) {
    return [{ title: "Post not found" }];
  }

  return [
    { title: `${data.post.title} - AI Vibecoding Forum` },
    { name: "description", content: data.post.excerpt || `Discussion about ${data.post.title}` },
  ];
};

export default function PostDetail() {
  const { post, comments, totalComments } = useLoaderData<typeof loader>();
  const actionData = useActionData<{ error?: string; success?: boolean }>();
  const navigation = useNavigation();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');

  const isSubmittingComment = navigation.state === "submitting" && 
    navigation.formData?.get("intent") === "comment";
  const isSubmittingEdit = navigation.state === "submitting" && 
    navigation.formData?.get("intent") === "edit";

  // Close comment form after successful submission
  useEffect(() => {
    if (actionData?.success && !actionData?.error) {
      setShowReplyForm(false);
      setIsEditingPost(false);
    }
  }, [actionData]);

  // Check if current user can edit this post
  const canEditPost = currentUserEmail && 
    currentUserEmail.toLowerCase() === post.author_email?.toLowerCase();

  const handleVote = async (voteType: 'up' | 'down') => {
    // TODO: Implement voting logic
    console.log(`Voting ${voteType} on post ${post.id}`);
  };

  const handleReply = async (parentId: string, content: string, authorName?: string, authorEmail?: string) => {
    // This will be handled by the form submission in CommentThread
    console.log(`Replying to ${parentId}: ${content}`);
  };

  const handleCommentVote = async (commentId: string, voteType: 'up' | 'down') => {
    // TODO: Implement comment voting
    console.log(`Voting ${voteType} on comment ${commentId}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-slate-600">
        <Link to="/" className="hover:text-cyan-600">Home</Link>
        <span className="mx-2">›</span>
        <Link to="/posts" className="hover:text-cyan-600">Posts</Link>
        {post.category && (
          <>
            <span className="mx-2">›</span>
            <Link to={`/categories/${post.category.slug}`} className="hover:text-cyan-600">
              {post.category.name}
            </Link>
          </>
        )}
        <span className="mx-2">›</span>
        <span className="text-slate-900 font-medium truncate">{post.title}</span>
      </nav>

      {/* Post Content */}
      <article className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden mb-8">
        <div className="p-6">
          {/* Post Header */}
          <div className="flex gap-4 mb-6">
            <div className="flex-shrink-0">
              <VoteButtons
                itemId={post.id}
                itemType="post"
                votesCount={post.votes_count}
                onVote={handleVote}
              />
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Category and status */}
              <div className="flex items-center gap-2 mb-3">
                {post.is_pinned && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded-full">
                    📌 Pinned
                  </span>
                )}
                {post.category && (
                  <Link
                    to={`/categories/${post.category.slug}`}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full transition-colors"
                    style={{ 
                      backgroundColor: `${post.category.color}20`,
                      color: post.category.color 
                    }}
                  >
                    <span>{post.category.icon}</span>
                    {post.category.name}
                  </Link>
                )}
              </div>

                        {/* Title */}
          {isEditingPost ? (
            <div className="mb-4">
              <Form method="post" className="space-y-4">
                <input type="hidden" name="intent" value="edit" />
                <input type="hidden" name="authorEmail" value={post.author_email} />
                
                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium text-slate-700 mb-2">
                    Post Title *
                  </label>
                  <input
                    type="text"
                    id="edit-title"
                    name="title"
                    defaultValue={post.title}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-content" className="block text-sm font-medium text-slate-700 mb-2">
                    Post Content *
                  </label>
                  <textarea
                    id="edit-content"
                    name="content"
                    rows={12}
                    defaultValue={post.content}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-excerpt" className="block text-sm font-medium text-slate-700 mb-2">
                    Short Description
                  </label>
                  <textarea
                    id="edit-excerpt"
                    name="excerpt"
                    rows={2}
                    defaultValue={post.excerpt}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>

                {actionData?.error && (
                  <p className="text-sm text-red-600">{actionData.error}</p>
                )}

                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={isSubmittingEdit}>
                    {isSubmittingEdit ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outlined"
                    onClick={() => setIsEditingPost(false)}
                    disabled={isSubmittingEdit}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </div>
          ) : (
            <h1 className="text-3xl font-bold text-slate-900 mb-4">{post.title}</h1>
          )}

              {/* Author and meta */}
              <div className="flex items-center gap-4 text-sm text-slate-600 mb-6">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {post.author_profile?.display_name || post.author_name || 'Anonymous'}
                  </span>
                  {post.author_profile?.reputation_points && (
                    <span className="text-xs text-amber-600 font-medium">
                      {post.author_profile.reputation_points} pts
                    </span>
                  )}
                </div>
                <time dateTime={post.created_at}>
                  {formatDate(post.created_at)}
                </time>
                <span>{post.views_count} views</span>
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      to={`/tags/${tag.slug}`}
                      className="inline-block px-2 py-1 text-xs font-medium rounded-md hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: `${tag.color}15`, color: tag.color }}
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Post Content */}
          {!isEditingPost && (
            <div className="prose prose-slate max-w-none">
              {post.content.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          {/* Post Actions */}
          <div className="flex items-center gap-4 mt-6 pt-6 border-t border-slate-200">
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
              disabled={isEditingPost}
            >
              Reply to Post
            </button>
            {canEditPost && (
              <button 
                onClick={() => setIsEditingPost(!isEditingPost)}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
                disabled={showReplyForm}
              >
                {isEditingPost ? 'Cancel Edit' : 'Edit Post'}
              </button>
            )}
            <button className="text-sm text-slate-500 hover:text-red-600">
              Report
            </button>
            <div className="ml-auto text-sm text-slate-500">
              {totalComments} {totalComments === 1 ? 'comment' : 'comments'}
            </div>
          </div>
        </div>

        {/* Reply Form */}
        {showReplyForm && (
          <div className="border-t border-slate-200 p-6 bg-slate-50">
            <h3 className="font-semibold text-slate-900 mb-4">Add a Comment</h3>
            <Form method="post" className="space-y-4">
              <input type="hidden" name="intent" value="comment" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  id="authorName"
                  name="authorName"
                  label="Your Name (optional)"
                  placeholder="Enter your name or leave blank for guest number"
                  defaultValue={currentUserEmail && !isGuestEmail(currentUserEmail) ? '' : ''}
                />
                <div>
                  <TextField
                    id="authorEmail"
                    name="authorEmail"
                    label="Email (optional)"
                    type="email"
                    placeholder="your@email.com"
                    defaultValue={currentUserEmail}
                    onChange={(e) => setCurrentUserEmail(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    💡 Use the same email to edit your posts later
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-2">
                  Comment *
                </label>
                <textarea
                  id="content"
                  name="content"
                  required
                  rows={4}
                  placeholder="Share your thoughts..."
                  className="block w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100 focus:outline-none"
                />
              </div>

              {actionData?.error && (
                <p className="text-sm text-red-600">{actionData.error}</p>
              )}

              <div className="flex items-center gap-2">
                <Button type="submit" disabled={isSubmittingComment}>
                  {isSubmittingComment ? "Posting..." : "Post Comment"}
                </Button>
                <Button 
                  type="button" 
                  variant="outlined"
                  onClick={() => setShowReplyForm(false)}
                  disabled={isSubmittingComment}
                >
                  Cancel
                </Button>
              </div>
            </Form>
          </div>
        )}
      </article>

      {/* Comments Section */}
      <section>
        <h2 className="text-2xl font-semibold text-slate-900 mb-6">
          Comments ({totalComments})
        </h2>
        
        {comments.length > 0 ? (
          <CommentThread
            comments={comments}
            postId={post.id}
            onReply={handleReply}
            onVote={handleCommentVote}
            currentUserEmail={currentUserEmail}
            setCurrentUserEmail={setCurrentUserEmail}
          />
        ) : (
          <div className="text-center py-8 bg-white rounded-xl shadow-md border border-slate-200">
            <div className="text-slate-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No comments yet</h3>
            <p className="text-slate-600 mb-4">Be the first to share your thoughts!</p>
            <Button onClick={() => setShowReplyForm(true)}>
              Add First Comment
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

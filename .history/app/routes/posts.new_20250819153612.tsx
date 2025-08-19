import type { MetaFunction, ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData, useActionData, useNavigation, Link } from "@remix-run/react";
import { useState } from "react";

import { getSupabaseClient } from "~/utils/getSupabaseClient";
import { requireAuth, getUserProfile } from "~/utils/auth.server";
import type { Category, Tag } from "~/types/forum";

export async function loader({ request }: LoaderFunctionArgs) {
  // Require authentication to create posts
  const user = await requireAuth(request);
  const supabase = getSupabaseClient();

  // Fetch categories and tags for the form
  const [categoriesResult, tagsResult] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .order("name"),
    supabase
      .from("tags")
      .select("*")
      .order("usage_count", { ascending: false })
      .limit(20)
  ]);

  if (categoriesResult.error) {
    throw new Response("Failed to load categories", { status: 500 });
  }

  // Fetch user profile
  const userProfile = await getUserProfile(user.id);

  return Response.json({
    categories: categoriesResult.data || [],
    popularTags: tagsResult.data || [],
    user,
    userProfile
  });
}

export async function action({ request }: ActionFunctionArgs) {
  // Require authentication to create posts
  const user = await requireAuth(request);
  
  const formData = await request.formData();
  const supabase = getSupabaseClient();

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const excerpt = formData.get("excerpt") as string;
  const categoryId = formData.get("category_id") as string;
  const selectedTags = formData.getAll("tags") as string[];

  // Validation
  const errors: Record<string, string> = {};
  
  if (!title?.trim()) errors.title = "Title is required";
  if (!content?.trim()) errors.content = "Content is required";
  if (!categoryId) errors.category = "Category is required";

  // Get user profile for display name
  const userProfile = await getUserProfile(user.id);
  const displayName = userProfile?.display_name || user.email?.split('@')[0] || 'Anonymous User';

  if (Object.keys(errors).length > 0) {
    return Response.json({ errors }, { status: 400 });
  }

  try {
    // Create the post with authenticated user data
    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt?.trim() || title.trim().substring(0, 150) + "...",
        category_id: categoryId,
        author_id: user.id,
        author_name: displayName,
        author_email: user.email,
        status: "published"
      })
      .select()
      .single();

    if (postError) {
      throw new Error(postError.message);
    }

    // Add tags if any selected
    if (selectedTags.length > 0 && post) {
      const tagInserts = selectedTags.map(tagId => ({
        post_id: post.id,
        tag_id: tagId
      }));

      const { error: tagsError } = await supabase
        .from("post_tags")
        .insert(tagInserts);

      if (tagsError) {
        console.error("Failed to add tags:", tagsError);
        // Don't fail the whole operation for tag errors
      }
    }

    // Redirect to the new post
    return redirect(`/posts/${post.id}`);

  } catch (error) {
    console.error("Error creating post:", error);
    return Response.json(
      { errors: { general: "Failed to create post. Please try again." } },
      { status: 500 }
    );
  }
}

export const meta: MetaFunction = () => {
  return [
    { title: "Create New Post - AI Vibecoding Forum" },
    { name: "description", content: "Share your AI projects, get help with code, or start a discussion in our vibecoding community." },
  ];
};

export default function NewPost() {
  const { categories, popularTags } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const isSubmitting = navigation.state === "submitting";
  const errors = actionData?.errors || {};

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-slate-600">
        <Link to="/" className="hover:text-cyan-600">Home</Link>
        <span className="mx-2">›</span>
        <Link to="/posts" className="hover:text-cyan-600">Posts</Link>
        <span className="mx-2">›</span>
        <span className="text-slate-900 font-medium">Create New Post</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Create New Post</h1>
        <p className="text-slate-600">
          Share your AI projects, ask for code help, or start a discussion with the vibecoding community.
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
        <Form method="post" className="space-y-6">
          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{errors.general}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
              Post Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              placeholder="What's your post about?"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${
                errors.title ? 'border-red-300' : 'border-slate-300'
              }`}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          {/* Author Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="author_name" className="block text-sm font-medium text-slate-700 mb-2">
                Your Name (optional)
              </label>
              <input
                type="text"
                id="author_name"
                name="author_name"
                placeholder="Your name (leave blank for guest number)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
              <p className="mt-1 text-xs text-slate-500">Guest users will get an auto-generated number if no name is provided</p>
            </div>

            <div>
              <label htmlFor="author_email" className="block text-sm font-medium text-slate-700 mb-2">
                Your Email (optional)
              </label>
              <input
                type="email"
                id="author_email"
                name="author_email"
                placeholder="your@email.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
              <p className="mt-1 text-xs text-slate-500">💡 Use the same email to edit your posts later</p>
            </div>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category_id" className="block text-sm font-medium text-slate-700 mb-2">
              Category *
            </label>
            <select
              id="category_id"
              name="category_id"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${
                errors.category ? 'border-red-300' : 'border-slate-300'
              }`}
            >
              <option value="">Select a category...</option>
              {categories.map((category: Category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-2">
              Post Content *
            </label>
            <textarea
              id="content"
              name="content"
              rows={12}
              placeholder="Write your post content here... You can use Markdown formatting."
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${
                errors.content ? 'border-red-300' : 'border-slate-300'
              }`}
            />
            {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
            <p className="mt-2 text-sm text-slate-500">
              Tip: Use **bold**, *italic*, `code`, and code blocks with ```language to format your content.
            </p>
          </div>

          {/* Excerpt */}
          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium text-slate-700 mb-2">
              Short Description (Optional)
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              rows={2}
              placeholder="Brief summary of your post (will be auto-generated if left empty)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tags (Optional)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {popularTags.map((tag: Tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                    selectedTags.includes(tag.id)
                      ? 'bg-cyan-100 border-cyan-300 text-cyan-700'
                      : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  #{tag.name}
                </button>
              ))}
            </div>
            {selectedTags.map(tagId => (
              <input key={tagId} type="hidden" name="tags" value={tagId} />
            ))}
            <p className="text-sm text-slate-500">Click tags to add them to your post.</p>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <Link
              to="/posts"
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Creating Post..." : "Create Post"}
            </button>
          </div>
        </Form>
      </div>

      {/* Guidelines */}
      <div className="mt-8 bg-slate-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">📝 Posting Guidelines</h3>
        <ul className="space-y-2 text-sm text-slate-600">
          <li>• Be clear and descriptive in your title</li>
          <li>• Include relevant code examples when asking for help</li>
          <li>• Choose the most appropriate category for your post</li>
          <li>• Add tags to help others find your content</li>
          <li>• Be respectful and constructive in your posts</li>
          <li>• Search existing posts before creating duplicates</li>
        </ul>
      </div>
    </div>
  );
}

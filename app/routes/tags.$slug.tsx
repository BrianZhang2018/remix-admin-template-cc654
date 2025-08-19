import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import invariant from "tiny-invariant";

import PostCard from "~/components/forum/PostCard";
import { getSupabaseClient } from "~/utils/getSupabaseClient";
import type { Post, Tag } from "~/types/forum";

export async function loader({ params }: LoaderFunctionArgs) {
  invariant(params.slug, "Missing tag slug param");
  
  const supabase = getSupabaseClient();

  // Fetch tag
  const { data: tag, error: tagError } = await supabase
    .from("tags")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (tagError || !tag) {
    throw new Response("Tag not found", { status: 404 });
  }

  // Fetch posts with this tag
  const { data: postsData, error: postsError } = await supabase
    .from("posts")
    .select(`
      *,
      category:categories(*),
      tags:post_tags(tag:tags(*))
    `)
    .eq("post_tags.tag_id", tag.id)
    .eq("status", "published")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (postsError) {
    throw new Response("Failed to load posts", { status: 500 });
  }

  // Transform the data
  const posts: Post[] = postsData.map((post: any) => ({
    ...post,
    tags: post.tags.map((pt: any) => pt.tag).filter(Boolean)
  }));

  return Response.json({ tag, posts });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.tag) {
    return [{ title: "Tag not found" }];
  }

  return [
    { title: `#${data.tag.name} Posts - AI VibeCoding Forum` },
    { name: "description", content: `Browse all posts tagged with ${data.tag.name} in the AI VibeCoding Forum.` },
  ];
};

export default function TagPage() {
  const { tag, posts } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8 text-lg text-slate-600">
        <Link to="/" className="hover:text-cyan-600 font-medium">Home</Link>
        <span className="mx-3 text-xl">›</span>
        <Link to="/posts" className="hover:text-cyan-600 font-medium">Posts</Link>
        <span className="mx-3 text-xl">›</span>
        <span className="text-slate-900 font-semibold">#{tag.name}</span>
      </nav>

      {/* Tag Header */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-8 mb-8">
        <div className="flex items-center gap-4 mb-4">
          <span 
            className="text-2xl font-bold px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: tag.color }}
          >
            #{tag.name}
          </span>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Posts tagged with "{tag.name}"</h1>
            <p className="text-slate-600">
              Discover discussions and content related to {tag.name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <span>
              <span className="font-semibold text-slate-900">{posts.length}</span> posts found
            </span>
            <span>
              <span className="font-semibold text-slate-900">{tag.usage_count}</span> total posts with this tag
            </span>
          </div>
          <Link to="/posts/new">
            <button className="px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors">
              Create Post
            </button>
          </Link>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-6">
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post}
              showCategory={true}
              showTags={true}
              showExcerpt={true}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-md border border-slate-200">
            <div className="text-slate-400 mb-4">
              <span 
                className="text-4xl font-bold px-6 py-3 rounded-lg"
                style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
              >
                #{tag.name}
              </span>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No posts with this tag yet</h3>
            <p className="text-slate-600 mb-4">Be the first to create content about {tag.name}!</p>
            <Link to="/posts/new">
              <button className="px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors">
                Create First Post
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Related Tags */}
      <div className="mt-12 bg-white rounded-xl shadow-md border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Explore Related Topics</h3>
        <div className="flex flex-wrap gap-2">
          <Link to="/tags/javascript" className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors">
            #javascript
          </Link>
          <Link to="/tags/python" className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors">
            #python
          </Link>
          <Link to="/tags/ai" className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors">
            #ai
          </Link>
          <Link to="/tags/react" className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors">
            #react
          </Link>
          <Link to="/posts" className="px-3 py-1 text-sm text-cyan-600 hover:text-cyan-700 transition-colors">
            View all posts →
          </Link>
        </div>
      </div>
    </div>
  );
}


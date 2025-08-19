import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import invariant from "tiny-invariant";

import PostCard from "~/components/forum/PostCard";
import { getSupabaseClient } from "~/utils/getSupabaseClient";
import type { Post, Category } from "~/types/forum";

export async function loader({ params }: LoaderFunctionArgs) {
  invariant(params.slug, "Missing category slug param");
  
  const supabase = getSupabaseClient();

  // Fetch category
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (categoryError || !category) {
    throw new Response("Category not found", { status: 404 });
  }

  // Fetch posts in this category
  const { data: postsData, error: postsError } = await supabase
    .from("posts")
    .select(`
      *,
      category:categories(*),
      tags:post_tags(tag:tags(*))
    `)
    .eq("category_id", category.id)
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

  return Response.json({ category, posts });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.category) {
    return [{ title: "Category not found" }];
  }

  return [
    { title: `${data.category.name} - AI Vibecoding Forum` },
    { name: "description", content: data.category.description },
  ];
};

export default function CategoryPage() {
  const { category, posts } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8 text-lg text-slate-600">
        <Link to="/" className="hover:text-cyan-600 font-medium">Home</Link>
        <span className="mx-3 text-xl">›</span>
        <Link to="/posts" className="hover:text-cyan-600 font-medium">Posts</Link>
        <span className="mx-3 text-xl">›</span>
        <span className="text-slate-900 font-semibold">{category.name}</span>
      </nav>

      {/* Category Header */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-8 mb-8">
        <div className="flex items-center gap-4 mb-4">
          <span 
            className="text-4xl p-3 rounded-lg"
            style={{ backgroundColor: `${category.color}20` }}
          >
            {category.icon}
          </span>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{category.name}</h1>
            <p className="text-slate-600 text-lg">{category.description}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <span>
              <span className="font-semibold text-slate-900">{posts.length}</span> posts
            </span>
            <span>
              <span className="font-semibold text-slate-900">{category.post_count}</span> total posts
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
              showCategory={false}
              showTags={true}
              showExcerpt={true}
            />
          ))
        ) : (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex flex-col items-center gap-1">
                  <button className="flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200 text-slate-400 hover:text-green-500 hover:bg-green-50 cursor-pointer" aria-label="Upvote" title="Upvote">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd"></path></svg>
                  </button>
                  <span className="text-sm font-medium min-w-[2rem] text-center text-slate-500">0</span>
                  <button className="flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200 text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer" aria-label="Downvote" title="Downvote">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-slate-900 mb-2 text-xl">No posts in this category yet</h2>
                    <p className="text-slate-600 text-sm mb-3">Be the first to start a discussion in {category.name}. Share your knowledge and help build our community!</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ backgroundColor: category.color }}>
                      {category.icon}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Community</span>
                    </div>
                    <time className="whitespace-nowrap">Ready for your contribution</time>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link to="/posts/new" className="flex items-center gap-1 hover:text-cyan-600 transition-colors">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"></path></svg>
                      <span>Create Post</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


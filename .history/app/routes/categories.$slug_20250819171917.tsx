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
      <nav className="mb-6 text-sm text-slate-600">
        <Link to="/" className="hover:text-cyan-600">Home</Link>
        <span className="mx-2">›</span>
        <Link to="/posts" className="hover:text-cyan-600">Posts</Link>
        <span className="mx-2">›</span>
        <span className="text-slate-900 font-medium">{category.name}</span>
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
          <div className="text-center py-12 bg-white rounded-xl shadow-md border border-slate-200">
            <div className="text-slate-400 mb-4" style={{ color: category.color }}>
              <span className="text-6xl">{category.icon}</span>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No posts in this category yet</h3>
            <p className="text-slate-600 mb-4">Be the first to start a discussion in {category.name}!</p>
            <Link to="/posts/new">
              <button className="px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors">
                Create First Post
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}


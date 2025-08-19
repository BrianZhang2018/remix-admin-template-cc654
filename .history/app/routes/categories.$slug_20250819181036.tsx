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
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-8">
            <div className="flex items-center gap-6 mb-6">
              <div className="flex-shrink-0">
                <span 
                  className="text-6xl p-4 rounded-2xl"
                  style={{ backgroundColor: `${category.color}20`, color: category.color }}
                >
                  {category.icon}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Ready to start something amazing?</h3>
                <p className="text-slate-600 text-lg mb-4">
                  Be the first to share your knowledge and insights in {category.name}. 
                  Help build our community by starting a meaningful discussion.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link to="/posts/new">
                    <button className="px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors font-medium">
                      Create First Post
                    </button>
                  </Link>
                  <Link to="/posts">
                    <button className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium">
                      Browse All Posts
                    </button>
                  </Link>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-200 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl mb-2">🎯</div>
                  <h4 className="font-semibold text-slate-900 mb-1">Share Knowledge</h4>
                  <p className="text-sm text-slate-600">Help others learn and grow</p>
                </div>
                <div>
                  <div className="text-2xl mb-2">💬</div>
                  <h4 className="font-semibold text-slate-900 mb-1">Start Discussions</h4>
                  <p className="text-sm text-slate-600">Engage with the community</p>
                </div>
                <div>
                  <div className="text-2xl mb-2">🚀</div>
                  <h4 className="font-semibold text-slate-900 mb-1">Get Recognition</h4>
                  <p className="text-sm text-slate-600">Build your reputation</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


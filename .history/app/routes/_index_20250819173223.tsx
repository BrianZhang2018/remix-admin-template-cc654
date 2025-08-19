import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, Form } from "@remix-run/react";

import Logo from "~/components/Logo";
import PostCard from "~/components/forum/PostCard";
import { getSupabaseClient } from "~/utils/getSupabaseClient";
import { getOptionalUser } from "~/utils/auth.server";
import type { Post, Category } from "~/types/forum";

export async function loader({ request }: LoaderFunctionArgs) {
  const supabase = getSupabaseClient();
  
  // Fetch featured/pinned posts and categories
  const [postsResult, categoriesResult] = await Promise.all([
    supabase
      .from("posts")
      .select(`
        *,
        category:categories(*),
        tags:post_tags(tag:tags(*))
      `)
      .eq("status", "published")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6),
    
    supabase
      .from("categories")
      .select("*")
      .order("post_count", { ascending: false })
  ]);

  if (postsResult.error || categoriesResult.error) {
    throw new Response("Failed to load forum data", { status: 500 });
  }

  // Transform the data to match our types
  const posts: Post[] = postsResult.data.map((post: any) => ({
    ...post,
    tags: post.tags.map((pt: any) => pt.tag)
  }));

  const categories: Category[] = categoriesResult.data;

  return Response.json({ posts, categories });
}

export const meta: MetaFunction = () => {
  return [
    { title: "AI Vibecoding Forum - Share AI tools, get code help, showcase projects" },
    { name: "description", content: "A modern AI-focused coding forum where developers share AI tools, get code help, showcase projects, and discuss the latest in AI and programming." },
  ];
};

export default function ForumHomepage() {
  const { posts, categories } = useLoaderData<typeof loader>();

  return (
    <>
      {/* Header */}
      <header className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <Logo />
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-cyan-100 hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                to="/posts/new"
                className="px-4 py-2 text-sm font-medium bg-white text-cyan-600 rounded-md hover:bg-gray-50 transition-colors"
              >
                Create Post
              </Link>
            </div>
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">AI Vibecoding Forum</h1>
            <p className="text-xl text-cyan-100 mb-6 max-w-2xl mx-auto">
              Share AI tools, get code help, showcase projects, and discuss the latest in AI and programming
            </p>
            
            {/* Quick stats */}
            <div className="flex justify-center gap-8 text-sm">
              <div>
                <span className="font-semibold">{posts.length}</span>
                <span className="text-cyan-100 ml-1">Recent Posts</span>
              </div>
              <div>
                <span className="font-semibold">{categories.length}</span>
                <span className="text-cyan-100 ml-1">Categories</span>
              </div>
              <div>
                <span className="font-semibold">Guest</span>
                <span className="text-cyan-100 ml-1">Posting Enabled</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Categories Grid */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Forum Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/categories/${category.slug}`}
                className="block p-6 bg-white rounded-xl shadow-md border border-slate-200 hover:shadow-lg hover:border-cyan-300 transition-all duration-200"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{category.icon}</span>
                  <h3 className="font-semibold text-slate-900">{category.name}</h3>
                </div>
                <p className="text-sm text-slate-600 mb-3">{category.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span 
                    className="font-medium"
                    style={{ color: category.color }}
                  >
                    {category.post_count} posts
                  </span>
                  <span className="text-slate-400">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Posts */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate-900">Recent Posts</h2>
            <Link
              to="/posts"
              className="text-cyan-600 hover:text-cyan-700 font-medium"
            >
              View all posts →
            </Link>
          </div>
          
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
              <div className="text-center py-12">
                <div className="text-slate-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm1 0v12h12V4H4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No posts yet</h3>
                <p className="text-slate-600 mb-4">Be the first to start a discussion!</p>
                <Link
                  to="/posts/new"
                  className="inline-flex items-center px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors"
                >
                  Create First Post
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">AI Vibecoding Forum</h4>
              <p className="text-sm text-slate-600">
                A community for AI enthusiasts, developers, and learners to share knowledge and grow together.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Categories</h4>
              <ul className="space-y-2 text-sm">
                {categories.slice(0, 4).map((category) => (
                  <li key={category.id}>
                    <Link 
                      to={`/categories/${category.slug}`}
                      className="text-slate-600 hover:text-cyan-600 transition-colors"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Community</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link to="/posts" className="hover:text-cyan-600 transition-colors">All Posts</Link></li>
                <li><Link to="/users" className="hover:text-cyan-600 transition-colors">Top Contributors</Link></li>
                <li><Link to="/tags" className="hover:text-cyan-600 transition-colors">Popular Tags</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Built with</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>Remix Framework</li>
                <li>Supabase Database</li>
                <li>Netlify Hosting</li>
                <li>TailwindCSS</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 mt-8 pt-8 text-center text-sm text-slate-500">
            &copy; {new Date().getFullYear()} AI Vibecoding Forum. Built with ❤️ for the developer community.
          </div>
        </div>
      </footer>
    </>
  );
}

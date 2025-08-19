import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams, Link } from "@remix-run/react";
import { useState } from "react";

import PostCard from "~/components/forum/PostCard";
import Button from "~/components/Button";
import { getSupabaseClient } from "~/utils/getSupabaseClient";
import type { Post, Category, Tag, PostFilters, PostSorting } from "~/types/forum";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const supabase = getSupabaseClient();
  
  // Parse query parameters
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "10");
  const category = url.searchParams.get("category");
  const tag = url.searchParams.get("tag");
  const search = url.searchParams.get("search");
  const sortField = url.searchParams.get("sort") || "created_at";
  const sortDirection = url.searchParams.get("order") || "desc";
  
  const offset = (page - 1) * limit;

  // Build the query
  let query = supabase
    .from("posts")
    .select(`
      *,
      category:categories(*),
      tags:post_tags(tag:tags(*))
    `, { count: 'exact' })
    .eq("status", "published");

  // Apply filters
  if (category) {
    query = query.eq("category.slug", category);
  }
  
  if (search) {
    query = query.textSearch("title,content", search);
  }

  // Apply sorting
  query = query.order(sortField as any, { ascending: sortDirection === "asc" });
  query = query.order("is_pinned", { ascending: false }); // Always show pinned first

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  // Execute the query
  const { data: postsData, error: postsError, count } = await query;

  if (postsError) {
    throw new Response("Failed to load posts", { status: 500 });
  }

  // Transform the data
  const posts: Post[] = postsData.map((post: any) => ({
    ...post,
    tags: post.tags.map((pt: any) => pt.tag).filter(Boolean)
  }));

  // Fetch categories and tags for filters
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

  const categories: Category[] = categoriesResult.data || [];
  const tags: Tag[] = tagsResult.data || [];

  return Response.json({
    posts,
    categories,
    tags,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
    filters: {
      category,
      tag,
      search,
      sort: sortField,
      order: sortDirection,
    },
  });
}

export const meta: MetaFunction = () => {
  return [
    { title: "All Posts - AI Vibecoding Forum" },
    { name: "description", content: "Browse all posts in the AI Vibecoding Forum. Find discussions about AI tools, code help, project showcases, and more." },
  ];
};

export default function PostsListing() {
  const { posts, categories, tags, pagination, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [localSearch, setLocalSearch] = useState(filters.search || "");

  const updateFilter = (key: string, value: string | null) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (value) {
      newSearchParams.set(key, value);
    } else {
      newSearchParams.delete(key);
    }
    newSearchParams.delete("page"); // Reset to first page when filtering
    setSearchParams(newSearchParams);
  };

  const updateSort = (sort: string, order: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("sort", sort);
    newSearchParams.set("order", order);
    newSearchParams.delete("page");
    setSearchParams(newSearchParams);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter("search", localSearch.trim() || null);
  };

  const clearFilters = () => {
    setSearchParams({});
    setLocalSearch("");
  };

  const sortOptions = [
    { value: "created_at|desc", label: "Newest first" },
    { value: "created_at|asc", label: "Oldest first" },
    { value: "votes_count|desc", label: "Most upvoted" },
    { value: "comments_count|desc", label: "Most commented" },
    { value: "views_count|desc", label: "Most viewed" },
  ];

  const currentSort = `${filters.sort}|${filters.order}`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">All Posts</h1>
          <p className="text-slate-600">
            {pagination.total} posts • Page {pagination.page} of {pagination.totalPages}
          </p>
        </div>
        <Link to="/posts/new">
          <Button>Create Post</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 sticky top-8">
            <h2 className="font-semibold text-slate-900 mb-4">Filters</h2>

            {/* Search */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Search Posts
              </label>
              <form onSubmit={handleSearch} className="space-y-2">
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Search posts..."
                  className="block w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100 focus:outline-none"
                />
                <Button type="submit" className="w-full text-sm py-2">
                  Search
                </Button>
              </form>
            </div>

            {/* Sort */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Sort By
              </label>
              <select
                value={currentSort}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split("|");
                  updateSort(sort, order);
                }}
                className="block w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100 focus:outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Category
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <button
                  onClick={() => updateFilter("category", null)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    !filters.category 
                      ? "bg-cyan-100 text-cyan-800" 
                      : "hover:bg-slate-50"
                  }`}
                >
                  All Categories
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => updateFilter("category", category.slug)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                      filters.category === category.slug
                        ? "bg-cyan-100 text-cyan-800"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <span>{category.icon}</span>
                    <span className="flex-1">{category.name}</span>
                    <span className="text-xs text-slate-500">{category.post_count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Tags */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Popular Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 10).map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => updateFilter("tag", tag.slug)}
                    className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                      filters.tag === tag.slug
                        ? "text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                    style={{
                      backgroundColor: filters.tag === tag.slug ? tag.color : `${tag.color}15`,
                      color: filters.tag === tag.slug ? 'white' : tag.color
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {(filters.category || filters.tag || filters.search) && (
              <button
                onClick={clearFilters}
                className="w-full px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </aside>

        {/* Posts List */}
        <main className="lg:col-span-3">
          {/* Active Filters */}
          {(filters.category || filters.tag || filters.search) && (
            <div className="mb-6 p-4 bg-cyan-50 rounded-lg border border-cyan-200">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-cyan-800">Active filters:</span>
                {filters.category && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-cyan-100 text-cyan-800 rounded-md">
                    Category: {categories.find(c => c.slug === filters.category)?.name}
                    <button
                      onClick={() => updateFilter("category", null)}
                      className="ml-1 hover:bg-cyan-200 rounded-full w-4 h-4 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.tag && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-cyan-100 text-cyan-800 rounded-md">
                    Tag: {tags.find(t => t.slug === filters.tag)?.name}
                    <button
                      onClick={() => updateFilter("tag", null)}
                      className="ml-1 hover:bg-cyan-200 rounded-full w-4 h-4 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.search && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-cyan-100 text-cyan-800 rounded-md">
                    Search: "{filters.search}"
                    <button
                      onClick={() => updateFilter("search", null)}
                      className="ml-1 hover:bg-cyan-200 rounded-full w-4 h-4 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Posts */}
          <div className="space-y-6">
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post}
                  showCategory={!filters.category}
                  showTags={true}
                  showExcerpt={true}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-slate-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No posts found</h3>
                <p className="text-slate-600 mb-4">
                  {(filters.category || filters.tag || filters.search) 
                    ? "Try adjusting your filters or search terms"
                    : "Be the first to create a post!"
                  }
                </p>
                {(filters.category || filters.tag || filters.search) ? (
                  <Button variant="outlined" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                ) : (
                  <Link to="/posts/new">
                    <Button>Create First Post</Button>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {/* Previous Page */}
              {pagination.page > 1 && (
                <Link
                  to={`?${new URLSearchParams({ ...Object.fromEntries(searchParams.entries()), page: String(pagination.page - 1) })}`}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                >
                  Previous
                </Link>
              )}

              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, pagination.page - 2) + i;
                if (pageNum > pagination.totalPages) return null;
                
                return (
                  <Link
                    key={pageNum}
                    to={`?${new URLSearchParams({ ...Object.fromEntries(searchParams.entries()), page: String(pageNum) })}`}
                    className={`px-3 py-2 text-sm border rounded-md transition-colors ${
                      pageNum === pagination.page
                        ? "bg-cyan-500 text-white border-cyan-500"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {pageNum}
                  </Link>
                );
              })}

              {/* Next Page */}
              {pagination.page < pagination.totalPages && (
                <Link
                  to={`?${new URLSearchParams({ ...Object.fromEntries(searchParams.entries()), page: String(pagination.page + 1) })}`}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}


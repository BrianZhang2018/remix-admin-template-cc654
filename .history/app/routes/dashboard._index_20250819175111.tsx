import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import Button from "~/components/Button";
import PostCard from "~/components/forum/PostCard";
import { GlobalErrorBoundary } from "~/components/GlobalErrorBoundary";
import { formatDate } from "~/utils/formatDate";
import { getInitials } from "~/utils/getInitials";
import { getSupabaseClient } from "~/utils/getSupabaseClient";
import { requireAuth, getUserProfile } from "~/utils/auth.server";
import type { Post, Comment } from "~/types/forum";

type UserStats = {
  totalPosts: number;
  totalComments: number;
  totalVotes: number;
  totalViews: number;
  joinedDate: string;
};

type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlockedAt?: string;
};

export const meta: MetaFunction = () => {
  return [
    {
      title: "Dashboard | AI Vibecoding Forum",
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const userProfile = await getUserProfile(user.id);
  const supabase = getSupabaseClient();

  // Get user's posts with category and tag data
  const { data: userPosts, error: postsError } = await supabase
    .from("posts")
    .select(`
      *,
      category:categories(*),
      tags:post_tags(tag:tags(*))
    `)
    .eq("author_id", user.id)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(5);

  if (postsError) {
    throw new Response("Failed to load user posts", { status: 500 });
  }

  // Get user's recent comments
  const { data: userComments, error: commentsError } = await supabase
    .from("comments")
    .select(`
      *,
      post:posts(id, title, category:categories(name, slug))
    `)
    .eq("author_id", user.id)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(10);

  if (commentsError) {
    throw new Response("Failed to load user comments", { status: 500 });
  }

  // Calculate user statistics
  const [postsCountResult, commentsCountResult, votesCountResult, viewsCountResult] = await Promise.all([
    supabase
      .from("posts")
      .select("id", { count: "exact" })
      .eq("author_id", user.id)
      .eq("status", "published"),
    supabase
      .from("comments")
      .select("id", { count: "exact" })
      .eq("author_id", user.id)
      .eq("status", "published"),
    supabase
      .from("posts")
      .select("votes_count")
      .eq("author_id", user.id)
      .eq("status", "published"),
    supabase
      .from("posts")
      .select("views_count")
      .eq("author_id", user.id)
      .eq("status", "published")
  ]);

  const totalVotes = votesCountResult.data?.reduce((sum, post) => sum + (post.votes_count || 0), 0) || 0;
  const totalViews = viewsCountResult.data?.reduce((sum, post) => sum + (post.views_count || 0), 0) || 0;

  const userStats: UserStats = {
    totalPosts: postsCountResult.count || 0,
    totalComments: commentsCountResult.count || 0,
    totalVotes,
    totalViews,
    joinedDate: user.created_at || new Date().toISOString()
  };

  // Calculate achievements based on user activity
  const achievements: Achievement[] = [];
  
  // First Post achievement
  if (userStats.totalPosts >= 1) {
    achievements.push({
      id: "first-post",
      name: "First Post",
      description: "Created your first post",
      icon: "✍️",
      color: "#22c55e",
      unlockedAt: userPosts[0]?.created_at
    });
  }

  // Active Commenter achievement
  if (userStats.totalComments >= 10) {
    achievements.push({
      id: "active-commenter",
      name: "Active Commenter",
      description: "Made 10 or more comments",
      icon: "💬",
      color: "#3b82f6",
      unlockedAt: new Date().toISOString()
    });
  }

  // Popular Post achievement
  if (userStats.totalVotes >= 50) {
    achievements.push({
      id: "popular-content",
      name: "Popular Content",
      description: "Received 50+ votes on your posts",
      icon: "🔥",
      color: "#f59e0b",
      unlockedAt: new Date().toISOString()
    });
  }

  // View Magnet achievement
  if (userStats.totalViews >= 1000) {
    achievements.push({
      id: "view-magnet",
      name: "View Magnet",
      description: "Your posts have been viewed 1000+ times",
      icon: "👁️",
      color: "#8b5cf6",
      unlockedAt: new Date().toISOString()
    });
  }

  // Transform posts data to match our types
  const transformedPosts: Post[] = userPosts.map((post: any) => ({
    ...post,
    tags: post.tags?.map((pt: any) => pt.tag).filter(Boolean) || []
  }));

  return Response.json({
    user,
    userProfile,
    userStats,
    recentPosts: transformedPosts,
    recentComments: userComments,
    achievements
  });
}

export default function ForumDashboard() {
  const { user, userProfile, userStats, recentPosts, recentComments, achievements } = useLoaderData<{
    user: any;
    userProfile: any;
    userStats: UserStats;
    recentPosts: Post[];
    recentComments: any[];
    achievements: Achievement[];
  }>();

  const displayName = userProfile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
            {getInitials(displayName)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {displayName}!</h1>
            <p className="text-cyan-100">Member since {formatDate(userStats.joinedDate)}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{userStats.totalPosts}</div>
            <div className="text-cyan-100 text-sm">Posts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{userStats.totalComments}</div>
            <div className="text-cyan-100 text-sm">Comments</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{userStats.totalVotes}</div>
            <div className="text-cyan-100 text-sm">Total Votes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{userStats.totalViews}</div>
            <div className="text-cyan-100 text-sm">Total Views</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button to="/posts/new" className="h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
          ✍️ Create New Post
        </Button>
        <Button to="/posts" className="h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
          📚 Browse Posts
        </Button>
        <Button to="/dashboard/user" className="h-12 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
          ⚙️ Edit Profile
        </Button>
      </div>

      {/* Achievements Section */}
      {achievements.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">🏆 Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="border border-slate-200 rounded-lg p-4 hover:border-cyan-300 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl" style={{ color: achievement.color }}>
                    {achievement.icon}
                  </span>
                  <div>
                    <h3 className="font-medium text-slate-900">{achievement.name}</h3>
                    <p className="text-sm text-slate-600">{achievement.description}</p>
                  </div>
                </div>
                {achievement.unlockedAt && (
                  <p className="text-xs text-slate-500">
                    Unlocked {formatDate(achievement.unlockedAt)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Posts */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">📝 Your Recent Posts</h2>
          <Link to="/posts?author=me" className="text-cyan-600 hover:text-cyan-700 text-sm font-medium">
            View all posts →
          </Link>
        </div>
        
        {recentPosts.length > 0 ? (
          <div className="space-y-4">
            {recentPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                showCategory={true}
                showTags={true}
                showExcerpt={true}
                compact={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <div className="text-4xl mb-2">📝</div>
            <p className="mb-2">No posts yet</p>
            <Button to="/posts/new" size="sm">Create your first post</Button>
          </div>
        )}
      </div>

      {/* Recent Comments */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">💬 Recent Comments</h2>
          <span className="text-sm text-slate-500">{recentComments.length} recent</span>
        </div>
        
        {recentComments.length > 0 ? (
          <div className="space-y-4">
            {recentComments.slice(0, 5).map((comment: any) => (
              <div key={comment.id} className="border-l-4 border-cyan-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    to={`/posts/${comment.post.id}`}
                    className="font-medium text-slate-900 hover:text-cyan-600 text-sm"
                  >
                    {comment.post.title}
                  </Link>
                  <span className="text-xs text-slate-500">
                    in {comment.post.category?.name}
                  </span>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2">{comment.content}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {formatDate(comment.created_at)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <div className="text-4xl mb-2">💬</div>
            <p>No comments yet</p>
            <p className="text-sm">Start engaging with the community!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return <GlobalErrorBoundary />;
}
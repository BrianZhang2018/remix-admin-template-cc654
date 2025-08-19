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

export default function MemberList() {
  const { members } = useLoaderData<{ members: Member[] }>();
  const deleteMemberFetcher = useFetcher();

  return (
    <>
      <div className="flex justify-between gap-2 mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 lg:text-3xl">
          Member List
        </h1>
        <Button to="/dashboard/new">Add Member</Button>
      </div>
      <div className="pb-10 overflow-x-auto overflow-y-visible bg-white shadow-md rounded-xl md:pb-12">
        <table className="w-full text-sm bg-white">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-6 font-medium text-left text-slate-900">
                {members.length} {members.length === 1 ? "member" : "members"}
              </th>
              <th className="p-6 font-medium text-left text-slate-900">
                Location
              </th>
              <th className="p-6 font-medium text-left text-slate-900">
                Created
              </th>
              <th className="p-6 font-medium text-left text-slate-900"></th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              return (
                <tr
                  key={member.id}
                  className="transition border-b border-slate-200 hover:border-cyan-300"
                >
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      {member.avatar_url ? (
                        <img
                          className="object-cover w-12 h-12 rounded-full"
                          src={member.avatar_url}
                          alt={`${member.name} avatar`}
                        />
                      ) : (
                        <div className="flex items-center justify-center w-12 h-12 font-medium tracking-wide text-white rounded-full bg-cyan-500">
                          {getInitials(member.name)}
                        </div>
                      )}
                      <div className="space-y-0.5 overflow-hidden">
                        <p className="font-semibold">{member.name}</p>
                        <p className="truncate">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">{member.location}</td>
                  <td className="p-6 whitespace-nowrap">
                    {formatDate(member.created_at)}
                  </td>
                  <td className="p-6">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/dashboard/${member.id}`}
                        className="flex items-center justify-center w-8 h-8 transition rounded-md cursor-pointer text-slate-300 hover:text-cyan-600 hover:bg-cyan-50"
                        aria-label="View details"
                      >
                        <ViewIcon />
                      </Link>
                      <Link
                        to={`/dashboard/${member.id}/edit`}
                        className="flex items-center justify-center w-8 h-8 transition rounded-md cursor-pointer text-slate-300 hover:text-cyan-600 hover:bg-cyan-50"
                        aria-label="Edit"
                      >
                        <EditIcon />
                      </Link>
                      <deleteMemberFetcher.Form
                        method="POST"
                        action="/dashboard?index"
                      >
                        <input
                          type="hidden"
                          name="memberId"
                          value={member.id}
                        />
                        <button
                          type="submit"
                          className="flex items-center justify-center w-8 h-8 transition rounded-md cursor-pointer text-slate-300 hover:text-cyan-600 hover:bg-cyan-50"
                          aria-label="Delete"
                        >
                          <DeleteIcon />
                        </button>
                      </deleteMemberFetcher.Form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function ErrorBoundary() {
  return <GlobalErrorBoundary />;
}
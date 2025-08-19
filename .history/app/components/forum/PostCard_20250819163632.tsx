import { Link } from "@remix-run/react";
import type { PostCardProps } from "~/types/forum";
import { formatDate } from "~/utils/formatDate";
import { getInitials } from "~/utils/getInitials";
import VoteButtons from "./VoteButtons";

export default function PostCard({ 
  post, 
  showCategory = true, 
  showTags = true, 
  showExcerpt = true,
  compact = false 
}: PostCardProps) {
  const handleVote = async (voteType: 'up' | 'down') => {
    // TODO: Implement voting logic
    console.log(`Voting ${voteType} on post ${post.id}`);
  };

  const authorName = post.author_profile?.display_name || post.author_name || 'Anonymous';
  const authorAvatar = post.author_profile?.avatar_url;

  return (
    <article className={`
      bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden
      hover:shadow-lg hover:border-cyan-300 transition-all duration-200
      ${compact ? 'p-4' : 'p-6'}
    `}>
      <div className="flex gap-4">
        {/* Vote Buttons */}
        <div className="flex-shrink-0">
          <VoteButtons
            itemId={post.id}
            itemType="post"
            votesCount={post.votes_count}
            onVote={handleVote}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              {/* Category and Pinned Status */}
              <div className="flex items-center gap-2 mb-2">
                {post.is_pinned && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded-full">
                    📌 Pinned
                  </span>
                )}
                {showCategory && post.category && (
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
              <h2 className={`font-semibold text-slate-900 mb-2 hover:text-cyan-600 transition-colors ${
                compact ? 'text-lg' : 'text-xl'
              }`}>
                <Link to={`/posts/${post.id}`} className="block">
                  {post.title}
                </Link>
              </h2>

              {/* Excerpt */}
              {showExcerpt && post.excerpt && !compact && (
                <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                  {post.excerpt}
                </p>
              )}

              {/* Tags */}
              {showTags && post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {post.tags.slice(0, compact ? 3 : 5).map((tag) => (
                    <Link
                      key={tag.id}
                      to={`/tags/${tag.slug}`}
                      className="inline-block px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
                      style={{ backgroundColor: `${tag.color}15`, color: tag.color }}
                    >
                      {tag.name}
                    </Link>
                  ))}
                  {post.tags.length > (compact ? 3 : 5) && (
                    <span className="inline-block px-2 py-1 text-xs text-slate-500">
                      +{post.tags.length - (compact ? 3 : 5)} more
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Author Avatar */}
            {!compact && (
              <div className="flex-shrink-0">
                {authorAvatar ? (
                  <img
                    src={authorAvatar}
                    alt={`${authorName} avatar`}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-white text-sm font-medium">
                    {getInitials(authorName)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-sm text-slate-500">
            <div className="flex items-center gap-4">
              {/* Author */}
              <div className="flex items-center gap-2">
                {compact && (
                  <>
                    {authorAvatar ? (
                      <img
                        src={authorAvatar}
                        alt={`${authorName} avatar`}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-white text-xs font-medium">
                        {getInitials(authorName)}
                      </div>
                    )}
                  </>
                )}
                <span className="font-medium">{authorName}</span>
                {post.author_profile?.reputation_points && (
                  <span className="text-xs text-amber-600 font-medium">
                    {post.author_profile.reputation_points} pts
                  </span>
                )}
              </div>

              {/* Date */}
              <time dateTime={post.created_at} className="whitespace-nowrap">
                {formatDate(post.created_at)}
              </time>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4">
              <Link
                to={`/posts/${post.id}#comments`}
                className="flex items-center gap-1 hover:text-cyan-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                <span>{post.comments_count}</span>
              </Link>

              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                <span>{post.views_count}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

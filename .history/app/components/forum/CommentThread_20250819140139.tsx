import { useState } from "react";
import { Form } from "@remix-run/react";
import type { CommentThreadProps } from "~/types/forum";
import { formatDate } from "~/utils/formatDate";
import { getInitials } from "~/utils/getInitials";
import { isGuestEmail } from "~/utils/guestUtils";
import VoteButtons from "./VoteButtons";
import Button from "~/components/Button";

export default function CommentThread({
  comments,
  postId,
  onReply,
  onVote,
  level = 0,
  maxLevel = 5,
  currentUserEmail = '',
  setCurrentUserEmail
}: CommentThreadProps) {
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReplySubmit = async (parentId: string) => {
    if (!replyContent.trim()) return;
    if (!onReply) return;

    setIsSubmitting(true);
    try {
      await onReply(parentId, replyContent);
      setReplyContent("");
      setAuthorName("");
      setAuthorEmail("");
      setReplyToId(null);
    } catch (error) {
      console.error("Failed to post reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoteComment = async (commentId: string, voteType: 'up' | 'down') => {
    if (!onVote) return;
    try {
      await onVote(commentId, voteType);
    } catch (error) {
      console.error("Failed to vote on comment:", error);
    }
  };

  const renderComment = (comment: any, depth: number = 0) => {
    const authorName = comment.author_profile?.display_name || comment.author_name || 'Anonymous';
    const authorAvatar = comment.author_profile?.avatar_url;
    const isNested = depth > 0;
    const canNest = depth < maxLevel;

    return (
      <div key={comment.id} className={`${isNested ? 'ml-6 mt-4' : 'mb-6'}`}>
        <div className={`
          bg-white rounded-lg border border-slate-200 p-4
          ${isNested ? 'border-l-4 border-l-cyan-200' : ''}
        `}>
          {/* Comment Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-shrink-0">
              <VoteButtons
                itemId={comment.id}
                itemType="comment"
                votesCount={comment.votes_count}
                onVote={(voteType) => handleVoteComment(comment.id, voteType)}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {/* Author Avatar */}
                {authorAvatar ? (
                  <img
                    src={authorAvatar}
                    alt={`${authorName} avatar`}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white text-xs font-medium">
                    {getInitials(authorName)}
                  </div>
                )}

                {/* Author Name and Reputation */}
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">{authorName}</span>
                  {comment.author_profile?.reputation_points && (
                    <span className="text-xs text-amber-600 font-medium">
                      {comment.author_profile.reputation_points} pts
                    </span>
                  )}
                </div>

                {/* Date */}
                <time dateTime={comment.created_at} className="text-sm text-slate-500">
                  {formatDate(comment.created_at)}
                </time>
              </div>

              {/* Comment Content */}
              <div className="prose prose-sm max-w-none text-slate-700 mb-3">
                {comment.content.split('\n').map((paragraph: string, index: number) => (
                  <p key={index} className="mb-2 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Comment Actions */}
              <div className="flex items-center gap-4">
                {canNest && onReply && (
                  <button
                    onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
                    className="text-sm text-slate-500 hover:text-cyan-600 transition-colors"
                  >
                    Reply
                  </button>
                )}
                <button className="text-sm text-slate-500 hover:text-red-600 transition-colors">
                  Report
                </button>
              </div>
            </div>
          </div>

          {/* Reply Form */}
          {replyToId === comment.id && onReply && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
              <div className="space-y-3">
                {/* Guest author fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="block w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100 focus:outline-none"
                  />
                  <input
                    type="email"
                    placeholder="Your email (optional)"
                    value={authorEmail}
                    onChange={(e) => setAuthorEmail(e.target.value)}
                    className="block w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100 focus:outline-none"
                  />
                </div>

                {/* Reply content */}
                <textarea
                  placeholder="Write your reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={3}
                  className="block w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100 focus:outline-none"
                />

                {/* Reply actions */}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => handleReplySubmit(comment.id)}
                    loading={isSubmitting}
                    disabled={!replyContent.trim() || !authorName.trim()}
                    className="text-sm py-2 px-4"
                  >
                    Post Reply
                  </Button>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => setReplyToId(null)}
                    className="text-sm py-2 px-4"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map((reply: any) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {comments.map((comment) => renderComment(comment, level))}
    </div>
  );
}

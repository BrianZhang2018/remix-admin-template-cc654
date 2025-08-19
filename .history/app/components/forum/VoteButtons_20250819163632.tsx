import { useState } from "react";
import type { VoteButtonsProps } from "~/types/forum";

export default function VoteButtons({
  itemId,
  itemType,
  votesCount,
  userVote,
  onVote,
  disabled = false
}: VoteButtonsProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [optimisticVote, setOptimisticVote] = useState<'up' | 'down' | null>(userVote || null);
  const [optimisticCount, setOptimisticCount] = useState(votesCount);

  const handleVote = async (voteType: 'up' | 'down') => {
    if (disabled || isVoting) return;

    setIsVoting(true);
    
    // Optimistic updates
    const previousVote = optimisticVote;
    const previousCount = optimisticCount;
    
    let newCount = previousCount;
    
    if (previousVote === voteType) {
      // Remove vote
      setOptimisticVote(null);
      newCount = previousCount + (voteType === 'up' ? -1 : 1);
    } else if (previousVote === null) {
      // Add new vote
      setOptimisticVote(voteType);
      newCount = previousCount + (voteType === 'up' ? 1 : -1);
    } else {
      // Change vote type
      setOptimisticVote(voteType);
      newCount = previousCount + (voteType === 'up' ? 2 : -2);
    }
    
    setOptimisticCount(newCount);

    try {
      await onVote(voteType);
    } catch (error) {
      // Revert optimistic updates on error
      setOptimisticVote(previousVote);
      setOptimisticCount(previousCount);
      console.error('Failed to vote:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const upvoteActive = optimisticVote === 'up';
  const downvoteActive = optimisticVote === 'down';

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Upvote Button */}
      <button
        onClick={() => handleVote('up')}
        disabled={disabled || isVoting}
        className={`
          flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200
          ${upvoteActive 
            ? 'bg-green-500 text-white hover:bg-green-600' 
            : 'text-slate-400 hover:text-green-500 hover:bg-green-50'
          }
          ${disabled || isVoting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-label={`Upvote this ${itemType}`}
        title={`Upvote this ${itemType}`}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Vote Count */}
      <span className={`
        text-sm font-medium min-w-[2rem] text-center
        ${optimisticCount > 0 ? 'text-green-600' : optimisticCount < 0 ? 'text-red-600' : 'text-slate-500'}
      `}>
        {optimisticCount}
      </span>

      {/* Downvote Button */}
      <button
        onClick={() => handleVote('down')}
        disabled={disabled || isVoting}
        className={`
          flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200
          ${downvoteActive 
            ? 'bg-red-500 text-white hover:bg-red-600' 
            : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
          }
          ${disabled || isVoting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-label={`Downvote this ${itemType}`}
        title={`Downvote this ${itemType}`}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

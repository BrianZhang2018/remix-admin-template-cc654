// TypeScript type definitions for forum entities

export interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  color: string;
  icon: string;
  post_count: number;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
  usage_count: number;
  created_at: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  author_id?: string;
  author_name?: string;
  author_email?: string;
  category_id: string;
  created_at: string;
  updated_at: string;
  votes_count: number;
  comments_count: number;
  views_count: number;
  status: 'draft' | 'published' | 'hidden' | 'deleted';
  is_pinned: boolean;
  metadata: Record<string, any>;
  
  // Joined data
  category?: Category;
  tags?: Tag[];
  author_profile?: UserProfile;
}

export interface Comment {
  id: string;
  post_id: string;
  parent_id?: string;
  author_id?: string;
  author_name?: string;
  author_email?: string;
  content: string;
  created_at: string;
  updated_at: string;
  votes_count: number;
  status: 'published' | 'hidden' | 'deleted';
  
  // Joined data
  author_profile?: UserProfile;
  replies?: Comment[];
}

export interface Vote {
  id: string;
  user_id?: string;
  guest_identifier?: string;
  post_id?: string;
  comment_id?: string;
  vote_type: 'up' | 'down';
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  website_url?: string;
  github_username?: string;
  reputation_points: number;
  posts_count: number;
  comments_count: number;
  achievements: string[];
  skills: string[];
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  reporter_id?: string;
  reporter_email?: string;
  post_id?: string;
  comment_id?: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  admin_notes?: string;
  created_at: string;
  resolved_at?: string;
}

// API Response types
export interface PostsResponse {
  posts: Post[];
  total: number;
  page: number;
  limit: number;
}

export interface CommentsResponse {
  comments: Comment[];
  total: number;
}

// Form types
export interface CreatePostData {
  title: string;
  content: string;
  excerpt?: string;
  category_id: string;
  tag_ids: string[];
  author_name?: string;
  author_email?: string;
}

export interface CreateCommentData {
  post_id: string;
  parent_id?: string;
  content: string;
  author_name?: string;
  author_email?: string;
}

export interface VoteData {
  post_id?: string;
  comment_id?: string;
  vote_type: 'up' | 'down';
}

// Filter and sorting types
export interface PostFilters {
  category?: string;
  tag?: string;
  author?: string;
  status?: Post['status'];
  search?: string;
}

export interface PostSorting {
  field: 'created_at' | 'updated_at' | 'votes_count' | 'comments_count' | 'views_count';
  direction: 'asc' | 'desc';
}

// UI component props types
export interface PostCardProps {
  post: Post;
  showCategory?: boolean;
  showTags?: boolean;
  showExcerpt?: boolean;
  compact?: boolean;
}

export interface VoteButtonsProps {
  itemId: string;
  itemType: 'post' | 'comment';
  votesCount: number;
  userVote?: 'up' | 'down' | null;
  onVote: (voteType: 'up' | 'down') => Promise<void>;
  disabled?: boolean;
}

export interface CommentThreadProps {
  comments: Comment[];
  postId: string;
  onReply?: (parentId: string, content: string) => Promise<void>;
  onVote?: (commentId: string, voteType: 'up' | 'down') => Promise<void>;
  level?: number;
  maxLevel?: number;
}

export interface TagSelectorProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  maxTags?: number;
  placeholder?: string;
  disabled?: boolean;
}

// Utility types
export type PostStatus = Post['status'];
export type VoteType = Vote['vote_type'];
export type CommentStatus = Comment['status'];
export type ReportStatus = Report['status'];

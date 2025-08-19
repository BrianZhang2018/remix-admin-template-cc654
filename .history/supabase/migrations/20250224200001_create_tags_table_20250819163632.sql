-- Create tags table for content categorization
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#10b981',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for slug lookups and usage sorting
CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_tags_usage_count ON tags(usage_count DESC);

-- Insert default tags
INSERT INTO tags (name, slug, color) VALUES
  ('JavaScript', 'javascript', '#f7df1e'),
  ('Python', 'python', '#3776ab'),
  ('React', 'react', '#61dafb'),
  ('Node.js', 'nodejs', '#339933'),
  ('TypeScript', 'typescript', '#3178c6'),
  ('AI', 'ai', '#ff6b6b'),
  ('Machine Learning', 'machine-learning', '#4ecdc4'),
  ('OpenAI', 'openai', '#412991'),
  ('Claude', 'claude', '#d97706'),
  ('GPT', 'gpt', '#10b981'),
  ('Prompt Engineering', 'prompt-engineering', '#8b5cf6'),
  ('Code Review', 'code-review', '#06b6d4'),
  ('Tutorial', 'tutorial', '#f59e0b'),
  ('Beginner', 'beginner', '#84cc16'),
  ('Advanced', 'advanced', '#ef4444'),
  ('Project', 'project', '#ec4899'),
  ('Help Wanted', 'help-wanted', '#f97316'),
  ('Debugging', 'debugging', '#64748b');

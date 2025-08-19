-- Create categories table for forum organization
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6366f1',
  icon TEXT,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for slug lookups
CREATE INDEX idx_categories_slug ON categories(slug);

-- Insert default categories
INSERT INTO categories (name, description, slug, color, icon) VALUES
  ('AI Tools & Prompts', 'Share and discover AI tools, prompts, and workflows', 'ai-tools', '#8b5cf6', '🤖'),
  ('Code Review & Help', 'Get help with code, debugging, and best practices', 'code-help', '#06b6d4', '🔍'),
  ('Project Showcases', 'Show off your AI projects and get feedback', 'showcases', '#10b981', '🚀'),
  ('Learning Resources', 'Tutorials, courses, and educational content', 'learning', '#f59e0b', '📚'),
  ('Industry Discussions', 'General AI and tech industry conversations', 'discussions', '#ef4444', '💬'),
  ('Challenges & Competitions', 'Coding challenges and community competitions', 'challenges', '#84cc16', '🏆');


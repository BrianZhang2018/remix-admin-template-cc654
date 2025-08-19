-- Add VibeCoding Projects category
-- This category is for sharing projects built with AI coding assistants

INSERT INTO categories (id, name, description, slug, color, icon, post_count)
VALUES (
  'a8d3e12f-4b7c-4e89-9012-3456789abcde',
  'VibeCoding Projects',
  'Share amazing projects you''ve built with AI coding assistants! Showcase your vibecoding creations.',
  'vibecoding-projects',
  '#ff6b6b',
  '🚀✨',
  0
);

-- Add some initial tags relevant to VibeCoding projects
INSERT INTO tags (name, slug, color, usage_count) VALUES
('VibeCoding', 'vibecoding', '#ff6b6b', 0),
('AI Assistant', 'ai-assistant', '#ff8c42', 0),
('Full Stack', 'full-stack', '#4ecdc4', 0),
('Rapid Prototyping', 'rapid-prototyping', '#45b7d1', 0),
('Code Generation', 'code-generation', '#96ceb4', 0),
('Pair Programming', 'pair-programming', '#feca57', 0),
('MVP', 'mvp', '#ff9ff3', 0),
('Learning Project', 'learning-project', '#54a0ff', 0),
('Open Source', 'open-source', '#5f27cd', 0),
('Production Ready', 'production-ready', '#00d2d3', 0)
ON CONFLICT (slug) DO NOTHING;

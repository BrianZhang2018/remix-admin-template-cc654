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
INSERT INTO tags (id, name, description, slug, color, usage_count) VALUES
('vibe1001-0000-0000-0000-000000000001', 'VibeCoding', 'Projects built with AI coding assistance', 'vibecoding', '#ff6b6b', 0),
('vibe1002-0000-0000-0000-000000000002', 'AI Assistant', 'Built using AI coding assistants', 'ai-assistant', '#ff8c42', 0),
('vibe1003-0000-0000-0000-000000000003', 'Full Stack', 'Complete full-stack applications', 'full-stack', '#4ecdc4', 0),
('vibe1004-0000-0000-0000-000000000004', 'Rapid Prototyping', 'Quickly built prototypes and MVPs', 'rapid-prototyping', '#45b7d1', 0),
('vibe1005-0000-0000-0000-000000000005', 'Code Generation', 'Heavy use of AI-generated code', 'code-generation', '#96ceb4', 0),
('vibe1006-0000-0000-0000-000000000006', 'Pair Programming', 'Human-AI collaborative development', 'pair-programming', '#feca57', 0),
('vibe1007-0000-0000-0000-000000000007', 'MVP', 'Minimum viable products', 'mvp', '#ff9ff3', 0),
('vibe1008-0000-0000-0000-000000000008', 'Learning Project', 'Built while learning new technologies', 'learning-project', '#54a0ff', 0),
('vibe1009-0000-0000-0000-000000000009', 'Open Source', 'Open source VibeCoding projects', 'open-source', '#5f27cd', 0),
('vibe1010-0000-0000-0000-000000000010', 'Production Ready', 'Ready for production deployment', 'production-ready', '#00d2d3', 0)
ON CONFLICT (id) DO NOTHING;

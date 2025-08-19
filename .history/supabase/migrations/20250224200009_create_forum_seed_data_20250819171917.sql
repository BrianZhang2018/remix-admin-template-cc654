-- Create sample forum data for testing and demonstration
-- Insert sample posts
INSERT INTO posts (title, content, excerpt, author_name, author_email, category_id, votes_count, views_count) VALUES
(
  'Getting Started with AI Code Review Tools',
  '# AI Code Review Tools: A Comprehensive Guide

## Introduction
AI-powered code review tools have revolutionized how we approach code quality and security. In this post, I''ll share my experience with various AI tools and best practices.

## Popular Tools
1. **GitHub Copilot** - Excellent for suggestions
2. **DeepCode** - Great for security analysis
3. **CodeGuru** - AWS''s offering with performance insights

```javascript
// Example: Using AI suggestions for better code
function processData(data) {
  // AI can suggest optimizations here
  return data.filter(item => item.isValid)
             .map(item => ({ ...item, processed: true }));
}
```

## Key Benefits
- Faster code reviews
- Consistent quality standards
- Early bug detection
- Security vulnerability identification

What are your favorite AI code review tools? Share your experiences below!',
  'A comprehensive guide to AI-powered code review tools, covering popular options and best practices for implementation.',
  'Alex Chen',
  'alex.chen@example.com',
  (SELECT id FROM categories WHERE slug = 'ai-tools'),
  15,
  234
),
(
  'Help: React State Management with AI Suggestions',
  '# Need Help with React State Management

I''m working on a React project and struggling with state management patterns. I''ve been using AI tools to help, but I''m getting conflicting suggestions.

## Current Setup
```jsx
const [user, setUser] = useState(null);
const [posts, setPosts] = useState([]);
const [loading, setLoading] = useState(false);
```

## The Problem
The AI suggests using Redux, but also mentions Zustand and Jotai. I''m confused about which approach is best for a medium-sized application.

## Questions
1. Which state management solution works best with AI code assistants?
2. How do you handle complex state updates with AI suggestions?
3. Any tips for prompt engineering for better state management code?

Any advice would be appreciated! 🙏',
  'Seeking advice on React state management patterns and how to effectively use AI tools for better code suggestions.',
  'Jordan Smith',
  'jordan.smith@example.com',
  (SELECT id FROM categories WHERE slug = 'code-help'),
  8,
  156
),
(
  'Project Showcase: AI-Powered Todo App with Voice Commands',
  '# 🚀 AI Todo App with Voice Commands

I''ve just finished building an AI-powered todo application that accepts voice commands and provides intelligent task suggestions.

## Features
- **Voice Input**: Speak your tasks naturally
- **AI Categorization**: Automatically categorizes tasks
- **Smart Reminders**: AI suggests optimal reminder times
- **Natural Language Processing**: Understands context and urgency

## Tech Stack
- **Frontend**: React + TypeScript
- **Backend**: Node.js + Express
- **AI**: OpenAI GPT-4 + Whisper API
- **Database**: PostgreSQL

```typescript
interface Task {
  id: string;
  title: string;
  category: string;
  priority: "low" | "medium" | "high";
  aiSuggestions: string[];
  voiceTranscript?: string;
}
```

## Demo
🔗 [Live Demo](https://ai-todo.example.com)
📱 [GitHub Repo](https://github.com/user/ai-todo)

## What I Learned
1. Voice recognition accuracy improves with context
2. AI categorization needs good training data
3. User feedback loops are crucial for AI improvements

Would love to hear your thoughts and suggestions for improvements!',
  'A showcase of an AI-powered todo application featuring voice commands, smart categorization, and intelligent reminders.',
  'Maria Rodriguez',
  'maria.rodriguez@example.com',
  (SELECT id FROM categories WHERE slug = 'showcases'),
  42,
  512
);

-- Add tags to posts
INSERT INTO post_tags (post_id, tag_id) VALUES
-- AI Code Review post tags
((SELECT id FROM posts WHERE title = 'Getting Started with AI Code Review Tools'), (SELECT id FROM tags WHERE slug = 'ai')),
((SELECT id FROM posts WHERE title = 'Getting Started with AI Code Review Tools'), (SELECT id FROM tags WHERE slug = 'code-review')),
((SELECT id FROM posts WHERE title = 'Getting Started with AI Code Review Tools'), (SELECT id FROM tags WHERE slug = 'javascript')),
((SELECT id FROM posts WHERE title = 'Getting Started with AI Code Review Tools'), (SELECT id FROM tags WHERE slug = 'tutorial')),

-- React Help post tags
((SELECT id FROM posts WHERE title = 'Help: React State Management with AI Suggestions'), (SELECT id FROM tags WHERE slug = 'react')),
((SELECT id FROM posts WHERE title = 'Help: React State Management with AI Suggestions'), (SELECT id FROM tags WHERE slug = 'help-wanted')),
((SELECT id FROM posts WHERE title = 'Help: React State Management with AI Suggestions'), (SELECT id FROM tags WHERE slug = 'ai')),
((SELECT id FROM posts WHERE title = 'Help: React State Management with AI Suggestions'), (SELECT id FROM tags WHERE slug = 'beginner')),

-- Project Showcase post tags
((SELECT id FROM posts WHERE title = 'Project Showcase: AI-Powered Todo App with Voice Commands'), (SELECT id FROM tags WHERE slug = 'project')),
((SELECT id FROM posts WHERE title = 'Project Showcase: AI-Powered Todo App with Voice Commands'), (SELECT id FROM tags WHERE slug = 'ai')),
((SELECT id FROM posts WHERE title = 'Project Showcase: AI-Powered Todo App with Voice Commands'), (SELECT id FROM tags WHERE slug = 'react')),
((SELECT id FROM posts WHERE title = 'Project Showcase: AI-Powered Todo App with Voice Commands'), (SELECT id FROM tags WHERE slug = 'typescript')),
((SELECT id FROM posts WHERE title = 'Project Showcase: AI-Powered Todo App with Voice Commands'), (SELECT id FROM tags WHERE slug = 'nodejs'));

-- Insert sample comments
INSERT INTO comments (post_id, content, author_name, author_email, votes_count) VALUES
(
  (SELECT id FROM posts WHERE title = 'Getting Started with AI Code Review Tools'),
  'Great overview! I''ve been using GitHub Copilot for a few months now and it''s been a game-changer. The suggestions for code optimization are particularly helpful. Have you tried the new Claude integration for code review?',
  'Sarah Wilson',
  'sarah.wilson@example.com',
  12
),
(
  (SELECT id FROM posts WHERE title = 'Getting Started with AI Code Review Tools'),
  'Thanks for sharing this! One thing I''d add is that AI tools work best when you give them context about your codebase. I''ve found that adding comments about the intended behavior helps get better suggestions.',
  'Dev Kumar',
  'dev.kumar@example.com',
  8
),
(
  (SELECT id FROM posts WHERE title = 'Help: React State Management with AI Suggestions'),
  'For medium-sized apps, I''d recommend starting with Zustand. It''s simpler than Redux and AI assistants seem to understand it well. Here''s a quick example:

```javascript
import { create } from ''zustand''

const useStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  posts: [],
  setPosts: (posts) => set({ posts }),
}))
```

The AI can then easily suggest improvements and patterns.',
  'Emma Thompson',
  'emma.thompson@example.com',
  15
),
(
  (SELECT id FROM posts WHERE title = 'Help: React State Management with AI Suggestions'),
  'I second Zustand! Also, try being more specific in your prompts. Instead of "help with state management", try "optimize this React state for performance with TypeScript" and you''ll get much better suggestions.',
  'Code Mentor',
  'mentor@example.com',
  10
),
(
  (SELECT id FROM posts WHERE title = 'Project Showcase: AI-Powered Todo App with Voice Commands'),
  'This is absolutely amazing! 🤩 The voice command feature is so smooth. I''m curious about the accuracy of the voice recognition - what''s your experience with different accents and background noise?',
  'Tech Enthusiast',
  'tech@example.com',
  18
),
(
  (SELECT id FROM posts WHERE title = 'Project Showcase: AI-Powered Todo App with Voice Commands'),
  'Impressive work! I love the AI categorization feature. How did you train the model to understand task contexts? Did you use a pre-trained model or create custom training data?',
  'AI Researcher',
  'researcher@example.com',
  14
);

-- Insert nested comment (reply to first comment on AI Code Review post)
INSERT INTO comments (post_id, parent_id, content, author_name, author_email, votes_count) VALUES
(
  (SELECT id FROM posts WHERE title = 'Getting Started with AI Code Review Tools'),
  (SELECT id FROM comments WHERE content LIKE 'Great overview! I''ve been using GitHub Copilot%'),
  'I haven''t tried Claude integration yet, but I''ve heard great things! The context awareness in code review is supposed to be excellent. Do you know if it integrates well with VS Code?',
  'Alex Chen',
  'alex.chen@example.com',
  5
);

-- Update category post counts (this will be handled by triggers in production)
UPDATE categories SET post_count = (
  SELECT COUNT(*) FROM posts WHERE category_id = categories.id AND status = 'published'
);

-- Update tag usage counts (this will be handled by triggers in production)
UPDATE tags SET usage_count = (
  SELECT COUNT(*) FROM post_tags WHERE tag_id = tags.id
);


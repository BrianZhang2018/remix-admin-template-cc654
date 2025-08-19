-- Create user_profiles table to extend user functionality
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  location TEXT,
  website_url TEXT,
  github_username TEXT,
  reputation_points INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  achievements JSONB DEFAULT '[]'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_reputation_points ON user_profiles(reputation_points DESC);
CREATE INDEX idx_user_profiles_posts_count ON user_profiles(posts_count DESC);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile when user signs up
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (user_id, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically create user profile on signup
CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF TG_TABLE_NAME = 'posts' AND NEW.status = 'published' AND NEW.author_id IS NOT NULL THEN
            UPDATE user_profiles SET posts_count = posts_count + 1 WHERE user_id = NEW.author_id;
        ELSIF TG_TABLE_NAME = 'comments' AND NEW.status = 'published' AND NEW.author_id IS NOT NULL THEN
            UPDATE user_profiles SET comments_count = comments_count + 1 WHERE user_id = NEW.author_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF TG_TABLE_NAME = 'posts' AND OLD.status != NEW.status AND NEW.author_id IS NOT NULL THEN
            IF NEW.status = 'published' AND OLD.status != 'published' THEN
                UPDATE user_profiles SET posts_count = posts_count + 1 WHERE user_id = NEW.author_id;
            ELSIF OLD.status = 'published' AND NEW.status != 'published' THEN
                UPDATE user_profiles SET posts_count = GREATEST(posts_count - 1, 0) WHERE user_id = NEW.author_id;
            END IF;
        ELSIF TG_TABLE_NAME = 'comments' AND OLD.status != NEW.status AND NEW.author_id IS NOT NULL THEN
            IF NEW.status = 'published' AND OLD.status != 'published' THEN
                UPDATE user_profiles SET comments_count = comments_count + 1 WHERE user_id = NEW.author_id;
            ELSIF OLD.status = 'published' AND NEW.status != 'published' THEN
                UPDATE user_profiles SET comments_count = GREATEST(comments_count - 1, 0) WHERE user_id = NEW.author_id;
            END IF;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF TG_TABLE_NAME = 'posts' AND OLD.status = 'published' AND OLD.author_id IS NOT NULL THEN
            UPDATE user_profiles SET posts_count = GREATEST(posts_count - 1, 0) WHERE user_id = OLD.author_id;
        ELSIF TG_TABLE_NAME = 'comments' AND OLD.status = 'published' AND OLD.author_id IS NOT NULL THEN
            UPDATE user_profiles SET comments_count = GREATEST(comments_count - 1, 0) WHERE user_id = OLD.author_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Triggers to automatically update user stats
CREATE TRIGGER update_user_posts_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER update_user_comments_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_user_stats();


-- Create votes table for upvote/downvote functionality
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  guest_identifier TEXT, -- for guest votes (IP + session)
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure only one vote per user per item
  CONSTRAINT votes_user_post_unique UNIQUE(user_id, post_id),
  CONSTRAINT votes_user_comment_unique UNIQUE(user_id, comment_id),
  CONSTRAINT votes_guest_post_unique UNIQUE(guest_identifier, post_id),
  CONSTRAINT votes_guest_comment_unique UNIQUE(guest_identifier, comment_id),
  
  -- Ensure either user_id or guest_identifier is set
  CONSTRAINT votes_user_or_guest CHECK (
    (user_id IS NOT NULL AND guest_identifier IS NULL) OR
    (user_id IS NULL AND guest_identifier IS NOT NULL)
  ),
  
  -- Ensure either post_id or comment_id is set, but not both
  CONSTRAINT votes_post_or_comment CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- Create indexes for efficient queries
CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_votes_guest_identifier ON votes(guest_identifier);
CREATE INDEX idx_votes_post_id ON votes(post_id);
CREATE INDEX idx_votes_comment_id ON votes(comment_id);
CREATE INDEX idx_votes_vote_type ON votes(vote_type);

-- Function to update vote counts
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update vote count for post or comment
        IF NEW.post_id IS NOT NULL THEN
            IF NEW.vote_type = 'up' THEN
                UPDATE posts SET votes_count = votes_count + 1 WHERE id = NEW.post_id;
            ELSE
                UPDATE posts SET votes_count = votes_count - 1 WHERE id = NEW.post_id;
            END IF;
        ELSIF NEW.comment_id IS NOT NULL THEN
            IF NEW.vote_type = 'up' THEN
                UPDATE comments SET votes_count = votes_count + 1 WHERE id = NEW.comment_id;
            ELSE
                UPDATE comments SET votes_count = votes_count - 1 WHERE id = NEW.comment_id;
            END IF;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle vote type change
        IF OLD.vote_type != NEW.vote_type THEN
            IF NEW.post_id IS NOT NULL THEN
                IF NEW.vote_type = 'up' THEN
                    UPDATE posts SET votes_count = votes_count + 2 WHERE id = NEW.post_id;
                ELSE
                    UPDATE posts SET votes_count = votes_count - 2 WHERE id = NEW.post_id;
                END IF;
            ELSIF NEW.comment_id IS NOT NULL THEN
                IF NEW.vote_type = 'up' THEN
                    UPDATE comments SET votes_count = votes_count + 2 WHERE id = NEW.comment_id;
                ELSE
                    UPDATE comments SET votes_count = votes_count - 2 WHERE id = NEW.comment_id;
                END IF;
            END IF;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Remove vote count
        IF OLD.post_id IS NOT NULL THEN
            IF OLD.vote_type = 'up' THEN
                UPDATE posts SET votes_count = votes_count - 1 WHERE id = OLD.post_id;
            ELSE
                UPDATE posts SET votes_count = votes_count + 1 WHERE id = OLD.post_id;
            END IF;
        ELSIF OLD.comment_id IS NOT NULL THEN
            IF OLD.vote_type = 'up' THEN
                UPDATE comments SET votes_count = votes_count - 1 WHERE id = OLD.comment_id;
            ELSE
                UPDATE comments SET votes_count = votes_count + 1 WHERE id = OLD.comment_id;
            END IF;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger to automatically update vote counts
CREATE TRIGGER update_vote_counts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON votes
    FOR EACH ROW EXECUTE FUNCTION update_vote_counts();

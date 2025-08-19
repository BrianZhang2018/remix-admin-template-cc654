-- Enable Row Level Security on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Categories policies (public read, admin write)
CREATE POLICY "Categories are viewable by everyone" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Categories are insertable by admins only" ON categories
    FOR INSERT WITH CHECK (false); -- Will be updated when admin roles are implemented

CREATE POLICY "Categories are updatable by admins only" ON categories
    FOR UPDATE USING (false); -- Will be updated when admin roles are implemented

-- Tags policies (public read, admin write)
CREATE POLICY "Tags are viewable by everyone" ON tags
    FOR SELECT USING (true);

CREATE POLICY "Tags are insertable by admins only" ON tags
    FOR INSERT WITH CHECK (false); -- Will be updated when admin roles are implemented

CREATE POLICY "Tags are updatable by admins only" ON tags
    FOR UPDATE USING (false); -- Will be updated when admin roles are implemented

-- Posts policies (public read, authenticated/guest write)
CREATE POLICY "Posts are viewable by everyone" ON posts
    FOR SELECT USING (status = 'published');

CREATE POLICY "Users can insert their own posts" ON posts
    FOR INSERT WITH CHECK (
        (auth.uid() IS NOT NULL AND author_id = auth.uid()) OR
        (auth.uid() IS NULL AND author_id IS NULL AND author_name IS NOT NULL)
    );

CREATE POLICY "Users can update their own posts" ON posts
    FOR UPDATE USING (
        (auth.uid() IS NOT NULL AND author_id = auth.uid()) OR
        (auth.uid() IS NULL AND author_id IS NULL)
    );

CREATE POLICY "Users can delete their own posts" ON posts
    FOR DELETE USING (
        (auth.uid() IS NOT NULL AND author_id = auth.uid()) OR
        (auth.uid() IS NULL AND author_id IS NULL)
    );

-- Post tags policies (follow post permissions)
CREATE POLICY "Post tags are viewable by everyone" ON post_tags
    FOR SELECT USING (true);

CREATE POLICY "Post tags can be managed with post permissions" ON post_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM posts 
            WHERE posts.id = post_tags.post_id 
            AND (
                (auth.uid() IS NOT NULL AND posts.author_id = auth.uid()) OR
                (auth.uid() IS NULL AND posts.author_id IS NULL)
            )
        )
    );

-- Comments policies (public read, authenticated/guest write)
CREATE POLICY "Comments are viewable by everyone" ON comments
    FOR SELECT USING (status = 'published');

CREATE POLICY "Users can insert their own comments" ON comments
    FOR INSERT WITH CHECK (
        (auth.uid() IS NOT NULL AND author_id = auth.uid()) OR
        (auth.uid() IS NULL AND author_id IS NULL AND author_name IS NOT NULL)
    );

CREATE POLICY "Users can update their own comments" ON comments
    FOR UPDATE USING (
        (auth.uid() IS NOT NULL AND author_id = auth.uid()) OR
        (auth.uid() IS NULL AND author_id IS NULL)
    );

CREATE POLICY "Users can delete their own comments" ON comments
    FOR DELETE USING (
        (auth.uid() IS NOT NULL AND author_id = auth.uid()) OR
        (auth.uid() IS NULL AND author_id IS NULL)
    );

-- Votes policies (authenticated/guest can vote)
CREATE POLICY "Votes are viewable by everyone" ON votes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own votes" ON votes
    FOR ALL USING (
        (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
        (auth.uid() IS NULL AND guest_identifier IS NOT NULL)
    );

-- User profiles policies (public read, own profile write)
CREATE POLICY "User profiles are viewable by everyone" ON user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Reports policies (users can create, admins can manage)
CREATE POLICY "Users can create reports" ON reports
    FOR INSERT WITH CHECK (
        (auth.uid() IS NOT NULL AND reporter_id = auth.uid()) OR
        (auth.uid() IS NULL AND reporter_email IS NOT NULL)
    );

CREATE POLICY "Users can view their own reports" ON reports
    FOR SELECT USING (
        (auth.uid() IS NOT NULL AND reporter_id = auth.uid()) OR
        false -- Admins will have separate policy
    );

CREATE POLICY "Reports are updatable by admins only" ON reports
    FOR UPDATE USING (false); -- Will be updated when admin roles are implemented


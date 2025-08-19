-- Create reports table for content moderation
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES auth.users(id),
  reporter_email TEXT, -- for guest reports
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  
  -- Ensure either reporter_id or reporter_email is set
  CONSTRAINT reports_reporter CHECK (
    (reporter_id IS NOT NULL AND reporter_email IS NULL) OR
    (reporter_id IS NULL AND reporter_email IS NOT NULL)
  ),
  
  -- Ensure either post_id or comment_id is set, but not both
  CONSTRAINT reports_content CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- Create indexes for efficient queries
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_post_id ON reports(post_id);
CREATE INDEX idx_reports_comment_id ON reports(comment_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

-- Function to update resolved_at timestamp
CREATE OR REPLACE FUNCTION update_report_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status != NEW.status AND NEW.status IN ('resolved', 'dismissed') THEN
        NEW.resolved_at = NOW();
    ELSIF OLD.status != NEW.status AND NEW.status = 'pending' THEN
        NEW.resolved_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update resolved_at
CREATE TRIGGER update_report_resolved_at_trigger BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_report_resolved_at();

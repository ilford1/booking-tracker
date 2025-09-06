-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- Reference to auth.users or your users table
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('booking', 'payment', 'campaign', 'creator', 'reminder', 'system')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ NULL,
    
    -- Optional metadata for context
    related_id UUID NULL,
    related_type TEXT NULL CHECK (related_type IN ('booking', 'payment', 'campaign', 'creator')),
    action_url TEXT NULL,
    expires_at TIMESTAMPTZ NULL,
    
    -- Audit fields
    actor TEXT NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_related ON notifications(related_id, related_type);

-- Create composite index for common queries (user's unread notifications)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read, created_at DESC);

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can only update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Only system/admin can create notifications
CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true); -- We'll handle this in the application layer

-- Only system/admin can delete notifications (for cleanup)
CREATE POLICY "System can delete notifications" ON notifications
    FOR DELETE USING (true); -- We'll handle this in the application layer

-- Create a function to automatically mark notification as read when read_at is set
CREATE OR REPLACE FUNCTION auto_mark_notification_read()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.read_at IS NOT NULL AND OLD.read_at IS NULL THEN
        NEW.read = TRUE;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER auto_mark_read_trigger 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW 
    EXECUTE FUNCTION auto_mark_notification_read();

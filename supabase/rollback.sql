-- ============================================
-- TaskSphere Database Rollback Script
-- ============================================
-- This script removes all objects created by set_up.sql
-- Run this to clean up the database completely

-- 1. Remove Storage Policies (from Migration)
DROP POLICY IF EXISTS "Authenticated users can upload task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Public can view task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Group members can see public submissions" ON submissions;

-- Remove bucket (Attempt to remove if empty, might fail if has objects, but good to try)
DO $$
BEGIN
    DELETE FROM storage.buckets WHERE id = 'task-attachments';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. Remove tables from realtime publication to avoid errors
DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE posts;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE likes;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE comments;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE notifications;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE group_messages;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE messages;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Reset replica identity
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'messages' AND schemaname = 'public') THEN
        ALTER TABLE messages REPLICA IDENTITY DEFAULT;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'group_messages' AND schemaname = 'public') THEN
        ALTER TABLE group_messages REPLICA IDENTITY DEFAULT;
    END IF;
END $$;

-- 3. Drop triggers BEFORE dropping tables
-- (Dropping a table drops its triggers, so we use DO blocks to avoid "relation does not exist" errors)
DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS ensure_super_admin ON users;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS update_users_updated_at ON users;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS update_groups_updated_at ON groups;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS update_submissions_updated_at ON submissions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 4. Drop tables (in reverse order of dependencies)
DROP TABLE IF EXISTS scores CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS ai_conversation_sessions CASCADE;
DROP TABLE IF EXISTS group_creation_messages CASCADE;
DROP TABLE IF EXISTS group_requests CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS group_messages CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 5. Drop functions
DROP FUNCTION IF EXISTS public.maintain_super_admin_status() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP TYPE IF EXISTS user_role;

-- 6. Drop indexes (Optional as table drops remove them, but good for completeness)
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_is_super_admin;
DROP INDEX IF EXISTS idx_groups_name;
DROP INDEX IF EXISTS idx_groups_top_admin;
DROP INDEX IF EXISTS idx_groups_created_at;
DROP INDEX IF EXISTS idx_members_user_role;
DROP INDEX IF EXISTS idx_members_group_user;
DROP INDEX IF EXISTS idx_members_user_id;
DROP INDEX IF EXISTS idx_members_role;
DROP INDEX IF EXISTS idx_group_requests_status;
DROP INDEX IF EXISTS idx_group_requests_user;
DROP INDEX IF EXISTS idx_posts_author;
DROP INDEX IF EXISTS idx_posts_visibility_created;
DROP INDEX IF EXISTS idx_posts_created_at;
DROP INDEX IF EXISTS idx_likes_post_id;
DROP INDEX IF EXISTS idx_likes_user_id;
DROP INDEX IF EXISTS idx_likes_post_user;
DROP INDEX IF EXISTS idx_comments_post_id;
DROP INDEX IF EXISTS idx_comments_user_id;
DROP INDEX IF EXISTS idx_comments_created_at;
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_user_read;
DROP INDEX IF EXISTS idx_notifications_created_at;
DROP INDEX IF EXISTS idx_messages_sender_receiver;
DROP INDEX IF EXISTS idx_messages_receiver;
DROP INDEX IF EXISTS idx_messages_created_at;
DROP INDEX IF EXISTS idx_group_messages_group_id;
DROP INDEX IF EXISTS idx_group_messages_sender;
DROP INDEX IF EXISTS idx_tasks_group_created;
DROP INDEX IF EXISTS idx_tasks_group_id;
DROP INDEX IF EXISTS idx_submissions_task_student;
DROP INDEX IF EXISTS idx_submissions_task;
DROP INDEX IF EXISTS idx_submissions_student;
DROP INDEX IF EXISTS idx_scores_submission;
DROP INDEX IF EXISTS idx_group_creation_sender;
DROP INDEX IF EXISTS idx_ai_sessions_user;
DROP INDEX IF EXISTS idx_ai_sessions_active;

-- Success message
SELECT '✅ TaskSphere database rollback completed successfully!' as status;

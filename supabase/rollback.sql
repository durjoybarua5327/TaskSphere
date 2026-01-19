-- ============================================
-- TaskSphere Complete Rollback Script
-- This will DROP ALL tables, enums, triggers, and functions
-- DANGER: This will delete ALL data in the database
-- ============================================

-- Toggle off RLS (Optional but safe)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'ALTER TABLE IF EXISTS ' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- Drop Tables (in reverse order of dependencies)
DROP TABLE IF EXISTS ai_conversation_sessions CASCADE;
DROP TABLE IF EXISTS group_creation_messages CASCADE;
DROP TABLE IF EXISTS scores CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS group_requests CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop Functions
DROP FUNCTION IF EXISTS public.maintain_super_admin_status() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop Enums
DROP TYPE IF EXISTS user_role CASCADE;

-- Optional: Drop UUID Extension
-- DROP EXTENSION IF EXISTS "uuid-ossp";

SELECT '✅ TaskSphere database rollback completed! You can now run setup_database.sql again.' as result;

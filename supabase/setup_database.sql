-- ============================================
-- TaskSphere Unified Database Setup
-- Includes: Users, Groups, Members, Posts, Tasks, Submissions, Scores, 
-- Messages, Group Requests, and AI Workflow Tables.
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ENUMS AND TYPES
-- ============================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'admin', 'top_admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================
-- 2. TABLES
-- ============================================

-- USERS Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- Clerk ID
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    student_id TEXT, 
    institute_name TEXT,
    is_super_admin BOOLEAN DEFAULT FALSE,
    ai_enabled BOOLEAN DEFAULT TRUE,
    banned_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GROUPS Table
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    institute_name TEXT,
    department TEXT,
    topics TEXT[],
    top_admin_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GROUP MEMBERS Table
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'student',
    points INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- GROUP REQUESTS Table
CREATE TABLE IF NOT EXISTS group_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    group_name TEXT,
    institute_name TEXT,
    department TEXT,
    topics TEXT[],
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- POSTS Table
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    tags TEXT[],
    images TEXT[],
    visibility TEXT DEFAULT 'public',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LIKES Table
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- COMMENTS Table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MESSAGES Table (Direct Messenger System)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    receiver_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_ai_response BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TASKS Table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    creator_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL, 
    deadline TIMESTAMP WITH TIME ZONE,
    max_score INTEGER DEFAULT 10,
    ai_prompt TEXT,
    visibility TEXT DEFAULT 'group',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SUBMISSIONS Table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    file_url TEXT,
    link_url TEXT,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'revision')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SCORES Table
CREATE TABLE IF NOT EXISTS scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    grader_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    score_value INTEGER NOT NULL,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GROUP CREATION MESSAGES (AI-Assisted Workflow)
CREATE TABLE IF NOT EXISTS group_creation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_ai BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI CONVERSATION SESSIONS
CREATE TABLE IF NOT EXISTS ai_conversation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    context_type TEXT NOT NULL, -- e.g., 'group_creation', 'chat'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(name);
CREATE INDEX IF NOT EXISTS idx_members_group_user ON group_members(group_id, user_id);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_submissions_task ON submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_group_creation_sender ON group_creation_messages(sender_id);

-- ============================================
-- 4. FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_groups_updated_at ON groups;
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-assign Super Admin by Email
CREATE OR REPLACE FUNCTION public.maintain_super_admin_status() 
RETURNS TRIGGER AS $$
BEGIN
    -- Add secondary emails if necessary
    IF NEW.email IN ('durjoybarua8115@gmail.com', 'durjoybarua5327@gmail.com') THEN
        NEW.is_super_admin := TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_super_admin ON users;
CREATE TRIGGER ensure_super_admin
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION public.maintain_super_admin_status();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_creation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversation_sessions ENABLE ROW LEVEL SECURITY;

-- USERS Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;
CREATE POLICY "Public profiles are viewable by everyone" ON users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING ((select auth.uid()::text) = id);

-- GROUPS Policies
DROP POLICY IF EXISTS "Groups viewable by everyone" ON groups;
CREATE POLICY "Groups viewable by everyone" ON groups FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create groups" ON groups;
CREATE POLICY "Anyone can create groups" ON groups FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Super and Admin can manage groups" ON groups;
CREATE POLICY "Super and Admin can manage groups" ON groups FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()::text) AND is_super_admin = true) OR
    top_admin_id = (select auth.uid()::text)
);

-- GROUP MEMBERS Policies
DROP POLICY IF EXISTS "Members can see each other" ON group_members;
CREATE POLICY "Members can see each other" ON group_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can be added to a group" ON group_members;
CREATE POLICY "Anyone can be added to a group" ON group_members FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can manage members" ON group_members;
CREATE POLICY "Admins can manage members" ON group_members FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()::text) AND is_super_admin = true) OR
    EXISTS (SELECT 1 FROM groups WHERE id = group_id AND top_admin_id = (select auth.uid()::text))
);

-- POSTS Policies
DROP POLICY IF EXISTS "Posts viewable by everyone" ON posts;
CREATE POLICY "Posts viewable by everyone" ON posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Logged in users can create posts" ON posts;
CREATE POLICY "Logged in users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Authors can update/delete own posts" ON posts;
CREATE POLICY "Authors can update/delete own posts" ON posts FOR ALL USING (
    author_id = (select auth.uid()::text) OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()::text) AND is_super_admin = true)
);

-- LIKES Policies
DROP POLICY IF EXISTS "Likes are public" ON likes;
CREATE POLICY "Likes are public" ON likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can like" ON likes;
CREATE POLICY "Users can like" ON likes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Users can unlike" ON likes;
CREATE POLICY "Users can unlike" ON likes FOR DELETE USING (user_id = (select auth.uid()::text));

-- COMMENTS Policies
DROP POLICY IF EXISTS "Comments are public" ON comments;
CREATE POLICY "Comments are public" ON comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can comment" ON comments;
CREATE POLICY "Users can comment" ON comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Authors can manage comments" ON comments;
CREATE POLICY "Authors can manage comments" ON comments FOR ALL USING (
    user_id = (select auth.uid()::text) OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()::text) AND is_super_admin = true)
);

-- MESSAGES Policies
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
CREATE POLICY "Users can view their own messages" ON messages FOR SELECT USING (
    sender_id = (select auth.uid()::text) OR 
    receiver_id = (select auth.uid()::text) OR 
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()::text) AND is_super_admin = true)
);
DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (sender_id = (select auth.uid()::text));

-- TASKS Policies
DROP POLICY IF EXISTS "Tasks viewable by group members" ON tasks;
CREATE POLICY "Tasks viewable by group members" ON tasks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage tasks" ON tasks;
CREATE POLICY "Admins can manage tasks" ON tasks FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()::text) AND is_super_admin = true) OR
    EXISTS (SELECT 1 FROM groups WHERE id = group_id AND top_admin_id = (select auth.uid()::text))
);

-- SUBMISSIONS Policies
DROP POLICY IF EXISTS "Students can view and manage their submissions" ON submissions;
CREATE POLICY "Students can view and manage their submissions" ON submissions FOR ALL USING (
    student_id = (select auth.uid()::text) OR
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()::text) AND is_super_admin = true)
);

-- SCORES Policies
DROP POLICY IF EXISTS "Users can see their scores" ON scores;
CREATE POLICY "Users can see their scores" ON scores FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can grade" ON scores;
CREATE POLICY "Admins can grade" ON scores FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()::text) AND is_super_admin = true)
);

-- ============================================
-- 6. REALTIME ENABLING
-- ============================================

-- Enable Realtime for specific tables
ALTER publication supabase_realtime ADD TABLE posts;
ALTER publication supabase_realtime ADD TABLE likes;
ALTER publication supabase_realtime ADD TABLE comments;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT '✅ TaskSphere FULL Unified Database set up successfully!' as result;

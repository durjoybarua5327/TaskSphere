-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ROLES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'admin', 'top_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- USERS Table
-- Changed id to TEXT to accommodate Clerk IDs (e.g., user_2N...)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    is_super_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GROUPS Table
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    top_admin_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
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
    status TEXT DEFAULT 'submitted',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SCORES Table
CREATE TABLE IF NOT EXISTS scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    score INTEGER CHECK (score >= 0 AND score <= 10),
    feedback TEXT,
    grader_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI REVIEWS Table
CREATE TABLE IF NOT EXISTS ai_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    suggested_score INTEGER,
    feedback_explanation TEXT,
    raw_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- POSTS Table
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    tags TEXT[],
    visibility TEXT DEFAULT 'public',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- POST VISIBILITY Table (From schema.sql, adapted)
CREATE TABLE IF NOT EXISTS post_visibility (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE
);

-- COMMENTS Table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LIKES Table
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);


-- RLS POLICIES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_visibility ENABLE ROW LEVEL SECURITY;

-- HELPER FOR AUTH (Clerk Compatibility)
-- Assumes auth.uid() returns the Clerk User ID as a string or compatible value, but likely needs casting.

-- 1. Users policies
CREATE POLICY "Public profiles are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id);

-- 2. Groups policies
CREATE POLICY "Groups viewable by everyone" ON groups FOR SELECT USING (true);
CREATE POLICY "Super and Top Admin can manage groups" ON groups FOR ALL USING (
    (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND is_super_admin = true)) OR
    top_admin_id = auth.uid()::text
);

-- 3. Group Members policies
CREATE POLICY "Viewable by group members and public" ON group_members FOR SELECT USING (true); 
CREATE POLICY "Admins can manage members" ON group_members FOR ALL USING (
    EXISTS (
        SELECT 1 FROM group_members gm 
        WHERE gm.user_id = auth.uid()::text
        AND gm.group_id = group_members.group_id 
        AND gm.role IN ('top_admin', 'admin')
    ) OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND is_super_admin = true)
);

-- 4. Group Requests Policies
CREATE POLICY "Users can create join requests" ON group_requests FOR INSERT WITH CHECK (
    auth.uid()::text = user_id AND 
    NOT EXISTS (SELECT 1 FROM group_members WHERE group_id = group_requests.group_id AND user_id = auth.uid()::text)
);
CREATE POLICY "Users can view own requests" ON group_requests FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Admins can view group requests" ON group_requests FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM group_members gm 
        WHERE gm.user_id = auth.uid()::text
        AND gm.group_id = group_requests.group_id 
        AND gm.role IN ('top_admin', 'admin')
    )
);
CREATE POLICY "Admins can update group requests" ON group_requests FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM group_members gm 
        WHERE gm.user_id = auth.uid()::text
        AND gm.group_id = group_requests.group_id 
        AND gm.role IN ('top_admin', 'admin')
    )
);

-- 5. Posts Policies
CREATE POLICY "Posts viewable by everyone" ON posts FOR SELECT USING (true);

CREATE POLICY "Members of any group can create posts" ON posts FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM group_members WHERE user_id = auth.uid()::text)
);

CREATE POLICY "Authors can update own posts" ON posts FOR UPDATE USING (author_id = auth.uid()::text);
CREATE POLICY "Authors can delete own posts" ON posts FOR DELETE USING (author_id = auth.uid()::text);

-- 6. Comments Policies (From schema.sql, adapted)
CREATE POLICY "Comments viewable by everyone" ON comments FOR SELECT USING (true);

CREATE POLICY "Members of any group can comment" ON comments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM group_members WHERE user_id = auth.uid()::text)
);

-- 7. Likes Policies (From schema.sql, adapted)
CREATE POLICY "Likes viewable by everyone" ON likes FOR SELECT USING (true);

CREATE POLICY "Members of any group can like" ON likes FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM group_members WHERE user_id = auth.uid()::text)
);

CREATE POLICY "Users can remove own likes" ON likes FOR DELETE USING (user_id = auth.uid()::text);

-- 8. Task Policies (Merged)
CREATE POLICY "Tasks viewable by group members" ON tasks FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members WHERE user_id = auth.uid()::text AND group_id = tasks.group_id)
);

CREATE POLICY "Admins can create tasks" ON tasks FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM group_members 
        WHERE user_id = auth.uid()::text
        AND group_id = group_id 
        AND role IN ('top_admin', 'admin')
    )
);

-- ADMIN SETUP (Run manually as needed)
-- 9. Promote User to Super Admin
-- Run this query in your Supabase SQL Editor to make the user a Super Admin

UPDATE users
SET is_super_admin = TRUE
WHERE email = 'durjoybarua8115@gmail.com';

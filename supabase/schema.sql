-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ROLES
CREATE TYPE user_role AS ENUM ('student', 'admin', 'top_admin');

-- USERS Table
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    is_super_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GROUPS Table
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    top_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GROUP MEMBERS Table
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'student',
    points INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- GROUP REQUESTS Table
CREATE TABLE group_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- TASKS Table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL, 
    deadline TIMESTAMP WITH TIME ZONE,
    max_score INTEGER DEFAULT 10,
    ai_prompt TEXT,
    visibility TEXT DEFAULT 'group',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SUBMISSIONS Table
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    file_url TEXT,
    link_url TEXT,
    status TEXT DEFAULT 'submitted',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SCORES Table
CREATE TABLE scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    score INTEGER CHECK (score >= 0 AND score <= 10),
    feedback TEXT,
    grader_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI REVIEWS Table
CREATE TABLE ai_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    suggested_score INTEGER,
    feedback_explanation TEXT,
    raw_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- POSTS Table
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    tags TEXT[],
    visibility TEXT DEFAULT 'public',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- POST VISIBILITY Table
CREATE TABLE post_visibility (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE
);

-- COMMENTS Table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LIKES Table
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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

-- 1. Users policies
CREATE POLICY "Public profiles are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- 2. Groups policies
CREATE POLICY "Groups viewable by everyone" ON groups FOR SELECT USING (true);
CREATE POLICY "Super and Top Admin can manage groups" ON groups FOR ALL USING (
    (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true)) OR
    top_admin_id = auth.uid()
);

-- 3. Group Members policies
CREATE POLICY "Viewable by group members and public" ON group_members FOR SELECT USING (true); 
CREATE POLICY "Admins can manage members" ON group_members FOR ALL USING (
    EXISTS (
        SELECT 1 FROM group_members gm 
        WHERE gm.user_id = auth.uid() 
        AND gm.group_id = group_members.group_id 
        AND gm.role IN ('top_admin', 'admin')
    ) OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true)
);

-- 3.5 Group Requests Policies
CREATE POLICY "Users can create join requests" ON group_requests FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    NOT EXISTS (SELECT 1 FROM group_members WHERE group_id = group_requests.group_id AND user_id = auth.uid())
);
CREATE POLICY "Users can view own requests" ON group_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view group requests" ON group_requests FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM group_members gm 
        WHERE gm.user_id = auth.uid() 
        AND gm.group_id = group_requests.group_id 
        AND gm.role IN ('top_admin', 'admin')
    )
);
CREATE POLICY "Admins can update group requests" ON group_requests FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM group_members gm 
        WHERE gm.user_id = auth.uid() 
        AND gm.group_id = group_requests.group_id 
        AND gm.role IN ('top_admin', 'admin')
    )
);

-- 4. Posts Policies (The User Request Implementation)
-- "They can see post... but can't like, comment, create post until they exist in any group"

CREATE POLICY "Posts viewable by everyone" ON posts FOR SELECT USING (true);

CREATE POLICY "Members of any group can create posts" ON posts FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM group_members WHERE user_id = auth.uid())
);

CREATE POLICY "Authors can update own posts" ON posts FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Authors can delete own posts" ON posts FOR DELETE USING (author_id = auth.uid());

-- 5. Likes/Comments Policies
CREATE POLICY "Comments viewable by everyone" ON comments FOR SELECT USING (true);

CREATE POLICY "Members of any group can comment" ON comments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM group_members WHERE user_id = auth.uid())
);

CREATE POLICY "Likes viewable by everyone" ON likes FOR SELECT USING (true);

CREATE POLICY "Members of any group can like" ON likes FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM group_members WHERE user_id = auth.uid())
);

CREATE POLICY "Users can remove own likes" ON likes FOR DELETE USING (user_id = auth.uid());

-- 6. Task Policies
CREATE POLICY "Tasks viewable by group members" ON tasks FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members WHERE user_id = auth.uid() AND group_id = tasks.group_id)
);
CREATE POLICY "Admins can create tasks" ON tasks FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM group_members 
        WHERE user_id = auth.uid() 
        AND group_id = group_id 
        AND role IN ('top_admin', 'admin')
    )
);

-- TRIGGER for updating user profile
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

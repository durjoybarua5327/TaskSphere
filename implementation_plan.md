# TaskSphere Implementation Plan

## 1. Project Initialization & Setup
- [x] Create Next.js App (App Router, Tailwind, TypeScript)
- [ ] Install Dependencies:
    - `@supabase/supabase-js`, `@supabase/ssr` (Supabase)
    - `openai`, `ai` (AI Grading)
    - `lucide-react` (Icons)
    - `@tiptap/react`, `@tiptap/starter-kit` (Rich Text Editor)
    - `clsx`, `tailwind-merge` (Styling utilities)
    - `date-fns` (Date formatting)
- [ ] Configure Environment Variables (`.env.local`)

## 2. Database Schema & Supabase Setup
- [ ] Create `schema.sql` file containing:
    - Tables: `users`, `roles`, `groups`, `group_members`, `tasks`, `submissions`, `scores`, `ai_reviews`, `posts`, `post_visibility`, `comments`, `likes`
    - Enums/Constants for Roles
    - RLS Policies for strict hierarchy enforcement
    - Triggers for `updated_at`
- [ ] Document strict role permissions in SQL comments

## 3. Core Architecture & Folder Structure
- [ ] Create directory structure:
    - `/app/(auth)`
    - `/app/dashboard/...`
    - `/components/ui`, `/components/editor`, `/lib`, `/hooks`
- [ ] Implement `lib/supabase.ts` (Client & Server clients)
- [ ] Implement `lib/auth.ts` (Auth helpers)
- [ ] Implement `context/AuthContext` (or `hooks/useAuth`)

## 4. UI/UX Foundation
- [ ] Configure Tailwind (`globals.css`) with "premium" aesthetic (colors, fonts, animations).
- [ ] Create reusable UI components:
    - `Button`, `Input`, `Card`, `Modal`
    - `RichTextEditor` (TipTap wrapper)
- [ ] Create Layouts:
    - `Sidebar` (Role-based navigation)
    - `Header` (Profile, Notifications)

## 5. Feature Implementation

### Authentication & Profiles
- [ ] Login/Register pages
- [ ] Profile Page (`/profile/[userId]`)
    - Display stats, groups, posts

### Group Management
- [ ] Super Admin Dashboard: Create Groups, Assign Top Admins
- [ ] Top Admin Dashboard: Manage Group, Add/Promote Admins/Students
- [ ] Admin Dashboard: Class management

### Task System
- [ ] Task Creation Form (with Rich Text & AI prompt)
- [ ] Task List & Details View
- [ ] Submission Interface (Text, File, URL)

### AI Grading & Evaluation
- [ ] Backend API `/api/ai-grading` using OpenAI/Gemini
- [ ] Instructor View: Review Submissions, Request AI suggestion
- [ ] Grading Interface: Accept/Edit AI score, allow feedback

### Community Features
- [ ] Global/Group Posting System
- [ ] Feed View (Rich cards)
- [ ] Comments & Likes

## 6. Final Polish
- [ ] Deployment Check (Vercel ready)
- [ ] README.md with detailed setup instructions

# TaskSphere

TaskSphere is a production-ready, scalable web application for clubs and learning communities. It features strict role-based access control, task management, and AI-assisted grading.

## Features

- **Role Hierarchy**: Super Admin > Top Admin (Group Owner) > Admin (Instructor) > Student.
- **Group System**: Users can belong to multiple groups with different roles.
- **Task Management**: Create tasks with rich text descriptions, deadlines, and file uploads.
- **AI-Assisted Grading**: Top Admins and Admins can use AI to evaluate submissions and suggest scores.
- **Rich Profiles**: Public profiles showcasing stats and group memberships.
- **Interactive Feed**: Global and group-specific posting system.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React Server Components, Tailwind CSS (Premium Design).
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions).
- **AI**: OpenAI / Gemini via Vercel AI SDK.
- **Deployment**: Vercel.

## Setup Instructions

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd tasksphere
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Variables**:
    Create a `.env.local` file in the root directory:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    OPENAI_API_KEY=your_openai_api_key
    ```

4.  **Database Setup**:
    - Go to your Supabase project > SQL Editor.
    - Copy the content of `supabase/schema.sql` and run it.
    - This will create all necessary tables, RLS policies, and triggers.

5.  **Run Locally**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000).

## Folder Structure

- `/app`: Next.js App Router pages and layouts.
- `/components`: Reusable UI components.
- `/lib`: Utility functions, Supabase clients, and logic helpers.
- `/styles`: Global styles and Tailwind configuration.
- `/supabase`: SQL schema and database resources.
- `/hooks`: Custom React hooks.

## Deployment

1.  Push to GitHub.
2.  Import project into Vercel.
3.  Add the Environment Variables in Vercel Project Settings.
4.  Deploy!

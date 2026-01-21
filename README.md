# 🎓 TaskSphere

**TaskSphere** is a comprehensive task management and collaboration platform designed for educational institutions. It enables seamless communication between students, admins, and super admins with real-time messaging, group management, task assignments, and AI-powered features.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## ✨ Features

### 👥 User Roles
- **Students**: Join groups, submit tasks, participate in discussions
- **Admins**: Manage groups, create tasks, moderate chat
- **Super Admins**: Full system access, create groups, manage users

### 💬 Real-Time Group Chat
- Live messaging with Supabase Realtime
- Social media-style interface with profiles and avatars
- Admin-only chat mode per group
- Emoji picker support
- Message history with timestamps
- Read receipts

### 📋 Task Management
- Create and assign tasks to groups
- File attachments support
- Deadline tracking
- Submission management
- Scoring and feedback system

### 🤖 AI Features
- AI-assisted group creation
- Smart recommendations
- Automated workflows

### 🔒 Security
- Row-level security (RLS) with Supabase
- Clerk authentication  
- Permission-based access control
- Secure webhooks

---

## 🚀 Tech Stack

- **Framework**: Next.js 16.1.3 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime
- **AI**: OpenAI API
- **Deployment**: Vercel
- **UI Components**: Radix UI, Framer Motion, Lucide Icons

---

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Clerk account
- OpenAI API key
- Vercel account (for deployment)

---

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/TaskSphere.git
cd TaskSphere
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in your credentials in `.env.local`:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_api_key

# Webhook
WEBHOOK_SECRET=your_webhook_secret
```

### 4. Set up the database

1. Go to your Supabase project
2. Run the SQL script from `supabase/setup_database.sql` in the SQL Editor
3. Verify all tables are created

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Build for Production

```bash
npm run build
npm start
```

---

## 🚀 Deploy to Vercel

See the comprehensive [DEPLOYMENT.md](./DEPLOYMENT.md) guide for detailed step-by-step instructions.

**Quick Deploy:**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## 📁 Project Structure

```
TaskSphere/
├── app/                          # Next.js App Router
│   ├── admin/                    # Admin panel
│   ├── student/                  # Student panel
│   ├── superadmin/               # Super admin panel
│   └── api/                      # API routes
├── lib/                          # Utilities
├── supabase/                     # Database scripts
├── .env.example                  # Environment template
├── vercel.json                   # Vercel config
└── DEPLOYMENT.md                 # Deployment guide
```

---

## 🔐 Security Features

- **Row-Level Security**: Supabase RLS policies on all tables
- **Authentication**: Clerk handles all auth flows
- **Authorization**: Permission checks at database and application level
- **Webhooks**: Verified webhook signatures

---

## 📝 Key Features

### Real-Time Group Chat
- Instant messaging with Supabase Realtime
- Admin-only mode per group
- Emoji picker
- Profile pictures and names

### Permission System

| Feature | Student | Admin | Super Admin |
|---------|---------|-------|-------------|
| Join Groups | ✅ | ✅ | ✅ |
| Create Groups | ❌ | ❌ | ✅ |
| Create Tasks | ❌ | ✅ | ✅ |
| Manage Members | ❌ | ✅ | ✅ |

---

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ for educational institutions**

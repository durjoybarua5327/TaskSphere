# 🎓 TaskSphere

**TaskSphere** is a premium task management and collaboration platform designed for modern educational institutions. It features a high-end, dynamic user interface with real-time synchronization, role-based workflows, and AI-powered automation.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## ✨ Key Features

### 🏛️ Advanced Role Hierarchy
- **Global Admin**: Full system governance, cross-institute management, and global analytics.
- **Top Admin**: Head of department/institute level control with group oversight.
- **Admin**: Group-level management, task creation, and moderation.
- **Student**: Collaborative learning, task submission, and peer interaction.

### 🎨 Premium UI/UX
- **Dynamic Content Area**: Independent scrolling system with custom glassmorphism effects.
- **Visual Role Badges**: Color-coded identity system (Emerald for Global, Orange for Top Admin, Purple for Admin).
- **Responsive Feed**: Post streams with horizontally scrollable tag systems and hidden scrollbars for a clean look.
- **Optimized Interactions**: Consolidated comment actions and hover-triggering management tools.

### 💬 Real-Time Collaboration
- **Unified Messaging**: Real-time group clusters and direct AI assistance channels.
- **Social Integration**: Clickable avatars and names for immediate profile navigation.
- **Smart Formatting**: Rich text support with Tiptap and syntax highlighting for code blocks.

### 📋 Task Center
- **Lifecycle Management**: From creation with AI-assistance to grading and feedback.
- **Submission Tracking**: File attachments, link sharing, and status monitoring.
- **Deadline Visuals**: Real-time countdowns and urgency indicators.

---

## 🚀 Tech Stack

- **Framework**: Next.js 16.1.3 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 (Custom Theme)
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime (Websockets)
- **AI**: OpenAI API
- **Animations**: Framer Motion
- **Performance**: Edge-cached routes and parallel data fetching

---

## 📁 Project Structure

```
TaskSphere/
├── app/                          # Next.js App Router
│   ├── admin/                    # Administrative Control Panel
│   ├── student/                  # Student Learning Dashboard
│   ├── superadmin/               # Global Governance Suite
│   └── api/                      # Protected Edge API Routes
├── components/                   # Modular UI Components
├── lib/                          # Core Utilities & Permissions
├── supabase/                     # SQL Schema & Migrations
└── styles/                       # Global Design System
```

---

## 🔐 Permission Matrix

| Feature | Student | Admin | Top Admin | Global Admin |
|---------|:-------:|:-----:|:---------:|:------------:|
| Join Groups | ✅ | ✅ | ✅ | ✅ |
| Create Tasks | ❌ | ✅ | ✅ | ✅ |
| Manage Members | ❌ | ✅ | ✅ | ✅ |
| Create Groups | ❌ | ❌ | ❌ | ✅ |
| System Config | ❌ | ❌ | ❌ | ✅ |

---

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ for educational excellence**

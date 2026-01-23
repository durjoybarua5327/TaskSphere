
import {
    Search,
    Bell,
    Home,
    Users,
    MessageSquare,
    CheckSquare,
    UserCircle,
    Plus,
    Heart,
    MoreHorizontal
} from "lucide-react";

export function MockDashboard() {
    return (
        <div className="w-full h-full bg-[#F8FAFC] flex flex-col overflow-hidden font-sans select-none pointer-events-none relative rounded-t-xl">
            {/* Top Navbar (Replicating UnifiedNavbar) */}
            <header className="absolute top-0 left-0 right-0 z-[10] bg-white/98 py-4 border-b border-slate-100/50 shadow-sm">
                <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between gap-4">
                    {/* Logo Section */}
                    <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xl md:text-2xl tracking-tight bg-gradient-to-r from-green-900 via-green-600 to-green-400 bg-clip-text text-transparent">
                            TaskSphere
                        </span>
                    </div>

                    {/* Navigation Items - Desktop */}
                    <nav className="hidden lg:flex items-center gap-2">
                        <NavPill icon={Home} label="Home" active />
                        <NavPill icon={Users} label="Groups" />
                        <NavPill icon={MessageSquare} label="Messages" />
                        <NavPill icon={CheckSquare} label="Tasks" />
                        <NavPill icon={UserCircle} label="Profile" />
                    </nav>

                    {/* Actions Panel */}
                    <div className="flex items-center gap-4">
                        <div className="relative w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </div>
                        <div className="h-8 w-px bg-slate-200" />
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-md">
                            JD
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 pt-24 pb-10 px-6 overflow-hidden relative">
                <div className="max-w-[1400px] mx-auto h-full flex flex-col">

                    {/* Header Action */}
                    <div className="flex items-center justify-end mb-8">
                        <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-xl shadow-slate-900/20 font-bold text-xs uppercase tracking-wider">
                            <Plus className="w-4 h-4" />
                            Create Post
                        </button>
                    </div>

                    {/* Post Feed Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">

                        {/* Post 1: Image & Tags */}
                        <MockPostCard
                            author="Dr. Sarah Smith"
                            role="Admin"
                            time="2 hours ago"
                            initial="S"
                            color="orange"
                            title="Advanced Physics Module 3 Released"
                            content="The new quantum mechanics module is now live. Please review the attached materials before Thursday's lab session."
                            image="/api/placeholder/400/200"
                            tags={['Physics', 'Important', 'Lab']}
                            likes={24}
                            comments={5}
                            hasImage={true}
                        />

                        {/* Post 2: Text Only */}
                        <MockPostCard
                            author="Alex Johnson"
                            role="Student"
                            time="5 hours ago"
                            initial="A"
                            color="blue"
                            title="Study Group for Calculus III"
                            content="Hey everyone! We're organizing a study session for the upcoming midterm at the library main hall. Anyone interested in joining?"
                            tags={['Calculus', 'Study Group']}
                            likes={12}
                            comments={8}
                        />

                        {/* Post 3: Announcement */}
                        <MockPostCard
                            author="Campus News"
                            role="Super Admin"
                            time="1 day ago"
                            initial="C"
                            color="emerald"
                            title="Semester Schedule Update"
                            content="Due to the upcoming holidays, the submission deadline for all final projects has been extended by 48 hours. Good luck!"
                            tags={['Announcement', 'General']}
                            likes={156}
                            comments={42}
                        />

                    </div>

                    {/* Fade out at bottom for scroll illusion */}
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#F8FAFC] to-transparent z-20 pointer-events-none" />
                </div>
            </main>
        </div>
    );
}

function NavPill({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
    return (
        <div className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-2xl transition-all duration-300 ${active ? 'text-green-700 shadow-md shadow-green-100 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100' : 'text-slate-500'}`}>
            <Icon className={`w-4 h-4 ${active ? 'text-green-600' : ''}`} />
            <span className="text-[11px] font-bold uppercase tracking-[0.12em]">{label}</span>
        </div>
    );
}

function MockPostCard({ author, role, time, initial, color, title, content, image, tags, likes, comments, hasImage = false }: any) {
    const colorClasses: Record<string, string> = {
        orange: 'bg-orange-100 text-orange-600',
        blue: 'bg-blue-100 text-blue-600',
        emerald: 'bg-emerald-100 text-emerald-600',
        purple: 'bg-purple-100 text-purple-600',
    };

    return (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col h-[400px] overflow-hidden relative">
            {/* Author Info */}
            <div className="flex items-center gap-3 mb-5 shrink-0">
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-sm ${colorClasses[color]}`}>
                    {initial}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-900 leading-none">{author}</span>
                        <span className="px-1.5 py-0.5 bg-green-50 border border-green-100 rounded-md text-[10px] font-bold text-green-700">
                            {role}
                        </span>
                    </div>
                    <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        {time}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                <h3 className="text-lg font-black text-slate-900 mb-3 leading-snug line-clamp-2 shrink-0">
                    {title}
                </h3>

                <div className="text-sm text-slate-600 leading-relaxed font-normal mb-4 overflow-hidden line-clamp-3">
                    {content}
                </div>

                {hasImage && (
                    <div className="relative aspect-video rounded-2xl overflow-hidden mt-auto mb-4 border border-slate-100 bg-slate-100 shrink-0 flex items-center justify-center">
                        <div className="text-slate-300 font-black text-7xl select-none opacity-20">TS</div>
                        {/* Abstract shapes to simulate image */}
                        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl"></div>
                    </div>
                )}

                <div className="mt-auto">
                    {tags && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {tags.map((tag: string) => (
                                <span key={tag} className="px-2.5 py-1 bg-green-50 text-green-700 rounded-xl text-xs font-bold border border-green-100">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <Heart className="w-4 h-4" />
                            <span className="text-sm font-semibold">{likes}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-sm font-semibold">{comments}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

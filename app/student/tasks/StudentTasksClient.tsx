"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ClipboardList,
    Users,
    FileText,
    Search,
    Calendar,
    CheckCircle2,
    Clock,
    User,
    ChevronRight,
    Building2,
    GraduationCap,
    ArrowRight,
    LayoutDashboard,
    AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Task {
    id: string;
    title: string;
    description: string;
    deadline: string | null;
    max_score: number;
    created_at: string;
    group: { id: string, name: string };
    creator: { full_name: string };
}

interface Submission {
    id: string;
    submitted_at: string;
    task: {
        id: string;
        title: string;
        group: { id: string, name: string };
    };
    scores: { score_value: number, feedback: string }[];
}

interface Group {
    id: string;
    name: string;
    description: string;
    institute_name: string | null;
    department: string | null;
    group_members: { count: number }[];
}

interface StudentTasksClientProps {
    initialTasks: Task[];
    initialSubmissions: Submission[];
    initialGroups: Group[];
}

export function StudentTasksClient({ initialTasks, initialSubmissions, initialGroups }: StudentTasksClientProps) {
    const [activeTab, setActiveTab] = useState<'groups' | 'tasks' | 'submissions'>('tasks');
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();

    const filteredTasks = initialTasks.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.group?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredSubmissions = initialSubmissions.filter(s =>
        s.task?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.task?.group?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredGroups = initialGroups.filter(g =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.department?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tight">
                        My Activities
                    </h1>
                    <p className="text-slate-500 font-medium pb-2 transition-all">
                        Track your tasks, submissions, and groups in one place.
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 w-full md:w-80 shadow-sm focus-within:ring-4 ring-emerald-500/10 transition-all">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search activities..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 w-full placeholder:text-slate-300 uppercase tracking-wide"
                    />
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-slate-100">
                <div className="flex items-center gap-8 overflow-x-auto pb-1 hide-scrollbar">
                    {[
                        { id: 'tasks', label: 'Assigned Tasks', icon: ClipboardList },
                        { id: 'submissions', label: 'My Submissions', icon: FileText },
                        { id: 'groups', label: 'My Groups', icon: Users },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 pb-4 text-xs font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                                {isActive && (
                                    <motion.div
                                        layoutId="studentActiveTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                {activeTab === 'tasks' && (
                    <motion.div
                        key="tasks"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 gap-4"
                    >
                        {filteredTasks.length === 0 ? (
                            <div className="text-center py-20 bg-white border border-slate-100 rounded-[2rem]">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ClipboardList className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-slate-900 font-black uppercase tracking-tight">No tasks assigned</h3>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">Join more groups to get assigned tasks.</p>
                            </div>
                        ) : (
                            filteredTasks.map(task => {
                                const isSubmitted = initialSubmissions.some(s => s.task.id === task.id);
                                return (
                                    <Link
                                        key={task.id}
                                        href={`/student/tasks/${task.id}`}
                                        className="block bg-white border border-slate-100 rounded-[2rem] p-6 group hover:border-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-50 transition-colors">
                                                    <ClipboardList className="w-5 h-5 text-slate-400 group-hover:text-emerald-500" />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                            {task.group?.name}
                                                        </span>
                                                        {isSubmitted && (
                                                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                                                <CheckCircle2 className="w-2.5 h-2.5" />
                                                                Submitted
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">
                                                        {task.title}
                                                    </h3>
                                                    <div className="flex items-center gap-4">
                                                        {task.deadline && (
                                                            <div className="flex items-center gap-1.5 text-red-500">
                                                                <Calendar className="w-3 h-3" />
                                                                <span className="text-[9px] font-black uppercase tracking-widest">
                                                                    Due {new Date(task.deadline).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1.5 text-slate-400">
                                                            <AlertCircle className="w-3 h-3" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">
                                                                {task.max_score} Points
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0">
                                                {isSubmitted ? 'Update Work' : 'Submit Work'}
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </motion.div>
                )}

                {activeTab === 'submissions' && (
                    <motion.div
                        key="submissions"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                    >
                        {filteredSubmissions.length === 0 ? (
                            <div className="text-center py-20 bg-white border border-slate-100 rounded-[2rem]">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-slate-900 font-black uppercase tracking-tight">No submissions yet</h3>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">Start submitting your assignments to see them here.</p>
                            </div>
                        ) : (
                            <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Task Assignment</th>
                                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status & Grade</th>
                                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Submitted At</th>
                                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredSubmissions.map(submission => {
                                            const isGraded = submission.scores && submission.scores.length > 0;
                                            return (
                                                <tr key={submission.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-6 py-5">
                                                        <div className="space-y-0.5">
                                                            <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate max-w-[200px]">
                                                                {submission.task?.title}
                                                            </p>
                                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                                                                {submission.task?.group?.name}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        {isGraded ? (
                                                            <div className="flex flex-col gap-1">
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest w-fit">
                                                                    <CheckCircle2 className="w-3 h-3" />
                                                                    Graded: {submission.scores[0]?.score_value}
                                                                </span>
                                                                {submission.scores[0].feedback && (
                                                                    <p className="text-[8px] font-bold text-slate-400 italic line-clamp-1">
                                                                        "{submission.scores[0].feedback}"
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest">
                                                                <Clock className="w-3 h-3" />
                                                                Pending Review
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
                                                        {new Date(submission.submitted_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <Link
                                                            href={`/student/tasks/${submission.task?.id}`}
                                                            className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-emerald-600 transition-colors flex items-center justify-end gap-1"
                                                        >
                                                            Edit Work
                                                            <ChevronRight className="w-3.5 h-3.5" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'groups' && (
                    <motion.div
                        key="groups"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {filteredGroups.length === 0 ? (
                            <div className="col-span-full text-center py-20 bg-white border border-slate-100 rounded-[2rem]">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-slate-900 font-black uppercase tracking-tight">No groups joined</h3>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">Browse groups to start collaborating.</p>
                            </div>
                        ) : (
                            filteredGroups.map(group => (
                                <Link href={`/student/groups/${group.id}`} key={group.id}>
                                    <div className="group bg-white border border-slate-100 rounded-[2rem] p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 h-full flex flex-col justify-between">
                                        <div className="space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                                                    <Users className="w-6 h-6 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight line-clamp-1 group-hover:text-emerald-700 transition-colors">
                                                    {group.name}
                                                </h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 line-clamp-2">
                                                    {group.description || "Active collaboration group"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                {group.department && <GraduationCap className="w-3 h-3 text-emerald-500" />}
                                                {group.department || "General Channel"}
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                                <ArrowRight className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

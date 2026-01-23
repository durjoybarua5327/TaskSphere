"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    ClipboardList,
    ChevronLeft,
    Building2,
    GraduationCap,
    Clock,
    Mail,
    Calendar,
    Search,
    Shield,
    ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface StudentGroupDetailsClientProps {
    initialGroup: any;
    initialMembers: any[];
    initialTasks: any[];
    currentUserId: string;
}

export function StudentGroupDetailsClient({ initialGroup, initialMembers, initialTasks, currentUserId }: StudentGroupDetailsClientProps) {
    const [activeTab, setActiveTab] = useState<'members' | 'tasks'>('tasks');
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();

    const filteredMembers = initialMembers.filter(member => {
        const query = searchQuery.toLowerCase();
        const name = member.user?.full_name?.toLowerCase() || "";
        const email = member.user?.email?.toLowerCase() || "";
        return name.includes(query) || email.includes(query);
    });

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 pb-20 space-y-6">
            {/* Back Button */}
            <Link
                href="/student/groups"
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors"
            >
                <ChevronLeft className="w-4 h-4" />
                Back to Groups
            </Link>

            {/* Group Header Card */}
            <div className="bg-white border border-slate-100 rounded-[1.5rem] p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative flex flex-col xl:flex-row gap-8 justify-between items-start">
                    <div className="space-y-6 flex-1 min-w-0">
                        <div className="flex flex-wrap gap-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest">
                                <Users className="w-3 h-3" />
                                {initialMembers.length} Members
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest">
                                <ClipboardList className="w-3 h-3" />
                                {initialTasks.length} Tasks Active
                            </span>
                        </div>

                        <div>
                            <h1 className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tight mb-3">
                                {initialGroup.name}
                            </h1>
                            <p className="text-slate-500 font-medium max-w-2xl leading-relaxed">
                                {initialGroup.description || "Welcome everyone! We're excited to have you as part of our community."}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            {initialGroup.institute_name && (
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50/50 px-4 py-2 rounded-xl">
                                    <Building2 className="w-4 h-4" />
                                    {initialGroup.institute_name}
                                </div>
                            )}
                            {initialGroup.department && (
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50/50 px-4 py-2 rounded-xl">
                                    <GraduationCap className="w-4 h-4" />
                                    {initialGroup.department}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-8 border-b border-slate-200 pb-1">
                {[
                    { id: 'tasks', label: 'Tasks', icon: ClipboardList },
                    { id: 'members', label: 'Members', icon: Users },
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
                                    layoutId="activeGroupTabStudent"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full"
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                {activeTab === 'members' && (
                    <motion.div
                        key="members"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Active Members</h3>
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500/50 transition-all w-full sm:w-64">
                                <Search className="w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search members..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-transparent border-none outline-none text-xs font-medium placeholder:text-slate-400 w-full"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredMembers.map(member => (
                                <div key={member.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 hover:shadow-lg transition-all">
                                    <Link href={`/student/profile?userId=${member.user_id}`} className="shrink-0">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden relative transition-all duration-300 hover:ring-2 hover:ring-emerald-500 hover:scale-105 shadow-sm">
                                            {member.user?.avatar_url ? (
                                                <img src={member.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Users className="w-5 h-5 text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                            )}
                                            {member.role === 'top_admin' && (
                                                <div className="absolute top-0 right-0 p-1 bg-emerald-500 rounded-bl-lg">
                                                    <Shield className="w-2 h-2 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <Link href={`/student/profile?userId=${member.user_id}`}>
                                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight hover:text-emerald-600 transition-all duration-300 hover:translate-x-1 inline-block">
                                                    {member.user?.full_name || "Unknown User"}
                                                </h4>
                                            </Link>
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${member.role === 'top_admin' ? 'bg-orange-50 text-orange-600' : member.role === 'admin' ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                                                {member.role.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 truncate">
                                            {member.user?.email}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'tasks' && (
                    <motion.div
                        key="tasks"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Active Tasks</h3>

                        {initialTasks.length === 0 ? (
                            <div className="text-center py-20 bg-white border border-slate-100 rounded-[2.5rem]">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ClipboardList className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-slate-900 font-bold uppercase tracking-tight">No tasks assigned yet</h3>
                                <p className="text-slate-500 text-xs mt-1">Check back later for new assignments.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {initialTasks.map(task => (
                                    <Link
                                        key={task.id}
                                        href={`/student/tasks/${task.id}`}
                                        className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 group"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="space-y-2 flex-1 min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-2 py-1 rounded-full">
                                                        {task.max_score} Points Max
                                                    </span>
                                                    {task.deadline && (
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            Due {new Date(task.deadline).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>

                                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">
                                                    {task.title}
                                                </h3>

                                                <p className="text-xs font-bold text-slate-400 line-clamp-1">
                                                    {(task.description || "No description provided.").replace(/<[^>]*>?/gm, '')}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0">
                                                View & Submit
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

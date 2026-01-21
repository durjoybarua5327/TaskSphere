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
    Plus
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreateTaskModal } from "../groups/[groupId]/_components/create-task-modal";
import { createTask } from "../actions";

interface Task {
    id: string;
    title: string;
    description: string;
    deadline: string | null;
    max_score: number;
    created_at: string;
    group: { name: string };
    creator: { full_name: string };
    submissions: { count: number }[];
    group_id: string;
}

interface Submission {
    id: string;
    content: string;
    submitted_at: string;
    student: {
        id: string;
        full_name: string;
        email: string;
        avatar_url: string;
    };
    task: {
        title: string;
        group: { id: string, name: string };
    };
    task_id: string;
    scores: { score_value: number }[];
}

interface Group {
    id: string;
    name: string;
    description: string;
    institute_name: string | null;
    department: string | null;
    members: { count: number }[];
}

interface TasksClientProps {
    initialTasks: Task[];
    initialSubmissions: Submission[];
    initialGroups: Group[];
}

export function TasksClient({ initialTasks, initialSubmissions, initialGroups }: TasksClientProps) {
    const [activeTab, setActiveTab] = useState<'groups' | 'tasks' | 'submissions'>('tasks');
    const [searchQuery, setSearchQuery] = useState("");
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isCreatingTask, setIsCreatingTask] = useState(false);
    const router = useRouter();

    const handleCreateTask = async (data: any) => {
        if (!data.groupId) {
            alert("Please select a group");
            return;
        }
        setIsCreatingTask(true);
        const result = await createTask(data.groupId, {
            title: data.title,
            description: data.description,
            deadline: data.deadline,
            max_score: data.maxScore,
            attachments: data.attachments
        });
        setIsCreatingTask(false);
        if (result.success) {
            setIsTaskModalOpen(false);
            router.refresh();
        } else {
            alert(result.error);
        }
    };

    const filteredTasks = initialTasks.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.group?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredSubmissions = initialSubmissions.filter(s =>
        s.student?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.task?.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredGroups = initialGroups.filter(g =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tight">
                        Task Management
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Overview of all groups, tasks, and submissions across your managed groups.
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 w-full md:w-80 shadow-sm focus-within:ring-4 ring-emerald-500/10 transition-all">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 w-full placeholder:text-slate-300 uppercase tracking-wide"
                    />
                </div>

                <button
                    onClick={() => setIsTaskModalOpen(true)}
                    className="group px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap shadow-lg shadow-slate-200"
                >
                    <Plus className="w-4 h-4 transition-transform duration-500 group-hover:rotate-180" />
                    Create Task
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-slate-100">
                <div className="flex items-center gap-8 overflow-x-auto pb-1 hide-scrollbar">
                    {[
                        { id: 'groups', label: 'Groups', icon: Users },
                        { id: 'tasks', label: 'All Tasks', icon: ClipboardList },
                        { id: 'submissions', label: 'Recent Submissions', icon: FileText },
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
                                        layoutId="activeTab"
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
                {activeTab === 'groups' && (
                    <motion.div
                        key="groups"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {filteredGroups.map(group => (
                            <Link href={`/admin/groups/${group.id}`} key={group.id}>
                                <div className="group bg-white border border-slate-100 rounded-[2rem] p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 h-full flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                                                <Users className="w-6 h-6 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                            </div>
                                            <div className="px-3 py-1 bg-slate-50 rounded-full">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    {group.members[0]?.count || 0} Members
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight line-clamp-1">
                                                {group.name}
                                            </h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 line-clamp-2">
                                                {group.description || "No description"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            {group.institute_name && <Building2 className="w-3 h-3" />}
                                            {group.institute_name || "No Institute"}
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                            <ArrowRight className="w-3 h-3" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'tasks' && (
                    <motion.div
                        key="tasks"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 gap-4"
                    >
                        {filteredTasks.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ClipboardList className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-slate-900 font-bold">No tasks found</h3>
                                <p className="text-slate-500 text-sm">Create tasks within specific groups.</p>
                            </div>
                        ) : (
                            filteredTasks.map(task => (
                                <Link
                                    key={task.id}
                                    href={`/admin/groups/${task.group_id}/tasks/${task.id}`}
                                    className="block bg-white border border-slate-100 rounded-[2rem] p-6 group hover:border-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
                                                <ClipboardList className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                        {task.group?.name}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                                                    {task.title}
                                                </h3>
                                                {task.deadline && (
                                                    <div className="flex items-center gap-1.5 text-red-500">
                                                        <Calendar className="w-3 h-3" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                                            Due {new Date(task.deadline).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))
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
                            <div className="text-center py-20">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-slate-900 font-bold">No submissions yet</h3>
                            </div>
                        ) : (
                            <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Task</th>
                                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredSubmissions.map(submission => {
                                            const isGraded = submission.scores && submission.scores.length > 0;

                                            return (
                                                <tr key={submission.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                                                                {submission.student?.avatar_url ? (
                                                                    <img src={submission.student.avatar_url} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <User className="w-4 h-4 text-slate-400" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-slate-900">
                                                                    {submission.student?.full_name || "Unknown"}
                                                                </p>
                                                                <p className="text-[9px] text-slate-400 font-medium">
                                                                    {submission.student?.email}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-0.5">
                                                            <p className="text-xs font-bold text-slate-700">
                                                                {submission.task?.title}
                                                            </p>
                                                            <p className="text-[9px] text-slate-400 uppercase tracking-widest">
                                                                {submission.task?.group?.name}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {isGraded ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                Graded ({submission.scores[0]?.score_value})
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest">
                                                                <Clock className="w-3 h-3" />
                                                                Pending
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-[10px] font-medium text-slate-500">
                                                        {new Date(submission.submitted_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Link
                                                            href={`/admin/groups/${submission.task?.group?.id}/tasks/${submission.task_id}`}
                                                            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors"
                                                        >
                                                            View
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
            </AnimatePresence>

            <CreateTaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onSubmit={handleCreateTask}
                isSubmitting={isCreatingTask}
                groups={initialGroups}
            />
        </div>
    );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@/components/ui/modal";
import {
    Users,
    ClipboardList,
    ChevronLeft,
    Building2,
    GraduationCap,
    Clock,
    Mail,
    Calendar,
    Plus,
    Pencil,
    Trash2,
    UserPlus,
    Shield,
    Trash,
    Settings,
    Search,
    Sparkles,
    Bot
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreateTaskModal } from "./_components/create-task-modal";
import { EditGroupModal } from "./_components/edit-group-modal";
import { GroupAIChat } from "./_components/group-ai-chat";
import {
    createTask,
    updateTask,
    handleJoinRequest,
    addStudentToGroup,
    removeMember,
    updateMemberRole,
    deleteTask,
    updateGroupInfo
} from "../../actions";

interface GroupDetailsClientProps {
    initialGroup: any;
    initialMembers: any[];
    initialTasks: any[];
    initialRequests: any[];
    currentUserId: string;
}

export function GroupDetailsClient({ initialGroup, initialMembers, initialTasks, initialRequests, currentUserId }: GroupDetailsClientProps) {
    const [activeTab, setActiveTab] = useState<'members' | 'tasks' | 'aichat'>('members');

    // Task States
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isSubmittingTask, setIsSubmittingTask] = useState(false);
    const [editingTask, setEditingTask] = useState<any | null>(null);
    const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
    const [isDeletingTask, setIsDeletingTask] = useState(false);
    const [deleteMemberId, setDeleteMemberId] = useState<string | null>(null);
    const [isDeletingMember, setIsDeletingMember] = useState(false);

    // Group Edit States
    const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
    const [isUpdatingGroup, setIsUpdatingGroup] = useState(false);

    const router = useRouter();

    // Invite Student State
    const [inviteEmail, setInviteEmail] = useState("");
    const [isInviting, setIsInviting] = useState(false);

    // Search State
    const [searchQuery, setSearchQuery] = useState("");

    const filteredMembers = initialMembers.filter(member => {
        const query = searchQuery.toLowerCase();
        const name = member.user?.full_name?.toLowerCase() || "";
        const email = member.user?.email?.toLowerCase() || "";
        return name.includes(query) || email.includes(query);
    });

    const handleCreateOrUpdateTask = async (data: any) => {
        setIsSubmittingTask(true);
        let result;

        if (editingTask) {
            result = await updateTask(editingTask.id, initialGroup.id, {
                title: data.title,
                description: data.description,
                deadline: data.deadline,
                max_score: data.maxScore,
                attachments: data.attachments
            });
        } else {
            result = await createTask(initialGroup.id, {
                title: data.title,
                description: data.description,
                deadline: data.deadline,
                max_score: data.maxScore,
                attachments: data.attachments
            });
        }

        setIsSubmittingTask(false);
        if (result.success) {
            setIsTaskModalOpen(false);
            setEditingTask(null);
            router.refresh();
        } else {
            alert(result.error);
        }
    };

    const handleUpdateGroup = async (data: any) => {
        setIsUpdatingGroup(true);
        const result = await updateGroupInfo(initialGroup.id, {
            name: data.name,
            description: data.description,
            instituteName: data.instituteName,
            department: data.department
        });
        setIsUpdatingGroup(false);

        if (result.success) {
            setIsEditGroupModalOpen(false);
            router.refresh();
        } else {
            alert(result.error);
        }
    }

    const handleInviteStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;

        setIsInviting(true);
        const result = await addStudentToGroup(initialGroup.id, inviteEmail);
        setIsInviting(false);

        if (result.success) {
            setInviteEmail("");
            router.refresh();
        } else {
            alert(result.error);
        }
    };

    const handleRequestAction = async (requestId: string, status: 'approved' | 'rejected') => {
        const result = await handleJoinRequest(requestId, status);
        if (result.success) {
            router.refresh();
        } else {
            alert(result.error);
        }
    };

    const handleDeleteTask = (taskId: string) => {
        setDeleteTaskId(taskId);
    };

    const confirmDeleteTask = async () => {
        if (!deleteTaskId) return;
        setIsDeletingTask(true);
        const result = await deleteTask(deleteTaskId, initialGroup.id);
        setIsDeletingTask(false);

        if (result.success) {
            setDeleteTaskId(null);
            router.refresh();
        } else {
            alert(result.error);
        }
    };

    const openEditTask = (task: any) => {
        setEditingTask(task);
        setIsTaskModalOpen(true);
    };

    const openCreateTask = () => {
        setEditingTask(null);
        setIsTaskModalOpen(true);
    };

    const handleRemoveMember = (memberId: string) => {
        setDeleteMemberId(memberId);
    };

    const confirmRemoveMember = async () => {
        if (!deleteMemberId) return;
        setIsDeletingMember(true);
        const result = await removeMember(deleteMemberId);
        setIsDeletingMember(false);
        if (result.success) {
            setDeleteMemberId(null);
            router.refresh();
        } else {
            alert(result.error);
        }
    };

    const handlePromoteMember = async (memberId: string) => {
        const result = await updateMemberRole(memberId, 'admin');
        if (result.success) router.refresh();
        else alert(result.error);
    }

    const handleDemoteMember = async (memberId: string) => {
        const result = await updateMemberRole(memberId, 'student');
        if (result.success) router.refresh();
        else alert(result.error);
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 pb-20 space-y-6">
            {/* Back Button */}
            <Link
                href="/admin/groups"
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
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest">
                                <Shield className="w-3 h-3" />
                                Top Admin Access
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest">
                                <Users className="w-3 h-3" />
                                {initialMembers.length} Members
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest">
                                <ClipboardList className="w-3 h-3" />
                                {initialTasks.length} Tasks Active
                            </span>
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <h1 className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tight">
                                    {initialGroup.name}
                                </h1>
                                <button
                                    onClick={() => setIsEditGroupModalOpen(true)}
                                    className="p-2 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition-all shrink-0"
                                >
                                    <Settings className="w-5 h-5" />
                                </button>
                            </div>
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

                    {/* Add Student Form - Moved to Header */}
                    <div className="w-full xl:w-80 bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3 shrink-0 mt-6 xl:mt-0">
                        <div className="flex items-center gap-2 text-slate-900 font-bold mb-2">
                            <UserPlus className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs uppercase tracking-widest">Add Student</span>
                        </div>
                        <form onSubmit={handleInviteStudent} className="space-y-3">
                            <input
                                type="email"
                                placeholder="student@email.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm"
                                required
                            />
                            <button
                                type="submit"
                                disabled={isInviting}
                                className="w-full py-3 bg-slate-500 hover:bg-slate-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-slate-200"
                            >
                                {isInviting ? "Adding..." : "+ Add to Group"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-8 border-b border-slate-200 pb-1">
                {[
                    { id: 'members', label: 'Members', icon: Users },
                    { id: 'tasks', label: 'Tasks & Submissions', icon: ClipboardList },
                    { id: 'aichat', label: 'Group AI Assistant', icon: Sparkles },
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
                                    layoutId="activeGroupTab"
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
                        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                    >
                        {/* Active Members - Left Column */}
                        <div className="lg:col-span-2 space-y-6">
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

                            <div className="space-y-3">
                                {filteredMembers.map(member => (
                                    <div key={member.id} className="bg-white border border-slate-100 rounded-2xl p-3 flex items-center justify-between group hover:shadow-lg transition-all">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <Link href={`/admin/profile?userId=${member.user_id}`} className="shrink-0">
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
                                                    <Link href={`/admin/profile?userId=${member.user_id}`}>
                                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight hover:text-emerald-600 transition-all duration-300 hover:translate-x-1 inline-block">
                                                            {member.user?.full_name || "Unknown User"} {member.user_id === initialGroup.top_admin_id && <span className="text-slate-400 font-bold ml-1 text-[10px]">(YOU)</span>}
                                                        </h4>
                                                    </Link>
                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${member.role === 'top_admin' ? 'bg-orange-50 text-orange-600' : member.role === 'admin' ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                                                        {member.role.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                                    <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3 shrink-0" /> {member.user?.email}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                                                    <span className="flex items-center gap-1 shrink-0"><Calendar className="w-3 h-3" /> Joined {new Date(member.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {member.role === 'student' && initialGroup.currentUserRole === 'top_admin' && (
                                                <button onClick={() => handlePromoteMember(member.id)} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-colors">
                                                    Promote to Admin
                                                </button>
                                            )}
                                            {member.role === 'admin' && initialGroup.currentUserRole === 'top_admin' && (
                                                <button onClick={() => handleDemoteMember(member.id)} className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-100 transition-colors">
                                                    Demote to Student
                                                </button>
                                            )}
                                            {member.role !== 'top_admin' && member.user_id !== currentUserId && (
                                                <button onClick={() => handleRemoveMember(member.id)} className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors">
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Column: Join Requests ONLY */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Join Requests</h3>

                            <div className="min-h-[200px] h-full">
                                {initialRequests.length === 0 ? (
                                    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 text-center h-[300px] flex flex-col items-center justify-center">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                            <Clock className="w-6 h-6" />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No pending requests</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {initialRequests.map(req => (
                                            <div key={req.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col gap-3">
                                                <div className="flex items-center gap-3">
                                                    <Link href={`/admin/profile?userId=${req.user_id}`} className="shrink-0">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden transition-all duration-300 hover:ring-2 hover:ring-emerald-500 hover:scale-105 shadow-sm">
                                                            {req.user?.avatar_url ? (
                                                                <img src={req.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                            ) : <Users className="w-4 h-4 text-slate-400" />}
                                                        </div>
                                                    </Link>
                                                    <div className="overflow-hidden flex-1">
                                                        <Link href={`/admin/profile?userId=${req.user_id}`}>
                                                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight truncate hover:text-emerald-600 transition-all duration-300 hover:translate-x-1 inline-block">{req.user?.full_name}</h4>
                                                        </Link>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{req.user?.email}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button onClick={() => handleRequestAction(req.id, 'rejected')} className="py-2.5 rounded-lg bg-slate-50 text-slate-600 text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors">
                                                        Decline
                                                    </button>
                                                    <button onClick={() => handleRequestAction(req.id, 'approved')} className="py-2.5 rounded-lg bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors">
                                                        Approve
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
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
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Tasks</h3>
                            <button
                                onClick={openCreateTask}
                                className="group px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap shadow-lg shadow-emerald-200"
                            >
                                <Plus className="w-4 h-4 transition-transform duration-500 group-hover:rotate-180" />
                                Create Task
                            </button>
                        </div>

                        {initialTasks.length === 0 ? (
                            <div className="text-center py-20 bg-white border border-slate-100 rounded-[2.5rem]">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ClipboardList className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-slate-900 font-bold">No tasks found</h3>
                                <p className="text-slate-500 text-sm mt-1">Get started by creating a new task.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {initialTasks.map(task => (
                                    <div
                                        key={task.id}
                                        className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 relative group"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-2 flex-1">
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

                                                <Link href={`/admin/groups/${initialGroup.id}/tasks/${task.id}`} className="block">
                                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">
                                                        {task.title}
                                                    </h3>
                                                </Link>

                                                <p className="text-xs font-bold text-slate-400 line-clamp-1">
                                                    {(task.description || "No description provided.").replace(/<[^>]*>?/gm, '')}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button onClick={() => openEditTask(task)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteTask(task.id)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'aichat' && (
                    <motion.div
                        key="aichat"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <GroupAIChat
                            groupId={initialGroup.id}
                            groupName={initialGroup.name}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <CreateTaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onSubmit={handleCreateOrUpdateTask}
                isSubmitting={isSubmittingTask}
                groupId={initialGroup.id}
                initialData={editingTask}
            />

            <EditGroupModal
                isOpen={isEditGroupModalOpen}
                onClose={() => setIsEditGroupModalOpen(false)}
                onSubmit={handleUpdateGroup}
                isSubmitting={isUpdatingGroup}
                initialData={{
                    name: initialGroup.name,
                    description: initialGroup.description,
                    institute_name: initialGroup.institute_name,
                    department: initialGroup.department
                }}
            />

            <Modal
                title="Delete Task"
                description="Are you sure you want to delete this task? This action cannot be undone."
                isOpen={!!deleteTaskId}
                onClose={() => setDeleteTaskId(null)}
            >
                <div className="flex justify-end gap-3 pt-6">
                    <button
                        onClick={() => setDeleteTaskId(null)}
                        disabled={isDeletingTask}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={confirmDeleteTask}
                        disabled={isDeletingTask}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-lg shadow-rose-200 flex items-center gap-2"
                    >
                        {isDeletingTask ? "Deleting..." : "Delete Task"}
                    </button>
                </div>
            </Modal>

            <Modal
                title="Remove Member"
                description="Are you sure you want to remove this member? They will lose access to the group."
                isOpen={!!deleteMemberId}
                onClose={() => setDeleteMemberId(null)}
            >
                <div className="flex justify-end gap-3 pt-6">
                    <button
                        onClick={() => setDeleteMemberId(null)}
                        disabled={isDeletingMember}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={confirmRemoveMember}
                        disabled={isDeletingMember}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-lg shadow-rose-200 flex items-center gap-2"
                    >
                        {isDeletingMember ? "Removing..." : "Remove Member"}
                    </button>
                </div>
            </Modal>
        </div>
    );
}

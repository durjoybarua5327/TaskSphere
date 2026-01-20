"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Users,
    Shield,
    UserPlus,
    Clock,
    Check,
    X,
    Building2,
    GraduationCap,
    User,
    MoreVertical,
    Trash2,
    ShieldCheck,
    Mail,
    Loader2,
    Search,
    Plus,
    CheckCircle2,
    XCircle,
    LayoutDashboard,
    FileText,
    Calendar,
    Send,
    Eye,
    ChevronRight,
    ClipboardList,
    AlertCircle,
    Image as ImageIcon,
    FileUp,
    Paperclip,
    Pencil
} from "lucide-react";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { motion, AnimatePresence } from "framer-motion";
import {
    updateMemberRole,
    removeMember,
    addStudentToGroup,
    handleJoinRequest,
    getGroupMembers,
    getGroupJoinRequests,

    createTask,
    updateTask,
    getTasks,
    deleteTask
} from "../../actions";
import { useUser } from "@clerk/nextjs";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { FileUpload } from "@/components/ui/file-upload";

interface Member {
    id: string;
    role: "student" | "admin" | "top_admin";
    joined_at: string;
    user: {
        id: string;
        full_name: string | null;
        email: string;
        avatar_url: string | null;
    } | null;
}

interface Request {
    id: string;
    created_at: string;
    user: {
        id: string;
        full_name: string | null;
        email: string;
        avatar_url: string | null;
    } | null;
}

interface Task {
    id: string;
    title: string;
    description: string;
    deadline: string | null;
    max_score: number;
    created_at: string;
    creator_id: string;
    creator?: {
        full_name: string | null;
        avatar_url: string | null;
    } | null;
    attachments?: string[];
}

interface GroupDetailClientProps {
    group: any;
    initialMembers: Member[];
    initialRequests: Request[];
    initialTasks: Task[];
    initialTab?: 'members' | 'tasks';
}

export function GroupDetailClient({ group, initialMembers, initialRequests, initialTasks, initialTab = 'members' }: GroupDetailClientProps) {
    const { user: currentUser } = useUser();
    const router = useRouter();
    const [members, setMembers] = useState<Member[]>(initialMembers);
    const [requests, setRequests] = useState<Request[]>(initialRequests);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [newMemberEmail, setNewMemberEmail] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [activeTab, setActiveTab] = useState<'members' | 'tasks'>(initialTab);
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [isCreatingTask, setIsCreatingTask] = useState(false);
    const [newTask, setNewTask] = useState<{
        title: string;
        description: string;
        deadline: string;
        maxScore: number;
        attachments: string[];
    }>({
        title: "",
        description: "",
        deadline: "",
        maxScore: 10,
        attachments: []
    });
    const [isEditingTask, setIsEditingTask] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [isLoadingTasks, setIsLoadingTasks] = useState(false);

    const currentUserRole = group.currentUserRole as "student" | "admin" | "top_admin";

    const filteredMembers = members.filter(m =>
        m.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.user?.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const refreshData = async () => {
        setIsRefreshing(true);
        const [membersRes, requestsRes, tasksRes] = await Promise.all([
            getGroupMembers(group.id),
            getGroupJoinRequests(group.id),
            getTasks(group.id)
        ]);
        if (membersRes.members) setMembers(membersRes.members as Member[]);
        if (requestsRes.requests) setRequests(requestsRes.requests as Request[]);
        if (tasksRes.tasks) setTasks(tasksRes.tasks as Task[]);
        setIsRefreshing(false);
    };

    const loadTasks = async () => {
        setIsLoadingTasks(true);
        const res = await getTasks(group.id);
        if (res.tasks) setTasks(res.tasks as Task[]);
        setIsLoadingTasks(false);
    };

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'remove_member' | 'delete_task' | null;
        itemId: string | null;
        title: string;
        description: string;
        isLoading: boolean;
    }>({
        isOpen: false,
        type: null,
        itemId: null,
        title: "",
        description: "",
        isLoading: false
    });

    // ... existing loadTasks ...

    const handlePromote = async (memberId: string, currentRole: string) => {
        const newRole = currentRole === 'student' ? 'admin' : 'student';
        const result = await updateMemberRole(memberId, newRole as any);
        if (result.success) {
            refreshData();
        } else {
            alert(result.error);
        }
    };

    const handleRemoveClick = (memberId: string) => {
        setConfirmModal({
            isOpen: true,
            type: 'remove_member',
            itemId: memberId,
            title: "Remove Member",
            description: "Are you sure you want to remove this member? They will lose access to all group content and tasks.",
            isLoading: false
        });
    };

    const handleDeleteTaskClick = (taskId: string) => {
        setConfirmModal({
            isOpen: true,
            type: 'delete_task',
            itemId: taskId,
            title: "Delete Task",
            description: "Are you sure you want to delete this task? All student submissions and grades associated with this task will be permanently deleted.",
            isLoading: false
        });
    };

    const handleConfirmAction = async () => {
        if (!confirmModal.itemId || !confirmModal.type) return;

        setConfirmModal(prev => ({ ...prev, isLoading: true }));

        try {
            if (confirmModal.type === 'remove_member') {
                const result = await removeMember(confirmModal.itemId);
                if (result.success) {
                    refreshData();
                } else {
                    alert(result.error);
                }
            } else if (confirmModal.type === 'delete_task') {
                const result = await deleteTask(confirmModal.itemId, group.id);
                if (result.success) {
                    loadTasks();
                } else {
                    alert(result.error);
                }
            }
        } catch (error) {
            console.error(error);
            alert("An unexpected error occurred");
        } finally {
            setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMemberEmail.trim()) return;
        setIsAdding(true);
        const result = await addStudentToGroup(group.id, newMemberEmail);
        setIsAdding(false);
        if (result.success) {
            setNewMemberEmail("");
            refreshData();
        } else {
            alert(result.error);
        }
    };

    const handleRequestAction = async (requestId: string, status: 'approved' | 'rejected') => {
        const result = await handleJoinRequest(requestId, status);
        if (result.success) {
            refreshData();
        } else {
            alert(result.error);
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreatingTask(true);
        const result = await createTask(group.id, {
            title: newTask.title,
            description: newTask.description,
            deadline: newTask.deadline,
            max_score: newTask.maxScore,
            attachments: newTask.attachments
        });
        setIsCreatingTask(false);
        if (result.success) {
            setNewTask({ title: "", description: "", deadline: "", maxScore: 10, attachments: [] });
            loadTasks();
        } else {
            alert(result.error);
        }
    };

    const handleEditTaskClick = (task: Task) => {
        setNewTask({
            title: task.title,
            description: task.description,
            deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : "",
            maxScore: task.max_score,
            attachments: task.attachments || []
        });
        setEditingTaskId(task.id);
        setIsEditingTask(true);

        // Scroll to form (simple implementation)
        const formElement = document.getElementById('task-form');
        if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
    };

    const handleUpdateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTaskId) return;

        setIsCreatingTask(true); // Reuse loading state
        const result = await updateTask(editingTaskId, group.id, {
            title: newTask.title,
            description: newTask.description,
            deadline: newTask.deadline,
            max_score: newTask.maxScore,
            attachments: newTask.attachments
        });
        setIsCreatingTask(false);

        if (result.success) {
            setNewTask({ title: "", description: "", deadline: "", maxScore: 10, attachments: [] });
            setEditingTaskId(null);
            setIsEditingTask(false);
            loadTasks();
        } else {
            alert(result.error);
        }
    };

    const handleCancelEdit = () => {
        setNewTask({ title: "", description: "", deadline: "", maxScore: 10, attachments: [] });
        setEditingTaskId(null);
        setIsEditingTask(false);
    };

    return (
        <div className="space-y-8 pb-20">
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleConfirmAction}
                title={confirmModal.title}
                description={confirmModal.description}
                confirmLabel="Yes, Continue"
                variant="danger"
                isLoading={confirmModal.isLoading}
            />
            {/* ... rest of the component ... */}
            {/* Header Section */}
            <div className="bg-white border border-slate-100 rounded-[3rem] p-8 md:p-12 shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl" />

                <div className="relative flex flex-col md:flex-row gap-8 items-start justify-between">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck className="w-3 h-3" />
                                {currentUserRole === 'top_admin' ? 'Top Admin Access' : 'Admin Access'}
                            </div>
                            <div className="px-4 py-1.5 bg-slate-50 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <Users className="w-3 h-3" />
                                {members.length} Members
                            </div>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight uppercase leading-none">
                            {group.name}
                        </h1>

                        <p className="text-slate-500 font-medium max-w-2xl text-lg">
                            {group.description || "No description provided for this group."}
                        </p>

                        <div className="flex flex-wrap gap-4 pt-4">
                            {group.institute_name && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <Building2 className="w-4 h-4 text-emerald-500" />
                                    {group.institute_name}
                                </div>
                            )}
                            {group.department && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <GraduationCap className="w-4 h-4 text-emerald-500" />
                                    {group.department}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Add Member */}
                    <div className="w-full md:w-80 bg-slate-50 border border-slate-100 rounded-[2.5rem] p-6 space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                <UserPlus className="w-4 h-4 text-emerald-600" />
                            </div>
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Add Student</p>
                        </div>
                        <form onSubmit={handleAddMember} className="space-y-3">
                            <input
                                type="email"
                                value={newMemberEmail}
                                onChange={(e) => setNewMemberEmail(e.target.value)}
                                placeholder="student@email.com"
                                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                            />
                            <button
                                disabled={isAdding || !newMemberEmail}
                                className="w-full py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                Add to Group
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-6 border-b border-slate-100 pb-2">
                <button
                    onClick={() => setActiveTab('members')}
                    className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'members' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Users className="w-4 h-4" />
                    Members
                    {activeTab === 'members' && (
                        <motion.div layoutId="activeTab" className="absolute bottom-[-2px] left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
                    )}
                </button>
                <button
                    onClick={() => {
                        setActiveTab('tasks');
                        if (tasks.length === 0) loadTasks();
                    }}
                    className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'tasks' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <ClipboardList className="w-4 h-4" />
                    Tasks & Submissions
                    {activeTab === 'tasks' && (
                        <motion.div layoutId="activeTab" className="absolute bottom-[-2px] left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    <AnimatePresence mode="wait">
                        {activeTab === 'members' ? (
                            <motion.div
                                key="members"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center justify-between px-4">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Active Members</h2>
                                        {isRefreshing && <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />}
                                    </div>

                                    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-2 w-64 shadow-sm focus-within:ring-4 ring-emerald-500/10 transition-all">
                                        <Search className="w-3.5 h-3.5 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search members..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="bg-transparent border-none outline-none text-[10px] font-bold text-slate-700 w-full placeholder:text-slate-300"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {filteredMembers.map((member) => {
                                        const isMe = member.user?.id === currentUser?.id;
                                        const isTargetTopAdmin = member.role === 'top_admin';
                                        const isStudent = member.role === 'student';

                                        const canPromote = (currentUserRole === 'top_admin' && !isTargetTopAdmin);

                                        const canRemove = (currentUserRole === 'top_admin' && !isTargetTopAdmin) ||
                                            (currentUserRole === 'admin' && isStudent);

                                        return (
                                            <motion.div
                                                layout
                                                key={member.id}
                                                className="bg-white border border-slate-100 rounded-[2rem] p-4 flex items-center justify-between group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                                                            {member.user?.avatar_url ? (
                                                                <img src={member.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <User className="w-6 h-6 text-slate-300" />
                                                            )}
                                                        </div>
                                                        {member.role !== 'student' && (
                                                            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-lg bg-emerald-500 border-2 border-white flex items-center justify-center shadow-lg">
                                                                <Shield className="w-3 h-3 text-white" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">
                                                                {member.user?.full_name || "Anonymous Member"} {isMe && "(You)"}
                                                            </h4>
                                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${member.role === 'top_admin' ? 'bg-amber-50 text-amber-600' :
                                                                member.role === 'admin' ? 'bg-emerald-50 text-emerald-600' :
                                                                    'bg-slate-50 text-slate-400'
                                                                }`}>
                                                                {member.role.replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                                <Mail className="w-2.5 h-2.5" />
                                                                {member.user?.email}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                                <Clock className="w-2.5 h-2.5" />
                                                                Joined {new Date(member.joined_at).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {canPromote && (
                                                        <button
                                                            onClick={() => handlePromote(member.id, member.role)}
                                                            className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${member.role === 'admin'
                                                                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                                }`}
                                                        >
                                                            {member.role === 'admin' ? 'Demote' : 'Promote to Admin'}
                                                        </button>
                                                    )}
                                                    {canRemove && (
                                                        <button
                                                            onClick={() => handleRemoveClick(member.id)}
                                                            className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all"
                                                            title="Remove from group"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {(!canPromote && !canRemove && !isMe) && (
                                                        <div className="px-3 py-1.5 bg-slate-50 rounded-xl">
                                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Protected</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="tasks"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center justify-between px-4">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Tasks</h2>
                                        {isLoadingTasks && <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {tasks.length === 0 ? (
                                        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-12 text-center space-y-4">
                                            <div className="w-16 h-16 rounded-[2rem] bg-slate-50 mx-auto flex items-center justify-center">
                                                <ClipboardList className="w-8 h-8 text-slate-200" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="font-black text-slate-900 uppercase tracking-tight">No tasks created yet</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    Create a task to start receiving submissions
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        tasks.map((task) => (
                                            <div key={task.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-6 group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[8px] font-black uppercase tracking-widest">
                                                                {task.max_score} Points Max
                                                            </span>
                                                            {task.deadline && (
                                                                <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                                                    <Calendar className="w-3 h-3" />
                                                                    Due {new Date(task.deadline).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{task.title}</h3>
                                                        <p className="text-slate-500 text-xs font-bold leading-relaxed line-clamp-2">{task.description}</p>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => router.push(`/admin/groups/${group.id}/tasks/${task.id}`)}
                                                            className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 flex items-center gap-2"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            View Submissions
                                                        </button>
                                                        {(currentUserRole === 'top_admin' || currentUser?.id === task.creator_id) && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleEditTaskClick(task)}
                                                                    className="w-12 h-12 flex items-center justify-center bg-slate-100 text-slate-600 rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                                                                    title="Edit Task"
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteTaskClick(task.id)}
                                                                    className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all"
                                                                    title="Delete Task"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <AnimatePresence mode="wait">
                        {activeTab === 'members' ? (
                            <motion.div
                                key="members-sidebar"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="px-4">
                                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Join Requests</h2>
                                </div>

                                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 space-y-4 shadow-sm">
                                    {requests.length === 0 ? (
                                        <div className="py-12 text-center space-y-3">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 mx-auto flex items-center justify-center">
                                                <Clock className="w-6 h-6 text-slate-200" />
                                            </div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No pending requests</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {requests.map((request) => (
                                                <div key={request.id} className="p-4 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden">
                                                            {request.user?.avatar_url ? (
                                                                <img src={request.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <User className="w-5 h-5 text-slate-300" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-xs font-black text-slate-900 truncate uppercase tracking-tight">
                                                                {request.user?.full_name || "Applicant"}
                                                            </h4>
                                                            <p className="text-[9px] font-bold text-slate-400 truncate tracking-widest">
                                                                {request.user?.email}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleRequestAction(request.id, 'approved')}
                                                            className="flex-1 py-2 bg-emerald-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleRequestAction(request.id, 'rejected')}
                                                            className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <XCircle className="w-3 h-3" />
                                                            Decline
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="tasks-sidebar"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="px-4 flex items-center justify-between">
                                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                        {isEditingTask ? "Edit Task" : "Create Task"}
                                    </h2>
                                    {isEditingTask && (
                                        <button
                                            onClick={handleCancelEdit}
                                            className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>

                                <div id="task-form" className="bg-white border border-slate-100 rounded-[2.5rem] p-8 space-y-6 shadow-sm">
                                    <form onSubmit={isEditingTask ? handleUpdateTask : handleCreateTask} className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Task Title</label>
                                            <input
                                                required
                                                type="text"
                                                value={newTask.title}
                                                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                                placeholder="e.g. Weekly Assignment 1"
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Description</label>
                                            <RichTextEditor
                                                content={newTask.description}
                                                onChange={(content) => setNewTask({ ...newTask, description: content })}
                                                placeholder="Describe the task requirements..."
                                                className="min-h-[200px]"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Attachments</label>
                                            <FileUpload
                                                value={newTask.attachments}
                                                onChange={(urls) => setNewTask({ ...newTask, attachments: urls })}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Deadline</label>
                                                <input
                                                    type="date"
                                                    value={newTask.deadline}
                                                    onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-[10px] font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Max Score</label>
                                                <input
                                                    type="number"
                                                    value={newTask.maxScore}
                                                    onChange={(e) => setNewTask({ ...newTask, maxScore: parseInt(e.target.value) })}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            disabled={isCreatingTask}
                                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-slate-200"
                                        >
                                            {isCreatingTask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                            {isEditingTask ? "Update Task" : "Publish Task"}
                                        </button>
                                    </form>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

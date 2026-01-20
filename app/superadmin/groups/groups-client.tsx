"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/providers/modal-provider";
import {
    createGroup,
    updateGroup,
    deleteGroup,
    approveGroupRequest,
    rejectGroupRequest,
    getGroupMembers,
    updateMemberRole,
    removeMemberFromGroup
} from "../actions";
import {
    Plus,
    Users,
    Pencil,
    Trash2,
    Check,
    X,
    Sparkles,
    Building2,
    GraduationCap,
    Clock,
    User,
    ChevronRight,
    Search,
    Shield,
    ShieldAlert
} from "lucide-react";

interface GroupMember {
    id: string;
    role: string;
    user: {
        id: string;
        full_name: string | null;
        email: string;
        avatar_url: string | null;
    } | null;
}
import { GroupForm, GroupFormData } from "@/components/groups/GroupForm";
import { motion, AnimatePresence } from "framer-motion";

interface Group {
    id: string;
    name: string;
    description?: string;
    institute_name?: string;
    department?: string;
    created_at: string;
    top_admin?: {
        id: string;
        full_name: string | null;
        email: string;
    } | null;
    members?: { count: number }[];
}

interface GroupRequest {
    id: string;
    group_name?: string;
    institute_name?: string;
    department?: string;
    message?: string;
    created_at: string;
    user?: {
        id: string;
        full_name: string | null;
        email: string;
    } | null;
}

interface GroupsClientProps {
    initialGroups: Group[];
    initialRequests: GroupRequest[];
    myGroupIds?: string[];
}

export function GroupsClient({ initialGroups, initialRequests, myGroupIds = [] }: GroupsClientProps) {
    const { openModal, closeModal } = useModal();
    const router = useRouter();
    const [groups, setGroups] = useState<Group[]>(initialGroups);
    const [requests, setRequests] = useState<GroupRequest[]>(initialRequests);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedGroupForMembers, setSelectedGroupForMembers] = useState<Group | null>(null);
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
    const [isFetchingMembers, setIsFetchingMembers] = useState(false);
    const [viewMode, setViewMode] = useState<"all" | "my">("all"); // Default to "All Groups" for Super Admin

    useEffect(() => {
        setGroups(initialGroups);
    }, [initialGroups]);

    useEffect(() => {
        setRequests(initialRequests);
    }, [initialRequests]);

    const filteredGroups = groups.filter(g => {
        const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.institute_name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesView = viewMode === "all" || (myGroupIds.includes(g.id));

        return matchesSearch && matchesView;
    });

    const handleCreateGroup = () => {
        openModal({
            type: "create",
            title: "Create New Group",
            description: "Manually create a new group for your platform",
            className: "max-w-2xl",
            preventOutsideClick: true,
            content: (
                <GroupForm
                    showTopAdminEmail={true}
                    onSubmit={async (data: GroupFormData) => {
                        const result = await createGroup(data);
                        if (result.success) {
                            closeModal();
                            router.refresh();
                        }
                        return result;
                    }}
                    onCancel={closeModal}
                />
            ),
        });
    };

    const handleEditGroup = (group: Group) => {
        openModal({
            type: "edit",
            title: "Edit Group",
            description: "Update group information",
            className: "max-w-2xl",
            preventOutsideClick: true,
            content: (
                <GroupForm
                    showTopAdminEmail={true}
                    initialData={{
                        name: group.name,
                        instituteName: group.institute_name || "",
                        department: group.department || "",
                        purpose: group.description || "",
                        topAdminEmail: group.top_admin?.email || "",
                    } as GroupFormData}
                    onSubmit={async (data: GroupFormData) => {
                        const result = await updateGroup(group.id, data);
                        if (result.success) {
                            closeModal();
                            router.refresh();
                        }
                        return result;
                    }}
                    onCancel={closeModal}
                    submitLabel="Update Group"
                />
            ),
        });
    };

    const handleDeleteGroup = (group: Group) => {
        openModal({
            type: "delete",
            title: "Delete Group",
            description: `Are you sure you want to delete "${group.name}"? This will remove all members and cannot be undone.`,
            isDestructive: true,
            confirmText: "Delete Group",
            onConfirm: async () => {
                const result = await deleteGroup(group.id);
                if (result.success) {
                    setGroups(groups.filter(g => g.id !== group.id));
                }
            },
        });
    };

    const handleApproveRequest = (request: GroupRequest) => {
        openModal({
            type: "create",
            title: "Approve Group Request",
            description: "Review and approve this group creation request",
            className: "max-w-2xl",
            preventOutsideClick: true,
            content: (
                <GroupForm
                    initialData={{
                        name: request.group_name || "",
                        instituteName: request.institute_name || "",
                        department: request.department || "",
                        purpose: request.message || "",
                    } as GroupFormData}
                    onSubmit={async (data: GroupFormData) => {
                        const result = await approveGroupRequest(request.id, data);
                        if (result.success) {
                            closeModal();
                            setRequests(requests.filter(r => r.id !== request.id));
                            router.refresh();
                        }
                        return result;
                    }}
                    onCancel={closeModal}
                    submitLabel="Approve & Create"
                />
            ),
        });
    };

    const handleViewMembers = async (group: Group) => {
        setSelectedGroupForMembers(group);
        setIsFetchingMembers(true);
        const result = await getGroupMembers(group.id);
        if (result.members) {
            setGroupMembers(result.members as GroupMember[]);
        }
        setIsFetchingMembers(false);
    };

    const handleUpdateMemberRole = async (membershipId: string, newRole: "student" | "admin" | "top_admin") => {
        const result = await updateMemberRole(membershipId, newRole);
        if (result.success && selectedGroupForMembers) {
            // Refresh members list
            const membersResult = await getGroupMembers(selectedGroupForMembers.id);
            if (membersResult.members) {
                setGroupMembers(membersResult.members as GroupMember[]);
            }
        }
    };

    const handleRemoveMember = async (membershipId: string) => {
        const result = await removeMemberFromGroup(membershipId);
        if (result.success && selectedGroupForMembers) {
            // Update local state
            setGroupMembers(prev => prev.filter(m => m.id !== membershipId));
        }
    };

    const handleRejectRequest = async (request: GroupRequest) => {
        openModal({
            type: "delete",
            title: "Reject Request",
            description: `Are you sure you want to reject the group request from ${request.user?.full_name || request.user?.email}?`,
            isDestructive: true,
            confirmText: "Reject",
            onConfirm: async () => {
                const result = await rejectGroupRequest(request.id);
                if (result.success) {
                    setRequests(requests.filter(r => r.id !== request.id));
                }
            },
        });
    };

    return (
        <div className="space-y-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4 uppercase">Groups Ecosystem</h1>

                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex items-center gap-3 bg-white border border-slate-200 rounded-[1.25rem] px-4 py-2.5 w-72 shadow-sm focus-within:ring-4 ring-emerald-500/10 focus-within:border-emerald-500/30 transition-all">
                        <Search className="w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Find a group..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm w-full font-bold text-slate-700 placeholder:text-slate-300"
                        />
                    </div>
                    <button
                        onClick={handleCreateGroup}
                        className="flex items-center gap-2.5 px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-emerald-600 transition-all duration-300 font-black text-[10px] tracking-[0.15em] uppercase shadow-xl shadow-slate-200 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Create Group
                    </button>
                </div>
            </div>

            {/* Pending Requests Section */}
            <AnimatePresence>
                {requests.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center gap-6">
                            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2.5 uppercase">
                                <Sparkles className="w-5 h-5 text-amber-500" />
                                Incoming Requests
                            </h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {requests.map((request) => (
                                <motion.div
                                    key={request.id}
                                    layout
                                    className="group relative bg-[#FFFBEB] border border-amber-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:bg-white transition-all duration-500 overflow-hidden"
                                >
                                    <div className="absolute -right-12 -top-12 w-48 h-48 bg-amber-200/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />

                                    <div className="relative flex items-start justify-between gap-6 mb-8">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 rounded-3xl bg-white border-2 border-amber-100 flex items-center justify-center shadow-inner">
                                                <GraduationCap className="w-8 h-8 text-amber-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900 tracking-tight mb-0.5 uppercase">
                                                    {request.group_name || "New Community Request"}
                                                </h3>
                                                <div className="flex items-center gap-2 text-[8px] font-black text-amber-600 uppercase tracking-widest">
                                                    <Clock className="w-3 h-3" />
                                                    Pending Review
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative flex flex-col gap-4 mb-8">
                                        <div className="flex items-center gap-2.5 text-xs font-bold text-slate-500">
                                            <div className="w-6 h-6 rounded-full bg-white border border-amber-100 flex items-center justify-center">
                                                <User className="w-3 h-3 text-amber-500" />
                                            </div>
                                            By {request.user?.full_name || request.user?.email}
                                        </div>
                                        {request.message && (
                                            <div className="bg-white/60 p-4 rounded-2xl border border-amber-50 text-slate-600 text-sm font-medium leading-relaxed italic">
                                                "{request.message}"
                                            </div>
                                        )}
                                    </div>

                                    <div className="relative flex gap-3">
                                        <button
                                            onClick={() => handleApproveRequest(request)}
                                            className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-100 active:scale-95"
                                        >
                                            <Check className="w-4 h-4" />
                                            Approve Request
                                        </button>
                                        <button
                                            onClick={() => handleRejectRequest(request)}
                                            className="px-6 py-4 bg-white text-red-600 border border-red-50 rounded-2xl hover:bg-red-50 transition-all font-black text-xs uppercase tracking-widest active:scale-95"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Groups Grid Section */}
            <div className="space-y-8">
                <div className="flex items-center gap-6">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2.5 uppercase">
                        <Users className="w-5 h-5 text-emerald-500" />
                        Active Groups
                        <span className="text-slate-300 font-light translate-y-0.5 ml-1">/</span>
                        <span className="text-slate-400 text-xs ml-1 font-black">{filteredGroups.length}</span>
                    </h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
                </div>

                {filteredGroups.length === 0 ? (
                    <div className="bg-white border border-slate-100 rounded-[3rem] p-24 text-center shadow-sm flex flex-col items-center">
                        <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center border border-slate-100 mb-6 group-hover:rotate-6 transition-transform">
                            <Users className="w-12 h-12 text-slate-300" />
                        </div>
                        <p className="text-slate-900 text-2xl font-black tracking-tight mb-2">No matching groups found</p>
                        <p className="text-slate-400 font-medium max-w-xs">Adjust your search parameters or create a new community.</p>
                    </div>
                ) : (
                    <motion.div
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                        {filteredGroups.map((group) => (
                            <GroupCard
                                key={group.id}
                                group={group}
                                onEdit={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    handleEditGroup(group);
                                }}
                                onDelete={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    handleDeleteGroup(group);
                                }}
                                onClick={() => handleViewMembers(group)}
                            />
                        ))}
                    </motion.div>
                )}
            </div>

            <MembersModal
                isOpen={!!selectedGroupForMembers}
                onClose={() => setSelectedGroupForMembers(null)}
                groupName={selectedGroupForMembers?.name || ""}
                members={groupMembers}
                isLoading={isFetchingMembers}
                onUpdateRole={handleUpdateMemberRole}
                onRemove={handleRemoveMember}
            />
        </div>
    );
}

function GroupCard({
    group,
    onEdit,
    onDelete,
    onClick
}: {
    group: Group;
    onEdit: (e: React.MouseEvent) => void;
    onDelete: (e: React.MouseEvent) => void;
    onClick: () => void;
}) {
    const memberCount = group.members?.[0]?.count || 0;

    return (
        <motion.div
            layout
            onClick={onClick}
            whileHover={{ y: -6, transition: { duration: 0.4 } }}
            className="group relative bg-white border border-slate-200 rounded-[2rem] p-5 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] transition-all duration-500 flex flex-col overflow-hidden cursor-pointer"
        >
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />

            <div className="relative flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-100/50 group-hover:rotate-6 transition-transform duration-500">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight mb-0.5 uppercase group-hover:text-emerald-600 transition-colors">
                            {group.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                            <ActivityIcon className="w-2.5 h-2.5 animate-pulse" />
                            {memberCount} Members
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative space-y-3 mb-6 flex-1">
                <div className="grid grid-cols-2 gap-2">
                    {group.institute_name && (
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest overflow-hidden">
                            <Building2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{group.institute_name}</span>
                        </div>
                    )}
                    {group.department && (
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest overflow-hidden">
                            <GraduationCap className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{group.department}</span>
                        </div>
                    )}
                </div>
                {group.description && (
                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed font-bold pl-1 uppercase tracking-tight">
                        {group.description}
                    </p>
                )}
            </div>

            {group.top_admin && (
                <div className="relative flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl mb-6 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-all duration-300">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Admin</span>
                            <span className="text-[9px] font-black text-slate-700 truncate max-w-[100px] uppercase leading-none">
                                {group.top_admin.full_name || group.top_admin.email.split('@')[0]}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative flex gap-2">
                <button
                    onClick={onEdit}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl hover:bg-emerald-600 transition-all font-black text-[9px] uppercase tracking-[0.2em] shadow-xl active:scale-95"
                >
                    <Pencil className="w-3 h-3" />
                    Edit
                </button>
                <button
                    onClick={onDelete}
                    className="w-10 h-10 flex items-center justify-center bg-white text-red-600 border border-red-50 rounded-xl hover:bg-red-50 transition-all active:scale-95"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}

function MembersModal({
    isOpen,
    onClose,
    groupName,
    members,
    isLoading,
    onUpdateRole,
    onRemove
}: {
    isOpen: boolean;
    onClose: () => void;
    groupName: string;
    members: GroupMember[];
    isLoading: boolean;
    onUpdateRole: (id: string, role: "student" | "admin" | "top_admin") => void;
    onRemove: (id: string) => void;
}) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative bg-white w-full max-w-xl max-h-[80vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase mb-1">{groupName}</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Community Members ({members.length})</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-red-500 transition-all hover:rotate-90"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Members List */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <ActivityIcon className="w-8 h-8 text-emerald-500 animate-spin" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Members...</p>
                            </div>
                        ) : members.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center border border-slate-100">
                                    <Users className="w-8 h-8 text-slate-300" />
                                </div>
                                <div>
                                    <p className="text-slate-900 font-black text-lg">No members found</p>
                                    <p className="text-slate-400 text-xs font-bold uppercase mt-1">This community is currently empty</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {members.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-[2rem] hover:bg-white hover:border-emerald-100 hover:shadow-lg transition-all duration-300 group/member">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden shadow-sm">
                                                {member.user?.avatar_url ? (
                                                    <img src={member.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-6 h-6 text-slate-300" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-sm font-black text-slate-900 truncate max-w-[150px] uppercase tracking-tight">
                                                        {member.user?.full_name || "Anonymous Member"}
                                                    </h4>
                                                    {member.role === 'top_admin' && (
                                                        <div className="p-1 bg-amber-50 rounded-lg">
                                                            <Shield className="w-3 h-3 text-amber-500" />
                                                        </div>
                                                    )}
                                                    {member.role === 'admin' && (
                                                        <div className="p-1 bg-emerald-50 rounded-lg">
                                                            <Shield className="w-3 h-3 text-emerald-500" />
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{member.user?.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {/* Role & Controls */}
                                            <div className="flex items-center gap-1.5 border-r border-slate-100 pr-4 mr-2">
                                                <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all duration-500 ${member.role === 'top_admin'
                                                    ? "bg-amber-50 border-amber-100 text-amber-600"
                                                    : member.role === 'admin'
                                                        ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                                                        : "bg-white border-slate-100 text-slate-400"
                                                    }`}>
                                                    {member.role.replace('_', ' ')}
                                                </div>
                                            </div>

                                            {member.role !== 'top_admin' && (
                                                <div className="flex items-center gap-3">
                                                    {/* Admin Toggle */}
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Admin</span>
                                                        <button
                                                            onClick={() => onUpdateRole(member.id, member.role === 'admin' ? 'student' : 'admin')}
                                                            className={`w-9 h-5 rounded-full transition-all relative shadow-inner ${member.role === 'admin' ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                                        >
                                                            <motion.div
                                                                animate={{ x: member.role === 'admin' ? 16 : 0 }}
                                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                                className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full shadow-md"
                                                            />
                                                        </button>
                                                    </div>

                                                    {/* Remove Button */}
                                                    <button
                                                        onClick={() => onRemove(member.id)}
                                                        title="Remove from Community"
                                                        className="p-2.5 hover:bg-red-50 text-red-400 hover:text-red-500 rounded-xl transition-all border border-transparent hover:border-red-100 shadow-sm active:scale-90"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-slate-50/50 border-t border-slate-100 text-center">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">TaskSphere Governance System</p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

function ActivityIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    )
}


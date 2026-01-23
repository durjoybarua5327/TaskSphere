"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useModal } from "@/components/providers/modal-provider";
import {
    updateGroupInfo,
    getGroupMembers,
    getGroupJoinRequests,
    handleJoinRequest,
    updateMemberRole,
    removeMember,
    addStudentToGroup
} from "../actions";
import {
    Users,
    Pencil,
    Sparkles,
    Building2,
    GraduationCap,
    User,
    Search,
    Shield,
    X,
    Plus,
    Loader2,
    Check
} from "lucide-react";
import { GroupForm, GroupFormData } from "@/components/groups/GroupForm";
import { motion, AnimatePresence } from "framer-motion";

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

interface JoinRequest {
    id: string;
    user: {
        id: string;
        full_name: string | null;
        email: string;
        avatar_url: string | null;
    } | null;
    created_at: string;
}

interface GroupsClientProps {
    initialGroups: Group[];
}

export function GroupsClient({ initialGroups }: GroupsClientProps) {
    const { openModal, closeModal } = useModal();
    const router = useRouter();
    const [groups, setGroups] = useState<Group[]>(initialGroups);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedGroupForMembers, setSelectedGroupForMembers] = useState<Group | null>(null);
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
    const [groupRequests, setGroupRequests] = useState<JoinRequest[]>([]);
    const [isFetchingMembers, setIsFetchingMembers] = useState(false);

    const filteredGroups = groups.filter(g =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.institute_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleEditGroup = (group: Group) => {
        openModal({
            type: "edit",
            title: "Edit Group",
            description: "Update group details",
            className: "max-w-2xl",
            preventOutsideClick: true,
            content: (
                <GroupForm
                    showTopAdminEmail={false} // Admin can't change top admin usually
                    initialData={{
                        name: group.name,
                        instituteName: group.institute_name || "",
                        department: group.department || "",
                        purpose: group.description || "",
                    } as GroupFormData}
                    onSubmit={async (data: GroupFormData) => {
                        const result = await updateGroupInfo(group.id, {
                            name: data.name,
                            description: data.purpose,
                            instituteName: data.instituteName,
                            department: data.department
                        });

                        if (result.success) {
                            closeModal();
                            // Optimistic update or refresh
                            setGroups(prev => prev.map(g => g.id === group.id ? { ...g, ...data, description: data.purpose, institute_name: data.instituteName } : g));
                            router.refresh();
                        } else {
                            alert(result.error || "Failed to update group");
                        }
                        return result;
                    }}
                    onCancel={closeModal}
                    submitLabel="Save Changes"
                />
            ),
        });
    };

    const handleNavigateToGroup = (groupId: string) => {
        router.push(`/admin/groups/${groupId}`);
    };

    const handleViewMembers = async (group: Group) => {
        setSelectedGroupForMembers(group);
        setIsFetchingMembers(true);

        const [membersResult, requestsResult] = await Promise.all([
            getGroupMembers(group.id),
            getGroupJoinRequests(group.id)
        ]);

        if (membersResult.members) {
            setGroupMembers(membersResult.members as GroupMember[]);
        }
        if (requestsResult.requests) {
            setGroupRequests(requestsResult.requests as JoinRequest[]);
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

    const handleRemoveMember = async (membershipId: string, memberName: string) => {
        openModal({
            type: "delete",
            title: "Remove Member",
            description: `Are you sure you want to remove ${memberName} from this group? This will revoke their access to all tasks and materials.`,
            isDestructive: true,
            confirmText: "Remove Member",
            onConfirm: async () => {
                const result = await removeMember(membershipId);
                if (result.success && selectedGroupForMembers) {
                    setGroupMembers(prev => prev.filter(m => m.id !== membershipId));
                } else if (!result.success) {
                    alert("Failed to remove member: " + result.error);
                }
            },
        });
    };

    const handleRequestAction = async (requestId: string, action: "approved" | "rejected") => {
        const result = await handleJoinRequest(requestId, action);
        if (result.success && selectedGroupForMembers) {
            // Refresh both lists as approving moves user to members
            const [membersResult, requestsResult] = await Promise.all([
                getGroupMembers(selectedGroupForMembers.id),
                getGroupJoinRequests(selectedGroupForMembers.id)
            ]);

            if (membersResult.members) setGroupMembers(membersResult.members as GroupMember[]);
            if (requestsResult.requests) setGroupRequests(requestsResult.requests as JoinRequest[]);
        }
    };

    return (
        <div className="space-y-8">
            {/* Search Bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-[1.25rem] px-4 py-3 w-full max-w-md shadow-sm focus-within:ring-4 ring-emerald-500/10 focus-within:border-emerald-500/30 transition-all">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search your groups..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm w-full font-bold text-slate-700 placeholder:text-slate-300"
                    />
                </div>
            </div>

            {/* Groups Grid */}
            {filteredGroups.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-[3rem] p-24 text-center shadow-sm flex flex-col items-center">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center border border-slate-100 mb-6">
                        <Users className="w-12 h-12 text-slate-300" />
                    </div>
                    <p className="text-slate-900 text-2xl font-black tracking-tight mb-2">No groups found</p>
                    <p className="text-slate-400 font-medium max-w-xs">You haven't been assigned to any groups yet.</p>
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
                            onClick={() => handleNavigateToGroup(group.id)}
                            onManageMembers={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleViewMembers(group);
                            }}
                        />
                    ))}
                </motion.div>
            )}

            <MembersModal
                isOpen={!!selectedGroupForMembers}
                onClose={() => setSelectedGroupForMembers(null)}
                groupName={selectedGroupForMembers?.name || ""}
                members={groupMembers}
                requests={groupRequests}
                isLoading={isFetchingMembers}
                onUpdateRole={handleUpdateMemberRole}
                onRemove={handleRemoveMember}
                onRequestAction={handleRequestAction}
            />
        </div>
    );
}

function GroupCard({
    group,
    onEdit,
    onClick,
    onManageMembers
}: {
    group: Group;
    onEdit: (e: React.MouseEvent) => void;
    onClick: () => void;
    onManageMembers: (e: React.MouseEvent) => void;
}) {
    const memberCount = group.members?.[0]?.count || 0;

    return (
        <motion.div
            layout
            onClick={onClick}
            whileHover={{ y: -6, transition: { duration: 0.4 } }}
            className="group relative bg-white border border-slate-200 rounded-[2rem] p-5 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] transition-all duration-500 flex flex-col overflow-hidden cursor-pointer h-full min-h-[220px]"
        >
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />

            <div className="relative flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-100/50 group-hover:rotate-6 transition-transform duration-500">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight mb-0.5 uppercase group-hover:text-emerald-600 transition-colors line-clamp-1">
                            {group.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                            <Sparkles className="w-2.5 h-2.5" />
                            {memberCount} Members
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative space-y-3 mb-6 flex-1">
                <div className="flex flex-wrap gap-2">
                    {group.institute_name && (
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest overflow-hidden max-w-full">
                            <Building2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{group.institute_name}</span>
                        </div>
                    )}
                </div>
                {group.description && (
                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed font-bold pl-1 uppercase tracking-tight">
                        {group.description}
                    </p>
                )}
            </div>

            <div className="relative flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                <button
                    onClick={onManageMembers}
                    className="flex items-center gap-2 text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700 transition-colors"
                >
                    Manage Members
                    <Users className="w-3 h-3" />
                </button>
                <button
                    onClick={onEdit}
                    className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-600 border border-slate-100 rounded-xl hover:bg-slate-100 transition-all active:scale-95"
                >
                    <Pencil className="w-3.5 h-3.5" />
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
    requests,
    isLoading,
    onUpdateRole,
    onRemove,
    onRequestAction
}: {
    isOpen: boolean;
    onClose: () => void;
    groupName: string;
    members: GroupMember[];
    requests: JoinRequest[];
    isLoading: boolean;
    onUpdateRole: (id: string, role: "student" | "admin" | "top_admin") => void;
    onRemove: (id: string, name: string) => void;
    onRequestAction: (id: string, action: "approved" | "rejected") => void;
}) {
    if (!isOpen) return null;
    const [activeTab, setActiveTab] = useState<"members" | "requests">("members");

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
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase mb-1">{groupName}</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Community Management</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-red-500 transition-all hover:rotate-90"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex bg-slate-200/50 p-1 rounded-xl">
                            <button
                                onClick={() => setActiveTab("members")}
                                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'members' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Members ({members.length})
                            </button>
                            <button
                                onClick={() => setActiveTab("requests")}
                                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'requests' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Requests ({requests.length})
                            </button>
                        </div>
                    </div>

                    {/* List Content */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing...</p>
                            </div>
                        ) : activeTab === 'members' ? (
                            members.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-slate-500 font-medium">No members found</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {members.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-[2rem] hover:bg-white hover:border-emerald-100 hover:shadow-lg transition-all duration-300">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <Link href={`/admin/profile?userId=${member.user?.id}`} className="shrink-0">
                                                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden transition-all duration-300 hover:ring-2 hover:ring-emerald-500 hover:scale-110 shadow-sm">
                                                        {member.user?.avatar_url ? (
                                                            <img src={member.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User className="w-5 h-5 text-slate-300" />
                                                        )}
                                                    </div>
                                                </Link>
                                                <div className="min-w-0">
                                                    <Link href={`/admin/profile?userId=${member.user?.id}`}>
                                                        <h4 className="text-sm font-bold text-slate-900 hover:text-emerald-600 transition-all duration-300 hover:translate-x-1 inline-block">{member.user?.full_name || "Unknown User"}</h4>
                                                    </Link>
                                                    <p className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full inline-block text-slate-600 font-bold uppercase tracking-wider mt-1 block w-fit">{member.role}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => onRemove(member.id, member.user?.full_name || "Unknown User")}
                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            requests.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-slate-500 font-medium">No pending requests</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {requests.map((request) => (
                                        <div key={request.id} className="flex items-center justify-between p-4 bg-amber-50/50 border border-amber-100 rounded-[2rem]">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <Link href={`/admin/profile?userId=${request.user?.id}`} className="shrink-0">
                                                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden transition-all duration-300 hover:ring-2 hover:ring-emerald-500 hover:scale-110 shadow-sm">
                                                        {request.user?.avatar_url ? (
                                                            <img src={request.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User className="w-5 h-5 text-slate-300" />
                                                        )}
                                                    </div>
                                                </Link>
                                                <div className="min-w-0">
                                                    <Link href={`/admin/profile?userId=${request.user?.id}`}>
                                                        <h4 className="text-sm font-bold text-slate-900 hover:text-emerald-600 transition-all duration-300 hover:translate-x-1 inline-block">{request.user?.full_name || "Unknown User"}</h4>
                                                    </Link>
                                                    <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mt-1 truncate">{request.user?.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => onRequestAction(request.id, "approved")}
                                                    className="p-2 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-200 transition-colors"
                                                    title="Approve"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => onRequestAction(request.id, "rejected")}
                                                    className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                                                    title="Reject"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}


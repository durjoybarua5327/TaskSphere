"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/providers/modal-provider";
import {
    updateGroupInfo,
    getGroupMembers,
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
    Loader2
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

interface GroupsClientProps {
    initialGroups: Group[];
}

export function GroupsClient({ initialGroups }: GroupsClientProps) {
    const { openModal, closeModal } = useModal();
    const router = useRouter();
    const [groups, setGroups] = useState<Group[]>(initialGroups);
    const [searchQuery, setSearchQuery] = useState("");

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
                        />
                    ))}
                </motion.div>
            )}

        </div>
    );
}

function GroupCard({
    group,
    onEdit,
    onClick
}: {
    group: Group;
    onEdit: (e: React.MouseEvent) => void;
    onClick: () => void;
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
                <div className="flex items-center gap-2 text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                    Manage Group
                    <Sparkles className="w-3 h-3 animate-pulse" />
                </div>
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


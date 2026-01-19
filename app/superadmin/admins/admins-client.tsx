"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/providers/modal-provider";
import { removeAdmin, banAdmin, updateMemberRole } from "../actions";
import { formatDistanceToNow } from "date-fns";
import {
    Shield,
    ShieldCheck,
    User,
    Mail,
    Users,
    Trash2,
    Ban,
    Clock,
    Search,
    ChevronRight,
    ArrowUpRight,
    Star,
    X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AdminMembership {
    id: string;
    role: string;
    created_at: string;
    user?: {
        id: string;
        full_name: string | null;
        email: string;
        avatar_url: string | null;
        is_super_admin?: boolean;
    } | null;
    group?: {
        id: string;
        name: string;
    } | null;
}

interface AdminsClientProps {
    admins: AdminMembership[];
}

export function AdminsClient({ admins: initialAdmins }: AdminsClientProps) {
    const { openModal, closeModal } = useModal();
    const router = useRouter();
    const [admins, setAdmins] = useState<AdminMembership[]>(initialAdmins);
    const [searchQuery, setSearchQuery] = useState("");

    // Group admins by user
    const adminsByUser = admins.reduce((acc, admin) => {
        const userId = admin.user?.id || "unknown";
        if (!acc[userId]) {
            acc[userId] = {
                user: admin.user,
                memberships: [],
            };
        }
        acc[userId].memberships.push(admin);
        return acc;
    }, {} as Record<string, { user: AdminMembership["user"]; memberships: AdminMembership[] }>);

    const filteredAdmins = Object.values(adminsByUser).filter(({ user }) =>
        user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleRemoveAdmin = (membership: AdminMembership) => {
        openModal({
            type: "delete",
            title: "Remove Admin Authority",
            description: `This will revoke administrative privileges for ${membership.user?.full_name || membership.user?.email} within the community "${membership.group?.name}".`,
            isDestructive: true,
            confirmText: "Revoke Access",
            onConfirm: async () => {
                const result = await removeAdmin(membership.id);
                if (result.success) {
                    setAdmins(admins.filter(a => a.id !== membership.id));
                }
            },
        });
    };

    const handleBanAdmin = (userId: string, userName: string) => {
        openModal({
            type: "confirm",
            title: "Suspend Administrator",
            description: `Initiate a temporary suspension for ${userName}. They will lose all access for the specified duration.`,
            className: "max-w-md",
            content: (
                <BanForm
                    onSubmit={async (hours) => {
                        const result = await banAdmin(userId, hours);
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

    const handleUpdateRole = async (membership: AdminMembership, newRole: "admin" | "top_admin") => {
        const result = await updateMemberRole(membership.id, newRole);
        if (result.success) {
            router.refresh();
        }
    };

    return (
        <div className="space-y-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Administrators</h1>
                    <p className="text-slate-500 font-medium text-lg">Manage governance and authority across all platform communities.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-[1.25rem] px-4 py-2.5 w-80 shadow-sm focus-within:ring-4 ring-emerald-500/10 focus-within:border-emerald-500/30 transition-all">
                        <Search className="w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm w-full font-bold text-slate-700 placeholder:text-slate-300"
                        />
                    </div>
                </div>
            </div>

            {/* Admins List Section */}
            {filteredAdmins.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-[3rem] p-32 text-center shadow-sm flex flex-col items-center">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center border border-slate-100 mb-6">
                        <Shield className="w-12 h-12 text-slate-200" />
                    </div>
                    <p className="text-slate-900 text-2xl font-black tracking-tight mb-2">No administrators found</p>
                    <p className="text-slate-400 font-medium max-w-xs">Admins will appear here once they are assigned to communities.</p>
                </div>
            ) : (
                <motion.div
                    layout
                    className="grid grid-cols-1 xl:grid-cols-2 gap-8"
                >
                    {filteredAdmins.map(({ user, memberships }, index) => (
                        <motion.div
                            key={user?.id || "unknown"}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <AdminCard
                                user={user}
                                memberships={memberships}
                                onRemove={handleRemoveAdmin}
                                onBan={() => handleBanAdmin(user?.id || "", user?.full_name || user?.email || "Unknown")}
                                onUpdateRole={handleUpdateRole}
                            />
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
}

function AdminCard({
    user,
    memberships,
    onRemove,
    onBan,
    onUpdateRole,
}: {
    user: AdminMembership["user"];
    memberships: AdminMembership[];
    onRemove: (membership: AdminMembership) => void;
    onBan: () => void;
    onUpdateRole: (membership: AdminMembership, newRole: "admin" | "top_admin") => void;
}) {
    const isTopAdminGlobal = memberships.some(m => m.role === "top_admin");

    return (
        <div className="group relative bg-white border border-slate-200 rounded-[2.5rem] p-8 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] transition-all duration-500 overflow-hidden">
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />

            {/* Profile Header */}
            <div className="relative flex items-start gap-6 mb-8">
                <div className="relative">
                    <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-slate-100 to-slate-200 p-1">
                        <div className="w-full h-full rounded-[1.85rem] bg-white flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-10 h-10 text-slate-300" />
                            )}
                        </div>
                    </div>
                    {isTopAdminGlobal && (
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-2xl bg-amber-400 border-4 border-white flex items-center justify-center shadow-lg">
                            <Star className="w-4 h-4 text-white fill-current" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0 pt-2">
                    <div className="flex items-center justify-between gap-4">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight truncate group-hover:text-emerald-600 transition-colors">
                            {user?.full_name || "Unknown User"}
                        </h3>
                    </div>
                    <div className="flex items-center gap-3 mt-1 px-3 py-1 bg-slate-50 rounded-full w-fit border border-slate-100">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-black text-slate-500 lowercase tracking-tight">{user?.email || "no_email_provided"}</span>
                    </div>
                </div>

                <button
                    onClick={onBan}
                    className="p-3 bg-red-50 text-red-500 border border-red-100 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95"
                    title="Suspend User"
                >
                    <Ban className="w-5 h-5" />
                </button>
            </div>

            {/* Assigned Responsibilities */}
            <div className="relative space-y-4 mb-8">
                <div className="flex items-center gap-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Responsibility Framework</p>
                    <div className="h-px flex-1 bg-slate-100" />
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {memberships.map((membership) => (
                        <div
                            key={membership.id}
                            className="flex items-center justify-between p-5 bg-slate-50 hover:bg-white border border-slate-50 hover:border-slate-100 rounded-3xl transition-all duration-300 group/item"
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${membership.role === 'top_admin' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-white text-slate-600 border border-slate-100'
                                    }`}>
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-black text-slate-900 text-sm truncate uppercase tracking-tight">
                                        {membership.group?.name || "Global Entity"}
                                    </p>
                                    <div className="flex items-center gap-3 mt-0.5">
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white border border-slate-100 rounded-lg">
                                            <div className={`w-1.5 h-1.5 rounded-full ${membership.role === 'top_admin' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.1em]">
                                                {membership.role.replace("_", " ")}
                                            </span>
                                        </div>

                                        <div className="h-3 w-px bg-slate-200" />

                                        {membership.role === "admin" && (
                                            <button
                                                onClick={() => onUpdateRole(membership, "top_admin")}
                                                className="text-[9px] text-emerald-600 hover:text-emerald-700 font-black uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
                                            >
                                                Promote
                                            </button>
                                        )}
                                        {membership.role === "top_admin" && (
                                            <button
                                                onClick={() => onUpdateRole(membership, "admin")}
                                                className="text-[9px] text-amber-600 hover:text-amber-700 font-black uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
                                            >
                                                Demote
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => onRemove(membership)}
                                className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-item-hover:opacity-100 group-hover:opacity-100 flex items-center gap-2"
                                title="Revoke access"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Metrics */}
            <div className="relative pt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Onboarded</span>
                        <span className="text-xs font-bold text-slate-600">{formatDistanceToNow(new Date(memberships[0]?.created_at || Date.now()), { addSuffix: true })}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Authorized</span>
                </div>
            </div>
        </div>
    );
}

function BanForm({
    onSubmit,
    onCancel,
}: {
    onSubmit: (hours: number) => Promise<{ error?: string; success?: boolean }>;
    onCancel: () => void;
}) {
    const [duration, setDuration] = useState(24);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const durations = [
        { value: 1, label: "1 hour" },
        { value: 6, label: "6 hours" },
        { value: 12, label: "12 hours" },
        { value: 24, label: "24 hours" },
        { value: 72, label: "3 days" },
        { value: 168, label: "1 week" },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const result = await onSubmit(duration);
        if (result.error) {
            setError(result.error);
        }
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 p-2">
            <div>
                <h4 className="text-lg font-black text-slate-900 mb-2">Duration of Suspension</h4>
                <p className="text-sm text-slate-500 font-medium mb-6">Select the timeframe during which administrative privileges will be revoked.</p>

                <div className="grid grid-cols-3 gap-3">
                    {durations.map((d) => (
                        <button
                            key={d.value}
                            type="button"
                            onClick={() => setDuration(d.value)}
                            className={`px-4 py-4 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 border-2 ${duration === d.value
                                ? "bg-slate-900 text-white border-slate-900 shadow-xl"
                                : "bg-white text-slate-500 hover:bg-slate-50 border-slate-100"
                                }`}
                        >
                            {d.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-4 p-5 bg-orange-50 rounded-[1.5rem] border border-orange-100">
                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-orange-500 shadow-sm border border-orange-50">
                    <Clock className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-xs font-black text-orange-900 uppercase tracking-widest leading-none mb-1">Impact Warning</p>
                    <p className="text-[11px] text-orange-700 font-bold">
                        User will be blocked for exactly {duration} hour{duration !== 1 ? "s" : ""}.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] py-4 bg-red-600 text-white rounded-[1.25rem] text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-red-100 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50"
                >
                    {isSubmitting ? "Processing..." : "Confirm Suspension"}
                </button>
            </div>
        </form>
    );
}

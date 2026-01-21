"use client";

import { useState } from "react";
import { GroupCard } from "./group-card";
import { Users, Search } from "lucide-react";
import { motion } from "framer-motion";

interface GroupsViewProps {
    groups: any[];
    myGroupIds: string[];
    pendingGroupIds?: string[];
    userId: string;
}

export function GroupsView({ groups, myGroupIds, pendingGroupIds = [], userId }: GroupsViewProps) {
    const [viewMode, setViewMode] = useState<"all" | "my">("all");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredGroups = groups.filter(g => {
        const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.institute_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.description?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesView = viewMode === "all" || myGroupIds.includes(g.id);

        return matchesSearch && matchesView;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-1 h-8 bg-indigo-500 rounded-full"></span>
                    {viewMode === 'my' ? 'My Groups' : 'All Groups'}
                </h2>

                <div className="flex items-center gap-4 flex-1 justify-end">
                    {/* Search */}
                    <div className="relative max-w-xs w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search groups..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm"
                        />
                    </div>

                    {/* Toggle */}
                    <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 relative">
                        <button
                            onClick={() => setViewMode("my")}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors relative ${viewMode === "my"
                                ? "text-slate-900"
                                : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            <span className="relative z-10">My Groups</span>
                            {viewMode === "my" && (
                                <motion.div
                                    layoutId="group-toggle"
                                    className="absolute inset-0 bg-white rounded-lg shadow-sm"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </button>
                        <button
                            onClick={() => setViewMode("all")}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors relative ${viewMode === "all"
                                ? "text-slate-900"
                                : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            <span className="relative z-10">All Groups</span>
                            {viewMode === "all" && (
                                <motion.div
                                    layoutId="group-toggle"
                                    className="absolute inset-0 bg-white rounded-lg shadow-sm"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid */}
            {filteredGroups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredGroups.map((group) => (
                        <GroupCard
                            key={group.id}
                            group={{
                                ...group,
                                university_name: group.institute_name,
                                group_purpose: group.description
                            }}
                            isMember={myGroupIds.includes(group.id)}
                            isPending={pendingGroupIds.includes(group.id)}
                            userId={userId}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                    <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 text-lg font-medium mb-2">No groups found</p>
                    <p className="text-slate-500 text-sm">Try adjusting filters or create a new group</p>
                </div>
            )}
        </div>
    );
}

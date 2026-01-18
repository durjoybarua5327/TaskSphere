"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, Shield, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JoinGroupModal } from "./JoinGroupModal";

interface Group {
    id: string;
    name: string;
    description: string | null;
    memberCount: number;
    ownerName: string;
    status: 'member' | 'pending' | 'rejected' | null;
}

export function GroupList({ groups }: { groups: Group[] }) {
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

    return (
        <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {groups.map((group) => (
                    <Card key={group.id} className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-slate-200/60 bg-white">
                        {/* Decorative Gradient Top */}
                        <div className="h-2 w-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400" />

                        <CardHeader className="pb-4">
                            <CardTitle className="flex justify-between items-start gap-4">
                                <span className="font-bold text-xl text-slate-900 line-clamp-1 group-hover:text-purple-700 transition-colors">
                                    {group.name}
                                </span>
                            </CardTitle>
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 pt-1">
                                <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full">
                                    <Users className="w-3 h-3" />
                                    {group.memberCount} members
                                </span>
                                <span>•</span>
                                <span className="truncate max-w-[120px]">
                                    By {group.ownerName}
                                </span>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            <p className="text-sm text-slate-600 line-clamp-4 min-h-[90px] leading-relaxed">
                                {group.description || "No description provided."}
                            </p>

                            <div className="pt-2">
                                {group.status === 'member' ? (
                                    <Button variant="ghost" disabled className="w-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                                        Joined
                                    </Button>
                                ) : group.status === 'pending' ? (
                                    <Button variant="ghost" disabled className="w-full bg-amber-50 text-amber-700 border border-amber-100">
                                        Request Pending
                                    </Button>
                                ) : (
                                    <Button
                                        className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10"
                                        onClick={() => setSelectedGroup(group)}
                                    >
                                        Request to Join
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {selectedGroup && (
                <JoinGroupModal
                    isOpen={!!selectedGroup}
                    onClose={() => setSelectedGroup(null)}
                    groupName={selectedGroup.name}
                    groupId={selectedGroup.id}
                />
            )}
        </>
    );
}

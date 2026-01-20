"use client";

import { Users, Building2, BookOpen, Target, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { joinGroup } from "./actions";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Group = {
    id: string;
    name: string;
    description: string | null;
    university_name: string | null;
    department: string | null;
    group_purpose: string | null;
    created_at: string;
    group_members: { count: number }[];
};

export function GroupCard({ group, isMember, userId }: { group: Group; isMember: boolean; userId: string }) {
    const router = useRouter();
    const [isJoining, setIsJoining] = useState(false);
    const [joined, setJoined] = useState(isMember);

    const memberCount = group.group_members?.[0]?.count || 0;

    const handleJoin = async () => {
        setIsJoining(true);
        try {
            await joinGroup(group.id, userId);
            setJoined(true);
            router.refresh();
        } catch (error) {
            console.error("Error joining group:", error);
            alert("Failed to join group");
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all">
            {/* Group Name */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{group.name}</h3>
                    {group.description && (
                        <p className="text-sm text-slate-600">{group.description}</p>
                    )}
                </div>
                {joined && (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Joined
                    </span>
                )}
            </div>

            {/* Group Details */}
            <div className="space-y-2 mb-4">
                {group.university_name && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Building2 className="w-4 h-4 text-indigo-500" />
                        <span>{group.university_name}</span>
                    </div>
                )}

                {group.department && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <BookOpen className="w-4 h-4 text-purple-500" />
                        <span>{group.department}</span>
                    </div>
                )}

                {group.group_purpose && (
                    <div className="flex items-start gap-2 text-sm text-slate-600 mt-3 p-3 bg-slate-50 rounded-lg">
                        <Target className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{group.group_purpose}</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-slate-600">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">{memberCount} members</span>
                </div>

                {!joined ? (
                    <Button
                        onClick={handleJoin}
                        disabled={isJoining}
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        {isJoining ? "Joining..." : "Join Group"}
                    </Button>
                ) : (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.location.href = `/student/groups/${group.id}`}
                    >
                        View Group
                    </Button>
                )}
            </div>
        </div>
    );
}

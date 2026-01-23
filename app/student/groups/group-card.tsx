import { Users, Building2, BookOpen, CheckCircle, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { joinGroup, withdrawJoinRequest } from "./actions";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Group = {
    id: string;
    name: string;
    description: string | null;
    institute_name: string | null;
    department: string | null;
    group_purpose: string | null;
    created_at: string;
    group_members: { count: number }[];
    top_admin?: {
        full_name: string | null;
        email: string;
        avatar_url: string | null;
    } | null;
};

export function GroupCard({ group, isMember, isPending = false, userId, isProfileComplete = true }: { group: Group; isMember: boolean; isPending?: boolean; userId: string; isProfileComplete?: boolean }) {
    const router = useRouter();
    const [isJoining, setIsJoining] = useState(false);
    const [joined, setJoined] = useState(isMember);
    const [hasPending, setHasPending] = useState(isPending);

    const memberCount = group.group_members?.[0]?.count || 0;

    const handleJoin = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsJoining(true);
        try {
            const result = await joinGroup(group.id, userId);
            if (result.success) {
                if (result.message === "Request sent" || result.message === "Request already pending") {
                    setHasPending(true);
                } else {
                    setJoined(true);
                }
                router.refresh();
            } else {
                alert(result.error || "Failed to join group");
            }
        } catch (error) {
            console.error("Error joining group:", error);
            alert("Failed to join group");
        } finally {
            setIsJoining(false);
        }
    };

    const handleWithdraw = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsJoining(true);
        try {
            const result = await withdrawJoinRequest(group.id, userId);
            if (result.success) {
                setHasPending(false);
                router.refresh();
            } else {
                alert(result.error || "Failed to withdraw request");
            }
        } catch (error) {
            console.error("Error withdrawing request:", error);
            alert("Failed to withdraw request");
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <div
            onClick={() => joined && router.push(`/student/groups/${group.id}`)}
            className={`bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all flex flex-col h-full ${joined ? 'cursor-pointer' : ''}`}
        >
            {/* Group Name */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{group.name}</h3>
                    {group.description && (
                        <p className="text-sm text-slate-600 line-clamp-2">{group.description}</p>
                    )}
                </div>
                {/* ... existing badges ... */}
                {joined && (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full flex items-center gap-1 shrink-0">
                        <CheckCircle className="w-3 h-3" />
                        Joined
                    </span>
                )}
                {!joined && hasPending && (
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full flex items-center gap-1 shrink-0">
                        <CheckCircle className="w-3 h-3" />
                        Pending
                    </span>
                )}
            </div>

            {/* ... Group Details ... */}
            <div className="space-y-2 mb-4 flex-1">
                {group.institute_name && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Building2 className="w-4 h-4 text-indigo-500" />
                        <span>{group.institute_name}</span>
                    </div>
                )}

                {group.department && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <BookOpen className="w-4 h-4 text-purple-500" />
                        <span>{group.department}</span>
                    </div>
                )}

                {group.top_admin && (
                    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                            {group.top_admin.avatar_url ? (
                                <img src={group.top_admin.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-4 h-4 text-slate-400" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">Top Admin</span>
                            <span className="text-xs font-semibold text-slate-700">{group.top_admin.full_name || group.top_admin.email}</span>
                        </div>
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
                    hasPending ? (
                        <Button
                            onClick={handleWithdraw}
                            disabled={isJoining}
                            size="sm"
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                            {isJoining ? "Withdrawing..." : (
                                <>
                                    <X className="w-3 h-3 mr-1" />
                                    Withdraw Request
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleJoin}
                            disabled={isJoining || !isProfileComplete}
                            size="sm"
                            className={!isProfileComplete ? "bg-slate-200 text-slate-500 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"}
                        >
                            {isJoining ? "Sending..." : "Request to Join"}
                        </Button>
                    )
                ) : (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/student/groups/${group.id}`);
                        }}
                    >
                        View Group
                    </Button>
                )}
            </div>
        </div>
    );
}

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getGroupDetails, getGroupMembers, getGroupJoinRequests, getTasks } from "../../actions";
import { GroupDetailClient } from "./GroupDetailClient";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface PageProps {
    params: Promise<{
        groupId: string;
    }>;
    searchParams: Promise<{
        tab?: string;
    }>;
}

export default async function GroupDetailPage(props: PageProps) {
    // Await params and searchParams
    const { groupId } = await props.params;
    const { tab } = await props.searchParams;

    const [groupRes, membersRes, requestsRes, tasksRes] = await Promise.all([
        getGroupDetails(groupId),
        getGroupMembers(groupId),
        getGroupJoinRequests(groupId),
        getTasks(groupId)
    ]);

    if (!groupRes.group) {
        return notFound();
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 pb-24">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Breadcrumbs / Back button */}
                <Link
                    href="/admin/groups"
                    className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 transition-colors font-black text-[10px] uppercase tracking-widest group w-fit"
                >
                    <div className="p-2 bg-white border border-slate-100 rounded-xl group-hover:border-emerald-100 transition-all">
                        <ChevronLeft className="w-4 h-4" />
                    </div>
                    Back to Groups
                </Link>

                <Suspense fallback={<GroupDetailLoading />}>
                    <GroupDetailClient
                        group={groupRes.group}
                        initialMembers={membersRes.members || []}
                        initialRequests={requestsRes.requests || []}
                        initialTasks={tasksRes.tasks || []}
                        initialTab={(tab as 'members' | 'tasks') || 'members'}
                    />
                </Suspense>
            </div>
        </div>
    );
}

function GroupDetailLoading() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="h-32 bg-white rounded-[2.5rem] border border-slate-100" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="h-20 bg-white rounded-3xl border border-slate-100" />
                    <div className="h-96 bg-white rounded-[2.5rem] border border-slate-100" />
                </div>
                <div className="space-y-6">
                    <div className="h-64 bg-white rounded-[2.5rem] border border-slate-100" />
                </div>
            </div>
        </div>
    );
}

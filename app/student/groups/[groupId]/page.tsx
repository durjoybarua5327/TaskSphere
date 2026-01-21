import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getGroupDetails, getGroupMembers, getTasks } from "@/app/admin/actions";
import { GroupDetailClient } from "@/app/admin/groups/[groupId]/GroupDetailClient";
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

export default async function StudentGroupDetailPage(props: PageProps) {
    const { userId } = await auth();
    if (!userId) {
        redirect("/sign-in");
    }

    const { groupId } = await props.params;
    const { tab } = await props.searchParams;

    // Fetch data using admin actions (which students can call for read-only data)
    const [groupRes, membersRes, tasksRes] = await Promise.all([
        getGroupDetails(groupId),
        getGroupMembers(groupId),
        getTasks(groupId)
    ]);

    if (!groupRes.group) {
        return notFound();
    }

    // Verify membership - student must be a member to see this page
    if (groupRes.group.currentUserRole === 'none') {
        redirect("/student/groups");
    }

    return (
        <div className="min-h-screen bg-slate-50/50 px-4 py-4 md:px-8 md:py-6 pb-24">
            <div className="max-w-7xl mx-auto space-y-4">
                {/* Breadcrumbs / Back button */}
                <Link
                    href="/student/groups"
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
                        initialMembers={(membersRes.members as any) || []}
                        initialRequests={[]} // Students don't see join requests
                        initialTasks={(tasksRes.tasks as any) || []}
                        initialTab={(tab as 'members' | 'tasks') || 'tasks'}
                        readOnly={true}
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

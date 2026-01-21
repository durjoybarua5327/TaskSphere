import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTasks, getSubmissions, verifyGroupAdminAccess } from "../../../../actions";
import { TaskSubmissionViewer } from "./TaskSubmissionViewer";
import { TaskHeaderClient } from "./TaskHeaderClient";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { auth } from "@clerk/nextjs/server";

interface PageProps {
    params: Promise<{
        groupId: string;
        taskId: string;
    }>;
}

export default async function TaskSubmissionsPage(props: PageProps) {
    const params = await props.params;
    const { groupId, taskId } = params;
    const { userId } = await auth();

    if (!userId) {
        return notFound();
    }

    const { role } = await verifyGroupAdminAccess(userId, groupId);

    const [tasksRes, submissionsRes] = await Promise.all([
        getTasks(groupId),
        getSubmissions(taskId)
    ]);

    const task = tasksRes.tasks?.find((t: any) => t.id === taskId);

    if (!task) {
        return notFound();
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-4 pb-24">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                    <Link href="/admin/groups" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
                        <ChevronLeft className="w-3 h-3" />
                        Groups
                    </Link>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    <Link href={`/admin/groups/${groupId}?tab=tasks`} className="hover:text-emerald-600 transition-colors">
                        Tasks
                    </Link>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    <span className="text-emerald-600">Submissions</span>
                </div>

                <TaskHeaderClient
                    task={task}
                    groupId={groupId}
                    submissionsCount={submissionsRes.submissions?.length || 0}
                    currentUserRole={role}
                    currentUserId={userId}
                />

                <Suspense fallback={<div className="h-96 bg-white animate-pulse rounded-[3rem]" />}>
                    <TaskSubmissionViewer
                        submissions={submissionsRes.submissions || []}
                        taskId={taskId}
                        groupId={groupId}
                    />
                </Suspense>
            </div>
        </div>
    );
}

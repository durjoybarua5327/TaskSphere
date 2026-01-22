import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { TaskSubmissionClient } from "./TaskSubmissionClient";
import Link from "next/link";
import { ChevronLeft, ClipboardList, ChevronRight, Eye, Paperclip } from "lucide-react";
import { getMySubmission, getPublicSubmissions } from "@/app/admin/actions";
import { auth } from "@clerk/nextjs/server";
import { StudentTaskHeaderClient } from "./_components/StudentTaskHeaderClient";

interface PageProps {
    params: Promise<{
        taskId: string;
    }>;
}

async function getTaskDetails(taskId: string) {
    const supabase = createAdminClient();
    const { data: task, error } = await supabase
        .from("tasks")
        .select(`
            *,
            group:group_id (
                id,
                name
            ),
            creator:creator_id (
                full_name,
                avatar_url
            )
        `)
        .eq("id", taskId)
        .single();

    if (error || !task) return null;
    return task;
}

export default async function StudentTaskDetailPage({ params }: PageProps) {
    const { taskId } = await params;
    const { userId } = await auth();

    if (!userId) redirect("/sign-in");

    const [task, submissionRes] = await Promise.all([
        getTaskDetails(taskId),
        getMySubmission(taskId)
    ]);

    let publicSubmissions = [];
    if (task?.submissions_visibility === 'public') {
        const res = await getPublicSubmissions(taskId);
        publicSubmissions = res.submissions || [];
    }

    if (!task) {
        return notFound();
    }

    // Verify membership in the group associated with this task
    const supabase = createAdminClient();
    const { data: membership } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", task.group?.id)
        .eq("user_id", userId)
        .single();

    if (!membership) {
        redirect("/student/tasks");
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 pb-24">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                    <Link href="/student/groups" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
                        <ChevronLeft className="w-3 h-3" />
                        Groups
                    </Link>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    <Link href={`/student/groups/${task.group.id}?tab=tasks`} className="hover:text-emerald-600 transition-colors">
                        Tasks
                    </Link>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    <span className="text-emerald-600">Submissions</span>
                </div>

                <StudentTaskHeaderClient
                    task={task}
                    taskId={taskId}
                    initialSubmission={submissionRes.submission}
                />

                <Suspense fallback={<div className="h-96 bg-white animate-pulse rounded-[3rem]" />}>
                    <TaskSubmissionClient
                        taskId={taskId}
                        initialSubmission={submissionRes.submission}
                        publicSubmissions={publicSubmissions}
                        isPublic={task.submissions_visibility === 'public'}
                    />
                </Suspense>
            </div>
        </div>
    );
}

import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { auth } from "@clerk/nextjs/server";
import { TaskHeaderClient } from "./TaskHeaderClient";
import { SubmissionList } from "./SubmissionList";
import { getSubmissions } from "@/app/admin/actions";

interface PageProps {
    params: Promise<{
        groupId: string;
        taskId: string;
    }>;
}

async function getTaskDetails(taskId: string) {
    const supabase = createAdminClient();
    const { data: task, error } = await supabase
        .from("tasks")
        .select(`
            *,
            creator:creator_id (
                id,
                full_name,
                avatar_url
            )
        `)
        .eq("id", taskId)
        .single();

    if (error || !task) return null;
    return task;
}

export default async function TaskSubmissionsPage({ params }: PageProps) {
    const { groupId, taskId } = await params;
    const { userId } = await auth();

    if (!userId) redirect("/sign-in");

    // Get task details and submissions
    const [task, submissionsRes] = await Promise.all([
        getTaskDetails(taskId),
        getSubmissions(taskId)
    ]);

    if (!task) {
        return notFound();
    }

    // Verify user role for the group
    const supabase = createAdminClient();
    const { data: member } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .single();

    const isTopAdmin = task.creator_id === userId; // Or logic based on group.top_admin_id

    // Check super admin status
    const { data: userData } = await supabase
        .from("users")
        .select("is_super_admin")
        .eq("id", userId)
        .single();

    const isSuperAdmin = userData?.is_super_admin || false;
    const isAdmin = member?.role === 'admin' || member?.role === 'top_admin' || isSuperAdmin;

    if (!isAdmin) {
        redirect(`/student/tasks/${taskId}`);
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 pb-24">
            <div className="max-w-7xl mx-auto space-y-8">
                <TaskHeaderClient
                    task={task}
                    groupId={groupId}
                    submissionsCount={submissionsRes.submissions?.length || 0}
                    currentUserRole={member?.role || (isSuperAdmin ? 'top_admin' : null)}
                    currentUserId={userId}
                />

                <Suspense fallback={<div className="h-96 bg-white animate-pulse rounded-[3rem]" />}>
                    <SubmissionList
                        submissions={submissionsRes.submissions || []}
                        maxScore={task.max_score}
                        taskId={taskId}
                    />
                </Suspense>
            </div>
        </div>
    );
}

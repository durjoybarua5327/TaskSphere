import { Suspense } from "react";
import { getTask, getSubmissions, getGroupMembers } from "@/app/admin/actions";
import { TaskDetailsClient } from "./task-details";
import { notFound } from "next/navigation";

export default async function TaskPage({ params }: { params: { groupId: string; taskId: string } }) {
    const resolvedParams = await params;
    const { groupId, taskId } = resolvedParams;

    // Parallel fetching
    const [taskRes, submissionsRes, membersRes] = await Promise.all([
        getTask(taskId),
        getSubmissions(taskId),
        getGroupMembers(groupId)
    ]);

    if (taskRes.error || !taskRes.task) {
        notFound();
    }

    // Ensure we passed valid data
    const task = taskRes.task;
    const submissions = submissionsRes.submissions || [];
    const totalMembers = membersRes.members?.length || 0;

    return (
        <TaskDetailsClient
            task={task}
            submissions={submissions}
            groupId={groupId}
            totalMembers={totalMembers}
        />
    );
}

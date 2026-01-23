import { auth } from "@clerk/nextjs/server";
import { getTaskForStudent, getMySubmission } from "@/app/admin/actions";
import { notFound, redirect } from "next/navigation";
import { StudentTaskDetailsClient } from "./client";

export default async function StudentTaskPage({ params }: { params: Promise<{ taskId: string }> }) {
    const resolvedParams = await params;
    const { taskId } = resolvedParams;
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    const [taskRes, submissionRes] = await Promise.all([
        getTaskForStudent(taskId),
        getMySubmission(taskId)
    ]);

    if (taskRes.error || !taskRes.task) {
        notFound();
    }

    let publicSubmissions = [];
    if (taskRes.task.submissions_visibility === 'public') {
        const { getPublicSubmissions } = await import("@/app/admin/actions");
        const pubRes = await getPublicSubmissions(taskId);
        publicSubmissions = pubRes.submissions || [];
    }

    return (
        <StudentTaskDetailsClient
            task={taskRes.task}
            initialSubmission={submissionRes.submission}
            userId={userId}
            publicSubmissions={publicSubmissions}
        />
    );
}

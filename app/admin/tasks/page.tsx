import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAllAdminTasks, getAllAdminSubmissions, getAdminGroups } from "../actions";
import { TasksClient } from "./tasks-client";

export default async function AdminTasksPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const [tasksRes, submissionsRes, groupsRes] = await Promise.all([
        getAllAdminTasks(),
        getAllAdminSubmissions(),
        getAdminGroups()
    ]);

    return (
        <TasksClient
            initialTasks={tasksRes.tasks || []}
            initialSubmissions={submissionsRes.submissions || []}
            initialGroups={groupsRes.groups || []}
        />
    );
}

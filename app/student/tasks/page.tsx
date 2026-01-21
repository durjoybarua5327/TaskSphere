import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getStudentTasks, getStudentSubmissions } from "@/app/admin/actions";
import { getStudentGroupsData } from "@/app/student/groups/actions";
import { StudentTasksClient } from "./StudentTasksClient";

export default async function StudentTasksPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const [tasksRes, submissionsRes, groupsRes] = await Promise.all([
        getStudentTasks(),
        getStudentSubmissions(),
        getStudentGroupsData()
    ]);

    // Filter groups only for those student is a member of
    const myGroupIds = (groupsRes.myGroupIds || []) as string[];
    const myGroups = (groupsRes.groups || []).filter((g: any) =>
        myGroupIds.includes(g.id)
    );

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-12 pb-24">
            <div className="max-w-7xl mx-auto">
                <StudentTasksClient
                    initialTasks={(tasksRes.tasks as any) || []}
                    initialSubmissions={(submissionsRes.submissions as any) || []}
                    initialGroups={myGroups}
                />
            </div>
        </div>
    );
}

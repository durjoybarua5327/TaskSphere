import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { getGroupDetails, getGroupMembers, getTasks } from "@/app/admin/actions";
import { StudentGroupDetailsClient } from "./client";
import { notFound, redirect } from "next/navigation";
import { getStudentGroupsData } from "../actions";

export const metadata = {
    title: "Group Details | TaskSphere",
    description: "View group members and tasks",
};

export default async function StudentViewGroupPage({ params }: { params: Promise<{ groupId: string }> }) {
    const resolvedParams = await params;
    const { groupId } = resolvedParams;
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    // Check if user is a member of this group
    const groupsData = await getStudentGroupsData();
    const isMember = groupsData.myGroupIds.includes(groupId);

    if (!isMember) {
        // If not a member, maybe they can't see the details? 
        // Or they see limited info. For now, let's redirect to groups list if not member.
        redirect("/student/groups");
    }

    const [groupRes, membersRes, tasksRes] = await Promise.all([
        getGroupDetails(groupId),
        getGroupMembers(groupId),
        getTasks(groupId)
    ]);

    if (groupRes.error || !groupRes.group) {
        notFound();
    }

    // Transform tasks
    const tasksWithGroup = tasksRes.tasks?.map((t: any) => ({
        ...t,
        group: { name: groupRes.group.name },
        group_id: groupId
    })) || [];

    return (
        <StudentGroupDetailsClient
            initialGroup={groupRes.group}
            initialMembers={membersRes.members || []}
            initialTasks={tasksWithGroup}
            currentUserId={userId}
        />
    );
}

import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { getGroupDetails, getGroupMembers, getTasks, getGroupJoinRequests } from "../../actions";
import { GroupDetailsClient } from "./client";
import { notFound } from "next/navigation";

export const metadata = {
    title: "Group Details | Admin Console",
    description: "Manage group members, tasks, and settings",
};

export default async function ViewGroupPage({ params }: { params: { groupId: string } }) {
    const resolvedParams = await params;
    const { groupId } = resolvedParams;

    const [groupRes, membersRes, tasksRes, requestsRes] = await Promise.all([
        getGroupDetails(groupId),
        getGroupMembers(groupId),
        getTasks(groupId),
        getGroupJoinRequests(groupId)
    ]);

    if (groupRes.error || !groupRes.group) {
        notFound();
    }

    // Transform tasks to include group name for consistency with shared components if needed,
    // though here we know the group.
    const tasksWithGroup = tasksRes.tasks?.map((t: any) => ({
        ...t,
        group: { name: groupRes.group.name },
        group_id: groupId
    })) || [];

    const { userId } = await auth();

    return (
        <GroupDetailsClient
            initialGroup={groupRes.group}
            initialMembers={membersRes.members || []}
            initialTasks={tasksWithGroup}
            initialRequests={requestsRes.requests || []}
            currentUserId={userId || ""}
        />
    );
}

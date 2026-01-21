import { LiveMessagesClient } from "@/app/admin/messages/LiveMessagesClient";
import { getStudentGroups } from "@/app/student/actions";

export default async function StudentMessagesPage() {
    const { groups } = await getStudentGroups();

    return (
        <LiveMessagesClient initialGroups={groups || []} />
    );
}

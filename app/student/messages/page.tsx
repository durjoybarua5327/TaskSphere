import { LiveMessagesClient } from "@/app/admin/messages/LiveMessagesClient";
import { getStudentGroups } from "@/app/student/actions";
import { getSuperAdmin } from "@/app/direct-messages/actions";

export default async function StudentMessagesPage() {
    const { groups } = await getStudentGroups();
    const superAdmin = await getSuperAdmin();

    return (
        <LiveMessagesClient initialGroups={groups || []} superAdmin={superAdmin} />
    );
}

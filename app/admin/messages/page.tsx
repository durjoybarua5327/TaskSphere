import { LiveMessagesClient } from "./LiveMessagesClient";
import { getAdminGroups } from "../actions";
import { getSuperAdmin } from "@/app/direct-messages/actions";

export default async function MessagesPage() {
    const { groups } = await getAdminGroups();
    const superAdmin = await getSuperAdmin();

    return (
        <LiveMessagesClient initialGroups={groups || []} superAdmin={superAdmin} profileBasePath="/admin/profile" />
    );
}

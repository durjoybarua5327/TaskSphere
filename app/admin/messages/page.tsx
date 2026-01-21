import { LiveMessagesClient } from "./LiveMessagesClient";
import { getAdminGroups } from "../actions";

export default async function MessagesPage() {
    const { groups } = await getAdminGroups();

    return (
        <LiveMessagesClient initialGroups={groups || []} />
    );
}

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/permissions";
import { getConversations } from "../actions";
import { MessagesClient } from "./messages-client";

export default async function MessagesPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    const isSuperAdminUser = await isSuperAdmin(userId);

    if (!isSuperAdminUser) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-800">
                <h1 className="text-4xl font-bold mb-4">403 Forbidden</h1>
                <p className="text-lg">You do not have permission to access this area.</p>
            </div>
        );
    }

    const result = await getConversations();

    return (
        <MessagesClient
            conversations={result.conversations || []}
            currentUserId={userId}
        />
    );
}

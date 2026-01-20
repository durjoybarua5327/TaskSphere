import { auth, currentUser } from "@clerk/nextjs/server";
import { getGlobalRole } from "@/lib/permissions";
import { NextResponse } from "next/server";

export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ role: null }, { status: 401 });
    }

    try {
        const user = await currentUser();
        const email = user?.emailAddresses[0]?.emailAddress;

        // Pass info to syncUserToSupabase so it can sync the user to Supabase
        if (email) {
            const { syncUserToSupabase } = await import("@/lib/permissions");
            // Fire and forget sync to avoid blocking the response
            syncUserToSupabase(userId, email, {
                name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || undefined,
                imageUrl: user?.imageUrl
            }).catch(e => console.error("Background sync failed", e));
        }

        const role = await getGlobalRole(userId);
        return NextResponse.json({ role });
    } catch (error) {
        console.error("Error in get-role API:", error);
        return NextResponse.json({ error: "Failed to fetch role" }, { status: 500 });
    }
}

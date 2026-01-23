
import { createAdminClient } from "@/lib/supabase-admin";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId: currentUserId } = await auth();
        if (!currentUserId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { userId: otherUserId } = await params;
        if (!otherUserId) {
            return new NextResponse("User ID required", { status: 400 });
        }

        const supabase = createAdminClient();

        // Fetch messages between current user and the specified user
        const { data: messages, error } = await supabase
            .from("messages")
            .select(`
                *,
                sender:sender_id (
                    id,
                    full_name,
                    email,
                    avatar_url,
                    is_super_admin
                )
            `)
            .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Error fetching messages:", error);
            return new NextResponse("Internal Error", { status: 500 });
        }

        return NextResponse.json({ messages: messages || [] });
    } catch (error) {
        console.error("[MESSAGES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

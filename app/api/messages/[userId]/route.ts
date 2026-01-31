
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

        // 1. Fetch direct messages
        const { data: directMessages, error: directError } = await supabase
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

        if (directError) {
            console.error("Error fetching direct messages:", directError);
            return new NextResponse("Internal Error", { status: 500 });
        }

        // 2. Fetch group creation requests for this user
        const { data: groupRequests, error: groupError } = await supabase
            .from("group_creation_messages")
            .select("*")
            .eq("sender_id", otherUserId)
            .order("created_at", { ascending: true });

        if (groupError) {
            console.error("Error fetching group requests:", groupError);
            // Don't fail the whole request if group requests fail
        }

        // 3. Merge and sort
        const formattedDirectMessages = (directMessages || []).map(m => ({
            ...m,
            type: 'direct'
        }));

        const formattedGroupRequests = (groupRequests || []).map(m => ({
            ...m,
            type: 'group_request',
            // Map common fields for sorting
            content: `Group Creation Request: ${m.requested_group_name}`,
            sender: {
                id: m.sender_id,
                full_name: m.sender_name,
                email: m.sender_email,
                avatar_url: null,
                is_super_admin: false
            }
        }));

        const allMessages = [...formattedDirectMessages, ...formattedGroupRequests].sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        return NextResponse.json({ messages: allMessages });
    } catch (error) {
        console.error("[MESSAGES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

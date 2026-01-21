"use server";

import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function sendGroupMessage(groupId: string, content: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", success: false };

    const supabase = createAdminClient();

    // Get group and membership details
    const { data: group } = await supabase
        .from("groups")
        .select("admin_only_chat, top_admin_id")
        .eq("id", groupId)
        .single();

    const { data: membership } = await supabase
        .from("group_members")
        .select("id, role")
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .single();

    if (!membership) {
        return { error: "You are not a member of this group", success: false };
    }

    // Check if admin-only chat is enabled
    if (group?.admin_only_chat) {
        const isAdmin = membership.role === 'admin' || membership.role === 'top_admin' || group.top_admin_id === userId;
        if (!isAdmin) {
            return { error: "Only admins can send messages in this group", success: false };
        }
    }

    // Insert the message
    const { data, error } = await supabase
        .from("group_messages")
        .insert({
            group_id: groupId,
            sender_id: userId,
            content: content.trim()
        })
        .select()
        .single();

    if (error) {
        console.error("Error sending message:", error);
        return { error: error.message, success: false };
    }

    return { success: true, message: data };
}

export async function getGroupMessages(groupId: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", messages: [] };

    const supabase = createAdminClient();

    // Verify user is a member of the group
    const { data: membership } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .single();

    if (!membership) {
        return { error: "You are not a member of this group", messages: [] };
    }

    // Fetch messages with sender details
    const { data, error } = await supabase
        .from("group_messages")
        .select(`
            *,
            sender:sender_id (
                id,
                full_name,
                avatar_url
            )
        `)
        .eq("group_id", groupId)
        .order("created_at", { ascending: true })
        .limit(100); // Load last 100 messages

    if (error) {
        console.error("Error fetching messages:", error);
        return { error: error.message, messages: [] };
    }

    return { messages: data || [] };
}

export async function toggleAdminOnlyChat(groupId: string, adminOnly: boolean) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", success: false };

    const supabase = createAdminClient();

    // Check if user is admin or top admin of the group
    const { data: group } = await supabase
        .from("groups")
        .select("top_admin_id")
        .eq("id", groupId)
        .single();

    const { data: membership } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .single();

    const isAuthorized = group?.top_admin_id === userId ||
        membership?.role === 'admin' ||
        membership?.role === 'top_admin';

    if (!isAuthorized) {
        return { error: "Only admins can change chat permissions", success: false };
    }

    // Update the group setting
    const { error } = await supabase
        .from("groups")
        .update({ admin_only_chat: adminOnly })
        .eq("id", groupId);

    if (error) {
        console.error("Error updating chat permissions:", error);
        return { error: error.message, success: false };
    }

    return { success: true };
}

export async function deleteGroupMessage(messageId: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", success: false };

    const supabase = createAdminClient();

    // Get the message to verify ownership
    const { data: message } = await supabase
        .from("group_messages")
        .select("sender_id, group_id")
        .eq("id", messageId)
        .single();

    if (!message) {
        return { error: "Message not found", success: false };
    }

    // Only the sender can delete their own message
    if (message.sender_id !== userId) {
        return { error: "You can only delete your own messages", success: false };
    }

    // Delete the message
    const { error } = await supabase
        .from("group_messages")
        .delete()
        .eq("id", messageId);

    if (error) {
        console.error("Error deleting message:", error);
        return { error: error.message, success: false };
    }

    return { success: true };
}


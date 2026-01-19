"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase-server";
import { isSuperAdmin } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function approveRequest(messageId: string, adminResponse: string) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    const isSuper = await isSuperAdmin(userId);
    if (!isSuper) {
        throw new Error("Only super admins can approve requests");
    }

    const supabase = await createClient();

    // Get the message details
    const { data: message, error: messageError } = await supabase
        .from("group_creation_messages")
        .select("*")
        .eq("id", messageId)
        .single();

    if (messageError || !message) {
        throw new Error("Message not found");
    }

    // Create the group
    const { data: newGroup, error: groupError } = await supabase
        .from("groups")
        .insert({
            name: message.requested_group_name,
            description: message.group_description || `Group created from request by ${message.sender_name}`,
        })
        .select()
        .single();

    if (groupError || !newGroup) {
        console.error("Error creating group:", groupError);
        throw new Error("Failed to create group");
    }

    // Get the user to make them top admin
    const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("email", message.sender_email)
        .single();

    if (userData) {
        // Make the requester the top admin of the group
        await supabase
            .from("group_members")
            .insert({
                group_id: newGroup.id,
                user_id: userData.id,
                role: "top_admin",
            });

        // Update the group's top_admin_id
        await supabase
            .from("groups")
            .update({ top_admin_id: userData.id })
            .eq("id", newGroup.id);
    }

    // Update the message status
    const { error: updateError } = await supabase
        .from("group_creation_messages")
        .update({
            status: "approved",
            admin_response: adminResponse,
            responded_at: new Date().toISOString(),
            created_group_id: newGroup.id,
        })
        .eq("id", messageId);

    if (updateError) {
        console.error("Error updating message:", updateError);
        throw new Error("Failed to update message status");
    }

    revalidatePath("/superadmin/messages");
    return { success: true, groupId: newGroup.id };
}

export async function rejectRequest(messageId: string, adminResponse: string) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    const isSuper = await isSuperAdmin(userId);
    if (!isSuper) {
        throw new Error("Only super admins can reject requests");
    }

    const supabase = await createClient();

    const { error } = await supabase
        .from("group_creation_messages")
        .update({
            status: "rejected",
            admin_response: adminResponse,
            responded_at: new Date().toISOString(),
        })
        .eq("id", messageId);

    if (error) {
        console.error("Error rejecting request:", error);
        throw new Error("Failed to reject request");
    }

    revalidatePath("/superadmin/messages");
    return { success: true };
}

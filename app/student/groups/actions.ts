"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function createGroup(data: {
    name: string;
    instituteName: string;
    department: string;
    groupId?: string;
    purpose: string;
}) {
    const { userId } = await auth();

    if (!userId) {
        return { error: "Not authenticated", success: false };
    }

    const supabase = createAdminClient();

    // Verify Super Admin
    const { data: user } = await supabase
        .from("users")
        .select("is_super_admin")
        .eq("id", userId)
        .single();

    if (!user?.is_super_admin) {
        return { error: "Unauthorized: Only Super Admins can create groups.", success: false };
    }

    // Create the group
    const { data: newGroup, error: groupError } = await supabase
        .from("groups")
        .insert({
            name: data.name,
            institute_name: data.instituteName,
            department: data.department,
            description: data.purpose,
            top_admin_id: userId,
        })
        .select()
        .single();

    if (groupError || !newGroup) {
        console.error("Error creating group:", groupError);
        return { error: "Failed to create group", success: false };
    }

    // Add creator as top admin member
    const { error: memberError } = await supabase
        .from("group_members")
        .insert({
            group_id: newGroup.id,
            user_id: userId,
            role: "top_admin",
        });

    if (memberError) {
        console.error("Error adding creator as member:", memberError);
        return { error: "Failed to add you to the group", success: false };
    }

    revalidatePath("/student/groups");
    return { success: true, groupId: newGroup.id };
}

export async function joinGroup(groupId: string, userId: string) {
    const { userId: authUserId } = await auth();

    if (!authUserId || authUserId !== userId) {
        return { error: "Unauthorized", success: false };
    }

    const supabase = await createClient();

    const { error } = await supabase
        .from("group_members")
        .insert({
            group_id: groupId,
            user_id: userId,
            role: "student",
        });

    if (error) {
        console.error("Error joining group:", error);
        return { error: "Failed to join group", success: false };
    }

    revalidatePath("/student/groups");
    return { success: true };
}

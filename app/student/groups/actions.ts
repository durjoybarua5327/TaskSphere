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

    const supabase = createAdminClient();

    // Check if already a member
    const { data: existingMember } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .single();

    if (existingMember) {
        return { success: true, message: "Already a member" };
    }

    // Check if already requested
    const { data: existingRequest } = await supabase
        .from("group_requests")
        .select("id")
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .eq("status", "pending")
        .single();

    if (existingRequest) {
        return { success: true, message: "Request already pending" };
    }

    const { error } = await supabase
        .from("group_requests")
        .insert({
            group_id: groupId,
            user_id: userId,
            status: "pending",
        });

    if (error) {
        console.error("Error requesting to join group:", error);
        return { error: "Failed to send join request", success: false };
    }

    revalidatePath("/student/groups");
    return { success: true, message: "Request sent" };
}

export async function withdrawJoinRequest(groupId: string, userId: string) {
    const { userId: authUserId } = await auth();

    if (!authUserId || authUserId !== userId) {
        return { error: "Unauthorized", success: false };
    }

    const supabase = createAdminClient();

    const { error } = await supabase
        .from("group_requests")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .eq("status", "pending");

    if (error) {
        console.error("Error withdrawing join request:", error);
        return { error: "Failed to withdraw request", success: false };
    }

    revalidatePath("/student/groups");
    return { success: true };
}

export async function getStudentGroupsData() {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", groups: [], myGroupIds: [], pendingGroupIds: [] };

    const supabase = createAdminClient();

    // 1. Fetch all groups
    const { data: allGroups, error: groupsError } = await supabase
        .from("groups")
        .select(`
            *,
            top_admin:top_admin_id (
                id,
                full_name,
                email,
                avatar_url
            ),
            group_members(count)
        `)
        .order("created_at", { ascending: false });

    if (groupsError) {
        console.error("Error fetching groups:", groupsError);
        return { error: "Failed to fetch groups", groups: [], myGroupIds: [], pendingGroupIds: [] };
    }

    // 2. Fetch user's memberships
    const { data: memberships } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", userId);

    const myGroupIds = memberships?.map(m => m.group_id) || [];

    // 3. Fetch user's pending requests
    const { data: requests } = await supabase
        .from("group_requests")
        .select("group_id")
        .eq("user_id", userId)
        .eq("status", "pending");

    const pendingGroupIds = requests?.map(r => r.group_id) || [];

    // 4. Check user status for profile completion and super admin
    const { data: userData } = await supabase
        .from("users")
        .select("is_super_admin, full_name, institute_name")
        .eq("id", userId)
        .single();

    return {
        groups: allGroups || [],
        myGroupIds,
        pendingGroupIds,
        isSuperAdmin: !!userData?.is_super_admin,
        isProfileComplete: !!(userData?.full_name && userData?.institute_name),
        userId
    };
}

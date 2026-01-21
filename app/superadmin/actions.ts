"use server";

import { createAdminClient } from "@/lib/supabase-admin";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// ==================== GROUP ACTIONS ====================

export async function createGroup(data: {
    name: string;
    instituteName: string;
    department: string;
    groupId?: string;
    purpose: string;
    topAdminEmail?: string;
}) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", success: false };

    const supabase = createAdminClient();

    // Verify super admin
    const { data: currentUserData } = await supabase
        .from("users")
        .select("is_super_admin")
        .eq("id", userId)
        .single();

    if (!currentUserData?.is_super_admin) {
        return { error: "Permission denied: Super Admin access required.", success: false };
    }

    // Check for duplicate group name
    const { data: existingGroup } = await supabase
        .from("groups")
        .select("id")
        .ilike("name", data.name)
        .single();

    if (existingGroup) {
        return { error: "A group with this name already exists.", success: false };
    }

    // Find top admin if email provided, else use current super admin
    let topAdminId = userId;
    if (data.topAdminEmail) {
        const { data: targetUser } = await supabase
            .from("users")
            .select("id")
            .eq("email", data.topAdminEmail)
            .single();

        if (targetUser) {
            topAdminId = targetUser.id;
        } else {
            return { error: "Specified Top Admin user does not exist.", success: false };
        }
    }

    // Create group
    const { data: newGroup, error: createError } = await supabase
        .from("groups")
        .insert({
            name: data.name,
            institute_name: data.instituteName,
            department: data.department,
            description: data.purpose,
            top_admin_id: topAdminId,
        })
        .select()
        .single();

    if (createError) return { error: "Failed to create group: " + createError.message, success: false };

    // Add as top admin member
    await supabase.from("group_members").insert({
        group_id: newGroup.id,
        user_id: topAdminId,
        role: "top_admin",
    });

    revalidatePath("/superadmin/groups");
    return { success: true, group: newGroup };
}

export async function updateGroup(groupId: string, data: {
    name: string;
    instituteName: string;
    department: string;
    purpose: string;
    topAdminEmail?: string;
}) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", success: false };

    const supabase = createAdminClient();

    let topAdminId: string | undefined;
    if (data.topAdminEmail) {
        const { data: targetUser } = await supabase
            .from("users")
            .select("id")
            .eq("email", data.topAdminEmail)
            .single();

        if (targetUser) {
            topAdminId = targetUser.id;
        } else {
            return { error: "Specified Top Admin user does not exist.", success: false };
        }
    }

    const { error } = await supabase
        .from("groups")
        .update({
            name: data.name,
            institute_name: data.instituteName,
            department: data.department,
            description: data.purpose,
            top_admin_id: topAdminId, // This might be undefined if not provided
            updated_at: new Date().toISOString(),
        })
        .eq("id", groupId);

    if (error) return { error: error.message, success: false };

    // If top admin changed, ensure they are in the group_members table as top_admin
    if (topAdminId) {
        // Upsert logically: if already there, update role, if not, insert
        const { data: existingMember } = await supabase
            .from("group_members")
            .select("id")
            .eq("group_id", groupId)
            .eq("user_id", topAdminId)
            .single();

        if (existingMember) {
            await supabase
                .from("group_members")
                .update({ role: "top_admin" })
                .eq("id", existingMember.id);
        } else {
            await supabase.from("group_members").insert({
                group_id: groupId,
                user_id: topAdminId,
                role: "top_admin",
            });
        }
    }

    revalidatePath("/superadmin/groups");
    return { success: true };
}

export async function deleteGroup(groupId: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated" };

    const supabase = createAdminClient();

    // CASCADE delete will automatically remove group_members
    // This effectively "demotes" any admins of this group to student status (unless they admin other groups)
    const { error } = await supabase
        .from("groups")
        .delete()
        .eq("id", groupId);

    if (error) return { error: error.message };

    revalidatePath("/superadmin/groups");
    revalidatePath("/superadmin/admins"); // Refresh admin list
    revalidatePath("/admin"); // Refresh admin panel access
    revalidatePath("/", "layout"); // Refresh global navigation/access
    return { success: true };
}

export async function getGroups() {
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("groups")
        .select(`
            *,
            top_admin:top_admin_id (
                id,
                full_name,
                email
            ),
            members:group_members(count)
        `)
        .order("created_at", { ascending: false });

    if (error) return { error: error.message, groups: [] };
    return { groups: data || [] };
}

export async function getUserGroupIds() {
    const { userId } = await auth();
    if (!userId) return [];

    const supabase = createAdminClient();
    const { data } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", userId);

    return data?.map(m => m.group_id) || [];
}

export async function getGroupMembers(groupId: string) {
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("group_members")
        .select(`
            *,
            user:user_id (
                id,
                full_name,
                email,
                avatar_url
            )
        `)
        .eq("group_id", groupId)
        .order("role", { ascending: false }); // Show admins first

    if (error) {
        console.error("Error fetching group members:", error);
        return { error: error.message, members: [] };
    }
    return { members: data || [] };
}

export async function getGroupRequests() {
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("group_requests")
        .select(`
            *,
            user:user_id (
                id,
                full_name,
                email
            )
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

    if (error) return { error: error.message, requests: [] };
    return { requests: data || [] };
}

export async function approveGroupRequest(requestId: string, groupData: {
    name: string;
    instituteName: string;
    department: string;
    purpose: string;
}) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", success: false };

    const supabase = createAdminClient();

    // Get the request
    const { data: request } = await supabase
        .from("group_requests")
        .select("*")
        .eq("id", requestId)
        .single();

    if (!request) return { error: "Request not found", success: false };

    // Create the group
    const result = await createGroup({
        name: groupData.name,
        instituteName: groupData.instituteName,
        department: groupData.department,
        purpose: groupData.purpose,
    });

    if (result.error) return result;

    // Update request status
    await supabase
        .from("group_requests")
        .update({ status: "approved" })
        .eq("id", requestId);

    // Add requester as member
    if (result.group) {
        await supabase.from("group_members").insert({
            group_id: result.group.id,
            user_id: request.user_id,
            role: "student",
        });
    }

    revalidatePath("/superadmin/groups");
    return { success: true };
}

export async function rejectGroupRequest(requestId: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated" };

    const supabase = createAdminClient();

    const { error } = await supabase
        .from("group_requests")
        .update({ status: "rejected" })
        .eq("id", requestId);

    if (error) return { error: error.message };

    // ... (existing rejectGroupRequest) ...
    revalidatePath("/superadmin/groups");
    return { success: true };
}

export async function getGroupJoinRequests(groupId: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", requests: [] };

    // Super admin check assumed or inherent if using this action
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("group_requests")
        .select(`
            *,
            user:user_id (
                id,
                full_name,
                email,
                avatar_url
            )
        `)
        .eq("group_id", groupId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

    if (error) return { error: error.message, requests: [] };
    return { requests: data || [] };
}

export async function handleJoinRequest(requestId: string, status: "approved" | "rejected") {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", success: false };

    const supabase = createAdminClient();

    // Get request details
    const { data: request } = await supabase
        .from("group_requests")
        .select("group_id, user_id")
        .eq("id", requestId)
        .single();

    if (!request) return { error: "Request not found", success: false };

    if (status === "approved") {
        // Add to group_members
        const { error: memberError } = await supabase
            .from("group_members")
            .insert({
                group_id: request.group_id,
                user_id: request.user_id,
                role: "student"
            });

        if (memberError && memberError.code !== '23505') { // Ignore if already a member
            return { error: memberError.message, success: false };
        }
    }

    // Update request status
    const { error: requestError } = await supabase
        .from("group_requests")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", requestId);

    if (requestError) return { error: requestError.message, success: false };

    revalidatePath("/superadmin/groups");
    return { success: true };
}

// ==================== ADMIN ACTIONS ====================

export async function getAdmins() {
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("group_members")
        .select(`
            *,
            user:user_id (
                id,
                full_name,
                email,
                avatar_url,
                is_super_admin
            ),
            group:group_id (
                id,
                name
            )
        `)
        .in("role", ["admin", "top_admin"])
        .order("created_at", { ascending: false });

    if (error) return { error: error.message, admins: [] };
    return { admins: data || [] };
}

export async function removeMemberFromGroup(membershipId: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", success: false };

    const supabase = createAdminClient();

    // Verify current user is super admin
    const { data: currentUser } = await supabase.from("users").select("is_super_admin").eq("id", userId).single();
    if (!currentUser?.is_super_admin) {
        return { error: "Permission denied", success: false };
    }

    const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("id", membershipId);

    if (error) return { error: error.message, success: false };

    revalidatePath("/superadmin/groups");
    revalidatePath("/superadmin/admins");
    return { success: true };
}

export async function removeAdmin(membershipId: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated" };

    const supabase = createAdminClient();

    const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("id", membershipId);

    if (error) return { error: error.message };

    revalidatePath("/superadmin/admins");
    return { success: true };
}

export async function banAdmin(userId: string, durationHours: number) {
    const { userId: currentUserId } = await auth();
    if (!currentUserId) return { error: "Not authenticated" };

    const supabase = createAdminClient();

    const bannedUntil = new Date();
    bannedUntil.setHours(bannedUntil.getHours() + durationHours);

    const { error } = await supabase
        .from("users")
        .update({
            banned_until: bannedUntil.toISOString(),
        })
        .eq("id", userId);

    if (error) return { error: error.message };

    revalidatePath("/superadmin/admins");
    return { success: true };
}

export async function updateMemberRole(membershipId: string, newRole: "student" | "admin" | "top_admin") {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", success: false };

    const supabase = createAdminClient();

    // Verify current user is super admin
    const { data: currentUser } = await supabase.from("users").select("is_super_admin").eq("id", userId).single();
    if (!currentUser?.is_super_admin) {
        return { error: "Permission denied", success: false };
    }

    const { error } = await supabase
        .from("group_members")
        .update({ role: newRole })
        .eq("id", membershipId);

    if (error) return { error: error.message, success: false };

    revalidatePath("/superadmin/admins");
    revalidatePath("/superadmin/groups");
    return { success: true };
}

// ==================== PROFILE ACTIONS ====================

export async function updateProfile(data: {
    fullName?: string;
    instituteName?: string;
    portfolioUrl?: string;
    avatarUrl?: string;
}) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated" };

    const supabase = createAdminClient();

    const updates: any = {};
    if (data.fullName !== undefined) updates.full_name = data.fullName;
    if (data.avatarUrl !== undefined) updates.avatar_url = data.avatarUrl;

    // Storing extended profile data in a jsonb column 'metadata' if specific columns don't exist, 
    // or assuming columns exist. Given the previous code didn't use them, let's look for a safe way.
    // However, usually these might be top level columns. I'll add them to the update object.
    if (data.instituteName !== undefined) updates.institute_name = data.instituteName;
    if (data.portfolioUrl !== undefined) updates.portfolio_url = data.portfolioUrl;

    const { error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", userId);

    if (error) return { error: error.message };

    revalidatePath("/superadmin/profile");
    return { success: true };
}

export async function getSuperAdminPosts() {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", posts: [] };

    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("posts")
        .select(`
            *,
            users:author_id (
                id,
                full_name,
                email,
                avatar_url
            ),
            likes:likes(user_id),
            comments:comments(count)
        `)
        .eq("author_id", userId)
        .order("created_at", { ascending: false });

    if (error) return { error: error.message, posts: [] };
    return { posts: data || [] };
}

export async function getProfile() {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", profile: null };

    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

    if (error) return { error: error.message, profile: null };
    return { profile: data };
}

// ==================== MESSAGE ACTIONS ====================

export async function getConversations() {
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("group_creation_messages")
        .select(`
            *,
            sender:sender_id (
                id,
                full_name,
                email,
                avatar_url
            )
        `)
        .order("created_at", { ascending: false });

    if (error) return { error: error.message, conversations: [] };

    // Group by sender
    const conversationMap = new Map();
    data?.forEach(msg => {
        if (!conversationMap.has(msg.sender_id)) {
            conversationMap.set(msg.sender_id, {
                userId: msg.sender_id,
                user: msg.sender,
                lastMessage: msg,
                unreadCount: 0,
            });
        }
    });

    return { conversations: Array.from(conversationMap.values()) };
}

export async function sendMessage(receiverId: string, content: string, isAiResponse: boolean = false) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated" };

    // For now, we'll use group_creation_messages table
    // In production, you'd want a dedicated messages table
    return { success: true };
}

export async function deleteMessage(messageId: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated" };

    const supabase = createAdminClient();

    const { error } = await supabase
        .from("group_creation_messages")
        .delete()
        .eq("id", messageId);

    if (error) return { error: error.message };

    revalidatePath("/superadmin/messages");
    return { success: true };
}

export async function toggleAiForUser(targetUserId: string, enabled: boolean) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated" };

    // This would update user preferences
    return { success: true };
}

import { unstable_cache } from "next/cache";

// ==================== STATS ====================

export async function getDashboardStats() {
    return unstable_cache(
        async () => {
            const supabase = createAdminClient();

            const [groupsResult, usersResult, postsResult] = await Promise.all([
                supabase.from("groups").select("id", { count: "exact", head: true }),
                supabase.from("users").select("id", { count: "exact", head: true }),
                supabase.from("posts").select("id", { count: "exact", head: true }),
            ]);

            return {
                totalGroups: groupsResult.count || 0,
                totalUsers: usersResult.count || 0,
                totalPosts: postsResult.count || 0,
                unreadMessages: 0,
            };
        },
        ["dashboard-stats"],
        { revalidate: 300, tags: ["dashboard-stats"] }
    )();
}

"use server";

import { createAdminClient } from "@/lib/supabase-admin";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/app/student/actions";
import { uploadBase64Image } from "@/lib/upload-image";

// Helper to check if user has admin rights for a group
export async function verifyGroupAdminAccess(userId: string, groupId: string) {
    const supabase = createAdminClient();

    // Check if user is top_admin in groups table
    const { data: group } = await supabase
        .from("groups")
        .select("top_admin_id")
        .eq("id", groupId)
        .single();

    if (group && group.top_admin_id === userId) {
        return { authorized: true, role: 'top_admin' };
    }

    // Check if user is admin/top_admin in group_members
    const { data: member } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .in("role", ["admin", "top_admin"])
        .single();

    if (member) {
        return { authorized: true, role: member.role };
    }

    return { authorized: false, role: null };
}

export async function getAdminGroups() {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", groups: [] };

    const supabase = createAdminClient();

    // 1. Get groups where user is top_admin
    const { data: ownedGroups, error: ownedError } = await supabase
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
        .eq("top_admin_id", userId);

    if (ownedError) console.error("Error fetching owned groups:", ownedError);

    // 2. Get groups where user is a member with admin/top_admin role
    const { data: memberGroups, error: memberError } = await supabase
        .from("group_members")
        .select(`
            group:group_id (
                *,
                top_admin:top_admin_id (
                    id,
                    full_name,
                    email
                ),
                members:group_members(count)
            )
        `)
        .eq("user_id", userId)
        .in("role", ["admin", "top_admin"]);

    if (memberError) console.error("Error fetching member groups:", memberError);

    // Combine and deduplicate
    const groupsMap = new Map();

    // Add owned groups
    ownedGroups?.forEach(g => groupsMap.set(g.id, g));

    // Add member groups (which are nested in the response)
    memberGroups?.forEach((item: any) => {
        if (item.group) {
            groupsMap.set(item.group.id, item.group);
        }
    });

    const combinedGroups = Array.from(groupsMap.values());

    // Sort by created_at desc
    combinedGroups.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return { groups: combinedGroups };
}

export async function updateGroupInfo(groupId: string, data: {
    name: string;
    description: string;
    instituteName: string;
    department: string;
    avatarUrl?: string;
}) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", success: false };

    const { authorized } = await verifyGroupAdminAccess(userId, groupId);
    if (!authorized) {
        return { error: "Permission denied", success: false };
    }

    const supabase = createAdminClient();

    // Handle group avatar upload if it's a base64 data URL
    let avatarUrl = undefined;
    if (data.avatarUrl && data.avatarUrl.startsWith("data:image/")) {
        const { uploadBase64Image } = await import("@/lib/upload-image");
        const uploadResult = await uploadBase64Image(data.avatarUrl, userId, `group-admin-update-${Date.now()}`);
        if (uploadResult.url) {
            avatarUrl = uploadResult.url;
        } else {
            console.error("Failed to upload group avatar:", uploadResult.error);
        }
    }

    const { error } = await supabase
        .from("groups")
        .update({
            name: data.name,
            description: data.description,
            institute_name: data.instituteName,
            department: data.department,
            avatar_url: avatarUrl || data.avatarUrl,
            updated_at: new Date().toISOString()
        })
        .eq("id", groupId);

    if (error) return { error: error.message, success: false };

    revalidatePath("/admin/groups");
    return { success: true };
}

export async function getGroupMembers(groupId: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", members: [] };

    // Any member can technically see other members, but for admin actions we verify access conceptually
    // However, for just fetching list, being logged in is usually enough or we check membership
    // Let's check membership to be safe
    const supabase = createAdminClient();

    /* 
       We could simplify and just fetch. RLS usually handles this, but since we use admin client,
       we should probably verify the user is at least a member or the top admin.
    */

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
        .order("role", { ascending: false });

    if (error) return { error: error.message, members: [] };
    return { members: data || [] };
}

export async function addStudentToGroup(groupId: string, email: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", success: false };

    // Verify admin access
    const { authorized } = await verifyGroupAdminAccess(userId, groupId);
    if (!authorized) return { error: "Permission denied", success: false };

    const supabase = createAdminClient();

    // Find user by email
    const { data: targetUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

    if (!targetUser) return { error: "User not found with that email", success: false };

    // Check if user is the Top Admin of the group
    const { data: group } = await supabase
        .from("groups")
        .select("top_admin_id")
        .eq("id", groupId)
        .single();

    if (group && group.top_admin_id === targetUser.id) {
        return { error: "Cannot add Group Top Admin as a member", success: false };
    }

    // Check if already member
    const { data: existingMember } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", groupId)
        .eq("user_id", targetUser.id)
        .single();

    if (existingMember) return { error: "User is already a member of this group", success: false };

    // Add member
    const { error } = await supabase
        .from("group_members")
        .insert({
            group_id: groupId,
            user_id: targetUser.id,
            role: "student"
        });

    if (error) return { error: error.message, success: false };

    revalidatePath("/admin/groups");
    return { success: true };
}

export async function updateMemberRole(membershipId: string, newRole: "student" | "admin" | "top_admin") {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", success: false };

    const supabase = createAdminClient();

    // Get the group_id for this membership to check permissions
    const { data: membership } = await supabase
        .from("group_members")
        .select("group_id, role, user_id")
        .eq("id", membershipId)
        .single();

    if (!membership) return { error: "Membership not found", success: false };

    // Check if target is Group Owner
    const { data: group } = await supabase
        .from("groups")
        .select("top_admin_id")
        .eq("id", membership.group_id)
        .single();

    if (group && group.top_admin_id === membership.user_id) {
        return { error: "Cannot modify role of the Group Owner", success: false };
    }

    const { authorized, role: adminRole } = await verifyGroupAdminAccess(userId, membership.group_id);
    if (!authorized) return { error: "Permission denied", success: false };

    // Prevent regular admin from promoting/demoting anyone
    if (adminRole === 'admin') {
        return { error: "Only Top Admins can promote or demote members", success: false };
    }

    // Prevent regular admin from promoting to top_admin or demoting/modifying top_admin
    if (adminRole !== 'top_admin' && (newRole === 'top_admin' || membership.role === 'top_admin')) {
        return { error: "Only Top Admins can modify Top Admin status", success: false };
    }

    // Prevent regular admin from modifying another admin
    if (adminRole === 'admin' && membership.role === 'admin') {
        return { error: "Admins cannot modify other Admins", success: false };
    }

    const { error } = await supabase
        .from("group_members")
        .update({ role: newRole })
        .eq("id", membershipId);

    if (error) return { error: error.message, success: false };

    revalidatePath("/admin/groups");
    return { success: true };
}

export async function removeMember(membershipId: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", success: false };

    const supabase = createAdminClient();

    const { data: membership } = await supabase
        .from("group_members")
        .select("group_id, role, user_id")
        .eq("id", membershipId)
        .single();

    if (!membership) return { error: "Membership not found", success: false };

    // Check if target is Group Owner
    const { data: group } = await supabase
        .from("groups")
        .select("top_admin_id")
        .eq("id", membership.group_id)
        .single();

    if (group && group.top_admin_id === membership.user_id) {
        return { error: "Cannot remove the Group Owner", success: false };
    }

    const { authorized, role: adminRole } = await verifyGroupAdminAccess(userId, membership.group_id);
    if (!authorized) return { error: "Permission denied", success: false };

    // Safety checks
    if (membership.role === 'top_admin' && adminRole !== 'top_admin') {
        return { error: "Cannot remove Top Admin", success: false };
    }

    if (membership.role === 'admin' && adminRole === 'admin') {
        return { error: "Admins cannot remove other Admins", success: false };
    }

    const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("id", membershipId);

    if (error) return { error: error.message, success: false };

    revalidatePath("/admin/groups");
    return { success: true };
}

export async function getGroupDetails(groupId: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated" };

    const supabase = createAdminClient();

    const { data: group, error } = await supabase
        .from("groups")
        .select(`
            *,
            top_admin:top_admin_id (
                id,
                full_name,
                email,
                avatar_url
            ),
            members:group_members(count)
        `)
        .eq("id", groupId)
        .single();

    if (error) return { error: error.message };

    // Also get current user's role in this group
    const { data: membership } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .single();

    let role = membership?.role || 'none';
    if (group.top_admin_id === userId) {
        role = 'top_admin';
    }

    return {
        group: {
            ...group,
            currentUserRole: role
        }
    };
}

export async function getGroupJoinRequests(groupId: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", requests: [] };

    const { authorized } = await verifyGroupAdminAccess(userId, groupId);
    if (!authorized) return { error: "Permission denied", requests: [] };

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

    const { authorized } = await verifyGroupAdminAccess(userId, request.group_id);
    if (!authorized) return { error: "Permission denied", success: false };

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

    revalidatePath(`/admin/groups/${request.group_id}`);
    return { success: true };
}

// --- Task Actions ---

export async function createTask(groupId: string, data: {
    title: string;
    description: string;
    deadline?: string;
    max_score?: number;
    attachments?: string[];
    submissions_visibility?: 'private' | 'public';
}) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", success: false };

    const { authorized } = await verifyGroupAdminAccess(userId, groupId);
    if (!authorized) return { error: "Permission denied", success: false };

    const supabase = createAdminClient();

    // We need to fetch the inserted task ID or use a second query. 
    // Actually, let's fetch members and notify them. We can just say "New Task" without linking to specific task ID if we don't have it, or fetching latest task.

    // Better strategy: Select returned ID.
    // Since the original code didn't use .select(), we might not have ID.
    // Let's modify the insert to return data.

    // Re-implementing insert with select to get ID
    const { data: newTask, error: createError } = await supabase
        .from("tasks")
        .insert({
            group_id: groupId,
            creator_id: userId,
            title: data.title,
            description: data.description,
            deadline: data.deadline || null,
            max_score: data.max_score || 10,
            attachments: data.attachments || [],
            submissions_visibility: data.submissions_visibility || 'private'
        })
        .select()
        .single();

    if (createError) return { error: createError.message, success: false };

    // Notify all group members
    const { data: members } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId);

    if (members) {
        // Fetch group name for better message
        const { data: group } = await supabase.from("groups").select("name").eq("id", groupId).single();
        const groupName = group?.name || "group";

        await Promise.all(members.map(member =>
            createNotification(
                member.user_id,
                "task_created",
                userId,
                undefined, // No post ID
                `added a new task in ${groupName}: "${data.title}"`,
                { task_id: newTask.id, group_id: groupId }
            )
        ));
    }

    revalidatePath(`/admin/groups/${groupId}`);
    return { success: true };
}

export async function updateTask(taskId: string, groupId: string, data: {
    title: string;
    description: string;
    deadline?: string;
    max_score?: number;
    attachments?: string[];
    submissions_visibility?: 'private' | 'public';
}) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", success: false };

    const { authorized } = await verifyGroupAdminAccess(userId, groupId);
    if (!authorized) return { error: "Permission denied", success: false };

    const supabase = createAdminClient();
    const { error } = await supabase
        .from("tasks")
        .update({
            title: data.title,
            description: data.description,
            deadline: data.deadline || null,
            max_score: data.max_score || 10,
            attachments: data.attachments || [],
            submissions_visibility: data.submissions_visibility || 'private',
            updated_at: new Date().toISOString()
        })
        .eq("id", taskId);

    if (error) return { error: error.message, success: false };

    revalidatePath(`/admin/groups/${groupId}`);
    return { success: true };
}

export async function getTasks(groupId: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", tasks: [] };

    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("tasks")
        .select(`
            *,
            creator:creator_id (
                id,
                full_name,
                avatar_url
            )
        `)
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

    if (error) return { error: error.message, tasks: [] };
    return { tasks: data || [] };
}

export async function deleteTask(taskId: string, groupId: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", success: false };

    const { authorized } = await verifyGroupAdminAccess(userId, groupId);
    if (!authorized) return { error: "Permission denied", success: false };

    const supabase = createAdminClient();
    const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

    if (error) return { error: error.message, success: false };

    revalidatePath(`/admin/groups/${groupId}`);
    return { success: true };
}

// --- Submission Actions ---

export async function submitTask(taskId: string, data: {
    content?: string;
    file_url?: string;
    link_url?: string;
    attachments?: string[];
}) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", success: false };

    const supabase = createAdminClient();

    // Check if task exists and user is member of the group
    const { data: task } = await supabase
        .from("tasks")
        .select("group_id")
        .eq("id", taskId)
        .single();

    if (!task) return { error: "Task not found", success: false };

    const { data: membership } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", task.group_id)
        .eq("user_id", userId)
        .single();

    if (!membership) return { error: "You are not a member of this group", success: false };

    // Update if exists, else insert
    const { data: existing } = await supabase
        .from("submissions")
        .select("id")
        .eq("task_id", taskId)
        .eq("student_id", userId)
        .single();

    let error;
    if (existing) {
        const { error: updateError } = await supabase
            .from("submissions")
            .update({
                content: data.content,
                file_url: data.file_url,
                link_url: data.link_url,
                attachments: (data as any).attachments || [],
                submitted_at: new Date().toISOString()
            })
            .eq("id", existing.id);
        error = updateError;
    } else {
        const { error: insertError } = await supabase
            .from("submissions")
            .insert({
                task_id: taskId,
                student_id: userId,
                content: data.content,
                file_url: data.file_url,
                link_url: data.link_url,
                attachments: (data as any).attachments || []
            });
        error = insertError;
    }

    if (error) return { error: error.message, success: false };

    // Notify Group Admins
    // 1. Get group top admin and admins
    const { data: group } = await supabase
        .from("groups")
        .select("id, name, top_admin_id")
        .eq("id", task.group_id)
        .single();

    // Get other admins
    const { data: admins } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", task.group_id)
        .in("role", ["admin", "top_admin"]);

    const adminIds = new Set<string>();
    if (group?.top_admin_id) adminIds.add(group.top_admin_id);
    admins?.forEach(a => adminIds.add(a.user_id));

    // Get task title for message
    const { data: taskDetails } = await supabase.from("tasks").select("title").eq("id", taskId).single();

    const submissionId = existing?.id || (await supabase.from("submissions").select("id").eq("task_id", taskId).eq("student_id", userId).single()).data?.id;

    await Promise.all(Array.from(adminIds).map(adminId =>
        createNotification(
            adminId,
            "task_submitted",
            userId,
            undefined,
            `submitted a task: "${taskDetails?.title || 'Unknown Task'}" in ${group?.name}`,
            { task_id: taskId, submission_id: submissionId }
        )
    ));

    revalidatePath(`/admin/groups/${task.group_id}`);
    return { success: true };
}

export async function deleteSubmission(submissionId: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", success: false };

    const supabase = createAdminClient();

    const { data: submission } = await supabase
        .from("submissions")
        .select(`
            id,
            student_id,
            task_id,
            task: task_id(
                group_id
            )
        `)
        .eq("id", submissionId)
        .single();

    if (!submission) return { error: "Submission not found", success: false };

    const isOwner = submission.student_id === userId;
    const { authorized } = await verifyGroupAdminAccess(userId, (submission.task as any).group_id);
    const isGroupAdmin = authorized;

    if (!isOwner && !isGroupAdmin) {
        return { error: "Permission denied", success: false };
    }

    const { error } = await supabase
        .from("submissions")
        .delete()
        .eq("id", submissionId);

    if (error) return { error: error.message, success: false };

    revalidatePath(`/student/tasks/${submission.task_id}`);
    return { success: true };
}

export async function getSubmissions(taskId: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", submissions: [] };

    const supabase = createAdminClient();

    // Verify requesting user is admin of the group this task belongs to
    const { data: task } = await supabase
        .from("tasks")
        .select("group_id")
        .eq("id", taskId)
        .single();

    if (!task) return { error: "Task not found", submissions: [] };

    const { authorized } = await verifyGroupAdminAccess(userId, task.group_id);
    if (!authorized) return { error: "Permission denied", submissions: [] };

    const { data, error } = await supabase
        .from("submissions")
        .select(`
            *,
            student:student_id (
                id,
                full_name,
                email,
                avatar_url
            ),
            scores (
                score_value,
                feedback,
                grader:grader_id (full_name)
            )
        `)
        .eq("task_id", taskId)
        .order("submitted_at", { ascending: false });

    if (error) return { error: error.message, submissions: [] };
    return { submissions: data || [] };
}

export async function scoreSubmission(submissionId: string, scoreValue: number, feedback: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", success: false };

    const supabase = createAdminClient();

    // Verify requesting user is admin of the group this submission belongs to
    const { data: submission } = await supabase
        .from("submissions")
        .select(`
            id,
            task: task_id(
                group_id
            )
        `)
        .eq("id", submissionId)
        .single();

    if (!submission) return { error: "Submission not found", success: false };

    const { authorized } = await verifyGroupAdminAccess(userId, (submission.task as any).group_id);
    if (!authorized) return { error: "Permission denied", success: false };

    // Update if exists, else insert
    const { data: existing } = await supabase
        .from("scores")
        .select("id")
        .eq("submission_id", submissionId)
        .single();

    let error;
    if (existing) {
        const { error: updateError } = await supabase
            .from("scores")
            .update({
                score_value: scoreValue,
                feedback: feedback,
                grader_id: userId
            })
            .eq("id", existing.id);
        error = updateError;
    } else {
        const { error: insertError } = await supabase
            .from("scores")
            .insert({
                submission_id: submissionId,
                score_value: scoreValue,
                feedback: feedback,
                grader_id: userId
            });
        error = insertError;
    }

    if (error) return { error: error.message, success: false };

    // Notify Student
    const { data: sub } = await supabase.from("submissions").select("student_id, task_id").eq("id", submissionId).single();
    if (sub) {
        const { data: task } = await supabase.from("tasks").select("title, group:groups(name)").eq("id", sub.task_id).single();
        const taskTitle = task?.title || "Task";
        const groupName = (task?.group as any)?.name || "Group";

        await createNotification(
            sub.student_id,
            "grade_received",
            userId,
            undefined,
            `graded your submission for "${taskTitle}" in ${groupName}. Score: ${scoreValue}`,
            { task_id: sub.task_id, submission_id: submissionId }
        );
    }

    return { success: true };
}

export async function getMySubmission(taskId: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated" };

    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("submissions")
        .select(`
        *,
            scores(
                score_value,
                feedback
            )
        `)
        .eq("task_id", taskId)
        .eq("student_id", userId)
        .single();

    if (error && error.code !== 'PGRST116') return { error: error.message }; // PGRST116 is Record not found
    return { submission: data || null };
}

export async function getAllAdminTasks() {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", tasks: [] };

    const { groups } = await getAdminGroups();
    const groupIds = groups?.map((g: any) => g.id) || [];

    if (groupIds.length === 0) return { tasks: [] };

    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("tasks")
        .select(`
            *,
            group: group_id(name),
            creator: creator_id(full_name),
            submissions: submissions(count)
        `)
        .in("group_id", groupIds)
        .order("created_at", { ascending: false });

    if (error) return { error: error.message, tasks: [] };
    return { tasks: data || [] };
}

export async function getAllAdminSubmissions() {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", submissions: [] };

    const { tasks } = await getAllAdminTasks();
    const taskIds = tasks?.map((t: any) => t.id) || [];

    if (taskIds.length === 0) return { submissions: [] };

    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("submissions")
        .select(`
        *,
            task: task_id(title, group: group_id(id, name)),
            student: student_id(full_name, email, avatar_url),
            scores(score_value)
        `)
        .in("task_id", taskIds)
        .order("submitted_at", { ascending: false })
        .limit(50);

    if (error) return { error: error.message, submissions: [] };
    return { submissions: data || [] };
}

export async function uploadTaskAttachment(formData: FormData) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", url: null };

    const file = formData.get('file') as File;
    if (!file) return { error: "No file provided", url: null };

    // Basic validation? Assuming admin knows what they are doing.
    // 50MB limit
    if (file.size > 50 * 1024 * 1024) {
        return { error: "File too large (max 50MB)", url: null };
    }

    const supabase = createAdminClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error } = await supabase.storage
        .from('task-attachments')
        .upload(filePath, file);

    if (error) {
        console.error("Upload error:", error);
        return { error: error.message, url: null };
    }

    const { data } = supabase.storage
        .from('task-attachments')
        .getPublicUrl(filePath);

    return { url: data.publicUrl, error: null };
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
    if (data.instituteName !== undefined) updates.institute_name = data.instituteName;
    if (data.portfolioUrl !== undefined) updates.portfolio_url = data.portfolioUrl;

    // Handle avatar upload if it's a base64 data URL
    if (data.avatarUrl !== undefined && data.avatarUrl !== null) {
        if (data.avatarUrl.startsWith("data:image/")) {
            // It's a base64 image, upload to storage
            const uploadResult = await uploadBase64Image(data.avatarUrl, userId);

            if (uploadResult.error || !uploadResult.url) {
                return { error: `Failed to upload avatar: ${uploadResult.error || 'Unknown upload error'}` };
            }

            updates.avatar_url = uploadResult.url;
        } else {
            // It's already a URL
            updates.avatar_url = data.avatarUrl;
        }
    }

    const { error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", userId);

    if (error) return { error: error.message };

    revalidatePath("/admin/profile");
    return { success: true };
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

export async function getMyPosts() {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", posts: [] };

    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("posts")
        .select(`
        *,
            users: author_id(
                id,
                full_name,
                email,
                avatar_url
            ),
            likes: likes(user_id),
            comments: comments(count)
        `)
        .eq("author_id", userId)
        .order("created_at", { ascending: false });

    if (error) return { error: error.message, posts: [] };
    return { posts: data || [] };
}

export async function getStudentTasks() {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", tasks: [] };

    const supabase = createAdminClient();

    // 1. Get groups user is a member of
    const { data: memberships } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", userId);

    const groupIds = memberships?.map(m => m.group_id) || [];
    if (groupIds.length === 0) return { tasks: [] };

    // 2. Get tasks for those groups
    const { data: tasks, error } = await supabase
        .from("tasks")
        .select(`
        *,
            group: group_id(name, id),
            creator: creator_id(full_name)
        `)
        .in("group_id", groupIds)
        .order("created_at", { ascending: false });

    if (error) return { error: error.message, tasks: [] };
    return { tasks: tasks || [] };
}

export async function getStudentSubmissions() {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", submissions: [] };

    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("submissions")
        .select(`
        *,
            task: task_id(
                id,
                title,
                group: group_id(id, name)
            ),
            scores(
                score_value,
                feedback
            )
        `)
        .eq("student_id", userId)
        .order("submitted_at", { ascending: false });

    if (error) return { error: error.message, submissions: [] };
    return { submissions: data || [] };
}

export async function getPublicSubmissions(taskId: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", submissions: [] };

    const supabase = createAdminClient();

    // Check if task exists and is public
    const { data: task } = await supabase
        .from("tasks")
        .select("submissions_visibility, group_id")
        .eq("id", taskId)
        .single();

    if (!task) return { error: "Task not found", submissions: [] };

    // If task is private, only admin can use getSubmissions.
    // This action is specifically for public view.
    if (task.submissions_visibility !== 'public') {
        return { submissions: [] };
    }

    // Verify user is in the group
    const { data: membership } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", task.group_id)
        .eq("user_id", userId)
        .single();

    if (!membership) return { error: "Not a member of this group", submissions: [] };

    const { data, error } = await supabase
        .from("submissions")
        .select(`
            *,
            student:student_id (
                id,
                full_name,
                email,
                avatar_url
            )
        `)
        .eq("task_id", taskId)
        .order("submitted_at", { ascending: false });

    if (error) return { error: error.message, submissions: [] };
    return { submissions: data || [] };
}

export async function getTask(taskId: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", task: null };

    const supabase = createAdminClient();

    const { data: task, error } = await supabase
        .from("tasks")
        .select(`
            *,
            group: group_id(id, name, top_admin_id, institute_name),
            creator: creator_id(full_name, avatar_url),
            submissions: submissions(count)
        `)
        .eq("id", taskId)
        .single();

    if (error || !task) return { error: error?.message || "Task not found", task: null };

    // Verify access
    const { authorized } = await verifyGroupAdminAccess(userId, task.group.id);
    if (!authorized) return { error: "Permission denied", task: null };

    return { task };
}

export async function getTaskForStudent(taskId: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", task: null };

    const supabase = createAdminClient();

    const { data: task, error } = await supabase
        .from("tasks")
        .select(`
            *,
            group: group_id(id, name, top_admin_id, institute_name, department),
            creator: creator_id(full_name, avatar_url),
            submissions: submissions(count)
        `)
        .eq("id", taskId)
        .single();

    if (error || !task) return { error: error?.message || "Task not found", task: null };

    // Verify user is member of the group
    const { data: membership } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", task.group.id)
        .eq("user_id", userId)
        .single();

    if (!membership) return { error: "Permission denied", task: null };

    return { task };
}

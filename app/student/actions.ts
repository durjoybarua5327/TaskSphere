"use server";


import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { uploadBase64Image } from "@/lib/upload-image";

export async function requestJoinGroup(groupId: string, metadata?: any) {
    const user = await currentUser();
    if (!user) return { error: "Not authenticated" };

    const supabase = createAdminClient();

    if (metadata) {
        console.log("Join Request Metadata:", metadata);
    }

    const { error } = await supabase
        .from("group_requests")
        .insert({
            group_id: groupId,
            user_id: user.id,
            status: "pending"
        });

    if (error) {
        if (error.code === '23505') return { error: "Request already sent" }; // Unique violation
        return { error: error.message };
    }

    revalidatePath("/student");
    revalidatePath("/student/groups");
    return { success: true };
}

export async function createPost({ title, content, tags, images }: {
    title?: string;
    content: string;
    tags?: string[];
    images?: string[];
}) {
    const user = await currentUser();
    if (!user) return { error: "Not authenticated", success: false };

    const supabase = createAdminClient();

    // Ensure user exists in our DB to maintain reference integrity
    const { syncUserToSupabase } = await import("@/lib/permissions");
    const email = user.emailAddresses[0]?.emailAddress;
    if (email) {
        await syncUserToSupabase(user.id, email, {
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            imageUrl: user.imageUrl
        });
    }

    // Handle post images upload if they are base64
    const uploadedImages: string[] = [];
    if (images && images.length > 0) {
        for (const [index, img] of images.entries()) {
            if (img.startsWith("data:image/")) {
                const { uploadBase64Image } = await import("@/lib/upload-image");
                const uploadResult = await uploadBase64Image(img, user.id, `post-${Date.now()}-${index}`);
                if (uploadResult.url) {
                    uploadedImages.push(uploadResult.url);
                } else {
                    console.error("Failed to upload post image:", uploadResult.error);
                }
            } else {
                uploadedImages.push(img);
            }
        }
    }

    // Create the post
    const { error } = await supabase
        .from("posts")
        .insert({
            author_id: user.id,
            title: title || null,
            content: content,
            tags: tags || [],
            images: uploadedImages,
            visibility: "public",
        });

    if (error) {
        console.error("Error creating post in Supabase:", error);
        return { error: `Failed to create post: ${error.message}`, success: false };
    }

    revalidatePath("/student");
    revalidatePath("/superadmin");
    return { success: true };
}

export async function updatePost({ id, title, content, tags, images }: {
    id: string;
    title?: string;
    content: string;
    tags?: string[];
    images?: string[];
}) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", success: false };

    const supabase = createAdminClient();

    // Check ownership or superadmin
    const { data: user } = await supabase.from("users").select("is_super_admin").eq("id", userId).single();
    const { data: post } = await supabase.from("posts").select("author_id").eq("id", id).single();

    if (!post) return { error: "Post not found", success: false };

    if (post.author_id !== userId && !user?.is_super_admin) {
        return { error: "Unauthorized", success: false };
    }

    // Handle post images upload if they are base64
    const uploadedImages: string[] = [];
    if (images && images.length > 0) {
        for (const [index, img] of images.entries()) {
            if (img.startsWith("data:image/")) {
                const { uploadBase64Image } = await import("@/lib/upload-image");
                const uploadResult = await uploadBase64Image(img, userId, `post-update-${Date.now()}-${index}`);
                if (uploadResult.url) {
                    uploadedImages.push(uploadResult.url);
                } else {
                    console.error("Failed to upload post image:", uploadResult.error);
                }
            } else {
                uploadedImages.push(img);
            }
        }
    }

    const { error } = await supabase
        .from("posts")
        .update({
            title: title || null,
            content: content,
            tags: tags || [],
            images: uploadedImages,
        })
        .eq("id", id);

    if (error) {
        console.error("Error updating post:", error);
        return { error: `Failed to update post: ${error.message}`, success: false };
    }

    revalidatePath("/student");
    revalidatePath("/superadmin");
    return { success: true };
}

export async function createNotification(
    userId: string,
    type: "like" | "comment" | "system" | "task_created" | "grade_received" | "task_submitted",
    actorId: string,
    postId?: string,
    message?: string,
    metadata?: any
) {
    const supabase = createAdminClient();

    // Don't notify if user interacts with their own content
    if (userId === actorId) return;

    let dbType = type;
    let dbMessage = message;

    // Handle extended types for Schema Compatibility
    // Schema only supports: 'like', 'comment', 'system' and NO metadata column
    if (["task_created", "grade_received", "task_submitted"].includes(type)) {
        dbType = "system";
        const payload = JSON.stringify({ original_type: type, ...metadata });
        // Encode payload into message
        dbMessage = `$$JSON:${payload}$$${message}`;
    }

    const { error } = await supabase.from("notifications").insert({
        user_id: userId,
        actor_id: actorId,
        type: dbType as "like" | "comment" | "system",
        post_id: postId || null,
        message: dbMessage,
        is_read: false
    });

    if (error) {
        console.error("Error creating notification:", error);
    }
}

export async function getNotifications() {
    const { userId } = await auth();
    if (!userId) return [];

    const supabase = createAdminClient();

    // Fetch notifications with actor details
    const { data, error } = await supabase
        .from("notifications")
        .select(`
            *,
            actor:actor_id (
                full_name,
                avatar_url
            ),
            post:post_id (
                id,
                title
            )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

    if (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }

    return data || [];
}

export async function markNotificationAsRead(notificationId: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated" };

    const supabase = createAdminClient();
    await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("user_id", userId);

    revalidatePath("/superadmin");
    return { success: true };
}

export async function markAllNotificationsAsRead() {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated" };

    const supabase = createAdminClient();
    await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);

    revalidatePath("/superadmin");
    return { success: true };
}

export async function likePost(postId: string, userId: string) {
    const { userId: authUserId } = await auth();

    if (!authUserId || authUserId !== userId) {
        throw new Error("Unauthorized");
    }

    const supabase = createAdminClient();

    const { error } = await supabase
        .from("likes")
        .insert({
            post_id: postId,
            user_id: userId,
        });

    if (error) {
        console.error("Error liking post:", error);
        throw new Error("Failed to like post");
    }

    // Fetch post to get author ID for notification
    const { data: post } = await supabase.from("posts").select("author_id").eq("id", postId).single();
    if (post && post.author_id) {
        await createNotification(post.author_id, "like", authUserId, postId, "liked your post");
    }

    revalidatePath("/student");
    revalidatePath("/superadmin");
    return { success: true };
}

export async function unlikePost(postId: string, userId: string) {
    const { userId: authUserId } = await auth();

    if (!authUserId || authUserId !== userId) {
        throw new Error("Unauthorized");
    }

    const supabase = createAdminClient();

    const { error } = await supabase
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);

    if (error) {
        console.error("Error unliking post:", error);
        throw new Error("Failed to unlike post");
    }

    revalidatePath("/student");
    revalidatePath("/superadmin");
    return { success: true };
}

export async function deletePost(postId: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", success: false };

    const supabase = createAdminClient();

    // Check ownership or superadmin
    const { data: user } = await supabase.from("users").select("is_super_admin").eq("id", userId).single();
    const { data: post } = await supabase.from("posts").select("author_id").eq("id", postId).single();

    if (!post) return { error: "Post not found", success: false };

    if (post.author_id !== userId && !user?.is_super_admin) {
        return { error: "Unauthorized", success: false };
    }

    const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId);

    if (error) {
        return { error: error.message, success: false };
    }

    revalidatePath("/student");
    revalidatePath("/superadmin");
    return { success: true };
}

export async function addComment(postId: string, content: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", success: false };

    const supabase = createAdminClient();

    const { error } = await supabase
        .from("comments")
        .insert({
            post_id: postId,
            user_id: userId,
            content: content
        });

    if (error) {
        console.error("Error adding comment:", error);
        return { error: error.message, success: false };
    }

    // Notify post author
    const { data: post } = await supabase.from("posts").select("author_id").eq("id", postId).single();
    if (post && post.author_id) {
        await createNotification(post.author_id, "comment", userId, postId, "commented on your post");
    }

    revalidatePath("/student");
    revalidatePath("/superadmin");
    return { success: true };
}

export async function updateComment(commentId: string, content: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", success: false };

    const supabase = createAdminClient();

    // Verify ownership
    const { data: comment } = await supabase
        .from("comments")
        .select("user_id")
        .eq("id", commentId)
        .single();

    if (!comment || comment.user_id !== userId) {
        return { error: "Unauthorized", success: false };
    }

    const { error } = await supabase
        .from("comments")
        .update({ content })
        .eq("id", commentId);

    if (error) {
        return { error: error.message, success: false };
    }

    revalidatePath("/student");
    revalidatePath("/superadmin");
    return { success: true };
}

export async function deleteComment(commentId: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", success: false };

    const supabase = createAdminClient();

    const { data: user } = await supabase.from("users").select("is_super_admin").eq("id", userId).single();
    const { data: comment } = await supabase.from("comments").select("user_id").eq("id", commentId).single();

    if (!comment) return { error: "Comment not found", success: false };

    // Allow author or super admin to delete
    if (comment.user_id !== userId && !user?.is_super_admin) {
        return { error: "Unauthorized", success: false };
    }

    const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

    if (error) {
        return { error: error.message, success: false };
    }

    revalidatePath("/student");
    revalidatePath("/superadmin");
    return { success: true };
}

export async function getComments(postId: string) {
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("comments")
        .select(`
            *,
            user:user_id (
                id,
                full_name,
                avatar_url
            )
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Error fetching comments:", error);
        return [];
    }

    return data || [];
}

export async function updateStudentProfile(data: {
    fullName?: string;
    instituteName?: string;
    portfolioUrl?: string;
    avatarUrl?: string;
}) {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated" };

    console.log("[updateStudentProfile] Starting update for user:", userId);
    console.log("[updateStudentProfile] Data received:", { ...data, avatarUrl: data.avatarUrl?.substring(0, 50) + "..." });

    const supabase = createAdminClient();

    const updates: any = {};
    if (data.fullName !== undefined) updates.full_name = data.fullName;
    if (data.instituteName !== undefined) updates.institute_name = data.instituteName;
    if (data.portfolioUrl !== undefined) updates.portfolio_url = data.portfolioUrl;

    // Handle avatar upload if it's a base64 data URL
    if (data.avatarUrl !== undefined && data.avatarUrl !== null) {
        if (data.avatarUrl.startsWith("data:image/")) {
            console.log("[updateStudentProfile] Detected base64 image, uploading to storage...");
            // It's a base64 image, upload to storage
            const uploadResult = await uploadBase64Image(data.avatarUrl, userId);

            console.log("[updateStudentProfile] Upload result:", uploadResult);

            if (uploadResult.error || !uploadResult.url) {
                console.error("[updateStudentProfile] Upload failed:", uploadResult.error);
                return { error: `Failed to upload avatar: ${uploadResult.error || 'Unknown upload error'}` };
            }

            updates.avatar_url = uploadResult.url;
            console.log("[updateStudentProfile] Avatar URL set to:", uploadResult.url);
        } else {
            // It's already a URL
            updates.avatar_url = data.avatarUrl;
            console.log("[updateStudentProfile] Using existing URL:", data.avatarUrl);
        }
    }

    console.log("[updateStudentProfile] Updates to apply:", updates);

    const { error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", userId);

    if (error) {
        console.error("[updateStudentProfile] Database update error:", error);
        return { error: error.message };
    }

    console.log("[updateStudentProfile] Profile updated successfully");
    revalidatePath("/student/profile");
    return { success: true };
}

export async function getStudentGroups() {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", groups: [] };

    const supabase = createAdminClient();

    // Get all groups where user is a member (any role: student, admin, or top_admin)
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
        .eq("user_id", userId);

    if (memberError) {
        console.error("Error fetching student groups:", memberError);
        return { error: memberError.message, groups: [] };
    }

    // Extract groups from the nested response
    const groups = memberGroups
        ?.map((item: any) => item.group)
        .filter((g: any) => g !== null) || [];

    // Sort by created_at desc
    groups.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return { groups };
}

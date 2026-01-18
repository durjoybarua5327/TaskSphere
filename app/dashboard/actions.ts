"use server";

import { createAdminClient } from "@/lib/supabase-admin";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function requestJoinGroup(groupId: string, metadata?: any) {
    const user = await currentUser();
    if (!user) return { error: "Not authenticated" };

    const supabase = createAdminClient();

    if (metadata) {
        // TODO: Save metadata to database once column is added
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

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/groups");
    return { success: true };
}

export async function createPost(input: { title?: string; content: string; tags?: string[]; images?: string[] }) {
    const user = await currentUser();
    if (!user) return { error: "Not authenticated" };

    const supabase = createAdminClient();

    // Append images to content if any
    let finalContent = input.content;
    if (input.images && input.images.length > 0) {
        const imageHtml = input.images.map(url => `<img src="${url}" alt="Post image" class="rounded-lg mt-4 max-h-96 object-cover" />`).join('');
        finalContent += `<div class="post-images grid gap-4 mt-4">${imageHtml}</div>`;
    }

    const authorName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User';

    const { error } = await supabase
        .from("posts")
        .insert({
            title: input.title,
            content: finalContent,
            tags: input.tags,
            user_id: user.id, // Using user_id as per codebase convention, despite schema.sql saying author_id
            author_name: authorName,
            author_avatar_url: user.imageUrl || null
        });

    if (error) return { error: error.message };

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile");
    return { success: true };
}

export async function updatePost(postId: string, content: string) {
    const user = await currentUser();
    if (!user) return { error: "Not authenticated" };

    const supabase = createAdminClient();

    // Verify ownership
    const { data: post } = await supabase.from("posts").select("user_id").eq("id", postId).single();
    if (!post || post.user_id !== user.id) return { error: "Unauthorized" };

    const { error } = await supabase
        .from("posts")
        .update({ content, updated_at: new Date().toISOString() })
        .eq("id", postId);

    if (error) return { error: error.message };

    revalidatePath("/dashboard");
    return { success: true };
}

export async function deletePost(postId: string) {
    const user = await currentUser();
    if (!user) return { error: "Not authenticated" };

    const supabase = createAdminClient();

    // Verify ownership
    const { data: post } = await supabase.from("posts").select("user_id").eq("id", postId).single();
    if (!post || post.user_id !== user.id) return { error: "Unauthorized" };

    const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId);

    if (error) return { error: error.message };

    revalidatePath("/dashboard");
    return { success: true };
}

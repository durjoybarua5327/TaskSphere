
"use server";

import { createClerkSupabaseClient } from "@/lib/supabase-clerk";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function createGroup(prevState: any, formData: FormData) {
    const supabase = await createClerkSupabaseClient();
    const { userId } = await auth();

    if (!userId) {
        return { error: "Unauthorized", success: null };
    }

    // 1. Verify Superadmin
    // Note: RLS policies should essentially prevent non-superadmins from doing this,
    // but we can check specifically for better error messages.
    const { data: currentUser } = await supabase
        .from("users")
        .select("is_super_admin")
        .eq("id", userId)
        .single();

    if (!currentUser?.is_super_admin) {
        return { error: "Permission denied: Superadmin access required.", success: null };
    }

    const groupName = formData.get("groupName") as string;
    const topAdminEmail = formData.get("topAdminEmail") as string;

    if (!groupName || !topAdminEmail) {
        return { error: "Group name and Top Admin email are required.", success: null };
    }

    // 2. Check if user with email exists
    const { data: targetUser, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("email", topAdminEmail)
        .single();

    if (userError || !targetUser) {
        return { error: `User with email '${topAdminEmail}' not found. They must have an account first.`, success: null };
    }

    // 3. Check for Duplicate Group Name
    const { data: existingGroup } = await supabase
        .from("groups")
        .select("id")
        .ilike("name", groupName) // Case-insensitive check
        .single();

    if (existingGroup) {
        return { error: "A group with this name already exists.", success: null };
    }

    // 4. Create Group
    // Transaction-like logic isn't fully supported in client-lib unless via RPC,
    // but we'll do sequential inserts.
    const { data: newGroup, error: createError } = await supabase
        .from("groups")
        .insert({
            name: groupName,
            top_admin_id: targetUser.id,
        })
        .select()
        .single();

    if (createError) {
        return { error: "Failed to create group: " + createError.message, success: null };
    }

    // 5. Add user as Top Admin in group_members
    const { error: memberError } = await supabase.from("group_members").insert({
        group_id: newGroup.id,
        user_id: targetUser.id,
        role: "top_admin",
    });

    if (memberError) {
        // Cleanup: try to delete the group if member creation fails? 
        // For now returning error, manual cleanup might be needed or improve logic with stored procedure.
        return { error: "Group created but failed to assign admin: " + memberError.message, success: null };
    }

    revalidatePath("/super-admin");
    return { success: `Group '${groupName}' created successfully with Top Admin: ${topAdminEmail}`, error: null };
}

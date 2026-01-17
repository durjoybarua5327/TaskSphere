"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function requestJoinGroup(groupId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Not authenticated" };

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
    return { success: true };
}

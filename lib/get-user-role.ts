
import { createAdminClient } from "@/lib/supabase-admin";

export type UserRole = 'Super Admin' | 'Top Admin' | 'Admin' | 'Student';

export async function getUserRole(userId: string): Promise<UserRole> {
    const supabase = createAdminClient();

    // 1. Check Super Admin
    const { data: user } = await supabase
        .from("users")
        .select("is_super_admin")
        .eq("id", userId)
        .single();

    if (user?.is_super_admin) return 'Super Admin';

    // 2. Check Top Admin (Group Owner)
    const { count: ownedGroupsCount } = await supabase
        .from("groups")
        .select("*", { count: 'exact', head: true })
        .eq("top_admin_id", userId);

    if (ownedGroupsCount && ownedGroupsCount > 0) return 'Top Admin';

    // 3. Check Admin (Group Admin)
    // Also check if they are top_admin via group_members just in case
    const { data: memberships } = await supabase
        .from("group_members")
        .select("role")
        .eq("user_id", userId);

    if (memberships) {
        if (memberships.some(m => m.role === 'top_admin')) return 'Top Admin';
        if (memberships.some(m => m.role === 'admin')) return 'Admin';
    }

    return 'Student';
}

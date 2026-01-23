import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { cache } from 'react'

export type GroupRole = 'student' | 'admin' | 'top_admin'
export type GlobalRole = 'super_admin' | 'top_admin' | 'admin' | 'student'


// Check if user is super admin
// Note: Removed caching due to Next.js constraints with cookies()
export const isSuperAdmin = cache(async (userId: string): Promise<boolean> => {
    try {
        const supabase = createAdminClient()
        const { data } = await supabase.from('users').select('is_super_admin').eq('id', userId).single()
        return data?.is_super_admin ?? false
    } catch (error) {
        console.error("isSuperAdmin check failed:", error);
        return false;
    }
});

export async function getGroupRole(userId: string, groupId: string): Promise<GroupRole | null> {
    const supabase = await createClient()
    const { data } = await supabase
        .from('group_members')
        .select('role')
        .eq('user_id', userId)
        .eq('group_id', groupId)
        .single()

    return (data?.role as GroupRole) || null
}

export async function isMemberOfAnyGroup(userId: string): Promise<boolean> {
    const supabase = await createClient()
    const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

    return (count || 0) > 0
}

export async function hasGroupPermission(userId: string, groupId: string, requiredRole: GroupRole): Promise<boolean> {
    if (await isSuperAdmin(userId)) return true

    const role = await getGroupRole(userId, groupId)
    if (!role) return false

    const hierarchy = {
        'student': 1,
        'admin': 2,
        'top_admin': 3
    }

    return hierarchy[role] >= hierarchy[requiredRole]
}


export const getGlobalRole = cache(async (userId: string): Promise<GlobalRole> => {
    // Use admin client to bypass RLS for checking/creating users
    let supabase;
    try {
        supabase = createAdminClient();
    } catch (e) {
        console.warn("Service role key missing, falling back to anon client:", e);
        supabase = await createClient();
    }

    // Now fetch user role and memberships
    const [userResult, membershipsResult] = await Promise.all([
        supabase
            .from('users')
            .select('is_super_admin')
            .eq('id', userId)
            .single(),
        supabase
            .from('group_members')
            .select('role')
            .eq('user_id', userId)
    ]);

    const isSuperAdminValue = userResult.data?.is_super_admin ?? false;
    const memberships = membershipsResult.data || [];

    if (isSuperAdminValue) return 'super_admin';

    // Check roles from the already fetched memberships
    const isTopAdmin = memberships.some(m => m.role === 'top_admin');
    if (isTopAdmin) return 'top_admin';

    const isAdmin = memberships.some(m => m.role === 'admin');
    if (isAdmin) return 'admin';

    return 'student';
});

export async function syncUserToSupabase(userId: string, userEmail: string, userData?: { name?: string, imageUrl?: string }) {
    const supabase = createAdminClient();

    // First check if user already has data to avoid overwriting custom profiles
    const { data: existingUser } = await supabase
        .from('users')
        .select('full_name, avatar_url')
        .eq('id', userId)
        .single();

    const { error } = await supabase
        .from('users')
        .upsert({
            id: userId,
            email: userEmail,
            full_name: existingUser?.full_name || userData?.name || null,
            avatar_url: existingUser?.avatar_url || userData?.imageUrl || null,
            updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

    if (error) {
        console.warn("Syncing user to Supabase error:", error.message);
    }
}

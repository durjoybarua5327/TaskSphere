import { createClient } from '@/lib/supabase-server'

export type GroupRole = 'student' | 'admin' | 'top_admin'
export type GlobalRole = 'super_admin' | 'top_admin' | 'admin' | 'student'

export async function isSuperAdmin(userId: string): Promise<boolean> {
    const supabase = await createClient()
    const { data } = await supabase.from('users').select('is_super_admin').eq('id', userId).single()
    return data?.is_super_admin ?? false
}

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

export async function getGlobalRole(userId: string, userEmail?: string): Promise<GlobalRole> {
    const supabase = await createClient()

    // Run user check/creation and membership fetch in parallel
    const [userResult, membershipsResult] = await Promise.all([
        supabase
            .from('users')
            .select('id, is_super_admin')
            .eq('id', userId)
            .maybeSingle(),
        supabase
            .from('group_members')
            .select('role')
            .eq('user_id', userId)
    ]);

    let existingUser = userResult.data;
    const memberships = membershipsResult.data || [];

    // If user doesn't exist and we have an email, create them
    if (!existingUser && userEmail) {
        // We await this because we need the user to exist, but if we assume success or don't block
        // we could optimize further. For safety, we keep it awaited, but the common path (user exists) is now faster.
        const { error } = await supabase
            .from('users')
            .insert({
                id: userId,
                email: userEmail,
                is_super_admin: false
            });

        if (!error) {
            existingUser = { id: userId, is_super_admin: false };
        }
    }

    // Check if super admin (from user table)
    if (existingUser?.is_super_admin) return 'super_admin';

    // Check roles from the already fetched memberships
    // We already have all roles for this user, no need for more DB calls
    const isTopAdmin = memberships.some(m => m.role === 'top_admin');
    if (isTopAdmin) return 'top_admin';

    const isAdmin = memberships.some(m => m.role === 'admin');
    if (isAdmin) return 'admin';

    return 'student';
}

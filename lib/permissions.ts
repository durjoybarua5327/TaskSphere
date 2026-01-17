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

export async function getGlobalRole(userId: string): Promise<GlobalRole> {
    if (await isSuperAdmin(userId)) return 'super_admin'

    const supabase = await createClient()
    // Check if user is top_admin in ANY group
    const { data: topAdminData } = await supabase
        .from('group_members')
        .select('id')
        .eq('user_id', userId)
        .eq('role', 'top_admin')
        .limit(1)

    if (topAdminData && topAdminData.length > 0) return 'top_admin'

    // Check if user is admin in ANY group
    const { data: adminData } = await supabase
        .from('group_members')
        .select('id')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .limit(1)

    if (adminData && adminData.length > 0) return 'admin'

    return 'student'
}

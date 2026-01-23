import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/permissions";
import { getDashboardStats } from "./actions";
import { UnifiedHomeFeed } from "@/components/unified-home-feed";
import { Users, FileText, MessageSquare, Plus, ArrowUpRight, Target, Activity } from "lucide-react";
import { createAdminClient } from "@/lib/supabase-admin";

async function getPosts(userId: string) {
    const supabase = createAdminClient();

    const { data: posts, error } = await supabase
        .from("posts")
        .select(`
            *,
            users:author_id (
                id,
                full_name,
                email,
                avatar_url,
                is_super_admin
            ),
            likes:likes(user_id),
            comments:comments(count)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

    if (error || !posts) return [];

    // Fetch roles for all authors to display correct badges
    const authorIds = Array.from(new Set(posts.map(p => p.author_id)));
    const { data: memberships } = await supabase
        .from("group_members")
        .select("user_id, role")
        .in("user_id", authorIds);

    // Map highest role to each author
    const authorRoles: Record<string, string> = {};
    memberships?.forEach(m => {
        const currentRole = authorRoles[m.user_id];
        const hierarchy: Record<string, number> = { 'student': 1, 'admin': 2, 'top_admin': 3 };
        if (!currentRole || hierarchy[m.role] > hierarchy[currentRole]) {
            authorRoles[m.user_id] = m.role;
        }
    });

    const postsWithRoles = posts.map(post => ({
        ...post,
        users: {
            ...post.users,
            role: authorRoles[post.author_id] || 'student'
        }
    }));

    return postsWithRoles;
}

export default async function SuperAdminPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    // Parallelize permission check and data fetching
    const [isSuperAdminUser, posts] = await Promise.all([
        isSuperAdmin(userId),
        getPosts(userId)
    ]);

    if (!isSuperAdminUser) {
        redirect("/student");
    }

    return (
        <div className="max-w-[1400px] mx-auto">
            <UnifiedHomeFeed
                initialPosts={posts}
                currentUserId={userId}
                isSuperAdmin={true}
                profileBasePath="/superadmin/profile"
            />
        </div>
    );
}

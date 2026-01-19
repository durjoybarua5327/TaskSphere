import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/permissions";
import { getDashboardStats } from "./actions";
import { SuperAdminHomeClient } from "./client-home";
import { Users, FileText, MessageSquare, Plus, ArrowUpRight, Target, Activity } from "lucide-react";
import { createAdminClient } from "@/lib/supabase-admin";

async function getPosts(userId: string) {
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("posts")
        .select(`
            *,
            users:author_id (
                id,
                full_name,
                email,
                avatar_url
            ),
            likes:likes(user_id),
            comments:comments(count)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) return [];
    return data || [];
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
            <SuperAdminHomeClient
                initialPosts={posts}
                currentUserId={userId}
            />
        </div>
    );
}

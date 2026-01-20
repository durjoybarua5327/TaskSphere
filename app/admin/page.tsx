import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { UnifiedHomeFeed } from "@/components/unified-home-feed";

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

export default async function AdminPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    const posts = await getPosts(userId);

    return (
        <div className="max-w-[1400px] mx-auto">
            <UnifiedHomeFeed
                initialPosts={posts}
                currentUserId={userId}
            />
        </div>
    );
}

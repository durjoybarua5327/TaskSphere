
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { PostFeed } from "@/components/post-feed";
import { CreatePostButton } from "@/components/create-post-button";

export default async function StudentPage() {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
        redirect("/sign-in");
    }

    const supabase = await createClient();

    // Fetch all public posts with author information
    const { data: posts } = await supabase
        .from("posts")
        .select(`
            *,
            users:author_id (
                id,
                full_name,
                email,
                avatar_url
            ),
            likes:likes(count),
            comments:comments(count)
        `)
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(50);

    const { data: userData } = await supabase.from("users").select("is_super_admin").eq("id", userId).single();

    const userName = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.emailAddresses[0]?.emailAddress || 'Student';

    return (
        <div className="max-w-7xl mx-auto space-y-6">

            {/* Create Post Section */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6">
                <CreatePostButton userId={userId} userName={userName} />
            </div>

            {/* Posts Feed */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="w-1 h-8 bg-emerald-500 rounded-full"></span>
                    Recent Activity
                </h2>
                <PostFeed posts={posts || []} currentUserId={userId} isSuperAdmin={!!userData?.is_super_admin} />
            </div>
        </div>
    );
}

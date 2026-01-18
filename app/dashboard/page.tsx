import { createClient } from "@/lib/supabase-server";
import { currentUser } from "@clerk/nextjs/server";
import { PostFeed } from "@/components/posts/PostFeed";
import { ShieldAlert, Info } from "lucide-react";

async function getData() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // Get posts
    const { data: posts } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

    return { posts: posts || [], userId };
}

export default async function DashboardPage() {
    const { posts, userId } = await getData();
    const user = await currentUser();

    return (
        <div className="space-y-8 pb-12">
            {/* Header Section */}
            <div className="relative bg-white p-8 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">
                        Welcome, <span className="text-emerald-600">{user?.firstName || 'Scholar'}</span>
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl">
                        Here's what's happening in your learning community.
                    </p>
                </div>
            </div>

            {/* Post Feed Section */}
            <section className="max-w-5xl mx-auto">
                <PostFeed posts={posts} currentUserId={userId || ''} />
            </section>
        </div>
    );
}

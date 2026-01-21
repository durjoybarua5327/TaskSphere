import { createClient } from "@/lib/supabase-server";
import { currentUser } from "@clerk/nextjs/server";
import { StudentProfileClient } from "./student-profile-client";
import { redirect } from "next/navigation";

async function getData() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { userId: null, profile: null, posts: [] };

    const userId = user.id;

    // Fetch user profile from DB
    const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

    // Fetch user posts
    const { data: posts } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    return {
        userId,
        profile,
        posts: posts || []
    };
}

export default async function ProfilePage() {
    const user = await currentUser();
    const { userId, profile, posts } = await getData();

    if (!userId || !profile) {
        if (!user) return null;
        // Handle edge case where Clerk user exists but DB user sync might be delayed
        // Or just show a basic loading/error state
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-800">
                <h1 className="text-4xl font-bold mb-4">Profile Loading...</h1>
                <p className="text-lg">Please refresh the page.</p>
            </div>
        );
    }

    // Ensure profile has required fields for the interface
    const completeProfile = {
        ...profile,
        email: user?.emailAddresses[0]?.emailAddress || profile.email,
        full_name: profile.full_name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        avatar_url: profile.avatar_url || user?.imageUrl
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-12 pb-24">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
                        My Profile
                    </h1>
                    <p className="text-slate-500 font-medium max-w-2xl">
                        View and manage your student profile and activity log.
                    </p>
                </div>

                <StudentProfileClient profile={completeProfile} posts={posts} currentUserId={userId} />
            </div>
        </div>
    );
}

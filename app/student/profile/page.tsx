import { auth, currentUser } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { StudentProfileClient } from "./student-profile-client";
import { redirect } from "next/navigation";

import { getUserRole } from "@/lib/get-user-role";

async function getData(searchUserId?: string) {
    const { userId: currentUserId } = await auth();

    if (!currentUserId) return { userId: null, profile: null, posts: [] };

    const targetUserId = searchUserId || currentUserId;
    const isOwnProfile = targetUserId === currentUserId;

    const supabase = createAdminClient();

    // Fetch user role
    const role = await getUserRole(targetUserId);

    // Fetch user profile from DB
    const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", targetUserId)
        .single();

    // Fetch user posts with required joins for PostFeed
    const { data: rawPosts } = await supabase
        .from("posts")
        .select(`
            *,
            users: author_id(
                id,
                full_name,
                email,
                avatar_url
            ),
            likes: likes(user_id),
            comments: comments(count)
        `)
        .eq("author_id", targetUserId)
        .order("created_at", { ascending: false });

    const posts = rawPosts?.map(post => ({
        ...post,
        users: {
            ...post.users,
            role: role
        }
    })) || [];

    return {
        userId: currentUserId,
        profile: { ...profile, role },
        posts,
        isOwnProfile
    };
}

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ userId?: string }> }) {
    const user = await currentUser();
    const { userId: searchUserId } = await searchParams;
    const { userId, profile, posts, isOwnProfile } = await getData(searchUserId);

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
    const completeProfile = isOwnProfile ? {
        ...profile,
        email: user?.emailAddresses[0]?.emailAddress || profile.email,
        full_name: profile.full_name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        avatar_url: profile.avatar_url || user?.imageUrl
    } : {
        ...profile
    };

    return <StudentProfileClient key={completeProfile.id} profile={completeProfile} posts={posts} currentUserId={userId} isOwnProfile={isOwnProfile} />;
}

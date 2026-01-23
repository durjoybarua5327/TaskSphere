import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase-admin";
import { ProfileClient } from "./profile-client";

import { getUserRole } from "@/lib/get-user-role";

// ...

async function getData(currentUserId: string, searchUserId?: string) {
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

    // Fetch user posts
    const { data: rawPosts } = await supabase
        .from("posts")
        .select(`
            *,
            users: author_id(
                id,
                full_name,
                email,
                avatar_url,
                is_super_admin
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
        profile: { ...profile, role },
        posts,
        isOwnProfile
    };
}

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ userId?: string }> }) {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    const isSuperAdminUser = await isSuperAdmin(userId);

    if (!isSuperAdminUser) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-800">
                <h1 className="text-4xl font-bold mb-4">403 Forbidden</h1>
                <p className="text-lg">You do not have permission to access this area.</p>
            </div>
        );
    }

    const { userId: searchUserId } = await searchParams;
    const { profile, posts, isOwnProfile } = await getData(userId, searchUserId);

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-800">
                <h1 className="text-4xl font-bold mb-4">Profile Not Found</h1>
                <p className="text-lg">Unable to load the requested profile.</p>
            </div>
        );
    }

    return <ProfileClient key={profile.id} profile={profile} posts={posts} currentUserId={userId} isOwnProfile={isOwnProfile} />;
}

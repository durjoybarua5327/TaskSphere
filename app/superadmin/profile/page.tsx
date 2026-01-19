import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/permissions";
import { getProfile, getSuperAdminPosts } from "../actions";
import { ProfileClient } from "./profile-client";

export default async function ProfilePage() {
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

    const [profileResult, postsResult] = await Promise.all([
        getProfile(),
        getSuperAdminPosts()
    ]);

    if (!profileResult.profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-800">
                <h1 className="text-4xl font-bold mb-4">Profile Not Found</h1>
                <p className="text-lg">Unable to load your profile.</p>
            </div>
        );
    }

    return <ProfileClient profile={profileResult.profile} posts={postsResult.posts} currentUserId={userId} />;
}

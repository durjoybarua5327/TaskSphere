import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getProfile, getMyPosts } from "../actions";
import { ProfileClient } from "@/app/admin/profile/ProfileClient";

export default async function ProfilePage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    const [profileResult, postsResult] = await Promise.all([
        getProfile(),
        getMyPosts()
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

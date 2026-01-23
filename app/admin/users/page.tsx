
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { StudentProfileClient } from "@/app/student/profile/student-profile-client";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
    searchParams: Promise<{
        userId?: string;
    }>;
}

async function getData(targetUserId: string) {
    const { userId: currentUserId } = await auth();
    if (!currentUserId) return { userId: null, profile: null, posts: [] };

    const supabase = createAdminClient();

    // Fetch user profile from DB
    const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", targetUserId)
        .single();

    // Fetch user posts
    const { data: posts } = await supabase
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

    return {
        userId: currentUserId,
        profile,
        posts: posts || [],
        isOwnProfile: currentUserId === targetUserId
    };
}

export default async function AdminUserProfilePage(props: PageProps) {
    const { userId: searchUserId } = await props.searchParams;

    if (!searchUserId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-800">
                <h1 className="text-4xl font-bold mb-4">User Not Selected</h1>
                <p className="text-lg pb-4">Please select a user to view their profile.</p>
                <Link href="/admin">
                    <button className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold">
                        Return to Dashboard
                    </button>
                </Link>
            </div>
        );
    }

    const { userId, profile, posts, isOwnProfile } = await getData(searchUserId);

    if (!userId || !profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-800">
                <h1 className="text-4xl font-bold mb-4">Profile Not Found</h1>
                <p className="text-lg pb-4">The user does not exist or you do not have permission.</p>
                <Link href="/admin">
                    <button className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold">
                        Return to Dashboard
                    </button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto p-6 space-y-6">
            <Link
                href="/admin"
                className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 transition-colors font-black text-[10px] uppercase tracking-widest group w-fit"
            >
                <div className="p-2 bg-white border border-slate-100 rounded-xl group-hover:border-emerald-100 transition-all">
                    <ChevronLeft className="w-4 h-4" />
                </div>
                Back to Dashboard
            </Link>

            <StudentProfileClient
                profile={profile}
                posts={posts}
                currentUserId={userId}
                isOwnProfile={isOwnProfile}
            />
        </div>
    );
}

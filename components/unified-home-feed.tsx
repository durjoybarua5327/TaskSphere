"use client";

import { PostFeed } from "@/components/post-feed";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { CreatePostModal } from "@/components/posts/CreatePostModal";
import { Plus as PlusIcon, UserCircle } from "lucide-react";
import Link from "next/link";

interface UnifiedHomeFeedProps {
    initialPosts: any[];
    currentUserId: string;
    isSuperAdmin?: boolean;
    profileBasePath?: string;
}

export function UnifiedHomeFeed({ initialPosts, currentUserId, isSuperAdmin = false, profileBasePath = "/student/profile" }: UnifiedHomeFeedProps) {
    const router = useRouter();
    const supabase = createClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [isProfileComplete, setIsProfileComplete] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data } = await supabase
                .from("users")
                .select("full_name, institute_name")
                .eq("id", currentUserId)
                .single();

            setProfile(data);
            setIsProfileComplete(!!(data?.full_name && data?.institute_name));
        };
        fetchProfile();
    }, [currentUserId, supabase]);

    useEffect(() => {
        const channel = supabase
            .channel('public_posts_changes_unified')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'posts'
                },
                () => {
                    router.refresh();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'likes'
                },
                () => {
                    router.refresh();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'comments'
                },
                () => {
                    router.refresh();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, router]);

    return (
        <div className="space-y-8">
            {!isProfileComplete && (
                <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                            <UserCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-slate-900 font-bold tracking-tight">Complete your profile</p>
                            <p className="text-slate-500 text-xs font-medium">Please update your full name and institute name in the profile section to create posts and join groups.</p>
                        </div>
                    </div>
                    <Link href={profileBasePath}>
                        <button className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-amber-200">
                            Update Profile
                        </button>
                    </Link>
                </div>
            )}

            <div className="flex items-center justify-end">
                <button
                    onClick={() => {
                        if (!isProfileComplete) return;
                        setIsCreateModalOpen(true);
                    }}
                    disabled={!isProfileComplete}
                    className={`group flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all duration-500 font-bold text-xs uppercase tracking-wider relative overflow-hidden ${!isProfileComplete
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                        : "bg-gradient-to-r from-slate-900 to-slate-800 hover:from-green-600 hover:to-emerald-600 text-white shadow-xl shadow-slate-900/20 hover:shadow-green-500/30 active:scale-95 hover:scale-105"
                        }`}
                >
                    {isProfileComplete && (
                        <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-400/10 to-green-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    )}
                    <PlusIcon className="w-4 h-4 relative z-10 transition-transform group-hover:rotate-90 duration-500" />
                    <span className="relative z-10">Create Post</span>
                </button>
            </div>

            <PostFeed
                posts={initialPosts}
                currentUserId={currentUserId}
                isSuperAdmin={isSuperAdmin}
                profileBasePath={profileBasePath}
            />

            <CreatePostModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
}

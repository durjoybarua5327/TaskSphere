"use client";

import { PostFeed } from "@/components/post-feed";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { CreatePostModal } from "@/components/posts/CreatePostModal";
import { Plus as PlusIcon } from "lucide-react";

interface UnifiedHomeFeedProps {
    initialPosts: any[];
    currentUserId: string;
    isSuperAdmin?: boolean;
}

export function UnifiedHomeFeed({ initialPosts, currentUserId, isSuperAdmin = false }: UnifiedHomeFeedProps) {
    const router = useRouter();
    const supabase = createClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
            <div className="flex items-center justify-end">
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-green-600 hover:to-emerald-600 text-white rounded-2xl transition-all duration-500 font-bold text-xs uppercase tracking-wider shadow-xl shadow-slate-900/20 hover:shadow-green-500/30 active:scale-95 hover:scale-105 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-400/10 to-green-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <PlusIcon className="w-4 h-4 relative z-10 transition-transform group-hover:rotate-90 duration-500" />
                    <span className="relative z-10">Create Post</span>
                </button>
            </div>

            <PostFeed
                posts={initialPosts}
                currentUserId={currentUserId}
                isSuperAdmin={isSuperAdmin}
            />

            <CreatePostModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
}

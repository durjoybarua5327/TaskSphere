"use client";

import { PostFeed } from "@/components/post-feed";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { CreatePostModal } from "@/components/posts/CreatePostModal";

interface SuperAdminHomeClientProps {
    initialPosts: any[];
    currentUserId: string;
}

export function SuperAdminHomeClient({ initialPosts, currentUserId }: SuperAdminHomeClientProps) {
    const router = useRouter();
    const supabase = createClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        const channel = supabase
            .channel('public_posts_changes')
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Platform Feed</h1>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time overview of all community activity</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#00897B] transition-all duration-300 shadow-xl shadow-slate-200"
                >
                    <Plus className="w-4 h-4" />
                    Create Post
                </button>
            </div>

            <PostFeed
                posts={initialPosts}
                currentUserId={currentUserId}
                isSuperAdmin={true}
            />

            <CreatePostModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
}

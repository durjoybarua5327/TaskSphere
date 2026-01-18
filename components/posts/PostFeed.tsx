"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { CreatePostModal } from "./CreatePostModal";
import { ViewPostModal } from "./ViewPostModal";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";

interface Post {
    id: string;
    content: string;
    user_id: string;
    author_name: string;
    author_avatar_url: string | null;
    created_at: string;
}

interface PostFeedProps {
    posts: Post[];
    currentUserId: string;
}

export function PostFeed({ posts, currentUserId }: PostFeedProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Community Feed</h2>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-emerald-900/20"
                    title="Create Post"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-500">No posts yet. Be the first to share something!</p>
                    </div>
                ) : (
                    posts.map((post) => (
                        <div
                            key={post.id}
                            onClick={() => setSelectedPost(post)}
                            className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                        >
                            <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-teal-400 absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden border border-emerald-200 shrink-0">
                                    {post.author_avatar_url ? (
                                        <Image src={post.author_avatar_url} alt={post.author_name} width={32} height={32} className="object-cover" />
                                    ) : (
                                        <span className="text-emerald-700 font-bold text-xs">{post.author_name.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="font-semibold text-slate-900 text-sm truncate">{post.author_name}</h3>
                                    <p className="text-xs text-slate-500 truncate">
                                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>

                            <div
                                className="prose prose-sm max-w-none text-slate-600 line-clamp-4 leading-relaxed mix-blend-multiply"
                                dangerouslySetInnerHTML={{ __html: post.content }}
                            />

                            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-end">
                                <span className="text-xs font-medium text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                                    Read more &rarr;
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <CreatePostModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

            {selectedPost && (
                <ViewPostModal
                    isOpen={!!selectedPost}
                    onClose={() => setSelectedPost(null)}
                    post={selectedPost}
                    currentUserId={currentUserId}
                />
            )}
        </div>
    );
}

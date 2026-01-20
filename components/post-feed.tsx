"use client";

import { formatDistanceToNow } from "date-fns";
import {
    Heart,
    MessageCircle,
    User,
    Pencil,
    Trash2,
    X,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useModal } from "@/components/providers/modal-provider";
import { likePost, unlikePost, deletePost, addComment, getComments, updateComment, deleteComment } from "@/app/student/actions";
import { createClient } from "@/lib/supabase";
import { CreatePostModal } from "./posts/CreatePostModal";
import { motion, AnimatePresence } from "framer-motion";

type Comment = {
    id: string;
    post_id: string;
    user_id: string;
    content: string;
    created_at: string;
    user: {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
    } | null;
};

type Post = {
    id: string;
    title: string | null;
    content: string;
    created_at: string;
    author_id: string;
    tags: string[];
    images: string[];
    users: {
        id: string;
        full_name: string | null;
        email: string;
        avatar_url: string | null;
        is_super_admin?: boolean;
    } | null;
    likes: { user_id: string }[];
    comments: { count: number }[];
};

export function PostFeed({ posts, currentUserId, isSuperAdmin = false }: { posts: Post[]; currentUserId: string; isSuperAdmin?: boolean }) {
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (selectedPost) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => { document.body.style.overflow = "unset"; };
    }, [selectedPost]);

    // Handle deep linking from notifications
    const searchParams = useSearchParams();
    const postIdFromUrl = searchParams.get('postId');

    useEffect(() => {
        if (postIdFromUrl && posts) {
            const targetPost = posts.find(p => p.id === postIdFromUrl);
            if (targetPost) {
                setSelectedPost(targetPost);
            }
        }
    }, [postIdFromUrl, posts]);

    // Sync selectedPost with updated posts from server
    useEffect(() => {
        if (selectedPost) {
            const updatedPost = posts.find(p => p.id === selectedPost.id);
            if (updatedPost && updatedPost !== selectedPost) {
                setSelectedPost(updatedPost);
            }
        }
    }, [posts, selectedPost]);

    if (!posts || posts.length === 0) {
        return (
            <div className="bg-white border border-slate-200 rounded-[2rem] p-20 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center border border-slate-100 mb-2">
                    <MessageCircle className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-900 text-xl font-black tracking-tight">Nothing to see here</p>
                <p className="text-slate-500 text-xs font-medium max-w-xs">Be the pioneer and start the conversation by sharing something meaningful.</p>
            </div>
        );
    }

    return (
        <div className="relative">
            <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
                {posts.map((post, index) => (
                    <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <PostCard
                            post={post}
                            currentUserId={currentUserId}
                            isSuperAdmin={isSuperAdmin}
                            onClick={() => setSelectedPost(post)}
                        />
                    </motion.div>
                ))}
            </motion.div>

            <AnimatePresence mode="wait">
                {selectedPost && (
                    <PostModal
                        post={selectedPost}
                        currentUserId={currentUserId}
                        isSuperAdmin={isSuperAdmin}
                        onClose={() => setSelectedPost(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function PostCard({ post, currentUserId, isSuperAdmin, onClick }: { post: Post; currentUserId: string; isSuperAdmin: boolean; onClick: () => void }) {
    const [isLiked, setIsLiked] = useState(post.likes?.some(l => l.user_id === currentUserId) || false);
    const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
    const [commentsCount, setCommentsCount] = useState(post.comments?.[0]?.count || 0);
    const [isLiking, setIsLiking] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const { openModal } = useModal();
    const router = useRouter();
    const supabase = createClient();

    const author = post.users;
    const authorName = author?.full_name || author?.email?.split('@')[0] || 'Unknown User';
    const canEdit = post.author_id === currentUserId || isSuperAdmin;

    useEffect(() => {
        setIsLiked(post.likes?.some(l => l.user_id === currentUserId) || false);
        setLikesCount(post.likes?.length || 0);
        setCommentsCount(post.comments?.[0]?.count || 0);
    }, [post.likes, post.comments, currentUserId]);

    // Realtime subscription for comments count
    useEffect(() => {
        const channel = supabase
            .channel(`post_card_${post.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'comments',
                    filter: `post_id=eq.${post.id}`
                },
                async (payload) => {
                    // Fetch updated count
                    const { count } = await supabase
                        .from('comments')
                        .select('*', { count: 'exact', head: true })
                        .eq('post_id', post.id);
                    setCommentsCount(count || 0);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [post.id, supabase]);

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsLiking(true);
        try {
            if (isLiked) {
                await unlikePost(post.id, currentUserId);
                setLikesCount((prev: number) => Math.max(0, prev - 1));
                setIsLiked(false);
            } else {
                await likePost(post.id, currentUserId);
                setLikesCount((prev: number) => prev + 1);
                setIsLiked(true);
            }
        } catch (error) {
            console.error("Error liking post:", error);
        } finally {
            setIsLiking(false);
        }
    };

    const hasImages = post.images && post.images.length > 0;

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        openModal({
            type: "delete",
            title: "Delete Post",
            description: "Are you sure you want to delete this post?",
            isDestructive: true,
            confirmText: "Delete",
            onConfirm: async () => {
                const result = await deletePost(post.id);
                if (result.success) {
                    router.refresh();
                }
            },
        });
    };

    return (
        <>
            <motion.div
                onClick={onClick}
                whileHover={{ y: -6, transition: { duration: 0.4 } }}
                className="group bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-2xl hover:shadow-slate-200/50 hover:border-green-100 transition-all duration-500 cursor-pointer flex flex-col relative h-[450px] overflow-hidden"
            >
                {/* Decorative gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/0 via-emerald-50/0 to-green-50/0 group-hover:from-green-50/30 group-hover:via-emerald-50/20 group-hover:to-green-50/30 opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none rounded-3xl"></div>

                {/* Admin/Owner Actions */}
                {canEdit && (
                    <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsEditModalOpen(true);
                            }}
                            className="p-2.5 bg-white/95 backdrop-blur-xl shadow-xl border border-slate-100 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-2xl transition-all duration-300 hover:scale-110 active:scale-95"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-2.5 bg-white/95 backdrop-blur-xl shadow-xl border border-slate-100 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-300 hover:scale-110 active:scale-95"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}


                {/* Author Info */}
                <div className="flex items-center gap-3 mb-5 shrink-0 relative z-10">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center border border-slate-200 shadow-sm">
                        {author?.avatar_url ? (
                            <img src={author.avatar_url} alt={authorName} className="w-full h-full rounded-2xl object-cover" />
                        ) : (
                            <User className="w-4 h-4 text-slate-400" />
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold text-slate-900 leading-none">{authorName}</p>
                            {/* Role Badge - Show exact role */}
                            <span className="px-1.5 py-0.5 bg-green-50 border border-green-100 rounded-md text-[10px] font-bold text-green-700">
                                {author?.is_super_admin ? 'Super Admin' : 'Student'}
                            </span>
                        </div>
                        <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </p>
                    </div>
                </div>

                {/* Post Content Preview Area - Fixed height flex container */}
                <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                    {post.title && (
                        <h3 className="text-lg font-black text-slate-900 mb-3 leading-snug group-hover:text-green-700 transition-colors line-clamp-2 shrink-0">
                            {post.title}
                        </h3>
                    )}

                    <div
                        className={`text-sm text-slate-600 leading-relaxed font-normal mb-4 overflow-hidden ${hasImages ? 'line-clamp-4' : 'line-clamp-[16]'
                            }`}
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />

                    {hasImages && (
                        <div className="relative aspect-video rounded-2xl overflow-hidden mt-auto mb-4 border border-slate-100 shadow-md shrink-0 group-hover:shadow-xl transition-shadow duration-500">
                            <img
                                src={post.images[0]}
                                alt="Media"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            {post.images.length > 1 && (
                                <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md text-white px-2.5 py-1 rounded-xl text-xs font-bold">
                                    +{post.images.length - 1}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-auto">
                        {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {post.tags.slice(0, 2).map((tag, idx) => (
                                    <span key={idx} className="px-2.5 py-1 bg-green-50 text-green-700 rounded-xl text-xs font-bold border border-green-100">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Actions Panel */}
                        <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                            <button
                                onClick={handleLike}
                                disabled={isLiking}
                                className={`flex items-center gap-1.5 transition-all duration-300 ${isLiked
                                    ? "text-red-600 font-bold scale-105"
                                    : "text-slate-400 hover:text-slate-700"
                                    }`}
                            >
                                <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""} transition-all`} />
                                <span className="text-sm font-semibold">{likesCount}</span>
                            </button>

                            <div className="flex items-center gap-1.5 text-slate-400">
                                <MessageCircle className="w-4 h-4" />
                                <span className="text-sm font-semibold">{commentsCount}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {isEditModalOpen && (
                <CreatePostModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    editData={{
                        id: post.id,
                        title: post.title,
                        content: post.content,
                        tags: post.tags,
                        images: post.images
                    }}
                />
            )}
        </>
    );
}

function PostModal({ post, currentUserId, isSuperAdmin, onClose }: { post: Post; currentUserId: string; isSuperAdmin: boolean; onClose: () => void }) {
    const [comment, setComment] = useState("");
    const [comments, setComments] = useState<Comment[]>([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLiked, setIsLiked] = useState(post.likes?.some(l => l.user_id === currentUserId) || false);
    const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
    const [isLiking, setIsLiking] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const author = post.users;
    const authorName = author?.full_name || author?.email?.split('@')[0] || 'Unknown User';

    // Fetch comments on mount
    useEffect(() => {
        const fetchComments = async () => {
            const data = await getComments(post.id);
            setComments(data as Comment[]);
        };
        fetchComments();
        // Sync local state with updated props
        setIsLiked(post.likes?.some(l => l.user_id === currentUserId) || false);
        setLikesCount(post.likes?.length || 0);
    }, [post.id, post.likes, currentUserId]);

    // Realtime subscription
    useEffect(() => {
        const channel = supabase
            .channel(`post_updates_${post.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'likes',
                    filter: `post_id=eq.${post.id}`
                },
                () => {
                    router.refresh(); // Refresh parent to get updated post data
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'comments',
                    filter: `post_id=eq.${post.id}`
                },
                async () => {
                    // Fetch full comment data with author
                    const newComments = await getComments(post.id);
                    setComments(newComments as Comment[]);
                    router.refresh();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [post.id, supabase, router]);

    const handleLike = async () => {
        if (isLiking) return;
        setIsLiking(true);
        // Optimistic update
        const wasLiked = isLiked;
        setIsLiked(!wasLiked);
        setLikesCount(prev => wasLiked ? prev - 1 : prev + 1);

        try {
            if (wasLiked) {
                await unlikePost(post.id, currentUserId);
            } else {
                await likePost(post.id, currentUserId);
            }
        } catch (error) {
            // Revert on error
            setIsLiked(wasLiked);
            setLikesCount(prev => wasLiked ? prev + 1 : prev - 1);
            console.error("Error liking post:", error);
        } finally {
            setIsLiking(false);
        }
    };

    const handleComment = async () => {
        if (!comment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const result = await addComment(post.id, comment);
            if (result.success) {
                setComment("");
                // Immediate local update as fallback for Realtime
                const newComments = await getComments(post.id);
                setComments(newComments as Comment[]);
                router.refresh();
            }
        } catch (error) {
            console.error("Error adding comment:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-hidden"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />

            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                className="relative bg-white w-full max-w-3xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute top-6 right-6 z-10">
                    <button
                        onClick={onClose}
                        className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-all border border-slate-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <div className="space-y-6">
                        {/* Header with Role */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                                {author?.avatar_url ? (
                                    <img src={author.avatar_url} alt={authorName} className="w-full h-full rounded-xl object-cover" />
                                ) : (
                                    <User className="w-5 h-5 text-slate-300" />
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-base font-bold text-slate-900 leading-none">{authorName}</h4>
                                    {/* Role Badge beside name - Show exact role */}
                                    <span className="px-2 py-0.5 bg-green-50 border border-green-100 rounded-lg text-xs font-bold text-green-700">
                                        {author?.is_super_admin ? 'Super Admin' : 'Student'}
                                    </span>
                                </div>
                                <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                </p>
                            </div>
                        </div>

                        {/* Title & Content */}
                        <div className="space-y-3">
                            {post.title && (
                                <h2 className="text-lg font-bold text-slate-900 leading-tight">
                                    {post.title}
                                </h2>
                            )}
                            <div
                                className="text-sm text-slate-600 prose prose-slate max-w-none leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: post.content }}
                            />
                        </div>

                        {/* Images Carousel - Smaller */}
                        {post.images && post.images.length > 0 && (
                            <div className="relative group/carousel rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm aspect-video flex items-center justify-center">
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={currentImageIndex}
                                        src={post.images[currentImageIndex]}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                        className="w-full h-full object-contain"
                                        alt={`Post image ${currentImageIndex + 1}`}
                                    />
                                </AnimatePresence>

                                {post.images.length > 1 && (
                                    <>
                                        {/* Navigation Buttons */}
                                        <button
                                            onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? post.images.length - 1 : prev - 1))}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 text-slate-800 opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-[#00897B] hover:text-white"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => setCurrentImageIndex((prev) => (prev === post.images.length - 1 ? 0 : prev + 1))}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 text-slate-800 opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-[#00897B] hover:text-white"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>

                                        {/* Pagination Indicator */}
                                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 p-2 bg-slate-900/10 backdrop-blur-md rounded-full">
                                            {post.images.map((_, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setCurrentImageIndex(idx)}
                                                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentImageIndex
                                                        ? "bg-[#00897B] w-4"
                                                        : "bg-white/60 hover:bg-white"}`}
                                                />
                                            ))}
                                        </div>

                                        {/* Counter Tag */}
                                        <div className="absolute top-6 left-6 px-3 py-1 bg-slate-900/60 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                                            {currentImageIndex + 1} / {post.images.length}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="pt-8 border-t border-slate-100 flex items-center gap-8">
                            <button
                                onClick={handleLike}
                                disabled={isLiking}
                                className="flex items-center gap-2 group"
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border ${isLiked ? 'bg-red-50 border-red-100 text-red-500' : 'bg-slate-50 border-slate-50 text-slate-400 group-hover:bg-red-50 group-hover:text-red-500'
                                    }`}>
                                    <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                                </div>
                                <div className="text-left">
                                    <span className="block text-lg font-black leading-none">{likesCount}</span>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Likes</span>
                                </div>
                            </button>

                            <div className="flex items-center gap-2">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-50 flex items-center justify-center text-slate-400">
                                    <MessageCircle className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <span className="block text-lg font-black leading-none">{comments.length}</span>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Comments</span>
                                </div>
                            </div>
                        </div>

                        {/* Comment Input */}
                        <div className="pt-6 border-t border-slate-100">
                            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100 focus-within:ring-4 ring-[#00897B]/5 focus-within:bg-white focus-within:border-[#00897B]/30 transition-all duration-300">
                                <input
                                    type="text"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Add a comment..."
                                    className="bg-transparent flex-1 px-3 text-sm font-medium outline-none text-slate-800 placeholder:text-slate-300"
                                    onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                                />
                                <button
                                    onClick={handleComment}
                                    disabled={!comment.trim() || isSubmitting}
                                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00897B] transition-all disabled:opacity-30"
                                >
                                    {isSubmitting ? '...' : 'Post'}
                                </button>
                            </div>
                        </div>

                        {/* Comments List */}
                        <div className="space-y-6 pt-6 border-t border-slate-100">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <MessageCircle className="w-3 h-3" />
                                Discussion ({comments.length})
                            </h5>

                            {comments.length > 0 ? (
                                <div className="space-y-6">
                                    {comments.map((c) => (
                                        <CommentItem
                                            key={c.id}
                                            comment={c}
                                            currentUserId={currentUserId}
                                            isSuperAdmin={isSuperAdmin}
                                            refreshData={() => {
                                                getComments(post.id).then((data) => setComments(data as Comment[]));
                                                router.refresh();
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="py-10 text-center bg-slate-50 rounded-[2rem] border border-slate-100 border-dashed">
                                    <MessageCircle className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No comments yet</p>
                                    <p className="text-[10px] text-slate-300 mt-1">Be the first to start the conversation!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

function CommentItem({
    comment,
    currentUserId,
    isSuperAdmin,
    refreshData
}: {
    comment: Comment;
    currentUserId: string;
    isSuperAdmin: boolean;
    refreshData: () => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [isSaving, setIsSaving] = useState(false);
    const { openModal } = useModal();

    // Users can only edit their own comments (superadmins can edit all)
    const canEdit = comment.user_id === currentUserId;
    const canDelete = comment.user_id === currentUserId || isSuperAdmin;

    const handleUpdate = async () => {
        if (!editContent.trim() || isSaving) return;
        setIsSaving(true);
        try {
            await updateComment(comment.id, editContent);
            setIsEditing(false);
            refreshData();
        } catch (error) {
            console.error("Failed to update comment", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = () => {
        openModal({
            type: "delete",
            title: "Delete Comment",
            description: "Are you sure you want to delete this comment?",
            isDestructive: true,
            confirmText: "Delete",
            onConfirm: async () => {
                await deleteComment(comment.id);
                refreshData();
            },
        });
    };

    return (
        <div className="flex gap-4 group">
            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                {comment.user?.avatar_url ? (
                    <img src={comment.user.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
                ) : (
                    <User className="w-4 h-4 text-slate-300" />
                )}
            </div>
            <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-tight">
                        {comment.user?.full_name || 'Anonymous'}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                        {canEdit && !isEditing && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setIsEditing(true)} className="p-1 hover:text-[#00897B] text-slate-400">
                                    <Pencil className="w-3 h-3" />
                                </button>
                                <button onClick={handleDelete} className="p-1 hover:text-red-500 text-slate-400">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {isEditing ? (
                    <div className="space-y-2">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#00897B]"
                            rows={2}
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-3 py-1 text-xs font-bold text-slate-500 hover:text-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={isSaving}
                                className="px-3 py-1 bg-[#00897B] text-white rounded-lg text-xs font-bold hover:bg-[#00796B]"
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">
                            {comment.content}
                        </p>

                        {(canEdit || canDelete) && (
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {canEdit && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-green-600 transition-colors"
                                        title="Edit comment"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                {canDelete && (
                                    <button
                                        onClick={handleDelete}
                                        className="p-1 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                                        title="Delete comment"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

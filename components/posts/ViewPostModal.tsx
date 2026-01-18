"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { deletePost, updatePost } from "@/app/dashboard/actions";
import { Loader2, Trash2, Edit2, Check, X as XIcon } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

interface Post {
    id: string;
    content: string;
    user_id: string;
    author_name: string;
    author_avatar_url: string | null;
    created_at: string;
}

interface ViewPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    post: Post | null;
    currentUserId: string;
}

export function ViewPostModal({ isOpen, onClose, post, currentUserId }: ViewPostModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState("");
    const [loading, setLoading] = useState(false);

    if (!post) return null;

    const isAuthor = currentUserId === post.user_id;

    const handleEditClick = () => {
        setEditContent(post.content);
        setIsEditing(true);
    };

    const handleSave = async () => {
        setLoading(true);
        const result = await updatePost(post.id, editContent);
        setLoading(false);
        if (result.success) {
            setIsEditing(false);
            // Ideally update local state or revalidate logic handles it
            onClose(); // Close on save for simplicity, or just exit edit mode
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this post?")) return;
        setLoading(true);
        const result = await deletePost(post.id);
        setLoading(false);
        if (result.success) {
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Edit Post" : "Post Details"}
            className="max-w-2xl"
        >
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden border border-emerald-200">
                        {post.author_avatar_url ? (
                            <Image src={post.author_avatar_url} alt={post.author_name} width={40} height={40} className="object-cover" />
                        ) : (
                            <span className="text-emerald-700 font-bold text-lg">{post.author_name.charAt(0)}</span>
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900">{post.author_name}</h3>
                        <p className="text-xs text-slate-500">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </p>
                    </div>
                </div>

                {/* Content */}
                {isEditing ? (
                    <div className="min-h-[200px]">
                        <RichTextEditor
                            content={editContent}
                            onChange={setEditContent}
                        />
                    </div>
                ) : (
                    <div
                        className="prose prose-sm sm:prose lg:prose-lg max-w-none text-slate-700"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                )}

                {/* Actions */}
                {isAuthor && (
                    <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-4">
                        {isEditing ? (
                            <div className="flex gap-2 w-full justify-end">
                                <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={loading}>
                                    <XIcon className="w-4 h-4 mr-2" />
                                    Cancel
                                </Button>
                                <Button onClick={handleSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-2" /> Save Changes</>}
                                </Button>
                            </div>
                        ) : (
                            <div className="flex gap-2 w-full justify-end">
                                <Button variant="ghost" onClick={handleDelete} disabled={loading} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4 mr-2" /> Delete</>}
                                </Button>
                                <Button variant="outline" onClick={handleEditClick} disabled={loading}>
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}

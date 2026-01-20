"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { Button } from "@/components/ui/button";
import { createPost, deletePost, updatePost } from "@/app/student/actions";
import { Loader2, X, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/providers/modal-provider";

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    editData?: {
        id: string;
        title: string | null;
        content: string;
        tags: string[];
        images: string[];
    };
}

export function CreatePostModal({ isOpen, onClose, editData }: CreatePostModalProps) {
    const [title, setTitle] = useState(editData?.title || "");
    const [content, setContent] = useState(editData?.content || "");
    const [tags, setTags] = useState<string[]>(editData?.tags || []);
    const [currentTag, setCurrentTag] = useState("");
    const [images, setImages] = useState<string[]>(editData?.images || []);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setImages([...images, reader.result as string]);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleAddTag = () => {
        if (!currentTag.trim()) return;
        if (tags.includes(currentTag.trim())) {
            setCurrentTag("");
            return;
        }
        setTags([...tags, currentTag.trim()]);
        setCurrentTag("");
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const router = useRouter();

    const handleSubmit = async () => {
        if (!content || content === '<p></p>') return;

        setLoading(true);

        const data = {
            title: title || undefined,
            content,
            tags,
            images
        };

        const result = editData
            ? await updatePost(editData.id, data)
            : await createPost(data);

        setLoading(false);

        if (result.success) {
            if (!editData) {
                setTitle("");
                setContent("");
                setTags([]);
                setImages([]);
            }
            router.refresh();
            onClose();
        } else {
            console.error(editData ? "Failed to update:" : "Failed to post:", result.error);
        }
    };

    const { openModal } = useModal();

    const handleDelete = async () => {
        if (!editData) return;

        openModal({
            type: "delete",
            title: "Delete Post",
            description: "Are you sure you want to delete this post?",
            isDestructive: true,
            confirmText: "Delete",
            onConfirm: async () => {
                setLoading(true);
                const result = await deletePost(editData.id);
                setLoading(false);

                if (result.success) {
                    router.refresh();
                    onClose();
                } else {
                    console.error("Failed to delete post:", result.error);
                }
            },
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create Post"
            className="max-w-5xl"
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[520px]">
                <div className="lg:col-span-2 flex flex-col gap-4 lg:h-full">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Title of your post"
                        className="text-xl font-bold border-none outline-none focus:outline-none px-0 placeholder:text-slate-400 w-full bg-transparent"
                    />

                    <div className="flex-1 min-h-0">
                        <RichTextEditor
                            content={content}
                            onChange={setContent}
                            placeholder="Share your knowledge or ask a question..."
                            className="min-h-[300px] max-h-[420px] border border-slate-200"
                        />
                    </div>
                </div>

                {/* Right Column: Metadata */}
                <div className="flex flex-col gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100 lg:h-full overflow-y-auto">
                    {/* Image Upload */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
                            Attachments
                        </label>
                        <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                                {images.map((img, idx) => (
                                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 group">
                                        <img src={img} alt="preview" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => handleRemoveImage(idx)}
                                            className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                                        >
                                            <span className="text-xs">&times;</span>
                                        </button>
                                    </div>
                                ))}
                                <label className="w-16 h-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors">
                                    <span className="text-2xl text-slate-400 mb-1">+</span>
                                    <span className="text-[10px] text-slate-500">Image</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
                            Tags
                        </label>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={currentTag}
                                onChange={(e) => setCurrentTag(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddTag();
                                    }
                                }}
                                placeholder="Add a tag..."
                                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                            />
                            <Button
                                onClick={handleAddTag}
                                type="button"
                                variant="outline"
                                className="border-slate-200 hover:bg-slate-50 text-slate-600"
                            >
                                Add
                            </Button>
                        </div>

                        {tags.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                        {tag}
                                        <button
                                            onClick={() => handleRemoveTag(tag)}
                                            className="hover:text-emerald-900 focus:outline-none"
                                        >
                                            &times;
                                        </button>
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400">
                                No tags added yet.
                            </p>
                        )}
                    </div>

                    {/* Submit Actions */}
                    <div className="mt-auto pt-4 border-t border-slate-200 flex flex-col gap-2">
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || !content || content === '<p></p>'}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                        >
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {editData ? "Update Post" : "Publish Post"}
                        </Button>

                        {editData && (
                            <Button
                                onClick={handleDelete}
                                disabled={loading}
                                variant="outline"
                                className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Post
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
}


"use client";

import { useState } from "react";
import { PlusCircle, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { createPost } from "@/app/student/actions";
import { useRouter } from "next/navigation";

export function CreatePostButton({ userId, userName }: { userId: string; userName: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await createPost({ title, content });
            setTitle("");
            setContent("");
            setIsOpen(false);
            router.refresh();
        } catch (error) {
            console.error("Error creating post:", error);
            alert("Failed to create post");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full flex items-center gap-3 p-4 text-left border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors group"
            >
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                    <span className="text-emerald-700 font-semibold">{userName.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-slate-500 flex-1">What's on your mind, {userName}?</span>
                <PlusCircle className="w-5 h-5 text-emerald-600" />
            </button>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Create a Post</h3>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <X className="w-5 h-5 text-slate-600" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title (optional)"
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />

                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Share your thoughts..."
                    required
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[120px] resize-none"
                    rows={5}
                />

                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting || !content.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Posting...
                            </>
                        ) : (
                            <>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Post
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}

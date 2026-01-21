"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Send, FileText, Paperclip } from "lucide-react";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { FileUpload } from "@/components/ui/file-upload";
import { uploadTaskAttachment } from "@/app/admin/actions";

interface SubmitTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { content: string; attachments: string[]; link_url: string }) => Promise<void>;
    initialData?: { content: string; attachments: string[]; link_url: string };
    isSubmitting: boolean;
}

export function SubmitTaskModal({ isOpen, onClose, onSubmit, initialData, isSubmitting }: SubmitTaskModalProps) {
    const [editorKey, setEditorKey] = useState(0);
    const [data, setData] = useState({
        content: "",
        attachments: [] as string[],
        link_url: ""
    });

    useEffect(() => {
        if (initialData) {
            setData({
                content: initialData.content || "",
                attachments: initialData.attachments || [],
                link_url: initialData.link_url || ""
            });
        } else {
            setData({
                content: "",
                attachments: [],
                link_url: ""
            });
        }
        setEditorKey(prev => prev + 1);
    }, [initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(data);
    };

    const handleUpload = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);

        const result = await uploadTaskAttachment(formData);
        if (result.error) {
            alert(result.error);
            return "";
        }
        return result.url || "";
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-[5%] -translate-x-1/2 w-full max-w-3xl max-h-[90vh] bg-white rounded-[2rem] shadow-2xl z-[101] flex flex-col overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-6 md:p-8 border-b border-slate-50">
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                                {initialData?.content ? "Edit Submission" : "Submit Task"}
                            </h2>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 md:p-8 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-track]:bg-transparent">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Submission Content</label>
                                    <div className="min-h-[300px] border border-slate-100 rounded-2xl overflow-hidden">
                                        <RichTextEditor
                                            key={editorKey}
                                            content={data.content}
                                            onChange={(content) => setData({ ...data, content })}
                                            placeholder="Provide details about your submission..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Attachments (Images/Files)</label>
                                    <FileUpload
                                        value={data.attachments}
                                        onChange={(urls) => setData({ ...data, attachments: urls })}
                                        onUploadFile={handleUpload}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">External Link (Optional)</label>
                                    <input
                                        type="url"
                                        value={data.link_url}
                                        onChange={(e) => setData({ ...data, link_url: e.target.value })}
                                        placeholder="https://github.com/..."
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                    />
                                </div>

                                <div className="pt-4 flex gap-3 justify-end">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !data.content}
                                        className="group px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-slate-200"
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1" />}
                                        {initialData?.content ? "Save Changes" : "Submit Task"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

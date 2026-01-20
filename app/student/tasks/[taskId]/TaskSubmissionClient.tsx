"use client";

import { useState } from "react";
import {
    Send,
    Loader2,
    CheckCircle2,
    FileText,
    Link as LinkIcon,
    Paperclip,
    Image as ImageIcon,
    AlertCircle,
    RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { submitTask } from "../../../admin/actions";
import { useRouter } from "next/navigation";

interface TaskSubmissionClientProps {
    taskId: string;
    initialStatus?: string;
    initialSubmission?: any;
}

export function TaskSubmissionClient({ taskId, initialSubmission }: TaskSubmissionClientProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [content, setContent] = useState(initialSubmission?.content || "");
    const [fileUrl, setFileUrl] = useState(initialSubmission?.file_url || "");
    const [linkUrl, setLinkUrl] = useState(initialSubmission?.link_url || "");
    const [showSuccess, setShowSuccess] = useState(!!initialSubmission);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const result = await submitTask(taskId, {
            content,
            file_url: fileUrl,
            link_url: linkUrl
        });
        setIsSubmitting(false);
        if (result.success) {
            setShowSuccess(true);
            router.refresh();
        } else {
            alert(result.error);
        }
    };

    if (showSuccess && !isSubmitting) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-slate-100 rounded-[3rem] p-12 text-center space-y-6 shadow-sm"
            >
                <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Assignment Submitted</h2>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                        Your work has been received. You can edit it until the deadline.
                    </p>
                </div>

                {initialSubmission?.scores?.[0] && (
                    <div className="max-w-md mx-auto p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grade Received</span>
                            <span className="text-2xl font-black text-emerald-600 uppercase tracking-tight">
                                {initialSubmission.scores[0].score_value}
                            </span>
                        </div>
                        {initialSubmission.scores[0].feedback && (
                            <p className="text-xs font-bold text-slate-600 text-left italic">
                                "{initialSubmission.scores[0].feedback}"
                            </p>
                        )}
                    </div>
                )}

                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => setShowSuccess(false)}
                        className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Edit Submission
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white border border-slate-100 rounded-[3rem] p-8 md:p-12 shadow-sm space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Submit Your Work</h2>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        Drafts are saved automatically
                    </div>
                </div>

                {/* Content Editor Area */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-6 py-3 bg-slate-50 border border-slate-100 rounded-t-[2rem] border-b-0">
                        <button type="button" className="p-2 hover:bg-white rounded-lg transition-all"><FileText className="w-4 h-4 text-slate-400" /></button>
                        <button type="button" className="p-2 hover:bg-white rounded-lg transition-all"><ImageIcon className="w-4 h-4 text-slate-400" /></button>
                        <button type="button" className="p-2 hover:bg-white rounded-lg transition-all"><Paperclip className="w-4 h-4 text-slate-400" /></button>
                        <div className="w-px h-4 bg-slate-200 mx-2" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rich Text Editor Ready</span>
                    </div>
                    <textarea
                        required
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write your submission here... Explain your work in detail."
                        rows={12}
                        className="w-full bg-white border border-slate-100 rounded-b-[2rem] px-8 py-6 text-slate-700 font-bold leading-relaxed focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all resize-none shadow-inner"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* File Upload Placeholder */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Attachment URL (Image/File)</label>
                        <div className="relative">
                            <Paperclip className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="url"
                                value={fileUrl}
                                onChange={(e) => setFileUrl(e.target.value)}
                                placeholder="https://example.com/my-work.pdf"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-xs font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* External Link */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">External Link (Project/Repo)</label>
                        <div className="relative">
                            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="url"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                placeholder="https://github.com/my-project"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-xs font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-slate-50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-sm">
                        By submitting, you agree that this is your original work and follows the academic integrity guidelines.
                    </p>
                    <button
                        disabled={isSubmitting || !content}
                        className="w-full md:w-auto px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-slate-200"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                Submit Assignment
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}

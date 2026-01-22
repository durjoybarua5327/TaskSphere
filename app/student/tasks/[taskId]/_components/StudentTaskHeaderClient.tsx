"use client";

import { useState } from "react";
import { ClipboardList, Plus, RotateCcw, Send, Eye, Paperclip } from "lucide-react";
import { SubmitTaskModal } from "./SubmitTaskModal";
import { submitTask } from "@/app/admin/actions";
import { useRouter } from "next/navigation";

interface StudentTaskHeaderClientProps {
    task: any;
    taskId: string;
    initialSubmission?: any;
}

export function StudentTaskHeaderClient({ task, taskId, initialSubmission }: StudentTaskHeaderClientProps) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (data: { content: string; attachments: string[]; link_url: string }) => {
        setIsSubmitting(true);
        const result = await submitTask(taskId, {
            content: data.content,
            attachments: data.attachments,
            link_url: data.link_url
        } as any);
        setIsSubmitting(false);

        if (result.success) {
            setIsModalOpen(false);
            router.refresh();
        } else {
            alert(result.error);
        }
    };

    const hasSubmitted = !!initialSubmission;

    return (
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 md:p-8 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl" />

            <div className="relative space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                            <ClipboardList className="w-3 h-3" />
                            Task Details
                        </div>
                        <div className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-widest">
                            Group: {task.group?.name}
                        </div>
                        <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                            Max Score: {task.max_score}
                        </div>
                        {task.submissions_visibility === 'public' ? (
                            <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Public Submissions
                            </div>
                        ) : (
                            <div className="px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                Private Submissions
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all active:scale-95 flex items-center gap-2 shadow-xl shadow-slate-200"
                    >
                        {hasSubmitted ? (
                            <>
                                <RotateCcw className="w-4 h-4" />
                                Edit Submission
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Submit Task
                            </>
                        )}
                    </button>
                </div>

                <div className="space-y-4">
                    <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight uppercase leading-none">
                        {task.title}
                    </h1>

                    <div
                        className="text-slate-500 font-medium max-w-4xl text-sm prose prose-sm max-w-none prose-p:m-0 prose-headings:m-0"
                        dangerouslySetInnerHTML={{
                            __html: task.description ? task.description.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') : ''
                        }}
                    />

                    {/* Task Attachments (Reference Materials) */}
                    {task.attachments && task.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-6 border-t border-slate-50">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-full mb-1">Reference Materials</p>
                            {task.attachments.map((url: string, i: number) => {
                                const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                                const fileName = url.split('/').pop()?.split('_').slice(1).join('_') || "File";

                                if (isImage) {
                                    return (
                                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border border-slate-200 group/img">
                                            <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                <Eye className="w-4 h-4 text-white" />
                                            </div>
                                        </a>
                                    );
                                }
                                return (
                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                                        <Paperclip className="w-3 h-3 text-slate-400" />
                                        <span className="max-w-[150px] truncate">{fileName}</span>
                                    </a>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <SubmitTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                initialData={hasSubmitted ? {
                    content: initialSubmission.content,
                    attachments: initialSubmission.attachments || [],
                    link_url: initialSubmission.link_url || ""
                } : undefined}
            />
        </div>
    );
}

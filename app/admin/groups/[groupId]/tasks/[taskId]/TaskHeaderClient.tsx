"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Paperclip, Eye, Download, Pencil, Trash2, Plus } from "lucide-react";
import { CreateTaskModal } from "../../_components/create-task-modal";
import { updateTask, deleteTask } from "@/app/admin/actions";

interface TaskHeaderClientProps {
    task: any;
    groupId: string;
    submissionsCount: number;
    currentUserRole?: string | null;
    currentUserId?: string | null;
}

export function TaskHeaderClient({ task, groupId, submissionsCount, currentUserRole, currentUserId }: TaskHeaderClientProps) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleUpdateTask = async (data: any) => {
        setIsSubmitting(true);
        const result = await updateTask(task.id, groupId, {
            title: data.title,
            description: data.description,
            deadline: data.deadline,
            max_score: data.maxScore,
            attachments: data.attachments
        });
        setIsSubmitting(false);

        if (result.success) {
            setIsModalOpen(false);
            router.refresh();
        } else {
            alert(result.error);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this task? This cannot be undone.")) return;

        const result = await deleteTask(task.id, groupId);
        if (result.success) {
            router.push(`/admin/groups/${groupId}?tab=tasks`);
        } else {
            alert(result.error);
        }
    };

    const hasEditPermission = currentUserRole === 'top_admin' || currentUserId === task.creator_id;

    return (
        <div className="bg-white border border-slate-100 rounded-[2rem] p-5 md:p-6 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl" />

            <div className="relative space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                            <ClipboardList className="w-3 h-3" />
                            Task Submissions
                        </div>
                        <div className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-widest">
                            {submissionsCount} Submissions
                        </div>
                    </div>

                    {hasEditPermission && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <Pencil className="w-3 h-3" />
                                Edit Task
                            </button>
                            {/* Option to delete from here is also useful */}
                            <button
                                onClick={handleDelete}
                                className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all"
                                title="Delete Task"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">
                        {task.title}
                    </h1>

                    <div
                        className="text-slate-500 font-medium max-w-3xl text-sm prose prose-sm max-w-none prose-p:m-0 prose-headings:m-0"
                        dangerouslySetInnerHTML={{
                            __html: task.description ? task.description.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') : ''
                        }}
                    />

                    {/* Attachments */}
                    {task.attachments && task.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                            {task.attachments.map((url: string, i: number) => {
                                const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                                const fileName = url.split('/').pop()?.split('_').slice(1).join('_') || "File";

                                if (isImage) {
                                    return (
                                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border border-slate-200 group/img">
                                            <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                <Eye className="w-4 h-4 text-white" />
                                            </div>
                                        </a>
                                    );
                                }
                                return (
                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                                        <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                                        <span className="max-w-[150px] truncate">{fileName}</span>
                                        <Download className="w-3 h-3 text-slate-400" />
                                    </a>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <CreateTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleUpdateTask}
                initialData={{
                    title: task.title,
                    description: task.description,
                    deadline: task.deadline,
                    maxScore: task.max_score,
                    attachments: task.attachments
                }}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { TaskSubmissionClient } from "./TaskSubmissionClient";
import Link from "next/link";
import { ChevronLeft, ClipboardList } from "lucide-react";
import { getMySubmission } from "../../../admin/actions";

interface PageProps {
    params: {
        taskId: string;
    };
}

async function getTaskDetails(taskId: string) {
    const supabase = await createClient();
    const { data: task, error } = await supabase
        .from("tasks")
        .select(`
            *,
            groups (
                name
            ),
            creator:creator_id (
                full_name,
                avatar_url
            )
        `)
        .eq("id", taskId)
        .single();

    if (error || !task) return null;
    return task;
}

export default async function StudentTaskDetailPage({ params }: PageProps) {
    const { taskId } = await params;

    const [task, submissionRes] = await Promise.all([
        getTaskDetails(taskId),
        getMySubmission(taskId)
    ]);

    if (!task) {
        return notFound();
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-12 pb-24">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Breadcrumbs */}
                <Link
                    href="/student/tasks"
                    className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 transition-colors font-black text-[10px] uppercase tracking-widest group w-fit"
                >
                    <div className="p-2 bg-white border border-slate-100 rounded-xl group-hover:border-emerald-100 transition-all">
                        <ChevronLeft className="w-4 h-4" />
                    </div>
                    Back to All Tasks
                </Link>

                <div className="bg-white border border-slate-100 rounded-[3rem] p-8 md:p-12 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl" />

                    <div className="relative space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="px-4 py-1.5 bg-slate-50 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                        <ClipboardList className="w-3 h-3" />
                                        {task.groups?.name}
                                    </div>
                                    <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        Max Score: {task.max_score}
                                    </div>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight uppercase leading-none">
                                    {task.title}
                                </h1>
                            </div>

                            {task.creator && (
                                <div className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
                                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 overflow-hidden">
                                        {task.creator.avatar_url ? (
                                            <img src={task.creator.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ClipboardList className="w-6 h-6 text-slate-200" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Posted By</p>
                                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{task.creator.full_name}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] text-slate-700 text-lg font-bold leading-relaxed whitespace-pre-wrap">
                            {task.description}
                        </div>
                    </div>
                </div>

                <Suspense fallback={<div className="h-96 bg-white animate-pulse rounded-[3rem]" />}>
                    <TaskSubmissionClient
                        taskId={taskId}
                        initialSubmission={submissionRes.submission}
                    />
                </Suspense>
            </div>
        </div>
    );
}

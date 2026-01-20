import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTasks, getSubmissions } from "../../../../actions";
import { TaskSubmissionViewer } from "./TaskSubmissionViewer";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";

interface PageProps {
    params: {
        groupId: string;
        taskId: string;
    };
}

export default async function TaskSubmissionsPage({ params }: PageProps) {
    const { groupId, taskId } = await params;

    const [tasksRes, submissionsRes] = await Promise.all([
        getTasks(groupId),
        getSubmissions(taskId)
    ]);

    const task = tasksRes.tasks?.find((t: any) => t.id === taskId);

    if (!task) {
        return notFound();
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-12 pb-24">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Breadcrumbs */}
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                    <Link href="/admin/groups" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
                        <ChevronLeft className="w-3 h-3" />
                        Groups
                    </Link>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    <Link href={`/admin/groups/${groupId}?tab=tasks`} className="hover:text-emerald-600 transition-colors">
                        Tasks
                    </Link>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    <span className="text-emerald-600">Submissions</span>
                </div>

                <div className="bg-white border border-slate-100 rounded-[3rem] p-8 md:p-12 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl" />

                    <div className="relative space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <ClipboardList className="w-3 h-3" />
                                Task Submissions
                            </div>
                            <div className="px-4 py-1.5 bg-slate-50 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                                {submissionsRes.submissions?.length || 0} Submissions
                            </div>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight uppercase leading-none">
                            {task.title}
                        </h1>

                        <p className="text-slate-500 font-medium max-w-3xl text-lg">
                            {task.description}
                        </p>
                    </div>
                </div>

                <Suspense fallback={<div className="h-96 bg-white animate-pulse rounded-[3rem]" />}>
                    <TaskSubmissionViewer
                        submissions={submissionsRes.submissions || []}
                        taskId={taskId}
                        groupId={groupId}
                    />
                </Suspense>
            </div>
        </div>
    );
}

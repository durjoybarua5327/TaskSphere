import { createClient } from "@/lib/supabase-server";
import { BookOpen, CheckCircle, Clock, Calendar, ChevronRight, ClipboardList, User } from "lucide-react";
import { getTasks } from "../../admin/actions";
import Link from "next/link";

interface Task {
    id: string;
    group_id: string;
    title: string;
    description: string;
    deadline: string | null;
    max_score: number;
    created_at: string;
    group_name?: string;
}

async function getStudentTasks() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { tasks: [] };

    // Optimized: Fetch tasks directly by joining with group_members to verify enrollment
    const { data: tasks, error } = await supabase
        .from("tasks")
        .select(`
            *,
            groups:group_id (
                name,
                group_members!inner (
                    user_id
                )
            )
        `)
        .eq("groups.group_members.user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching tasks:", error);
        return { tasks: [] };
    }

    return {
        tasks: tasks.map((t: any) => ({
            ...t,
            group_name: t.groups?.name
        }))
    };
}

export default async function StudentTasksPage() {
    const { tasks } = await getStudentTasks();

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />
                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <ClipboardList className="w-3 h-3" />
                            My Assignments
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight uppercase leading-none">
                        Student <span className="text-emerald-500">Workspace</span>
                    </h1>
                    <p className="text-slate-500 font-medium max-w-2xl text-lg">
                        Manage your tasks, track deadlines, and submit your work across all your academic groups in one place.
                    </p>
                </div>
            </div>

            {/* Tasks Grid */}
            <div className="grid gap-6">
                {tasks.length > 0 ? (
                    tasks.map(task => (
                        <Link
                            key={task.id}
                            href={`/student/tasks/${task.id}`}
                            className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 group block"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div className="space-y-4 flex-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-all">
                                            <BookOpen className="w-6 h-6 text-slate-400 group-hover:text-emerald-500 transition-all" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Group</p>
                                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">{task.group_name}</h3>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{task.title}</h2>
                                        <p className="text-slate-500 text-sm font-bold line-clamp-2 leading-relaxed">
                                            {task.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap md:flex-row items-center gap-4">
                                    <div className="px-5 py-3 bg-slate-50 rounded-2xl flex flex-col items-center justify-center min-w-[100px]">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Max Score</p>
                                        <p className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">{task.max_score}</p>
                                    </div>

                                    {task.deadline && (
                                        <div className="px-5 py-3 bg-red-50 rounded-2xl flex flex-col items-center justify-center min-w-[100px]">
                                            <p className="text-[8px] font-black text-red-400 uppercase tracking-widest mb-1">Deadline</p>
                                            <p className="text-xs font-black text-red-600 uppercase tracking-tight leading-none">
                                                {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                    )}

                                    <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover:bg-emerald-500 transition-all group-hover:translate-x-2">
                                        <ChevronRight className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="text-center py-24 bg-white rounded-[3.5rem] border border-dashed border-slate-200 space-y-4">
                        <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto">
                            <Clock className="w-10 h-10 text-slate-200" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">No active tasks</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-xs mx-auto">
                                You're up to date! Check back later for new assignments from your group admins.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

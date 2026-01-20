import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import { Users, ClipboardList, BookOpen, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function StudentGroupDetailPage({ params }: { params: { groupId: string } }) {
    const { groupId } = await params;
    const supabase = await createClient();

    const { data: group } = await supabase
        .from("groups")
        .select(`
            *,
            members:group_members(count)
        `)
        .eq("id", groupId)
        .single();

    if (!group) return notFound();

    const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 -mr-20 -mt-20" />
                <div className="relative z-10 space-y-4">
                    <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight">{group.name}</h1>
                    <p className="text-slate-500 font-medium text-lg max-w-2xl">{group.description}</p>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <Users className="w-3 h-3" />
                            {group.members?.[0]?.count || 0} Members
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Active Tasks</h2>
                        <ClipboardList className="w-5 h-5 text-slate-300" />
                    </div>

                    <div className="space-y-4">
                        {tasks && tasks.length > 0 ? (
                            tasks.map(task => (
                                <Link
                                    key={task.id}
                                    href={`/student/tasks/${task.id}`}
                                    className="block p-6 bg-white border border-slate-100 rounded-[2rem] hover:shadow-lg transition-all group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-2">
                                            <h3 className="font-black text-lg text-slate-900 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">
                                                {task.title}
                                            </h3>
                                            <p className="text-sm text-slate-500 font-bold line-clamp-1">{task.description}</p>
                                            {task.deadline && (
                                                <div className="flex items-center gap-2 text-[10px] font-black text-red-400 uppercase tracking-widest">
                                                    <Clock className="w-3 h-3" />
                                                    Due {new Date(task.deadline).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="bg-white border border-dashed border-slate-200 rounded-[2rem] p-12 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No tasks released yet</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 space-y-4 shadow-xl shadow-slate-200">
                        <h3 className="text-lg font-black uppercase tracking-tight">Need help?</h3>
                        <p className="text-slate-400 text-sm font-bold leading-relaxed">
                            If you have questions about a task, you can message the group admins in the messages tab.
                        </p>
                        <Link
                            href="/student/messages"
                            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                            Go to Messages
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

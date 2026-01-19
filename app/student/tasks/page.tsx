import { createClient } from "@/lib/supabase-server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BookOpen, CheckCircle, Clock } from "lucide-react";

async function getData() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get groups where user is a member
    const { data: myGroups } = await supabase
        .from("group_members")
        .select(`
            group_id,
            groups (
                id,
                name,
                description,
                users!top_admin_id(full_name)
            )
        `)
        .eq("user_id", user?.id);

    // Flatten structure
    const joinedGroups = myGroups?.map(mg => {
        // TypeScript safe casting
        const g = mg.groups as any;
        return {
            id: g.id,
            name: g.name,
            description: g.description,
            ownerName: g.users?.full_name || 'Unknown'
        };
    }) || [];

    return joinedGroups;
}

export default async function TasksPage() {
    const groups = await getData();

    return (
        <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">My Learning Tasks</h1>
                    <p className="text-slate-600">View tasks and assignments from your groups.</p>
                </div>
            </div>

            <div className="grid gap-6">
                {groups.length > 0 ? (
                    groups.map(group => (
                        <div key={group.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-blue-600" />
                                        {group.name}
                                    </h2>
                                    <p className="text-sm text-slate-500 mt-1">Managed by {group.ownerName}</p>
                                </div>
                                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                                    Active Member
                                </span>
                            </div>

                            {/* Task Placeholder */}
                            <div className="bg-slate-50 rounded-lg p-8 text-center border border-dashed border-slate-200">
                                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle className="w-6 h-6 text-slate-400" />
                                </div>
                                <h3 className="text-slate-900 font-medium mb-1">No active tasks</h3>
                                <p className="text-slate-500 text-sm">
                                    You're up to date! Check back later for new assignments from your admins.
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                        <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">No joined groups</h3>
                        <p className="text-slate-500">Join a group to see tasks here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

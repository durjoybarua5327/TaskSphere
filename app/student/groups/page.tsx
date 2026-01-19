import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { GroupCard } from "./group-card";
import { GroupsHeader } from "./groups-header";
import { Users, PlusCircle } from "lucide-react";

export default async function GroupsPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    const supabase = await createClient();

    // Fetch all groups with member count
    const { data: groups } = await supabase
        .from("groups")
        .select(`
            *,
            group_members(count)
        `)
        .order("created_at", { ascending: false });

    // Get user's groups
    const { data: userGroups } = await supabase
        .from("group_members")
        .select("group_id, role")
        .eq("user_id", userId);

    const userGroupIds = new Set(userGroups?.map(g => g.group_id) || []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <GroupsHeader />

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <h3 className="text-slate-500 font-medium mb-1">Total Groups</h3>
                    <p className="text-3xl font-bold text-slate-900">{groups?.length || 0}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <h3 className="text-slate-500 font-medium mb-1">Your Groups</h3>
                    <p className="text-3xl font-bold text-indigo-600">{userGroupIds.size}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <h3 className="text-slate-500 font-medium mb-1">Available to Join</h3>
                    <p className="text-3xl font-bold text-emerald-600">
                        {(groups?.length || 0) - userGroupIds.size}
                    </p>
                </div>
            </div>

            {/* Groups List */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="w-1 h-8 bg-indigo-500 rounded-full"></span>
                    All Groups
                </h2>

                {groups && groups.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {groups.map((group) => (
                            <GroupCard
                                key={group.id}
                                group={group}
                                isMember={userGroupIds.has(group.id)}
                                userId={userId}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                        <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600 text-lg font-medium mb-2">No groups yet</p>
                        <p className="text-slate-500 text-sm">Create the first group to get started!</p>
                    </div>
                )}
            </div>
        </div>
    );
}

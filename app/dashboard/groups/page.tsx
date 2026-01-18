import { createClient } from "@/lib/supabase-server";
import { GroupList } from "@/components/groups/GroupList";
import { Search, Users } from "lucide-react";

async function getData() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // Execute queries in parallel
    const [groupsResponse, requestsResponse, membershipsResponse] = await Promise.all([
        supabase
            .from("groups")
            .select(`*, group_members!inner(count), users!top_admin_id(full_name)`),
        supabase
            .from("group_requests")
            .select("group_id, status")
            .eq("user_id", userId),
        supabase
            .from("group_members")
            .select("group_id")
            .eq("user_id", userId)
    ]);

    const groups = groupsResponse.data || [];
    const myRequests = requestsResponse.data || [];
    const myMemberships = membershipsResponse.data || [];

    const processedGroups = groups.map(group => {
        const request = myRequests.find(r => r.group_id === group.id);
        const isMember = myMemberships.some(m => m.group_id === group.id);

        return {
            ...group,
            memberCount: group.group_members?.[0]?.count || 0,
            ownerName: group.users?.full_name || 'Unknown',
            status: isMember ? 'member' : (request?.status || null)
        };
    });

    return processedGroups;
}

export default async function GroupsPage() {
    const groups = await getData();

    return (
        <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Find Your Community</h1>
                        <p className="text-slate-600">Browse available groups and request to join.</p>
                    </div>
                </div>
            </div>

            <GroupList groups={groups} />

            {groups.length === 0 && (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No groups found</h3>
                </div>
            )}
        </div>
    );
}

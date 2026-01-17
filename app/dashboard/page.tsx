import { createClient } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Lock, ArrowRight } from "lucide-react";
import JoinButton from "./JoinButton";

async function getGroups() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // Get all groups
    const { data: groups } = await supabase
        .from("groups")
        .select(`
        *,
        group_members!inner(count), 
        users!top_admin_id(full_name)
    `);

    // Get my requests/memberships to filter/show status
    const { data: myRequests } = await supabase
        .from("group_requests")
        .select("group_id, status")
        .eq("user_id", userId);

    const { data: myMemberships } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", userId);

    return groups?.map(group => {
        const request = myRequests?.find(r => r.group_id === group.id);
        const isMember = myMemberships?.some(m => m.group_id === group.id);

        return {
            ...group,
            memberCount: group.group_members?.[0]?.count || 0,
            ownerName: group.users?.full_name || 'Unknown',
            status: isMember ? 'member' : (request?.status || null)
        };
    }) || [];
}

export default async function DashboardPage() {
    const groups = await getGroups();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Discover Groups</h1>
                <p className="text-slate-500">Find and join communities to start learning.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group) => (
                    <Card key={group.id} className="card-hover-effect">
                        <CardHeader>
                            <CardTitle className="flex justify-between items-start">
                                <span className="truncate">{group.name}</span>
                                <Users className="w-5 h-5 text-slate-400" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[40px]">
                                {group.description || "No description provided."}
                            </p>

                            <div className="flex items-center text-xs text-slate-400 mb-6">
                                <span className="bg-slate-100 px-2 py-1 rounded mr-2">
                                    {group.memberCount} Members
                                </span>
                                <span>By {group.ownerName}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <JoinButton groupId={group.id} currentStatus={group.status} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {groups.length === 0 && (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No groups found</h3>
                    <p className="text-slate-500">Be the first to create one!</p>
                </div>
            )}
        </div>
    );
}

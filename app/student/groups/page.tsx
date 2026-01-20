import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { GroupCard } from "./group-card";
import { GroupsHeader } from "./groups-header";
import { GroupsView } from "./groups-view";
import { Users, PlusCircle } from "lucide-react";

import { isSuperAdmin } from "@/lib/permissions";

export default async function GroupsPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    const supabase = await createClient();
    const [
        { data: groups },
        { data: userGroups },
        isSuperAdminUser
    ] = await Promise.all([
        supabase.from("groups").select("*, group_members(count)").order("created_at", { ascending: false }),
        supabase.from("group_members").select("group_id, role").eq("user_id", userId),
        isSuperAdmin(userId)
    ]);

    const userGroupIds = new Set(userGroups?.map(g => g.group_id) || []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <GroupsHeader isSuperAdmin={isSuperAdminUser} />


            {/* Groups List */}
            <GroupsView
                groups={groups || []}
                myGroupIds={Array.from(userGroupIds)}
                userId={userId}
            />
        </div>
    );
}

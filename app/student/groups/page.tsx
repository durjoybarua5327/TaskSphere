import { getStudentGroupsData } from "./actions";
import { GroupsHeader } from "./groups-header";
import { GroupsView } from "./groups-view";
import { Suspense } from "react";

export const metadata = {
    title: "Groups | TaskSphere",
    description: "Join and manage your collaboration groups",
};

export default async function StudentGroupsPage() {
    const data = await getStudentGroupsData();

    if ("error" in data) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-slate-500">{data.error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-12 pb-24">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
                            Collaboration Groups
                        </h1>
                        <p className="text-slate-500 font-medium max-w-2xl text-lg">
                            Discover and join communities, collaborate on tasks, and track your progress with your peers.
                        </p>
                    </div>
                    <GroupsHeader isSuperAdmin={data.isSuperAdmin} />
                </div>

                <Suspense fallback={<GroupsLoading />}>
                    <GroupsView
                        groups={data.groups}
                        myGroupIds={data.myGroupIds}
                        pendingGroupIds={data.pendingGroupIds}
                        userId={data.userId}
                        isProfileComplete={data.isProfileComplete}
                    />
                </Suspense>
            </div>
        </div>
    );
}

function GroupsLoading() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 rounded-2xl bg-white border border-slate-200 animate-pulse" />
            ))}
        </div>
    );
}

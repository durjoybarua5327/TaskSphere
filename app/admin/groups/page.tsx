import { Suspense } from "react";
import { getAdminGroups } from "../actions";
import { GroupsClient } from "./GroupsClient";

export const metadata = {
    title: "My Groups | Admin Console",
    description: "Manage your assigned groups and communities",
};

export default async function AdminGroupsPage() {
    const { groups } = await getAdminGroups();

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-12 pb-24">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
                        Group Management
                    </h1>
                    <p className="text-slate-500 font-medium max-w-2xl">
                        Manage your assigned communities, update information, and oversee member roles.
                    </p>
                </div>

                <Suspense fallback={<GroupsLoading />}>
                    <GroupsClient initialGroups={groups || []} />
                </Suspense>
            </div>
        </div>
    );
}

function GroupsLoading() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 rounded-[2rem] bg-white border border-slate-100 p-6 flex flex-col gap-4 animate-pulse">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100" />
                    <div className="space-y-2">
                        <div className="h-4 w-3/4 bg-slate-100 rounded-lg" />
                        <div className="h-3 w-1/2 bg-slate-100 rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    );
}

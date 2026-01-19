
import { createClerkSupabaseClient } from "@/lib/supabase-clerk";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import CreateGroupForm from "./create-group-form";

export default async function SuperAdminPage() {
    const { userId } = await auth();
    const supabase = await createClerkSupabaseClient();

    if (!userId) {
        redirect("/sign-in");
    }

    // Double check Superadmin status
    const userObj = await currentUser();
    const email = userObj?.emailAddresses?.[0]?.emailAddress;

    // Direct Allow for specific Admin Email
    if (email === "durjoybarua8115@gmail.com") {
        // Access Granted
    } else {
        const { data: user } = await supabase
            .from("users")
            .select("is_super_admin")
            .eq("id", userId)
            .single();

        if (!user?.is_super_admin) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen text-slate-800">
                    <h1 className="text-4xl font-bold mb-4">403 Forbidden</h1>
                    <p className="text-lg">You do not have permission to access this area.</p>
                </div>
            );
        }
    }
    return (
        <div className="space-y-8">
            <div className="bg-gradient-to-r from-indigo-500/10 to-indigo-600/10 border border-indigo-200 rounded-3xl p-8">
                <h1 className="text-4xl font-bold text-slate-900 mb-4">
                    Welcome back, Super Admin.
                </h1>
                <p className="text-slate-600 text-lg max-w-2xl">
                    You have full control over the platform. Manage users, groups, and system settings from here.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                    <h3 className="text-slate-500 font-medium mb-1">Total Groups</h3>
                    <p className="text-3xl font-bold text-slate-900">12</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                    <h3 className="text-slate-500 font-medium mb-1">Active Students</h3>
                    <p className="text-3xl font-bold text-slate-900">248</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                    <h3 className="text-slate-500 font-medium mb-1">System Status</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-emerald-600 font-medium">Operational</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                        <span className="w-1 h-8 bg-indigo-500 rounded-full"></span>
                        Create New Group
                    </h2>
                    <CreateGroupForm />
                </div>
            </div>
        </div>
    );
}

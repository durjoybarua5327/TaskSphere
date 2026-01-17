
import { createClerkSupabaseClient } from "@/lib/supabase-clerk";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import CreateGroupForm from "./create-group-form";

export default async function SuperAdminPage() {
    const { userId } = await auth();
    const supabase = await createClerkSupabaseClient();

    if (!userId) {
        redirect("/sign-in");
    }

    // Double check Superadmin status
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

    return (
        <div className="container mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold mb-8 text-center">Super Admin Dashboard</h1>
            <CreateGroupForm />
        </div>
    );
}

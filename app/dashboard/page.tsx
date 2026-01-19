import { createClerkSupabaseClient } from "@/lib/supabase-clerk";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const user = await currentUser();

    if (!user) {
        redirect("/sign-in");
    }

    // 1. Hardcoded Super Admin Check (Safety net)
    const email = user.emailAddresses?.[0]?.emailAddress;
    if (email === "durjoybarua8115@gmail.com") {
        redirect("/superadmin");
    }

    const supabase = await createClerkSupabaseClient();

    // 2. Database Role Checks
    try {
        // Check User Profile for Super Admin
        const { data: dbUser } = await supabase
            .from("users")
            .select("is_super_admin")
            .eq("id", user.id)
            .single();

        if (dbUser?.is_super_admin) {
            redirect("/superadmin");
        }

        // Check Group Memberships for Admin/Top Admin roles
        const { data: adminRoles } = await supabase
            .from("group_members")
            .select("role")
            .eq("user_id", user.id)
            .in("role", ["admin", "top_admin"])
            .limit(1);

        if (adminRoles && adminRoles.length > 0) {
            redirect("/admin");
        }

    } catch (error) {
        console.error("Error checking user roles:", error);
        // Fallback or continue to student if error
    }

    // 3. Default to Student Dashboard
    redirect("/student");
}

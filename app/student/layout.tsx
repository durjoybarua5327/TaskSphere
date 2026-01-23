import { auth, currentUser } from "@clerk/nextjs/server";
import { getGlobalRole, syncUserToSupabase } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { StudentLayoutClient } from "./layout-client";

export default async function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
        redirect("/sign-in");
    }

    let role: import("@/lib/permissions").GlobalRole;
    try {
        role = await getGlobalRole(userId);
    } catch (error) {
        console.error("Layout Role Check Error (DB might be unreachable):", error);
        role = 'student'; // Fallback
    }

    // Prevent superadmin and admin from accessing student routes
    if (role === 'super_admin') {
        redirect('/superadmin');
    }
    if (role === 'admin' || role === 'top_admin') {
        redirect('/admin');
    }

    // Sync user data to Supabase (this now safely preserves custom profiles)
    const email = user.emailAddresses[0]?.emailAddress;
    if (email) {
        await syncUserToSupabase(userId, email, {
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            imageUrl: user.imageUrl
        });
    }

    // Fetch the latest profile data from Supabase to ensure the layout shows updated info
    const supabase = createAdminClient();
    const { data: profile } = await supabase
        .from("users")
        .select("full_name, avatar_url")
        .eq("id", userId)
        .single();

    return (
        <StudentLayoutClient
            role={role}
            userId={userId}
            user={{
                imageUrl: profile?.avatar_url || user.imageUrl,
                fullName: profile?.full_name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                email: user.emailAddresses[0]?.emailAddress
            }}
        >
            {children}
        </StudentLayoutClient>
    );
}

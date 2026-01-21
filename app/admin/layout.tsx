import { auth, currentUser } from "@clerk/nextjs/server";
import { getGlobalRole, syncUserToSupabase } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { AdminLayoutClient } from "./layout-client";

export default async function AdminLayout({
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
        console.error("Layout Role Check Error:", error);
        role = 'student';
    }

    // STRICT: Only admin and top_admin can access this route
    if (role !== 'admin' && role !== 'top_admin') {
        if (role === 'super_admin') redirect('/superadmin');
        redirect('/student');
    }

    // Sync user data to Supabase
    const email = user.emailAddresses[0]?.emailAddress;
    if (email) {
        await syncUserToSupabase(userId, email, {
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            imageUrl: user.imageUrl
        });
    }

    return (
        <AdminLayoutClient
            userId={userId}
            user={{
                imageUrl: user.imageUrl,
                fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                email: user.emailAddresses[0]?.emailAddress
            }}
        >
            {children}
        </AdminLayoutClient>
    );
}

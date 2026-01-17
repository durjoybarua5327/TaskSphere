import { createClient } from "@/lib/supabase-server";
import { Navbar } from "@/components/navbar";
import { AdminChatbot } from "@/components/admin-chatbot";
import { getGlobalRole } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const role = await getGlobalRole(user.id);
    const showChatbot = role === 'admin' || role === 'top_admin';

    return (
        <div className="min-h-screen bg-slate-50 relative">
            <Navbar
                user={{
                    name: user.user_metadata.full_name || user.email || 'User',
                    email: user.email!,
                    role: role
                }}
            />

            <main className="container mx-auto px-4 py-8">
                {children}
            </main>

            {showChatbot && <AdminChatbot />}
        </div>
    );
}

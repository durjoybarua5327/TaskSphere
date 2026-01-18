import { auth, currentUser } from "@clerk/nextjs/server";
import { Navbar } from "@/components/navbar";
import { AdminChatbot } from "@/components/admin-chatbot";
import { getGlobalRole } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
        redirect("/sign-in");
    }

    const userEmail = user.emailAddresses[0]?.emailAddress || '';
    const role = await getGlobalRole(userId, userEmail);
    const showChatbot = role === 'admin' || role === 'top_admin';

    return (
        <div className="min-h-screen bg-slate-50 relative">
            <Navbar
                user={{
                    name: user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.emailAddresses[0]?.emailAddress || 'User',
                    email: user.emailAddresses[0]?.emailAddress || '',
                    role: role
                }}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>

            {showChatbot && <AdminChatbot />}
        </div>
    );
}

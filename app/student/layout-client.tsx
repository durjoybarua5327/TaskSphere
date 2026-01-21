"use client";

import { UnifiedNavbar } from "@/components/unified-navbar";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase";

type StudentLayoutClientProps = {
    children: React.ReactNode;
    role: "student" | "admin" | "top_admin" | "super_admin";
    userId: string;
    user: {
        imageUrl: string;
        fullName: string | null;
        email: string | undefined;
    };
};

export function StudentLayoutClient({ children, role, userId, user }: StudentLayoutClientProps) {
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const supabase = createClient();

        const channel = supabase.channel('realtime-roles-student')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'group_members',
                filter: `user_id=eq.${userId}`
            }, () => {
                router.refresh();
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'users',
                filter: `id=eq.${userId}`
            }, () => {
                router.refresh();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, router]);

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <UnifiedNavbar role={role} baseHref="/student" user={user} />

            {/* Main Content Area */}
            <main className="pt-24 pb-20 px-6">
                <div className="max-w-[1400px] mx-auto">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                    >
                        {children}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}

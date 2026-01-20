"use client";

import { UnifiedNavbar } from "@/components/unified-navbar";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

type SuperAdminLayoutClientProps = {
    children: React.ReactNode;
};

export function SuperAdminLayoutClient({ children }: SuperAdminLayoutClientProps) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <UnifiedNavbar role="super_admin" baseHref="/superadmin" />

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

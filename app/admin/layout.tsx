"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { ProfileDropdown } from "@/components/profile-dropdown";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Navbar */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">



                        {/* Logo/Brand */}
                        <Link href="/admin" className="flex items-center gap-2">
                            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                TaskSphere
                            </span>
                        </Link>

                        {/* User Menu */}
                        <ProfileDropdown role="Admin" />
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main>
                {children}
            </main>
        </div>
    );
}

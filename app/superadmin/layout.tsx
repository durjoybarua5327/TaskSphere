"use client";

import Link from "next/link";
import { Home, Users, ShieldCheck, UserCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { ProfileDropdown } from "@/components/profile-dropdown";

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Navbar */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo/Brand */}
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                                <ShieldCheck className="text-white w-5 h-5" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-800">
                                SuperAdmin
                            </span>
                        </div>

                        {/* Navigation Links */}
                        <div className="hidden md:flex items-center gap-1">
                            <NavLink href="/superadmin" icon={<Home className="w-4 h-4" />} label="Home" active={pathname === "/superadmin"} />
                            <NavLink href="/superadmin/groups" icon={<Users className="w-4 h-4" />} label="Groups" active={pathname.startsWith("/superadmin/groups")} />
                            <NavLink href="/superadmin/admins" icon={<ShieldCheck className="w-4 h-4" />} label="Admins" active={pathname.startsWith("/superadmin/admins")} />
                            <NavLink href="/superadmin/profile" icon={<UserCircle className="w-4 h-4" />} label="Profile" active={pathname.startsWith("/superadmin/profile")} />
                        </div>

                        {/* User Menu */}
                        <ProfileDropdown role="Super Admin" />
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}

function NavLink({
    href,
    icon,
    label,
    active
}: {
    href: string;
    icon: React.ReactNode;
    label: string;
    active: boolean;
}) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${active
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
        >
            {icon}
            <span>{label}</span>
        </Link>
    );
}

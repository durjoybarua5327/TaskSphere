"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Users,
    ShieldCheck,
    UserCircle,
    MessageSquare,
    Home,
    Menu,
    X,
    CheckSquare
} from "lucide-react";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NotificationPopover } from "@/components/notification-popover";

type UnifiedNavbarProps = {
    role?: "student" | "admin" | "top_admin" | "super_admin";
    baseHref?: string;
    user: {
        imageUrl: string;
        fullName: string | null;
        email: string | undefined;
    };
};

export function UnifiedNavbar({ role = "student", baseHref = "/student", user }: UnifiedNavbarProps) {
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = (e: any) => {
            const scrollTop = e.target === window || e.target === document
                ? window.scrollY
                : (e.target as HTMLElement).scrollTop;
            setScrolled(scrollTop > 20);
        };

        window.addEventListener("scroll", handleScroll, true);
        return () => window.removeEventListener("scroll", handleScroll, true);
    }, []);

    // Define navigation items based on role
    const getNavItems = () => {
        const commonItems = [
            { href: `${baseHref}`, icon: Home, label: "Home" },
            { href: `${baseHref}/groups`, icon: Users, label: "Groups" },
            { href: `${baseHref}/messages`, icon: MessageSquare, label: "Messages" },
        ];

        if (role === "super_admin") {
            return [
                ...commonItems,
                { href: `${baseHref}/admins`, icon: ShieldCheck, label: "Manage Admins" },
                { href: `${baseHref}/profile`, icon: UserCircle, label: "Profile" },
            ];
        }

        // For student, admin, top_admin
        return [
            ...commonItems,
            { href: `${baseHref}/tasks`, icon: CheckSquare, label: "Tasks" },
            { href: `${baseHref}/profile`, icon: UserCircle, label: "Profile" },
        ];
    };

    const navItems = getNavItems();

    const getRoleLabel = () => {
        if (role === "super_admin") return "Global Admin";
        if (role === "top_admin") return "Top Admin";
        if (role === "admin") return "Admin";
        return "Student";
    };

    return (
        <>
            {/* Top Navbar */}
            <header
                className={`fixed top-0 left-0 w-screen z-[100] transition-all duration-500 ${scrolled
                    ? "bg-white/95 backdrop-blur-2xl border-b border-slate-200/80 py-3 shadow-lg shadow-slate-900/5"
                    : "bg-white/98 py-4 border-b border-slate-100/50 shadow-sm"
                    }`}
            >
                <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between gap-4">
                    {/* Logo Section */}
                    <Link href={baseHref} className="flex items-center group shrink-0 relative">
                        <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-green-900 via-green-600 to-green-400 bg-clip-text text-transparent relative">
                            TaskSphere
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-green-600 to-green-400 group-hover:w-full transition-all duration-500"></span>
                        </span>
                    </Link>

                    {/* Navigation Items - Desktop */}
                    <nav className="hidden lg:flex items-center gap-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-2xl transition-all duration-300 group ${isActive
                                        ? "text-green-700 shadow-md shadow-green-100"
                                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                        }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-pill"
                                            className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <Icon className={`w-4 h-4 relative z-10 transition-transform group-hover:scale-110 ${isActive ? "text-green-600" : ""}`} />
                                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] relative z-10">
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Actions Panel */}
                    <div className="flex items-center gap-4">
                        <NotificationPopover />

                        <div className="h-8 w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent hidden sm:block"></div>

                        <div className="sm:block">
                            <ProfileDropdown role={getRoleLabel()} user={user} />
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden p-3 text-slate-600 hover:bg-slate-100 rounded-2xl transition-all hover:shadow-md active:scale-95"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Navigation Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-x-0 top-[73px] z-[110] lg:hidden bg-white/98 backdrop-blur-xl border-b border-slate-200 shadow-2xl"
                    >
                        <div className="p-6">
                            <nav className="flex flex-col gap-2">
                                {navItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center gap-4 p-4 rounded-2xl transition-all shadow-sm ${isActive
                                                ? "bg-gradient-to-br from-green-50 to-emerald-50 text-green-700 border border-green-100 shadow-md"
                                                : "text-slate-600 hover:bg-slate-50 border border-transparent"
                                                }`}
                                        >
                                            <Icon className={`w-5 h-5 ${isActive ? "text-green-600" : ""}`} />
                                            <span className="text-sm font-bold uppercase tracking-wider">{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

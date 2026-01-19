"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Users,
    ShieldCheck,
    UserCircle,
    MessageSquare,
    Home,
    Bell,
    Menu,
    X
} from "lucide-react";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NotificationPopover } from "@/components/notification-popover";

type SuperAdminLayoutProps = {
    children: React.ReactNode;
};

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navItems = [
        { href: "/superadmin", icon: Home, label: "Home" },
        { href: "/superadmin/groups", icon: Users, label: "Groups" },
        { href: "/superadmin/messages", icon: MessageSquare, label: "Messages" },
        { href: "/superadmin/admins", icon: ShieldCheck, label: "Manage Admins" },
        { href: "/superadmin/profile", icon: UserCircle, label: "Profile" },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Top Navbar */}
            <header
                className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${scrolled
                    ? "bg-white/90 backdrop-blur-xl border-b border-slate-200 py-3 shadow-sm"
                    : "bg-white py-4 border-b border-transparent"
                    }`}
            >
                <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between gap-4">
                    {/* Logo Section - Matching provided image */}
                    <Link href="/superadmin" className="flex items-center group shrink-0">
                        <span className="font-extrabold text-2xl tracking-tight text-[#00897B]">
                            TaskSphere
                        </span>
                    </Link>

                    {/* Navigation Items - Desktop */}
                    <nav className="hidden lg:flex items-center gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 group ${isActive
                                        ? "text-[#00897B]"
                                        : "text-slate-500 hover:text-slate-900"
                                        }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-pill"
                                            className="absolute inset-0 bg-[#00897B]/5 rounded-xl"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <Icon className={`w-3.5 h-3.5 relative z-10 ${isActive ? "text-[#00897B]" : ""}`} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.15em] relative z-10">
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Actions Panel */}
                    <div className="flex items-center gap-3">
                        <NotificationPopover />

                        <div className="h-6 w-px bg-slate-100 hidden sm:block mx-1" />

                        <div className="sm:block">
                            <ProfileDropdown role="Global Admin" />
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden p-2.5 text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
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
                        className="fixed inset-x-0 top-[73px] z-[110] lg:hidden bg-white border-b border-slate-200 shadow-xl"
                    >
                        <div className="p-4">
                            <nav className="flex flex-col gap-1">
                                {navItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? "bg-[#00897B]/5 text-[#00897B]" : "text-slate-500"
                                                }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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

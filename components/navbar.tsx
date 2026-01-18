"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { User, LogOut, Settings, Bell, Search, Menu, X, Home, Users, CheckSquare, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import type { GlobalRole } from "@/lib/permissions";

interface NavbarProps {
    user: {
        name: string;
        email: string;
        avatarUrl?: string;
        role: GlobalRole;
    };
}

export function Navbar({ user }: NavbarProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const pathname = usePathname();

    const getNavLinks = () => {
        const commonLinks = [
            { href: "/dashboard", label: "Home", icon: Home },
            { href: "/dashboard/groups", label: "Groups", icon: Users },
            { href: "/dashboard/tasks", label: "Tasks", icon: CheckSquare },
            { href: "/dashboard/profile", label: "Profile", icon: User },
        ];

        if (user.role === 'super_admin') {
            return [
                ...commonLinks,
                { href: "/dashboard/admins", label: "Dashboard Admins", icon: Users },
            ];
        }

        return commonLinks;
    };

    const navLinks = getNavLinks();

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const toggleProfile = () => setIsProfileOpen(!isProfileOpen);

    return (
        <nav className="bg-white border-b sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-1">
                        <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">TaskSphere</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-emerald-50 text-emerald-700"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right Side: Profile */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button
                                onClick={toggleProfile}
                                className="flex items-center gap-2 focus:outline-none"
                            >
                                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200">
                                    <span className="font-semibold text-emerald-700">
                                        {user.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </button>

                            {/* Profile Dropdown */}
                            {isProfileOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsProfileOpen(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="px-3 py-2 border-b border-slate-100 mb-2">
                                            <p className="font-medium text-slate-900 truncate">{user.name}</p>
                                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">
                                                {user.role.replace('_', ' ')}
                                            </p>
                                        </div>

                                        <SignOutButton>
                                            <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                <LogOut className="w-4 h-4" />
                                                Sign Out
                                            </button>
                                        </SignOutButton>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md"
                            onClick={toggleMenu}
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Nav */}
            {isMenuOpen && (
                <div className="md:hidden border-t bg-white px-4 py-4 space-y-2">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <Icon className="w-5 h-5" />
                                {link.label}
                            </Link>
                        );
                    })}
                </div>
            )}
        </nav>
    );
}

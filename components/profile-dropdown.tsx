"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { LogOut, User, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ProfileDropdownProps {
    role: string;
}

export function ProfileDropdown({ role }: ProfileDropdownProps) {
    const { user } = useUser();
    const { signOut } = useClerk();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        await signOut();
        router.push("/");
    };

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Profile Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-2 rounded-2xl hover:bg-slate-50 transition-all duration-300 hover:shadow-md active:scale-95"
            >
                <img
                    src={user.imageUrl}
                    alt={user.fullName || "Profile"}
                    className="w-10 h-10 rounded-full border-2 border-slate-100 shadow-sm ring-2 ring-white"
                />
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                    {/* User Info Section */}
                    <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-br from-slate-50/50 to-transparent">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <img
                                    src={user.imageUrl}
                                    alt={user.fullName || "Profile"}
                                    className="w-14 h-14 rounded-2xl border-2 border-green-100 shadow-md"
                                />
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-base font-bold text-slate-900 truncate">
                                    {user.fullName || "User"}
                                </p>
                                <p className="text-sm text-slate-500 truncate">
                                    {user.primaryEmailAddress?.emailAddress}
                                </p>
                            </div>
                        </div>
                    </div>



                    {/* Menu Items */}
                    <div className="py-3 px-3">
                        <div className="px-4 py-3 flex items-center gap-4 text-sm text-slate-700 bg-slate-50/80 rounded-2xl">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md shadow-green-200">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Role</p>
                                <p className="text-sm font-bold text-green-700">{role}</p>
                            </div>
                        </div>
                    </div>

                    {/* Sign Out Button */}
                    <div className="border-t border-slate-100 pt-2 px-3 pb-2">
                        <button
                            onClick={handleSignOut}
                            className="w-full px-5 py-3 flex items-center gap-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-2xl transition-all hover:shadow-md active:scale-95"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

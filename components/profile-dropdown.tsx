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
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
                <img
                    src={user.imageUrl}
                    alt={user.fullName || "Profile"}
                    className="w-9 h-9 rounded-full border-2 border-slate-200"
                />
                <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                    {/* User Info Section */}
                    <div className="px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <img
                                src={user.imageUrl}
                                alt={user.fullName || "Profile"}
                                className="w-12 h-12 rounded-full border-2 border-indigo-500"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">
                                    {user.fullName || "User"}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                    {user.primaryEmailAddress?.emailAddress}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                        <div className="px-4 py-2 flex items-center gap-3 text-sm text-slate-700">
                            <User className="w-4 h-4 text-slate-400" />
                            <div>
                                <p className="text-xs text-slate-500">Role</p>
                                <p className="text-sm font-medium text-indigo-600">{role}</p>
                            </div>
                        </div>
                    </div>

                    {/* Sign Out Button */}
                    <div className="border-t border-slate-100 pt-2">
                        <button
                            onClick={handleSignOut}
                            className="w-full px-4 py-2 flex items-center gap-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

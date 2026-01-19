"use client";

import { Button } from "@/components/ui/button";
import { Menu, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Image from "next/image";

export function GlobalNavbar() {
    const { isSignedIn } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
        e.preventDefault();
        setMobileMenuOpen(false);

        // Only scroll to section if on home page
        if (pathname === '/') {
            const element = document.querySelector(targetId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else {
            // Navigate to home page with hash
            window.location.href = `/${targetId}`;
        }
    };

    // Hide Navbar on specific authenticated routes
    if (
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/superadmin') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/student')
    ) {
        return null;
    }

    const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (pathname === '/') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
            ? 'bg-white/98 backdrop-blur-xl shadow-lg border-b border-slate-200'
            : 'bg-white/90 backdrop-blur-md border-b border-slate-100'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                <Link href="/" onClick={handleLogoClick} className="flex items-center gap-2">
                    <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">TaskSphere</span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
                    <a href="#features" onClick={(e) => handleNavClick(e, '#features')} className="text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">
                        Features
                    </a>
                    <a href="#how-it-works" onClick={(e) => handleNavClick(e, '#how-it-works')} className="text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">
                        How it works
                    </a>
                    <a href="#about" onClick={(e) => handleNavClick(e, '#about')} className="text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">
                        About
                    </a>
                </nav>

                <div className="hidden md:flex items-center gap-3">
                    {isSignedIn ? (
                        <Link href="/dashboard">
                            <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium">
                                Dashboard
                                <ArrowRight className="ml-1 w-3.5 h-3.5" />
                            </Button>
                        </Link>
                    ) : (
                        <>
                            <Link href="/sign-in">
                                <Button variant="ghost" size="sm" className="text-sm font-medium">
                                    Sign in
                                </Button>
                            </Link>
                            <Link href="/sign-up">
                                <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium">
                                    Sign up
                                    <ArrowRight className="ml-1 w-3.5 h-3.5" />
                                </Button>
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t bg-white">
                    <nav className="px-4 py-3 flex flex-col gap-2">
                        <a href="#features" onClick={(e) => handleNavClick(e, '#features')} className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg cursor-pointer">
                            Features
                        </a>
                        <a href="#about" onClick={(e) => handleNavClick(e, '#about')} className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg cursor-pointer">
                            About
                        </a>
                        {isSignedIn ? (
                            <Link href="/dashboard" className="px-3 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg text-center flex items-center justify-center gap-2">
                                Dashboard
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <>
                                <Link href="/sign-in" className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg">
                                    Log In
                                </Link>
                                <Link href="/sign-up" className="px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg text-center">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
}

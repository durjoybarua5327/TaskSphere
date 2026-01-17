import { Bot } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left: Branding */}
            <div className="hidden lg:flex flex-col bg-slate-900 text-white p-12 justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-900 z-0" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-bold text-2xl tracking-tight">TaskSphere</span>
                </div>

                <div className="relative z-10 max-w-lg">
                    <h2 className="text-4xl font-bold mb-6">
                        Everything you need to manage your club.
                    </h2>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        "TaskSphere has revolutionized how we manage assignments and grading. The AI integration is a game-changer."
                    </p>
                </div>

                <div className="relative z-10 text-sm text-slate-500">
                    © 2024 TaskSphere Inc.
                </div>
            </div>

            {/* Right: Form */}
            <div className="flex items-center justify-center p-8 bg-slate-50">
                <div className="w-full max-w-md space-y-8">
                    {children}
                </div>
            </div>
        </div>
    );
}

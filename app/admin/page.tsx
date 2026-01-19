import { currentUser } from "@clerk/nextjs/server";
import { LayoutDashboard, Users, Trophy } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
    const user = await currentUser();

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto space-y-12">
                <div className="text-center space-y-4 pt-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                        Admin <span className="text-emerald-600">Dashboard</span>
                    </h1>
                    <p className="text-xl text-slate-600">
                        Manage your groups and monitor student progress, {user?.firstName}.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Link href="/groups" className="group">
                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 h-full">
                            <div className="h-14 w-14 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <LayoutDashboard className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Manage Groups</h3>
                            <p className="text-slate-500">
                                Create, update, and oversee your learning groups and their activities.
                            </p>
                        </div>
                    </Link>

                    <Link href="/groups" className="group">
                        {/* Placeholder relative link or create specific admin sub-routes later */}
                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 h-full">
                            <div className="h-14 w-14 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Users className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Student Members</h3>
                            <p className="text-slate-500">
                                Review student performance, approve requests, and manage roles.
                            </p>
                        </div>
                    </Link>

                    <Link href="/tasks" className="group">
                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 h-full">
                            <div className="h-14 w-14 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Trophy className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Tasks & Grading</h3>
                            <p className="text-slate-500">
                                Create assignments and grade submissions with AI assistance.
                            </p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}

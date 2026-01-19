import { currentUser } from "@clerk/nextjs/server";
import { MoveRight } from "lucide-react";
import Link from "next/link";

export default async function StudentDashboard() {
    const user = await currentUser();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-2xl w-full text-center space-y-8">
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                        Student <span className="text-indigo-600">Portal</span>
                    </h1>
                    <p className="text-xl text-slate-600">
                        Welcome back, {user?.firstName || "Student"}. Your learning journey continues here.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 transform transition-all hover:scale-105 duration-300">
                    <div className="h-32 w-32 bg-indigo-100 rounded-full mx-auto flex items-center justify-center mb-6">
                        <span className="text-4xl">🎓</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Ready to learn?</h2>
                    <p className="text-slate-500 mb-8">
                        View your groups, complete tasks, and track your progress.
                    </p>
                    <Link
                        href="/groups"
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors w-full sm:w-auto"
                    >
                        Go to My Groups
                        <MoveRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { MessageSquare, Send, Bot } from "lucide-react";
import Link from "next/link";
import { RequestCard } from "./request-card";

export default async function MessagesPage() {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
        redirect("/sign-in");
    }

    const userEmail = user.emailAddresses[0]?.emailAddress || '';
    const userName = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : userEmail;

    // Fetch user's own requests
    const supabase = await createClient();
    const { data: requests, error } = await supabase
        .from("group_creation_messages")
        .select("*")
        .eq("sender_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching requests:", error);
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-600/10 border border-emerald-200 rounded-3xl p-8">
                <div className="flex items-center gap-4 mb-4">
                    <MessageSquare className="w-10 h-10 text-emerald-600" />
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900">
                            Group Creation Requests
                        </h1>
                        <p className="text-slate-600 text-lg mt-2">
                            Request to create a new group and become its Top Admin
                        </p>
                    </div>
                </div>
            </div>

            {/* Create New Request */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/dashboard/messages/new?method=manual">
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-lg transition-all cursor-pointer h-full">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                                <Send className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">
                                    Manual Request
                                </h3>
                                <p className="text-slate-600 text-sm">
                                    Fill out a form with group details and submit directly to the super admin
                                </p>
                            </div>
                        </div>
                    </div>
                </Link>

                <Link href="/dashboard/messages/new?method=ai">
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-8 hover:shadow-lg transition-all cursor-pointer h-full">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <Bot className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                                    AI-Assisted Request
                                    <span className="text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded-full">NEW</span>
                                </h3>
                                <p className="text-slate-600 text-sm">
                                    Chat with AI to build your request step-by-step with intelligent guidance
                                </p>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Your Requests */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="w-1 h-8 bg-emerald-500 rounded-full"></span>
                    Your Requests ({requests?.length || 0})
                </h2>

                {requests && requests.length > 0 ? (
                    <div className="space-y-4">
                        {requests.map((request) => (
                            <RequestCard key={request.id} request={request} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                        <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600 text-lg font-medium mb-2">
                            No requests yet
                        </p>
                        <p className="text-slate-500 text-sm">
                            Create your first group creation request using one of the options above
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

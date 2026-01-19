import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Send } from "lucide-react";
import { ManualRequestForm } from "./manual-form";
import { AIChatInterface } from "./ai-chat-interface";

export default async function NewRequestPage({
    searchParams,
}: {
    searchParams: Promise<{ method?: string }>;
}) {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
        redirect("/sign-in");
    }

    const params = await searchParams;
    const method = params.method || "manual";
    const isAiMethod = method === "ai";

    const userEmail = user.emailAddresses[0]?.emailAddress || '';
    const userName = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : userEmail;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-600/10 border border-indigo-200 rounded-3xl p-8">
                <h1 className="text-4xl font-bold text-slate-900 mb-2">
                    {isAiMethod ? "🤖 AI-Assisted Request" : "📝 Create Group Request"}
                </h1>
                <p className="text-slate-600 text-lg">
                    {isAiMethod
                        ? "Chat with our AI to build your group creation request step by step"
                        : "Fill out the form below to request a new group"}
                </p>
            </div>

            {/* Form or AI Chat */}
            {isAiMethod ? (
                <AIChatInterface
                    userId={userId}
                    userName={userName}
                    userEmail={userEmail}
                />
            ) : (
                <ManualRequestForm
                    userId={userId}
                    userName={userName}
                    userEmail={userEmail}
                />
            )}
        </div>
    );
}

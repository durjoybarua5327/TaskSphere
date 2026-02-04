"use server";

import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";

export async function askGroupAI(groupId: string, userMessage: string, chatHistory: { role: "user" | "ai", content: string }[]) {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    const supabase = createAdminClient();

    // 1. Verify membership
    const { data: member, error: memberError } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .single();

    if (memberError || !member) {
        throw new Error("You are not a member of this group.");
    }

    // 2. Fetch Group Info
    const { data: group } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

    // 3. Fetch Tasks
    const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("group_id", groupId);

    // 4. Fetch User's Submissions & Scores
    const { data: submissions } = await supabase
        .from("submissions")
        .select(`
            *,
            scores (
                score_value,
                feedback
            )
        `)
        .eq("student_id", userId)
        .in("task_id", (tasks || []).map(t => t.id));

    // 5. Construct Context
    const context = {
        groupName: group?.name,
        groupDescription: group?.description,
        tasks: (tasks || []).map(t => {
            const sub = submissions?.find(s => s.task_id === t.id);
            return {
                title: t.title,
                maxScore: t.max_score,
                deadline: t.deadline,
                status: sub ? "submitted" : "pending",
                score: sub?.scores?.[0]?.score_value || null,
                feedback: sub?.scores?.[0]?.feedback || null,
                submittedAt: sub?.submitted_at || null
            };
        }),
        userPerformance: {
            totalTasks: tasks?.length || 0,
            submittedCount: submissions?.length || 0,
            pendingCount: (tasks?.length || 0) - (submissions?.length || 0)
        }
    };

    // 6. Call AI
    const systemPrompt = `
You are the TaskSphere AI Assistant for the group "${context.groupName}".
Your goal is to ONLY help the student understand their own progress and performance.

ALLOWED TOPICS:
1. Which tasks haven't I solved yet? (Pending tasks)
2. What is my average score in this group?
3. What is my highest score?
4. Show me a summary of my progress.

STRICT CONSTRAINTS:
- ONLY discuss the current student's data.
- NEVER provide or leak information about other students.
- DO NOT answer general questions or questions about other topics.
- If the user asks about anything not in the ALLOWED TOPICS list, or asks about other students, politely respond that you can only help with their personal progress and scores in this group.

CONTEXT DATA:
${JSON.stringify(context, null, 2)}
`;

    const groq = createGroq({
        apiKey: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY
    });

    const { text } = await generateText({
        model: groq("llama-3.3-70b-versatile"),
        system: systemPrompt,
        messages: chatHistory.map(m => ({
            role: (m.role === "ai" ? "assistant" : "user") as "user" | "assistant",
            content: m.content
        })).concat([{ role: "user", content: userMessage }]),
    });

    return { response: text };
}

"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

// Manual request submission
export async function submitManualRequest({
    userId,
    userName,
    userEmail,
    groupName,
    description,
    subjectArea,
    expectedMembers,
    justification,
}: {
    userId: string;
    userName: string;
    userEmail: string;
    groupName: string;
    description: string;
    subjectArea: string;
    expectedMembers: number | null;
    justification: string;
}) {
    const { userId: authUserId } = await auth();

    if (!authUserId || authUserId !== userId) {
        throw new Error("Unauthorized");
    }

    const supabase = await createClient();

    const { error } = await supabase
        .from("group_creation_messages")
        .insert({
            sender_id: userId,
            sender_name: userName,
            sender_email: userEmail,
            requested_group_name: groupName,
            group_description: description || null,
            subject_area: subjectArea || null,
            expected_members_count: expectedMembers,
            justification: justification,
            status: "pending",
            creation_method: "manual",
        });

    if (error) {
        console.error("Error creating request:", error);
        throw new Error("Failed to submit request");
    }

    revalidatePath("/dashboard/messages");
    return { success: true };
}

// AI Conversation Management
const AI_QUESTIONS = [
    "What would you like to name your group? Please provide a descriptive and unique name.",
    "What subject area or field does this group focus on? (e.g., Computer Science, Physics, Literature)",
    "Can you describe the purpose and goals of this group? What will members do or learn?",
    "How many members do you expect will join this group?",
    "Why do you believe this group should be created? What value will it provide to its members?",
];

export async function startAIConversation(userId: string, userName: string) {
    const { userId: authUserId } = await auth();

    if (!authUserId || authUserId !== userId) {
        throw new Error("Unauthorized");
    }

    const supabase = await createClient();

    // Create initial message record
    const { data: message, error: messageError } = await supabase
        .from("group_creation_messages")
        .insert({
            sender_id: userId,
            sender_name: userName,
            sender_email: "", // Will be filled when submitting
            requested_group_name: "Pending",
            status: "pending",
            creation_method: "ai_assisted",
            ai_conversation: { qa_pairs: [], current_step: 0 },
        })
        .select()
        .single();

    if (messageError || !message) {
        throw new Error("Failed to create conversation");
    }

    // Create AI session
    const { data: session, error: sessionError } = await supabase
        .from("ai_conversation_sessions")
        .insert({
            message_id: message.id,
            user_id: userId,
            current_step: 1,
            total_steps: AI_QUESTIONS.length,
            is_completed: false,
            questions_answers: { pairs: [] },
        })
        .select()
        .single();

    if (sessionError || !session) {
        throw new Error("Failed to create AI session");
    }

    return {
        sessionId: session.id,
        firstMessage: `Hello ${userName}! 👋 I'm here to help you create a group creation request.\n\nI'll ask you a few questions to understand what kind of group you'd like to create. Let's get started!\n\n${AI_QUESTIONS[0]}`,
    };
}

export async function sendAIMessage(sessionId: string, userMessage: string) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    const supabase = await createClient();

    // Get session
    const { data: session } = await supabase
        .from("ai_conversation_sessions")
        .select("*, group_creation_messages(*)")
        .eq("id", sessionId)
        .single();

    if (!session || session.user_id !== userId) {
        throw new Error("Session not found");
    }

    const currentStep = session.current_step;
    const qa_pairs = session.questions_answers?.pairs || [];

    // Store the Q&A
    qa_pairs.push({
        question: AI_QUESTIONS[currentStep - 1],
        answer: userMessage,
        step: currentStep,
    });

    const isComplete = currentStep >= AI_QUESTIONS.length;

    let aiResponse = "";
    let collectedData: any = null;

    if (!isComplete) {
        // Ask next question
        aiResponse = `Great! ${AI_QUESTIONS[currentStep]}`;

        // Update session
        await supabase
            .from("ai_conversation_sessions")
            .update({
                current_step: currentStep + 1,
                questions_answers: { pairs: qa_pairs },
            })
            .eq("id", sessionId);
    } else {
        // All questions answered - generate summary
        const answers = {
            groupName: qa_pairs[0]?.answer || "",
            subjectArea: qa_pairs[1]?.answer || "",
            description: qa_pairs[2]?.answer || "",
            expectedMembers: qa_pairs[3]?.answer || "",
            justification: qa_pairs[4]?.answer || "",
        };

        try {
            const { text: summary } = await generateText({
                model: openai("gpt-4o-mini"),
                prompt: `Based on the following group creation request, write a concise 2-3 sentence summary:
                
Group Name: ${answers.groupName}
Subject: ${answers.subjectArea}
Purpose: ${answers.description}
Expected Members: ${answers.expectedMembers}
Justification: ${answers.justification}

Write a professional summary highlighting the key aspects of this group.`,
            });

            collectedData = {
                ...answers,
                aiSummary: summary,
            };

            aiResponse = `Perfect! I've collected all the information needed. Here's a summary of your group request:

📋 **Summary:**
${summary}

**Group Name:** ${answers.groupName}
**Subject Area:** ${answers.subjectArea}

Click the button below to submit your request to the Super Admin for review!`;

            // Update session as complete
            await supabase
                .from("ai_conversation_sessions")
                .update({
                    is_completed: true,
                    questions_answers: { pairs: qa_pairs },
                })
                .eq("id", sessionId);
        } catch (error) {
            console.error("Error generating summary:", error);
            collectedData = answers;
            aiResponse = `Perfect! I've collected all the information. Click the button below to submit your request!`;

            await supabase
                .from("ai_conversation_sessions")
                .update({
                    is_completed: true,
                    questions_answers: { pairs: qa_pairs },
                })
                .eq("id", sessionId);
        }
    }

    // Update the message with conversation
    await supabase
        .from("group_creation_messages")
        .update({
            ai_conversation: { qa_pairs },
        })
        .eq("id", session.message_id);

    return {
        aiResponse,
        isComplete,
        collectedData,
    };
}

export async function submitAIRequest(
    sessionId: string,
    userId: string,
    userName: string,
    userEmail: string,
    collectedData: any
) {
    const { userId: authUserId } = await auth();

    if (!authUserId || authUserId !== userId) {
        throw new Error("Unauthorized");
    }

    const supabase = await createClient();

    // Get session to find message
    const { data: session } = await supabase
        .from("ai_conversation_sessions")
        .select("message_id")
        .eq("id", sessionId)
        .single();

    if (!session) {
        throw new Error("Session not found");
    }

    // Update the message with final data
    const { error } = await supabase
        .from("group_creation_messages")
        .update({
            sender_email: userEmail,
            requested_group_name: collectedData.groupName,
            group_description: collectedData.description,
            subject_area: collectedData.subjectArea,
            expected_members_count: collectedData.expectedMembers
                ? parseInt(collectedData.expectedMembers)
                : null,
            justification: collectedData.justification,
            ai_summary: collectedData.aiSummary || null,
        })
        .eq("id", session.message_id);

    if (error) {
        console.error("Error updating message:", error);
        throw new Error("Failed to submit request");
    }

    revalidatePath("/dashboard/messages");
    return { success: true };
}

"use server";

import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { generateText } from "ai";
import { defaultModel } from "@/lib/ai";

export async function getSuperAdmin() {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("users")
        .select("id, full_name, avatar_url, email")
        .eq("is_super_admin", true)
        .limit(1)
        .single();

    if (error) {
        console.error("Error fetching super admin:", error);
        return null;
    }
    return data;
}

export async function sendDirectMessage(receiverId: string, content: string, isAiResponse: boolean = false) {
    console.log(`Action: Sending direct message to ${receiverId}, isAi: ${isAiResponse}`);
    const { userId } = await auth();
    if (!userId) {
        console.error("Action: Not authenticated");
        return { error: "Not authenticated", success: false };
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("messages")
        .insert({
            sender_id: userId,
            receiver_id: receiverId,
            content: content.trim(),
            is_ai_response: isAiResponse,
            is_read: false
        })
        .select()
        .single();

    if (error) {
        console.error("Error sending direct message:", error);
        return { error: error.message, success: false };
    }

    // If a non-superadmin sends a message to a superadmin, and it's NOT an AI response
    // Trigger AI logic
    if (!isAiResponse) {
        const { data: receiver } = await supabase.from("users").select("is_super_admin").eq("id", receiverId).single();
        if (receiver?.is_super_admin) {
            // In a real app, you'd queue this or run it in background
            await processAiResponse(userId, content);
        }
    }

    revalidatePath("/superadmin/messages");
    return { success: true, message: data };
}

async function processAiResponse(userId: string, userMessage: string) {
    try {
        const supabase = createAdminClient();

        // Check if AI is enabled for this user
        const { data: userData } = await supabase
            .from("users")
            .select("ai_enabled")
            .eq("id", userId)
            .single();

        if (userData?.ai_enabled === false) {
            console.log(`AI: Disabled for user ${userId}`);
            return;
        }

        console.log(`AI: Processing intelligent response for user ${userId}`);

        // Get conversation history
        const { data: history, error: historyError } = await supabase
            .from("messages")
            .select("*")
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order("created_at", { ascending: false })
            .limit(15);

        if (historyError) throw historyError;

        const msg = userMessage.toLowerCase();

        // Human-admin bypass
        if (msg.includes("admin") || msg.includes("superadmin") || msg.startsWith("@")) {
            return;
        }

        // Prepare conversation for LLM
        const lastMessages = history?.reverse() || [];
        const promptMessages = lastMessages.map(m => ({
            role: (m.is_ai_response || m.sender_id !== userId) ? 'assistant' : 'user' as const,
            content: m.content
        }));

        // Add current message if not yet in history
        if (promptMessages.length === 0 || promptMessages[promptMessages.length - 1].content !== userMessage) {
            promptMessages.push({ role: 'user', content: userMessage });
        }

        const systemPrompt = `
            You are the TaskSphere AI Assistant representing the Superadmin.
            Goals:
            1. Help with platform questions professionally.
            2. If the user wants a NEW GROUP (keywords: create group, new group), guide them through these 5 steps: Name, Description, Department, Members, and Justification.
            3. Once ALL 5 are collected, say: "Excellent! I have collected all the necessary information. I'm submitting your group creation request to the Superadmin now."
            4. Append the tag [SUBMIT_GROUP_REQUEST] ONLY at the very end of your final confirmation message.
            
            Be helpful, professional, and concise. Respond in plain text.
        `;

        const { text: aiResponse } = await generateText({
            model: defaultModel,
            system: systemPrompt,
            messages: promptMessages as any,
        });

        if (aiResponse) {
            const { data: superAdmin } = await supabase.from("users").select("id").eq("is_super_admin", true).limit(1).single();
            if (superAdmin) {
                const cleanedResponse = aiResponse.replace("[SUBMIT_GROUP_REQUEST]", "").trim();

                await supabase.from("messages").insert({
                    sender_id: superAdmin.id,
                    receiver_id: userId,
                    content: cleanedResponse,
                    is_ai_response: true
                });

                if (aiResponse.includes("[SUBMIT_GROUP_REQUEST]")) {
                    const { data: userData } = await supabase.from("users").select("*").eq("id", userId).single();
                    await supabase.from("group_creation_messages").insert({
                        sender_id: userId,
                        sender_name: userData?.full_name || "Unknown",
                        sender_email: userData?.email || "Unknown",
                        requested_group_name: "Group Request (AI Processed)",
                        group_description: "Request collected via intelligent chat.",
                        creation_method: "ai_assisted",
                        status: "pending",
                        metadata: { history: promptMessages }
                    });
                }
            }
        }
    } catch (err) {
        console.error("AI: processAiResponse failed:", err);
    }
}

export async function getDirectMessages(otherUserId: string) {
    console.log(`Action: Fetching direct messages for ${otherUserId}`);
    const { userId } = await auth();
    if (!userId) {
        console.error("Action: Not authenticated");
        return { error: "Not authenticated", messages: [] };
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("messages")
        .select(`
            *,
            sender:sender_id (
                id,
                full_name,
                avatar_url
            ),
            receiver:receiver_id (
                id,
                full_name,
                avatar_url
            )
        `)
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Error fetching direct messages:", error);
        return { error: error.message, messages: [] };
    }

    // Mark as read
    await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("receiver_id", userId)
        .eq("sender_id", otherUserId)
        .eq("is_read", false);

    return { messages: data || [] };
}

export async function getDirectConversations() {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated", conversations: [] };

    const supabase = createAdminClient();

    // Fetch all messages where user is sender or receiver
    const { data, error } = await supabase
        .from("messages")
        .select(`
            *,
            sender:sender_id (id, full_name, avatar_url, email),
            receiver:receiver_id (id, full_name, avatar_url, email)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching conversations:", error);
        return { error: error.message, conversations: [] };
    }

    const conversationMap = new Map();
    data?.forEach(msg => {
        const otherUser = msg.sender_id === userId ? msg.receiver : msg.sender;
        if (otherUser && !conversationMap.has(otherUser.id)) {
            conversationMap.set(otherUser.id, {
                userId: otherUser.id,
                user: otherUser,
                lastMessage: msg,
                unreadCount: msg.receiver_id === userId && !msg.is_read ? 1 : 0
            });
        } else if (otherUser && msg.receiver_id === userId && !msg.is_read) {
            const existing = conversationMap.get(otherUser.id);
            existing.unreadCount += 1;
        }
    });

    return { conversations: Array.from(conversationMap.values()) };
}

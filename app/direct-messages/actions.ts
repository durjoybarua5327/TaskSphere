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

import { logDebug } from "@/lib/debug-logger";

export async function sendDirectMessage(receiverId: string, content: string, isAiResponse: boolean = false) {
    logDebug(`ACTION: sendDirectMessage`, { receiverId, content, isAiResponse });
    const { userId } = await auth();
    if (!userId) {
        logDebug("ERROR: Not authenticated");
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
        logDebug("ERROR: Database insert failed", error);
        return { error: error.message, success: false };
    }

    logDebug("SUCCESS: Message saved to DB");

    // If a non-superadmin sends a message to a superadmin, and it's NOT an AI response
    // Trigger AI logic
    if (!isAiResponse) {
        logDebug(`CHECKING: Is receiver ${receiverId} a superadmin?`);
        const { data: receiver, error: receiverError } = await supabase.from("users").select("is_super_admin").eq("id", receiverId).single();

        logDebug(`RECEIVER DATA:`, { receiver, error: receiverError });

        if (receiver?.is_super_admin) {
            logDebug("TRIGGER: Calling processAiResponse");
            // In a real app, you'd queue this or run it in background
            await processAiResponse(userId, content);
        } else {
            logDebug("SKIP: Receiver is not superadmin");
        }
    }

    revalidatePath("/superadmin/messages");
    return { success: true, message: data };
}

import { generateAiResponse } from "@/lib/ai-service";

async function processAiResponse(userId: string, userMessage: string) {
    logDebug(`PROCESS: processAiResponse`, { userId, message: userMessage });

    try {
        const supabase = createAdminClient();

        // 1. Check if enabled
        const { data: userData } = await supabase.from("users").select("ai_enabled").eq("id", userId).single();
        if (userData?.ai_enabled === false) {
            logDebug(`AI: Disabled for user ${userId}`);
            return;
        }

        // 2. Fetch History (So AI can remember context for group creation flow)
        const { data: history } = await supabase
            .from("messages")
            .select("*")
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order("created_at", { ascending: false })
            .limit(10); // Limit context length

        const previousMessages = (history?.reverse() || []).map(m => ({
            role: (m.is_ai_response || m.sender_id !== userId) ? 'assistant' : 'user',
            content: m.content
        }));

        // 3. Generate Response
        const aiResponse = await generateAiResponse(userMessage, previousMessages);

        // 4. Send Response
        if (aiResponse) {
            const { data: superAdmin } = await supabase.from("users").select("id").eq("is_super_admin", true).limit(1).single();
            if (superAdmin) {
                const { error: msgError } = await supabase.from("messages").insert({
                    sender_id: superAdmin.id,
                    receiver_id: userId,
                    content: aiResponse.trim(),
                    is_ai_response: true
                });

                if (msgError) {
                    logDebug("ERROR: Failed to save AI response", msgError);
                } else {
                    logDebug("SUCCESS: AI response sent");
                }
            } else {
                logDebug("ERROR: No Superadmin found to act as sender");
            }
        }
    } catch (err: any) {
        logDebug("CRITICAL ERROR in processAiResponse", {
            message: err.message,
            stack: err.stack
        });
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

    // Optimized: Limit to last 100 messages and use simpler query
    const { data, error } = await supabase
        .from("messages")
        .select(`
            *,
            sender:sender_id (
                id,
                full_name,
                avatar_url
            )
        `)
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
        .order("created_at", { ascending: false })
        .limit(100);

    if (error) {
        console.error("Error fetching direct messages:", error);
        return { error: error.message, messages: [] };
    }

    // Mark as read (non-blocking - fire and forget)
    supabase
        .from("messages")
        .update({ is_read: true })
        .eq("receiver_id", userId)
        .eq("sender_id", otherUserId)
        .eq("is_read", false)
        .then((result) => {
            if (result.error) {
                console.error("Error marking messages as read:", result.error);
            } else {
                console.log("Messages marked as read");
            }
        });

    // Return messages in ascending order (oldest first)
    return { messages: data?.reverse() || [] };
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

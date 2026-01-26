import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { logDebug } from "@/lib/debug-logger";
import fs from 'fs';
import path from 'path';

// Initialize OpenRouter
const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENAI_API_KEY,
});

const defaultModel = openrouter('google/gemini-2.0-flash-001');

export async function generateAiResponse(userMessage: string, historyMessages: any[] = []) {
    logDebug("AI-SERVICE: Starting generation", { userMessage, historyLength: historyMessages.length });

    try {
        // Read knowledge base
        const knowledgePath = path.join(process.cwd(), 'lib/ai-knowledge.txt');
        let knowledgeContext = "";
        try {
            knowledgeContext = fs.readFileSync(knowledgePath, 'utf-8');
            logDebug("AI-SERVICE: Knowledge base loaded", { length: knowledgeContext.length });
        } catch (err) {
            logDebug("AI-SERVICE: Warning - Could not read knowledge file", err);
        }

        const systemPrompt = `
            You are the TaskSphere AI Assistant.
            
            CRITICAL INSTRUCTION:
            You are a Retrieval-Augmented Generation system.
            
            1. PRIORITY: Answer questions based on the "KNOWLEDGE BASE" provided below.
            2. PERSONALITY: You are helpful and friendly. If the user says "Hi", "Hello", or asks unrelated small talk, reply politely but then steer them back to TaskSphere.
            3. REFUSAL: If asked for specific FACTS not in the knowledge base (e.g. "Who is the president?", "How do I fix my car?"), refuse politely.
            
            If the user's question is not answered by the Knowledge Base and is not small talk, say exactly:
            "I'm sorry, I can only answer questions about TaskSphere and its owner, Durjoy Barua."

            --- KNOWLEDGE BASE START ---
            ${knowledgeContext}
            --- KNOWLEDGE BASE END ---
            
            Be concise.
        `;

        // Map history strict sanitization
        // Map history strict sanitization
        const rawMessages = historyMessages.map(m => {
            let content = "";
            if (typeof m.content === 'string') {
                content = m.content;
            } else if (Array.isArray(m.content)) {
                content = m.content.map((c: any) => c.text || JSON.stringify(c)).join("\n");
            } else {
                content = String(m.content || "");
            }

            let role = (m.role === 'user' || m.role === 'system') ? 'user' : 'assistant';
            let finalContent = content;

            // Workaround for Gemini/OpenRouter strict role issues:
            // Convert assistant messages to User messages with prefix, so they get merged into one transcript.
            if (role === 'assistant') {
                role = 'user';
                finalContent = "AI: " + content;
            } else {
                // Optional: Prefix user messages if we are squashing everything, but usually not needed if AI can infer context.
                // But to be consistent with "AI: ", maybe "User: "? 
                // Let's just prefix AI for now.
            }

            return {
                role: role as 'user',
                content: finalContent
            };
        }).filter(m => m.content.trim() !== ""); // Remove empty messages

        // Add the new user message to the raw list BEFORE merging
        rawMessages.push({ role: 'user', content: userMessage });

        // Merge consecutive messages of the same role
        const promptMessages: { role: 'user' | 'assistant', content: string }[] = [];

        for (const msg of rawMessages) {
            const lastMsg = promptMessages[promptMessages.length - 1];
            if (lastMsg && lastMsg.role === msg.role) {
                lastMsg.content += "\n\n" + msg.content;
            } else {
                promptMessages.push(msg as any);
            }
        }

        // Prepend system prompt to the first message if it exists, roughly simulating system instruction
        if (promptMessages.length > 0) {
            promptMessages[0].content = systemPrompt + "\n\n" + promptMessages[0].content;
        } else {
            // Should not happen as we always add user message, but safety first
            promptMessages.push({ role: 'user', content: systemPrompt });
        }

        logDebug("AI-SERVICE: Full Payload", JSON.stringify(promptMessages, null, 2));

        const { text: aiResponse } = await generateText({
            model: defaultModel,
            // system: systemPrompt, // Removed to avoid potential provider issues
            messages: promptMessages as any,
        });

        logDebug("AI-SERVICE: Success", { response: aiResponse });
        return aiResponse;

    } catch (error: any) {
        logDebug("AI-SERVICE: Error", { message: error.message, stack: error.stack });
        throw error;
    }
}

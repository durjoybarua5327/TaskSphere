import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.OPENAI_API_KEY,
});

const defaultModel = groq('llama-3.3-70b-versatile');

async function testAiResponse() {
    console.log("1. Finding Superadmin...");
    const { data: superAdmin } = await supabase
        .from('users')
        .select('id, email, is_super_admin')
        .eq('is_super_admin', true)
        .limit(1)
        .single();

    if (!superAdmin) {
        console.error("No superadmin found!");
        return;
    }
    console.log("Superadmin found:", superAdmin.email, superAdmin.id);

    // We'll use the superadmin as the 'user' for this test, simulating talking to themselves
    const userId = superAdmin.id;
    const userMessage = "Hello from the debugging script. Are you there?";

    console.log(`2. Processing message for user ${userId}: "${userMessage}"`);

    const promptMessages = [
        { role: 'user', content: userMessage }
    ];

    console.log("3. Sending to OpenRouter...");
    const apiKey = process.env.OPENAI_API_KEY;
    console.log("API Key available:", !!apiKey);

    try {
        const { text: aiResponse } = await generateText({
            model: defaultModel,
            system: "You are a helpful assistant.",
            messages: promptMessages as any,
        });

        console.log("4. AI Response:", aiResponse);

        if (aiResponse) {
            console.log("5. Attempting to insert into DB...");
            const { error } = await supabase.from("messages").insert({
                sender_id: superAdmin.id,
                receiver_id: userId,
                content: aiResponse.trim(),
                is_ai_response: true
            });
            if (error) console.error("DB Insert Error:", error);
            else console.log("DB Insert Success!");
        }

    } catch (error) {
        console.error("AI Generation Failed:", error);
    }
}

testAiResponse();

import 'dotenv/config';
import { defaultModel } from '../lib/ai';
import { generateText } from 'ai';

async function main() {
    console.log("Verifying AI integration with SDK...");
    try {
        const { text } = await generateText({
            model: defaultModel,
            prompt: 'Say hello!',
        });
        console.log("Success! AI replied:", text);
    } catch (error) {
        console.error("AI Verification Failed:", error);
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error cause:", error.cause);
        }
    }
}

main();

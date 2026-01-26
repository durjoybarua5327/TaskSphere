
import { generateAiResponse } from "../lib/ai-service";
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function main() {
    console.log("Testing AI Slash Commands...");
    try {
        // Test /about
        const response1 = await generateAiResponse("/about", []);
        console.log("\n/about Response:\n", response1);

        // Test /create group
        const response2 = await generateAiResponse("/create group", []);
        console.log("\n/create group Response:\n", response2);

    } catch (error: any) {
        console.error("Failed:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    }
}

main().catch(console.error);

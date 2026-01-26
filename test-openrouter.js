const apiKey = "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";

async function testOpenRouter() {
    console.log("Testing OpenRouter API...");
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                // "HTTP-Referer": "http://localhost:3000", // Optional
                // "X-Title": "Test Script", // Optional
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash-001",
                messages: [
                    { role: "user", content: "Hello, are you working?" }
                ]
            })
        });

        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error("Response body:", text);
        } else {
            const data = await response.json();
            console.log("Success!");
            console.log("Response:", JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("Fetch failed:", error);
    }
}

testOpenRouter();

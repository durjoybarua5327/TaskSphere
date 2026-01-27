
const apiKey = "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";

async function testOpenRouter() {
    console.log("Testing OpenRouter API with free model...");
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "TaskSphere",
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash-exp:free",
                messages: [
                    { role: "user", content: "Hello" }
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
            // console.log("Response:", JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("Fetch failed:", error);
    }
}

testOpenRouter();

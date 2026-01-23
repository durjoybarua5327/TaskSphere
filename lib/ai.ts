import { createOpenAI } from '@ai-sdk/openai';

export const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENAI_API_KEY,
});

export const defaultModel = openrouter('google/gemini-2.0-flash-001');

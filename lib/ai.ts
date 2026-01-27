import { createOpenAI } from '@ai-sdk/openai';

export const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.OPENAI_API_KEY,
});

export const defaultModel = groq('llama-3.3-70b-versatile');

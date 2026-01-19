"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Bot, User, Send, Loader2, CheckCircle } from "lucide-react";
import { startAIConversation, sendAIMessage, submitAIRequest } from "./actions";

type Message = {
    role: "ai" | "user";
    content: string;
    timestamp: Date;
};

export function AIChatInterface({
    userId,
    userName,
    userEmail,
}: {
    userId: string;
    userName: string;
    userEmail: string;
}) {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentInput, setCurrentInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isComplete, setIsComplete] = useState(false);
    const [collectedData, setCollectedData] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Initialize conversation
        const init = async () => {
            setIsLoading(true);
            try {
                const result = await startAIConversation(userId, userName);
                setSessionId(result.sessionId);
                setMessages([{
                    role: "ai",
                    content: result.firstMessage,
                    timestamp: new Date(),
                }]);
            } catch (error) {
                console.error("Error starting conversation:", error);
                setMessages([{
                    role: "ai",
                    content: "Sorry, I encountered an error. Please try the manual form instead.",
                    timestamp: new Date(),
                }]);
            } finally {
                setIsLoading(false);
            }
        };

        init();
    }, [userId, userName]);

    const handleSendMessage = async () => {
        if (!currentInput.trim() || !sessionId || isLoading) return;

        const userMessage = currentInput.trim();
        setCurrentInput("");

        // Add user message
        setMessages(prev => [...prev, {
            role: "user",
            content: userMessage,
            timestamp: new Date(),
        }]);

        setIsLoading(true);

        try {
            const result = await sendAIMessage(sessionId, userMessage);

            // Add AI response
            setMessages(prev => [...prev, {
                role: "ai",
                content: result.aiResponse,
                timestamp: new Date(),
            }]);

            if (result.isComplete) {
                setIsComplete(true);
                setCollectedData(result.collectedData);
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => [...prev, {
                role: "ai",
                content: "I'm sorry, I encountered an error. Could you try again?",
                timestamp: new Date(),
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitRequest = async () => {
        if (!sessionId || !collectedData) return;

        setIsLoading(true);
        try {
            await submitAIRequest(sessionId, userId, userName, userEmail, collectedData);
            router.push("/dashboard/messages");
        } catch (error) {
            console.error("Error submitting request:", error);
            alert("Failed to submit request. Please try again.");
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
            {/* Chat Messages */}
            <div className="h-[600px] overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-purple-50/30 to-white">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        {message.role === "ai" && (
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-5 h-5 text-purple-600" />
                            </div>
                        )}

                        <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === "ai"
                                    ? "bg-white border border-purple-200"
                                    : "bg-indigo-600 text-white"
                                }`}
                        >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>

                        {message.role === "user" && (
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                <User className="w-5 h-5 text-indigo-600" />
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="bg-white border border-purple-200 rounded-2xl px-4 py-3">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area or Submit Button */}
            <div className="border-t border-slate-200 p-4 bg-white">
                {isComplete ? (
                    <Button
                        onClick={handleSubmitRequest}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-6"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Submitting Request...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="mr-2 h-5 w-5" />
                                Submit Request to Super Admin
                            </>
                        )}
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={currentInput}
                            onChange={(e) => setCurrentInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your response..."
                            disabled={isLoading}
                            className="flex-1 border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-slate-50"
                        />
                        <Button
                            onClick={handleSendMessage}
                            disabled={isLoading || !currentInput.trim()}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

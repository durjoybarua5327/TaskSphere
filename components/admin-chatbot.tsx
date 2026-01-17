"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bot, X, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
        { role: 'ai', content: "Hello! I'm your AI assistant. Ask me to help with grading or finding students." }
    ]);
    const [input, setInput] = useState("");

    const toggleChat = () => setIsOpen(!isOpen);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        setMessages([...messages, { role: 'user', content: input }]);
        setInput("");

        // Simulate AI response for now
        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'ai', content: "I'm a demo bot right now. I'll be connected to real AI logic soon!" }]);
        }, 1000);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
            {isOpen && (
                <div className="w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="bg-emerald-600 p-4 flex items-center justify-between text-white">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            <span className="font-semibold">AI Assistant</span>
                        </div>
                        <button onClick={toggleChat} className="hover:bg-emerald-700 p-1 rounded">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="h-80 overflow-y-auto p-4 space-y-4 bg-slate-50">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                <div className={cn(
                                    "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                                    msg.role === 'user'
                                        ? "bg-emerald-600 text-white rounded-br-none"
                                        : "bg-white text-slate-800 border border-slate-100 rounded-bl-none"
                                )}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white border-t">
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <input
                                className="flex-1 bg-slate-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="Ask AI..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                            />
                            <Button size="icon" className="rounded-full h-9 w-9 bg-emerald-600 hover:bg-emerald-700">
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <Button
                onClick={toggleChat}
                className={cn(
                    "h-14 w-14 rounded-full shadow-xl transition-all duration-300",
                    isOpen ? "bg-slate-800 hover:bg-slate-900" : "bg-emerald-600 hover:bg-emerald-700 hover:scale-105"
                )}
            >
                {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-8 h-8" />}
            </Button>
        </div>
    );
}

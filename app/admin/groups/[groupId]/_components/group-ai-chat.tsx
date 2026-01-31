"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bot,
    Send,
    Sparkles,
    MessageSquare,
    Loader2,
    AlertCircle,
    X,
    User,
    ClipboardList,
    Users
} from "lucide-react";
import { chatWithGroupAi } from "../../../actions";

interface GroupAIChatProps {
    groupId: string;
    groupName: string;
}

interface ChatMessage {
    id: string;
    content: string;
    role: "user" | "ai";
    timestamp: Date;
}

export function GroupAIChat({ groupId, groupName }: GroupAIChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: "initial",
            role: "ai",
            content: `Hello! I'm the AI Assistant for **${groupName}**. I have access to all group members, tasks, and student submissions. \n\nYou can ask me things like:\n- "How many students have submitted Task 1?"\n- "Has user@example.com submitted all their tasks?"\n- "Rank students based on their total scores."\n- "Show me a summary of all task progress."`,
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading, scrollToBottom]);

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput("");
        setError(null);

        const newUserMessage: ChatMessage = {
            id: Date.now().toString(),
            role: "user",
            content: userMsg,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newUserMessage]);
        setIsLoading(true);

        try {
            const result = await chatWithGroupAi(groupId, userMsg, messages.slice(-10).map(m => ({
                role: m.role === "ai" ? "assistant" : "user",
                content: m.content
            })));

            if (result.success && result.response) {
                const aiMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    role: "ai",
                    content: result.response,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, aiMessage]);
            } else {
                setError(result.error || "Failed to get AI response");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-350px)] min-h-[500px] bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm shadow-slate-200/50">
            {/* Header */}
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                        <Bot className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Group Management AI</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Connected to group data
                        </p>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                        <Users className="w-3 h-3 text-emerald-500" />
                        Members
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                        <ClipboardList className="w-3 h-3 text-blue-500" />
                        Tasks
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                        <Sparkles className="w-3 h-3 text-purple-500" />
                        Submissions
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar bg-slate-50/20"
            >
                {messages.map((message) => (
                    <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                    >
                        <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-md ${message.role === "ai"
                            ? "bg-gradient-to-br from-slate-800 to-slate-900 text-white"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            }`}>
                            {message.role === "ai" ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                        </div>

                        <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${message.role === "user" ? "items-end" : "items-start"}`}>
                            <div className={`px-5 py-4 rounded-[1.5rem] shadow-sm text-sm font-medium leading-relaxed ${message.role === "ai"
                                ? "bg-white text-slate-700 rounded-tl-none border border-slate-100"
                                : "bg-slate-900 text-white rounded-tr-none"
                                }`}>
                                <div className="whitespace-pre-wrap">
                                    {message.content.split('**').map((part, i) =>
                                        i % 2 === 1 ? <strong key={i} className="font-black text-emerald-500">{part}</strong> : part
                                    )}
                                </div>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 px-1">
                                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </motion.div>
                ))}

                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-4"
                    >
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center shadow-md">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div className="bg-white border border-slate-100 px-6 py-4 rounded-[1.5rem] rounded-tl-none flex items-center gap-3 shadow-sm">
                            <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Analysing Group Data...</span>
                        </div>
                    </motion.div>
                )}

                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-center"
                    >
                        <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[10px] font-black uppercase tracking-widest shrink-0">
                            <AlertCircle className="w-3 h-3" />
                            {error}
                            <button onClick={() => setError(null)} className="ml-2 hover:text-rose-800"><X className="w-3 h-3" /></button>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} className="h-4 shrink-0" />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white border-t border-slate-100">
                <form
                    onSubmit={handleSend}
                    className="relative flex items-center gap-3"
                >
                    <div className="relative flex-1 group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            placeholder={`Inquire about ${groupName} data...`}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
                            className="w-full pl-12 pr-6 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 focus:bg-white transition-all shadow-inner"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none shrink-0"
                    >
                        {isLoading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <Send className="w-6 h-6" />
                        )}
                    </button>

                    <div className="absolute -top-12 left-0 right-0 flex justify-center opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none">
                        <span className="px-3 py-1 bg-slate-900 text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-full flex items-center gap-1.5 shadow-xl">
                            <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                            AI-Powered Insights
                        </span>
                    </div>
                </form>
            </div>
        </div>
    );
}

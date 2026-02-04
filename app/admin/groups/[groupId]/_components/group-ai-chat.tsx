"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    ClipboardList,
    MessageSquare,
    Bot,
    User,
    Send,
    Loader2,
    Sparkles,
    AlertCircle,
    X
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
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

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
        <div className="flex flex-col h-[calc(100vh-420px)] min-h-[500px] bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <Bot className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Group Management AI</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Always here to help you</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest border border-emerald-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-sm mx-auto opacity-50">
                        <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-300">
                            <MessageSquare className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">How can I help you today?</p>
                            <p className="text-[10px] font-medium text-slate-500">I can help you analyze student performance, rank members, and summarize task progress.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-2 w-full text-center">
                            {[
                                "How many students have submitted all tasks?",
                                "Who is the top performing student?",
                                "Show me a task completion summary.",
                                "Which students have low scores?"
                            ].map((suggest, i) => (
                                <button
                                    key={i}
                                    onClick={() => { setInput(suggest); }}
                                    className="px-4 py-2 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-slate-400 border border-transparent hover:border-emerald-100"
                                >
                                    {suggest}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <motion.div
                            key={msg.id || i}
                            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-[#0F172A] text-white' : 'bg-white border border-slate-100 text-emerald-500'}`}>
                                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                            </div>
                            <div className={`max-w-[80%] space-y-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`px-4 py-3 rounded-2xl text-[12px] font-medium leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-[#0F172A] text-white rounded-tr-none' : 'bg-slate-50 text-slate-700 border border-slate-100 rounded-tl-none'}`}>
                                    <div className="whitespace-pre-wrap">
                                        {msg.content.split('**').map((part, idx) =>
                                            idx % 2 === 1 ? <strong key={idx} className="font-bold text-emerald-600">{part}</strong> : part
                                        )}
                                    </div>
                                </div>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </motion.div>
                    ))
                )}
                {isLoading && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 text-emerald-500 flex items-center justify-center animate-bounce">
                            <Bot className="w-4 h-4" />
                        </div>
                        <div className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-none">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
                            </div>
                        </div>
                    </div>
                )}
                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-center"
                    >
                        <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[9px] font-black uppercase tracking-widest">
                            <AlertCircle className="w-3 h-3" />
                            {error}
                            <button onClick={() => setError(null)} className="ml-2 hover:text-rose-800"><X className="w-3" /></button>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 mt-auto">
                <form
                    onSubmit={handleSend}
                    className="flex items-center gap-2 bg-white p-2 border border-slate-200 rounded-2xl focus-within:ring-4 focus-within:ring-emerald-500/5 focus-within:border-emerald-200 transition-all shadow-sm"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Inquire about group data..."
                        className="flex-1 bg-transparent border-none outline-none px-3 text-sm font-medium placeholder:text-slate-400"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="w-10 h-10 rounded-xl bg-[#0F172A] text-white flex items-center justify-center hover:bg-emerald-600 transition-all disabled:opacity-50 active:scale-95 group"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

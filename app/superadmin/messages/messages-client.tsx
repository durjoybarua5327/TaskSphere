"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/providers/modal-provider";
import { sendMessage, deleteMessage, toggleAiForUser, clearAllMessages } from "../actions";
import { formatDistanceToNow } from "date-fns";
import {
    Send,
    Trash2,
    Bot,
    User,
    Search,
    Loader2,
    MessageSquare,
    Sparkles,
    CheckCheck,
    ChevronRight,
    SearchX,
    MessageCircle,
    Cpu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";

interface Message {
    id: string;
    content: string;
    sender_id: string;
    receiver_id: string;
    is_ai_response?: boolean;
    created_at: string;
    sender?: {
        id: string;
        full_name: string | null;
        email: string;
        avatar_url: string | null;
        is_super_admin?: boolean;
    } | null;
}

interface Conversation {
    userId: string;
    user: {
        id: string;
        full_name: string | null;
        email: string;
        avatar_url: string | null;
        ai_enabled?: boolean;
    } | null;
    lastMessage: Message;
    unreadCount: number;
}

interface MessagesClientProps {
    conversations: Conversation[];
    currentUserId: string;
}

export function MessagesClient({ conversations: initialConversations, currentUserId }: MessagesClientProps) {
    const { openModal } = useModal();
    const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(
        initialConversations[0] || null
    );
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const supabase = createClient();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Update local state when server props change (from router.refresh)
    useEffect(() => {
        setConversations(initialConversations);
        if (selectedConversation) {
            const updated = initialConversations.find(c => c.userId === selectedConversation.userId);
            if (updated) setSelectedConversation(updated);
        }
    }, [initialConversations]);

    // Global listener for ANY new message (to update sidebar/new conversations)
    useEffect(() => {
        const channel = supabase
            .channel('superadmin_global_updates')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                () => {
                    router.refresh();
                }
            )
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [supabase, router]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (selectedConversation?.userId) {
            loadMessages(selectedConversation.userId);
        }
    }, [selectedConversation?.userId]);

    // Realtime subscription
    useEffect(() => {
        if (!selectedConversation) return;

        const channel = supabase
            .channel(`superadmin_direct_${selectedConversation.userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                },
                async (payload: any) => {
                    console.log('Realtime Event (Superadmin):', payload.eventType, payload.new?.id);

                    if (payload.eventType === 'INSERT') {
                        const isRelevant = payload.new.sender_id === selectedConversation.userId ||
                            payload.new.receiver_id === selectedConversation.userId;

                        if (isRelevant) {
                            // Fetch full message details with sender info
                            const { data, error } = await supabase
                                .from('messages')
                                .select('*, sender:sender_id(id, full_name, email, avatar_url, is_super_admin)')
                                .eq('id', payload.new.id)
                                .single();

                            if (data && !error) {
                                setMessages(current => {
                                    if (current.some(m => m.id === data.id)) return current;
                                    return [...current, data as Message];
                                });
                                scrollToBottom();
                            }
                        }
                    } else if (payload.eventType === 'DELETE') {
                        setMessages(current => current.filter(m => m.id !== payload.old.id));
                    }
                }
            )
            .subscribe((status: string) => {
                console.log('Realtime Status:', status);
                if (status === 'CHANNEL_ERROR') {
                    console.error('Realtime connection failed. Please ensure Realtime is enabled for the "messages" table in Supabase Dashboard.');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedConversation?.userId, currentUserId, supabase]);

    const loadMessages = async (userId: string, silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const response = await fetch(`/api/messages/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setMessages(data.messages || []);
            } else {
                console.error(`Failed to load messages: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error("Failed to load messages:", error);
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const content = newMessage.trim();
        if (!content || !selectedConversation || isSending) return;

        setIsSending(true);
        // Optimistic update
        const tempId = Date.now().toString();
        const optimisticMsg: Message = {
            id: tempId,
            content: content,
            sender_id: currentUserId,
            receiver_id: selectedConversation.userId,
            created_at: new Date().toISOString(),
            sender: {
                id: currentUserId,
                full_name: 'You',
                email: '',
                avatar_url: null,
                is_super_admin: true
            }
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage("");

        try {
            const result = await sendMessage(selectedConversation.userId, content);

            if (!result.success) {
                setMessages(prev => prev.filter(m => m.id !== tempId));
                alert("Failed to send message: " + result.error);
                setNewMessage(content); // Restore message
            } else {
                // Silently reload to get real data
                loadMessages(selectedConversation.userId, true);
            }
        } catch (error) {
            console.error("Error in handleSendMessage:", error);
            setMessages(prev => prev.filter(m => m.id !== tempId));
            setNewMessage(content);
        } finally {
            setIsSending(false);
        }
    };

    const handleDeleteMessage = (message: Message) => {
        openModal({
            type: "delete",
            title: "Archival Deletion",
            description: "Are you certain you wish to permanently remove this communication record from the system database?",
            isDestructive: true,
            confirmText: "Delete Record",
            onConfirm: async () => {
                const result = await deleteMessage(message.id);
                if (result.success) {
                    setMessages(messages.filter(m => m.id !== message.id));
                }
            },
        });
    };

    const handleToggleAI = async () => {
        if (!selectedConversation?.user) return;

        const currentState = selectedConversation.user.ai_enabled !== false;
        const result = await toggleAiForUser(selectedConversation.userId, !currentState);

        if (result.success) {
            setSelectedConversation({
                ...selectedConversation,
                user: {
                    ...selectedConversation.user,
                    ai_enabled: !currentState,
                }
            });
            setConversations(conversations.map(c =>
                c.userId === selectedConversation.userId
                    ? { ...c, user: { ...c.user!, ai_enabled: !currentState } }
                    : c
            ));
        }
    };

    const handleClearHistory = async () => {
        if (!selectedConversation) return;

        openModal({
            type: "delete",
            title: "Clear Conversation History",
            description: "Are you certain you wish to permanently erase ALL communication records with this user? This action is irreversible.",
            isDestructive: true,
            confirmText: "Clear All Records",
            onConfirm: async () => {
                const result = await clearAllMessages(selectedConversation.userId);
                if (result.success) {
                    setMessages([]);
                } else {
                    alert("Failed to clear history: " + result.error);
                }
            },
        });
    };

    const filteredConversations = conversations.filter(conv => {
        const name = (conv.user?.full_name || "").toLowerCase();
        const email = (conv.user?.email || "").toLowerCase();
        const query = searchQuery.toLowerCase();
        return name.includes(query) || email.includes(query);
    });

    return (
        <div className="flex h-[calc(100vh-120px)] gap-0 items-stretch">
            {/* Conversations Sidebar */}
            <div className="w-[350px] flex flex-col overflow-hidden border border-slate-300 bg-white">
                <div className="p-6 border-b border-slate-100">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name or email..."
                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:border-slate-800 outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {filteredConversations.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-16 h-16 rounded-[2rem] bg-slate-50 flex items-center justify-center mb-4">
                                <SearchX className="w-8 h-8 text-slate-200" />
                            </div>
                            <p className="text-sm font-black text-slate-900 uppercase tracking-widest leading-tight">No Results</p>
                            <p className="text-xs font-medium text-slate-400 mt-2">No matching users found.</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredConversations.map((conv) => (
                                <button
                                    key={conv.userId}
                                    onClick={() => setSelectedConversation(conv)}
                                    className={`w-full p-4 flex items-center gap-4 rounded-[2rem] transition-all duration-300 relative group ${selectedConversation?.userId === conv.userId
                                        ? "bg-white shadow-xl shadow-slate-200/50"
                                        : "hover:bg-white/50"
                                        }`}
                                >
                                    {selectedConversation?.userId === conv.userId && (
                                        <motion.div
                                            layoutId="active-nav"
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#00897B] rounded-r-full shadow-[4px_0_12px_#00897B40]"
                                        />
                                    )}

                                    <div className="relative shrink-0">
                                        <div className="w-12 h-12 rounded-[1.5rem] overflow-hidden bg-slate-100 border-2 border-white shadow-sm ring-1 ring-slate-100">
                                            {conv.user?.avatar_url ? (
                                                <img src={conv.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                    <User className="w-6 h-6" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="font-black text-slate-900 truncate uppercase tracking-tight text-xs mb-0.5">
                                            {conv.user?.full_name || "Unknown User"}
                                        </p>
                                        <p className="text-[10px] font-medium text-slate-500 truncate">
                                            {conv.user?.email || "No email"}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Middle Line */}
            <div className="w-px bg-slate-300 my-4" />

            {/* Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden border border-slate-300 bg-white">
                {selectedConversation ? (
                    <>
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-[1.75rem] border-2 border-slate-50 flex items-center justify-center bg-slate-50 shadow-inner">
                                    {selectedConversation.user?.avatar_url ? (
                                        <img src={selectedConversation.user.avatar_url} alt="" className="w-full h-full rounded-[1.75rem] object-cover" />
                                    ) : (
                                        <User className="w-7 h-7 text-slate-300" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none mb-1">
                                        {selectedConversation.user?.full_name || "Unknown Identity"}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {selectedConversation.user?.email}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleToggleAI}
                                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 border ${selectedConversation.user?.ai_enabled !== false
                                        ? "bg-purple-900 text-white border-purple-900 shadow-xl shadow-purple-100"
                                        : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
                                        }`}
                                >
                                    <Cpu className={`w-4 h-4 ${selectedConversation.user?.ai_enabled !== false ? 'animate-pulse' : ''}`} />
                                    AI Governance: {selectedConversation.user?.ai_enabled !== false ? "Active" : "Disabled"}
                                </button>

                                <button
                                    onClick={handleClearHistory}
                                    disabled={messages.length === 0}
                                    className="flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 disabled:opacity-50 disabled:bg-slate-50 disabled:text-slate-300"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Clear History
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-12 bg-slate-50/30">
                            {isLoading ? (
                                <div className="h-full flex flex-col items-center justify-center gap-4">
                                    <div className="w-12 h-12 border-4 border-slate-100 border-t-[#00897B] rounded-full animate-spin" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Decrypting Data...</p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center">
                                    <div className="w-24 h-24 rounded-[3rem] bg-white border border-slate-100 flex items-center justify-center mb-6 shadow-sm">
                                        <MessageSquare className="w-10 h-10 text-slate-200" />
                                    </div>
                                    <p className="text-lg font-black text-slate-900 uppercase tracking-widest">Zero Latency</p>
                                    <p className="text-sm font-medium text-slate-400 mt-2">No preceding communication records found.</p>
                                </div>
                            ) : (
                                <div className="space-y-10">
                                    {messages.map((message) => (
                                        <MessageBubble
                                            key={message.id}
                                            message={message}
                                            isOwn={message.sender?.is_super_admin === true}
                                            onDelete={() => handleDeleteMessage(message)}
                                        />
                                    ))}
                                    <div ref={messagesEndRef} className="h-4" />
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-white border-t border-slate-100">
                            {selectedConversation.user?.ai_enabled !== false ? (
                                <div className="w-full py-6 px-8 bg-purple-50 border border-purple-100 rounded-[2.5rem] flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-purple-900 flex items-center justify-center shadow-lg shadow-purple-200">
                                            <Sparkles className="w-5 h-5 text-white animate-pulse" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-purple-900 uppercase tracking-widest">AI Governance Active</p>
                                            <p className="text-[10px] font-medium text-purple-400 mt-0.5">Manual override is disabled while AI is managing this conversation.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleToggleAI}
                                        className="px-6 py-2 bg-white border border-purple-200 rounded-xl text-[9px] font-black text-purple-900 uppercase tracking-widest hover:bg-purple-900 hover:text-white transition-all shadow-sm"
                                    >
                                        Disable AI to Chat
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSendMessage} className="relative">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type your manual response..."
                                        className="w-full pl-8 pr-24 py-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:bg-white focus:ring-8 ring-[#00897B]/5 outline-none transition-all shadow-inner"
                                        disabled={isSending}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                        <button
                                            type="submit"
                                            disabled={isSending || !newMessage.trim()}
                                            className="w-14 h-14 bg-slate-900 text-white rounded-[1.75rem] flex items-center justify-center hover:bg-[#00897B] transition-all duration-500 shadow-xl disabled:opacity-50 active:scale-95"
                                        >
                                            {isSending ? (
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                            ) : (
                                                <Send className="w-6 h-6" />
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-slate-50/50">
                        <div className="relative mb-10">
                            <div className="w-32 h-32 rounded-[4rem] bg-white border border-slate-100 flex items-center justify-center shadow-2xl relative z-10">
                                <MessageSquare className="w-12 h-12 text-[#00897B]" />
                            </div>
                            <div className="absolute inset-0 bg-[#00897B]/10 rounded-full blur-[60px] scale-150" />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase mb-4">Select User Profile</h3>
                        <p className="text-slate-500 font-medium max-w-sm mb-10 leading-relaxed">
                            Click on any user from the left sidebar to view their full message history and manage their direct communications.
                        </p>
                        <div className="flex flex-col items-center gap-4">
                            <div className="px-6 py-2 bg-white border border-slate-200 rounded-full flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest shadow-sm">
                                <Search className="w-3.5 h-3.5 text-[#00897B]" />
                                Locate User Profile
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function MessageBubble({
    message,
    isOwn,
    onDelete
}: {
    message: Message;
    isOwn: boolean;
    onDelete: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: isOwn ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
        >
            <div className={`group relative max-w-[70%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-3 mb-2 px-1">
                    {!isOwn && (
                        <div className="w-5 h-5 rounded-lg bg-slate-200 flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                    )}
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>
                    {isOwn && <CheckCheck className="w-3 h-3 text-emerald-500" />}
                </div>

                <div
                    className={`relative px-6 py-4 rounded-[1.75rem] shadow-sm transition-all duration-300 ${message.is_ai_response
                        ? "bg-purple-900 text-white shadow-xl shadow-purple-200/50"
                        : isOwn
                            ? "bg-white text-slate-900 border border-slate-100"
                            : "bg-[#00897B] text-white shadow-xl shadow-[#00897B]/20"
                        }`}
                >
                    {message.is_ai_response && (
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                                <Sparkles className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Synthesized Intelligence</span>
                        </div>
                    )}
                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{message.content}</p>

                    {/* Interaction Tools */}
                    {isOwn && (
                        <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                                onClick={onDelete}
                                className="w-8 h-8 rounded-xl bg-white text-red-500 shadow-xl border border-red-50 flex items-center justify-center hover:bg-red-50 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

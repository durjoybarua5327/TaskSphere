"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Search,
    Smile,
    Send,
    CheckCheck,
    Clock,
    User,
    X,
    Shield,
    MessageCircle,
    Lock,
    Unlock,
    Trash2,
    Contact
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { sendGroupMessage, getGroupMessages, toggleAdminOnlyChat, deleteGroupMessage, clearDirectMessages, deleteDirectMessage } from "./actions";
import { sendDirectMessage, getDirectMessages } from "@/app/direct-messages/actions";
import { useUser } from "@clerk/nextjs";
import { useModal } from "@/components/providers/modal-provider";
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { Sparkles, Bot, Info } from "lucide-react";

interface Message {
    id: string;
    group_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    is_ai_response?: boolean;
    sender?: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };
}

interface Group {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    admin_only_chat?: boolean;
    top_admin_id?: string;
    members?: any[];
}

interface SuperAdmin {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string;
}

export function LiveMessagesClient({ initialGroups, superAdmin, profileBasePath = "/student/profile" }: { initialGroups: Group[], superAdmin: SuperAdmin | null, profileBasePath?: string }) {
    const router = useRouter();
    const { user } = useUser();
    const { openModal } = useModal();
    const [activeGroupId, setActiveGroupId] = useState<string | null>(initialGroups.length > 0 ? initialGroups[0].id : null);
    const [isDirectChat, setIsDirectChat] = useState(false);
    const [messageInput, setMessageInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [groups, setGroups] = useState<Group[]>(initialGroups);
    const [sendError, setSendError] = useState<string>("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [realtimeStatus, setRealtimeStatus] = useState<string>("DISCONNECTED");
    const [isClearingHistory, setIsClearingHistory] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const [supabase] = useState(() => createClient());

    const activeGroup = useMemo(() => groups.find(g => g.id === activeGroupId), [groups, activeGroupId]);

    // Derived filtered groups - memoized for performance
    const filteredGroups = useMemo(() =>
        groups.filter(group =>
            group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            group.description?.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        [groups, searchTerm]
    );

    // Sync state with server props (for realtime sidebar updates)
    useEffect(() => {
        setGroups(initialGroups);
    }, [initialGroups]);

    // Check if current user is admin of active group
    const isGroupAdmin = () => {
        if (!activeGroup || !user?.id) return false;
        // Check if user is the top admin of the group
        if (activeGroup.top_admin_id === user.id) return true;
        // Note: For more precise checks, you'd need to query group_members table
        // For now, we assume top_admin_id is sufficient
        return false;
    };

    // Load messages when group or direct chat changes
    useEffect(() => {
        if (isDirectChat && superAdmin) {
            loadDirectMessages();
            return;
        }

        if (!activeGroupId) {
            setMessages([]);
            return;
        }

        loadMessages();
    }, [activeGroupId, isDirectChat]);

    const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
        if (messagesContainerRef.current) {
            const container = messagesContainerRef.current;
            // Scroll to bottom (max scrollTop) to see latest messages which are at the visual bottom
            // in a flex-col-reverse layout where correct visual order is maintained.
            container.scrollTo({ top: container.scrollHeight, behavior });
        }
    }, []);

    // Set up realtime subscription for current chat
    useEffect(() => {
        // Skip if direct chat but no superadmin/user, or if group chat but no activeGroupId
        if (isDirectChat && (!superAdmin || !user?.id)) return;
        if (!isDirectChat && !activeGroupId) return;

        console.log('Setting up realtime for:', isDirectChat ? 'direct chat' : `group ${activeGroupId}`);

        const channelId = isDirectChat ? `direct_messages_${user?.id}` : `group_messages_${activeGroupId}`;
        const table = isDirectChat ? 'messages' : 'group_messages';
        // PostgREST filter string for the realtime listener
        const realtimeFilter = isDirectChat ? undefined : `group_id=eq.${activeGroupId}`;

        const channel = supabase
            .channel(channelId)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: table,
                    filter: realtimeFilter,
                },
                async (payload: any) => {
                    console.log('Realtime Event:', payload.eventType, payload.new?.id || payload.old?.id);
                    console.log('Payload details:', { table, isDirectChat, activeGroupId, payload });

                    if (payload.eventType === 'DELETE') {
                        setMessages(prev => prev.filter(m => m.id !== payload.old.id));
                        return;
                    }

                    if (payload.eventType !== 'INSERT') return;

                    // For group messages, verify it belongs to current group (extra safety)
                    if (!isDirectChat && payload.new.group_id !== activeGroupId) return;

                    // For direct messages, verify it involves current user
                    if (isDirectChat) {
                        const isRelevant = payload.new.sender_id === user?.id ||
                            payload.new.receiver_id === user?.id;
                        if (!isRelevant) return;
                    }

                    // Avoid duplicate messages if optimistically added
                    let exists = false;
                    setMessages(prev => {
                        exists = prev.some(msg => msg.id === payload.new.id ||
                            (msg.content === payload.new.content &&
                                msg.sender_id === payload.new.sender_id &&
                                Math.abs(new Date(msg.created_at).getTime() - new Date(payload.new.created_at).getTime()) < 5000));
                        return prev;
                    });

                    if (!exists) {
                        console.log('Fetching full message details for:', payload.new.id);
                        // Fetch full message with sender details asynchronously
                        const { data, error } = await supabase
                            .from(table)
                            .select(`
                                *,
                                sender:sender_id (
                                    id,
                                    full_name,
                                    avatar_url
                                )
                            `)
                            .eq('id', payload.new.id)
                            .single();

                        if (data && !error) {
                            console.log('Adding message to UI:', data.id);
                            setMessages(current => {
                                if (current.some(m => m.id === data.id)) return current;
                                return [...current, data as Message];
                            });
                            // Smooth scroll for new messages
                            setTimeout(() => scrollToBottom('smooth'), 100);
                        } else {
                            console.error('Error fetching message details:', error);
                        }
                    } else {
                        console.log('Message already exists, skipping:', payload.new.id);
                    }
                }
            )
            .subscribe((status: string, err?: any) => {
                console.log(`Realtime Status (${isDirectChat ? 'Direct' : 'Group'}):`, status);
                if (err) {
                    console.error('Realtime subscription error:', err);
                }
                setRealtimeStatus(status);

                // Log when successfully subscribed
                if (status === 'SUBSCRIBED') {
                    console.log(`✅ Successfully subscribed to ${isDirectChat ? 'direct messages' : `group ${activeGroupId}`}`);
                }
            });

        return () => {
            console.log('Cleaning up realtime subscription for:', channelId);
            supabase.removeChannel(channel);
        };
    }, [activeGroupId, isDirectChat, user?.id, superAdmin?.id, scrollToBottom, supabase]);

    const loadMessages = useCallback(async (silent = false) => {
        if (!activeGroupId) return;

        if (!silent) setLoading(true);
        const { messages: fetchedMessages } = await getGroupReceipts(activeGroupId);
        setMessages(fetchedMessages || []);
        if (!silent) {
            setLoading(false);
            setTimeout(() => scrollToBottom("auto"), 100);
        }
    }, [activeGroupId, scrollToBottom]);

    // Helper to fetch group messages (keeping original function name for consistency)
    const getGroupReceipts = getGroupMessages;

    const loadDirectMessages = useCallback(async (silent = false) => {
        if (!superAdmin) return;

        if (!silent) setLoading(true);
        const { messages: fetchedMessages } = await getDirectMessages(superAdmin.id);
        const formattedMessages = fetchedMessages?.map(m => ({
            ...m,
            sender: m.sender_id === user?.id ? {
                id: user?.id || 'me',
                full_name: user?.fullName || 'You',
                avatar_url: user?.imageUrl || undefined
            } : {
                id: superAdmin.id,
                full_name: 'Ai assistant',
                avatar_url: superAdmin.avatar_url || undefined
            }
        })) as Message[];
        setMessages(formattedMessages || []);
        if (!silent) {
            setLoading(false);
            setTimeout(() => scrollToBottom("auto"), 100);
        }
    }, [superAdmin, user?.id, scrollToBottom]);

    const handleSendMessage = async (e?: React.FormEvent, overrideContent?: string) => {
        if (e) e.preventDefault();
        const content = (overrideContent || messageInput).trim();
        if (!content || !user) return;

        // Optimistic UI update
        const tempId = Date.now().toString();
        const optimisticMessage: Message = {
            id: tempId,
            content,
            sender_id: user.id,
            group_id: activeGroupId || '',
            created_at: new Date().toISOString(),
            sender: {
                id: user.id,
                full_name: user.fullName || 'You',
                avatar_url: user.imageUrl || undefined
            }
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setMessageInput("");
        setTimeout(() => scrollToBottom('smooth'), 50);
        setShowEmojiPicker(false);
        setSendError("");

        if (isDirectChat && superAdmin) {
            console.log("Sending direct message to SuperAdmin AI...");
            const result = await sendDirectMessage(superAdmin.id, content);
            console.log("Direct message result:", result);
            if (result.success) {
                // Realtime subscription will handle updating with server response
                // Remove optimistic message - realtime will add the real one
                setMessages(prev => prev.filter(m => m.id !== tempId));
            } else {
                setMessages(prev => prev.filter(m => m.id !== tempId));
                setSendError(result.error || "Failed to send message");
            }
            return;
        }

        if (!activeGroupId) return;

        const result = await sendGroupMessage(activeGroupId, content);
        if (result.error) {
            setMessages(prev => prev.filter(m => m.id !== tempId));
            setSendError(result.error);
            setTimeout(() => setSendError(""), 3000);
        }
        // On success, keep the optimistic message - realtime will replace it with the real one
        // The duplicate detection in realtime subscription will handle this properly
    };

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        setMessageInput(prev => prev + emojiData.emoji);
    };

    const handleDeleteMessage = (messageId: string) => {
        setMessageToDelete(messageId);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!messageToDelete) return;

        // Check if it's an optimistic message (timestamp ID) vs real message (UUID)
        // UUIDs have hyphens, timestamps don't
        const isOptimistic = !messageToDelete.includes('-');

        if (isOptimistic) {
            // Just remove from local state, no server call needed
            setMessages(prev => prev.filter(msg => msg.id !== messageToDelete));
            setShowDeleteModal(false);
            setMessageToDelete(null);
            return;
        }

        const result = isDirectChat
            ? await deleteDirectMessage(messageToDelete)
            : await deleteGroupMessage(messageToDelete);

        if (result.error) {
            console.error('Error deleting message:', result.error);
        } else {
            // Remove from local state immediately
            setMessages(prev => prev.filter(msg => msg.id !== messageToDelete));
        }

        setShowDeleteModal(false);
        setMessageToDelete(null);
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setMessageToDelete(null);
    };

    const handleToggleAdminOnly = async () => {
        if (!activeGroupId || !activeGroup) return;

        const newValue = !activeGroup.admin_only_chat;
        const result = await toggleAdminOnlyChat(activeGroupId, newValue);

        if (result.success) {
            // Update local state
            setGroups(prev => prev.map(g =>
                g.id === activeGroupId
                    ? { ...g, admin_only_chat: newValue }
                    : g
            ));
        }
    };

    const handleClearDirectHistory = async () => {
        if (!superAdmin || !isDirectChat) return;

        openModal({
            type: "delete",
            title: "Clear AI History",
            description: "Are you certain you wish to permanently clear all conversation history with the AI Assistant? This action cannot be undone.",
            isDestructive: true,
            confirmText: "Clear History",
            onConfirm: async () => {
                setIsClearingHistory(true);
                const result = await clearDirectMessages(superAdmin.id);

                if (result.success) {
                    setMessages([]);
                } else {
                    alert("Failed to clear history: " + result.error);
                }
                setIsClearingHistory(false);
            },
        });
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
                date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="h-[calc(100vh-140px)] bg-white border border-slate-200 rounded-[2.5rem] shadow-sm flex overflow-hidden">
            {/* Sidebar */}
            <div className={`w-full md:w-80 lg:w-96 border-r border-slate-100 flex flex-col bg-slate-50/50 ${activeGroup ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-6 pb-4">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Group Messages</h2>
                        <div className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {groups.length} Groups
                        </div>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search groups..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-4 ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-400 uppercase tracking-wide"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
                    {/* Superadmin Direct Chat Entry */}
                    {superAdmin && (
                        <button
                            onClick={() => {
                                setIsDirectChat(true);
                                setActiveGroupId(null);
                            }}
                            className={`w-full p-4 rounded-2xl flex items-start gap-4 transition-all duration-300 group text-left relative overflow-hidden ${isDirectChat
                                ? "bg-white shadow-lg shadow-slate-100 ring-1 ring-slate-100"
                                : "hover:bg-white hover:shadow-md hover:shadow-slate-100/50"
                                }`}
                        >
                            {isDirectChat && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500" />
                            )}
                            <div className="relative shrink-0">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-100/50">
                                    <Bot className="w-6 h-6 text-white" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                                    <Sparkles className="w-3 h-3 text-white" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                                <div className="flex items-center justify-between mb-0.5">
                                    <h3 className={`text-sm font-black uppercase tracking-tight truncate ${isDirectChat ? "text-slate-900" : "text-slate-700"
                                        }`}>
                                        AI Assistant
                                    </h3>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                        AI Active
                                    </span>
                                </div>
                                <p className="text-xs font-medium text-slate-400 truncate">
                                    Request tasks or group creation
                                </p>
                            </div>
                        </button>
                    )}

                    <div className="py-2 flex items-center gap-2">
                        <div className="h-px bg-slate-100 flex-1" />
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Groups</span>
                        <div className="h-px bg-slate-100 flex-1" />
                    </div>

                    {filteredGroups.map(group => (
                        <button
                            key={group.id}
                            onClick={() => {
                                setIsDirectChat(false);
                                setActiveGroupId(group.id);
                            }}
                            className={`w-full p-4 rounded-2xl flex items-start gap-4 transition-all duration-300 group text-left relative overflow-hidden ${activeGroupId === group.id
                                ? "bg-white shadow-lg shadow-slate-100 ring-1 ring-slate-100"
                                : "hover:bg-white hover:shadow-md hover:shadow-slate-100/50"
                                }`}
                        >
                            {activeGroupId === group.id && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                            )}
                            <div className="relative shrink-0">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-100/50">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                                {group.admin_only_chat && (
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white">
                                        <Shield className="w-3 h-3 text-white" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                                <div className="flex items-center justify-between mb-0.5">
                                    <h3 className={`text-sm font-black uppercase tracking-tight truncate ${activeGroupId === group.id ? "text-slate-900" : "text-slate-700"
                                        }`}>
                                        {group.name}
                                    </h3>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                        {new Date(group.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-xs font-medium text-slate-400 truncate">
                                    {group.description || "No description"}
                                </p>
                            </div>
                        </button>
                    ))}
                    {filteredGroups.length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                            <p className="text-xs">No groups found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex-col bg-white ${activeGroup || (isDirectChat && superAdmin) ? 'flex' : 'hidden md:flex'}`}>
                {isDirectChat && superAdmin ? (
                    <>
                        {/* Direct Chat Header */}
                        <div className="h-auto min-h-20 px-4 md:px-8 py-4 border-b border-slate-50 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-100/50">
                                            <Bot className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="absolute -right-1 -top-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                                            AI Assistant
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 border border-purple-200 rounded-full">
                                                <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                                                <span className="text-[9px] font-black text-purple-600 uppercase">AI Assistant Integrated</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                Direct Line
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleClearDirectHistory}
                                        disabled={isClearingHistory || messages.length === 0}
                                        className="flex items-center gap-2 h-9 px-4 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 disabled:bg-slate-50 disabled:text-slate-300 transition-all text-[10px] font-black uppercase tracking-widest"
                                        title="Clear all messages"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Clear History
                                    </button>
                                    <button
                                        onClick={() => setIsDirectChat(false)}
                                        className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-red-500 flex items-center justify-center transition-all"
                                        title="Close chat"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col-reverse gap-4">
                            <div ref={messagesEndRef} />
                            {loading ? (
                                <div className="flex justify-center items-center h-full flex-col-reverse">
                                    <div className="text-slate-400 text-sm">Loading security channel...</div>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4 flex-col-reverse">
                                    <div className="text-center max-w-xs px-6">
                                        <p className="text-sm font-bold mb-1 uppercase tracking-tight">Secure Channel Established</p>
                                        <p className="text-xs text-slate-400">Ask the AI for help with group creation or directly message the Superadmin.</p>
                                    </div>
                                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                                        <Bot className="w-8 h-8 text-slate-300" />
                                    </div>
                                </div>
                            ) : (
                                [...messages].reverse().map((msg) => {
                                    const isMe = msg.sender_id === user?.id;
                                    const isAi = msg.is_ai_response || (isDirectChat && !isMe);
                                    return (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={msg.id}
                                            className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                                        >
                                            <div className="shrink-0">
                                                {isAi ? (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md ring-2 ring-white">
                                                        <Sparkles className="w-5 h-5" />
                                                    </div>
                                                ) : msg.sender?.avatar_url ? (
                                                    <Link href={`${profileBasePath}?userId=${msg.sender.id}`} className="block transition-transform hover:scale-105">
                                                        <img
                                                            src={msg.sender.avatar_url}
                                                            alt={msg.sender.full_name}
                                                            className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-md hover:ring-indigo-400 transition-all cursor-pointer"
                                                        />
                                                    </Link>
                                                ) : (
                                                    <Link href={`${profileBasePath}?userId=${msg.sender?.id}`} className="block transition-transform hover:scale-105">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white hover:ring-indigo-400 transition-all">
                                                            {getInitials(msg.sender?.full_name || 'U')}
                                                        </div>
                                                    </Link>
                                                )}
                                            </div>

                                            <div className={`flex flex-col max-w-[70%] md:max-w-[60%] ${isMe ? "items-end" : "items-start"}`}>
                                                <div className={`flex items-center gap-2 mb-1 px-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                                    <span className="text-xs font-bold text-slate-700">
                                                        {isAi ? (
                                                            'AI Assistant'
                                                        ) : (
                                                            <Link href={`${profileBasePath}?userId=${msg.sender?.id}`} className="hover:text-indigo-600 hover:underline transition-colors">
                                                                {isMe ? 'You' : msg.sender?.full_name || 'User'}
                                                            </Link>
                                                        )}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {formatTime(msg.created_at)}
                                                    </span>
                                                </div>

                                                <div className="relative group/message">
                                                    <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${isMe
                                                        ? "bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-tr-md"
                                                        : isAi
                                                            ? "bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-tl-md"
                                                            : "bg-slate-100 text-slate-700 rounded-tl-md"
                                                        }`}>
                                                        {msg.content}
                                                    </div>

                                                    {/* Delete Button (only for own messages) */}
                                                    {isMe && (
                                                        <button
                                                            onClick={() => handleDeleteMessage(msg.id)}
                                                            className="absolute -top-2 -right-2 opacity-0 group-hover/message:opacity-100 transition-opacity w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg"
                                                            title="Delete message"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-slate-50">
                            {sendError && (
                                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-red-500 shrink-0" />
                                    <p className="text-xs font-bold text-red-700">{sendError}</p>
                                </div>
                            )}

                            <div className="relative">
                                {/* Slash commands manual hint popup */}
                                {messageInput.startsWith('/') && (
                                    <div className="absolute bottom-full mb-2 left-0 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
                                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Available Commands</p>
                                        </div>
                                        <div className="p-1">
                                            {[
                                                { cmd: '/create group', desc: 'Create a new group' },
                                                { cmd: '/about', desc: 'About TaskSphere' },
                                                { cmd: '/founder', desc: 'Who created this?' },
                                                { cmd: '/help', desc: 'How to use...' }
                                            ]
                                                .filter(item => item.cmd.toLowerCase().includes(messageInput.toLowerCase()))
                                                .map((item, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => {
                                                            // Auto-send the command
                                                            handleSendMessage(undefined, item.cmd);
                                                        }}
                                                        className="w-full text-left px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-3 group"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                            /
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-700">{item.cmd}</p>
                                                            <p className="text-[10px] font-medium text-slate-400">{item.desc}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            {/* Show empty state if filtering returns nothing */}
                                            {[
                                                { cmd: '/create group', desc: 'Create a new group' },
                                                { cmd: '/about', desc: 'About TaskSphere' },
                                                { cmd: '/founder', desc: 'Who created this?' },
                                                { cmd: '/help', desc: 'How to use...' }
                                            ].filter(item => item.cmd.toLowerCase().includes(messageInput.toLowerCase())).length === 0 && (
                                                    <div className="p-3 text-center text-xs text-slate-400 italic">No matching commands</div>
                                                )}
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleSendMessage} className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-3xl p-2 pl-4 focus-within:ring-4 ring-indigo-500/10 focus-within:border-indigo-500/30 transition-all">
                                    <textarea
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        placeholder="Type your request to the AI Assistant... (e.g., /create group, /about)"
                                        className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400 py-3 max-h-32 resize-none"
                                        rows={1}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage(e);
                                            }
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!messageInput.trim()}
                                        className="p-3 bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-2xl hover:shadow-lg disabled:opacity-50 disabled:hover:shadow-none transition-all shadow-md active:scale-95"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </>
                ) : activeGroup ? (
                    <>
                        {/* Header */}
                        <div className="h-auto min-h-20 px-4 md:px-8 py-4 border-b border-slate-50 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-100/50">
                                            <User className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="absolute -right-1 -top-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                                                {activeGroup.name}
                                            </h3>
                                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${realtimeStatus === 'SUBSCRIBED'
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                : 'bg-amber-50 text-amber-600 border-amber-200'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${realtimeStatus === 'SUBSCRIBED' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                                                    }`} />
                                                {realtimeStatus === 'SUBSCRIBED' ? 'LIVE' : realtimeStatus}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                {activeGroup.members?.[0]?.count || 0} Members
                                            </p>
                                            {activeGroup.admin_only_chat && (
                                                <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-full">
                                                    <Shield className="w-2.5 h-2.5 text-amber-600" />
                                                    <span className="text-[9px] font-black text-amber-600 uppercase">Admin Only</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setActiveGroupId(null)}
                                        className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-red-500 flex items-center justify-center transition-all"
                                        title="Close chat"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Admin Controls */}
                            {isGroupAdmin() && (
                                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                    <button
                                        onClick={handleToggleAdminOnly}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeGroup.admin_only_chat
                                            ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                                            : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                                            }`}
                                    >
                                        {activeGroup.admin_only_chat ? (
                                            <>
                                                <Lock className="w-3 h-3" />
                                                Admin Only Mode
                                            </>
                                        ) : (
                                            <>
                                                <Unlock className="w-3 h-3" />
                                                Everyone Can Chat
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Messages */}
                        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col-reverse gap-4">
                            <div ref={messagesEndRef} />
                            {loading ? (
                                <div className="flex justify-center items-center h-full flex-col-reverse">
                                    <div className="text-slate-400 text-sm">Loading messages...</div>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4 flex-col-reverse">
                                    <div className="text-center">
                                        <p className="text-sm font-bold mb-1">No messages yet</p>
                                        <p className="text-xs text-slate-400">Start the conversation!</p>
                                    </div>
                                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                                        <MessageCircle className="w-8 h-8 text-slate-300" />
                                    </div>
                                </div>
                            ) : (
                                [...messages].reverse().map((msg) => {
                                    const isMe = msg.sender_id === user?.id;
                                    return (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={msg.id}
                                            className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                                        >
                                            {/* Profile Picture */}
                                            <div className="shrink-0">
                                                {msg.sender?.avatar_url ? (
                                                    <Link href={`${profileBasePath}?userId=${msg.sender.id}`} className="block transition-transform hover:scale-105">
                                                        <img
                                                            src={msg.sender.avatar_url}
                                                            alt={msg.sender.full_name}
                                                            className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-md hover:ring-emerald-400 transition-all"
                                                        />
                                                    </Link>
                                                ) : (
                                                    <Link href={`${profileBasePath}?userId=${msg.sender?.id}`} className="block transition-transform hover:scale-105">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white hover:ring-emerald-400 transition-all">
                                                            {getInitials(msg.sender?.full_name || 'U')}
                                                        </div>
                                                    </Link>
                                                )}
                                            </div>

                                            {/* Message Content */}
                                            <div className={`flex flex-col max-w-[70%] md:max-w-[60%] ${isMe ? "items-end" : "items-start"}`}>
                                                {/* Name and Time */}
                                                <div className={`flex items-center gap-2 mb-1 px-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                                    <span className="text-xs font-bold text-slate-700">
                                                        <Link href={`${profileBasePath}?userId=${msg.sender?.id}`} className="hover:text-emerald-600 hover:underline transition-colors">
                                                            {isMe ? 'You' : msg.sender?.full_name || 'Unknown'}
                                                        </Link>
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {formatTime(msg.created_at)}
                                                    </span>
                                                </div>

                                                {/* Message Bubble with Delete Button */}
                                                <div className="relative group/message">
                                                    <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${isMe
                                                        ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-tr-md"
                                                        : "bg-slate-100 text-slate-700 rounded-tl-md"
                                                        }`}>
                                                        {msg.content}
                                                    </div>

                                                    {/* Delete Button (only for own messages) */}
                                                    {isMe && (
                                                        <button
                                                            onClick={() => handleDeleteMessage(msg.id)}
                                                            className="absolute -top-2 -right-2 opacity-0 group-hover/message:opacity-100 transition-opacity w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg"
                                                            title="Delete message"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Read Receipt */}
                                                {isMe && (
                                                    <div className="flex items-center gap-1 mt-1 px-1">
                                                        <CheckCheck className="w-3 h-3 text-emerald-500" />
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-slate-50">
                            {sendError && (
                                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-red-500 shrink-0" />
                                    <p className="text-xs font-bold text-red-700">{sendError}</p>
                                </div>
                            )}

                            <div className="relative">
                                <AnimatePresence>
                                    {showEmojiPicker && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute bottom-full mb-2 right-0 z-50 shadow-2xl rounded-2xl overflow-hidden"
                                        >
                                            <EmojiPicker onEmojiClick={handleEmojiClick} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <form onSubmit={handleSendMessage} className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-3xl p-2 pl-4 focus-within:ring-4 ring-emerald-500/10 focus-within:border-emerald-500/30 transition-all">
                                    <textarea
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        placeholder={activeGroup.admin_only_chat && !isGroupAdmin()
                                            ? "Only admins can send messages..."
                                            : `Message ${activeGroup.name}...`}
                                        disabled={activeGroup.admin_only_chat && !isGroupAdmin()}
                                        className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400 py-3 max-h-32 resize-none disabled:opacity-50"
                                        rows={1}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage(e);
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className="p-2 text-slate-400 hover:text-emerald-600 transition-colors disabled:opacity-50"
                                        disabled={activeGroup.admin_only_chat && !isGroupAdmin()}
                                    >
                                        <Smile className="w-5 h-5" />
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!messageInput.trim() || (activeGroup.admin_only_chat && !isGroupAdmin())}
                                        className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl hover:shadow-lg disabled:opacity-50 disabled:hover:shadow-none transition-all shadow-md active:scale-95"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                        <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center mb-6">
                            <Clock className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">No Group Selected</h3>
                        <p className="text-sm font-medium">Select a group to start messaging</p>
                    </div>
                )}       </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={cancelDelete}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200"
                        >
                            {/* Header */}
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
                                    <Trash2 className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                        Delete Message
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium">
                                        This action cannot be undone
                                    </p>
                                </div>
                            </div>

                            {/* Body */}
                            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                                Are you sure you want to delete this message? It will be removed for everyone in the group.
                            </p>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={cancelDelete}
                                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all uppercase tracking-wide"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-3 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all uppercase tracking-wide active:scale-95"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}

"use client";

import { useState, useEffect, useRef } from "react";
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
    Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { sendGroupMessage, getGroupMessages, toggleAdminOnlyChat, deleteGroupMessage } from "./actions";
import { useUser } from "@clerk/nextjs";
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface Message {
    id: string;
    group_id: string;
    sender_id: string;
    content: string;
    created_at: string;
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

export function LiveMessagesClient({ initialGroups }: { initialGroups: Group[] }) {
    const { user } = useUser();
    const [activeGroupId, setActiveGroupId] = useState<string | null>(initialGroups.length > 0 ? initialGroups[0].id : null);
    const [messageInput, setMessageInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [groups, setGroups] = useState<Group[]>(initialGroups);
    const [sendError, setSendError] = useState<string>("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    const activeGroup = groups.find(g => g.id === activeGroupId);

    // Check if current user is admin of active group
    const isGroupAdmin = () => {
        if (!activeGroup || !user?.id) return false;
        // Check if user is the top admin of the group
        if (activeGroup.top_admin_id === user.id) return true;
        // Note: For more precise checks, you'd need to query group_members table
        // For now, we assume top_admin_id is sufficient
        return false;
    };

    // Load messages when group changes
    useEffect(() => {
        if (!activeGroupId) {
            setMessages([]);
            return;
        }

        loadMessages();
    }, [activeGroupId]);

    // Set up realtime subscription
    useEffect(() => {
        if (!activeGroupId) return;

        console.log('Setting up realtime for group:', activeGroupId);

        const channel = supabase
            .channel(`group_messages_${activeGroupId}`, {
                config: {
                    broadcast: { self: true },
                },
            })
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'group_messages',
                    filter: `group_id=eq.${activeGroupId}`
                },
                async (payload: any) => {
                    console.log('New message received:', payload);
                    // Fetch the full message with sender details
                    const { data } = await supabase
                        .from('group_messages')
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

                    if (data) {
                        console.log('Adding message to state:', data);
                        setMessages(prev => [...prev, data as Message]);
                        setTimeout(() => scrollToBottom(), 100);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'group_messages',
                    filter: `group_id=eq.${activeGroupId}`
                },
                (payload: any) => {
                    console.log('Message deleted:', payload);
                    // Remove message from state
                    setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
                }
            )
            .subscribe((status) => {
                console.log('Realtime subscription status:', status);
            });

        return () => {
            console.log('Cleaning up realtime for group:', activeGroupId);
            supabase.removeChannel(channel);
        };
    }, [activeGroupId, supabase]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadMessages = async () => {
        if (!activeGroupId) return;

        setLoading(true);
        const { messages: fetchedMessages } = await getGroupMessages(activeGroupId);
        setMessages(fetchedMessages || []);
        setLoading(false);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !activeGroupId) return;

        const content = messageInput;
        setMessageInput("");
        setShowEmojiPicker(false);
        setSendError("");

        const result = await sendGroupMessage(activeGroupId, content);
        if (result.error) {
            setSendError(result.error);
            // Show error for 3 seconds
            setTimeout(() => setSendError(""), 3000);
        }
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

        const result = await deleteGroupMessage(messageToDelete);
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
                            className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-4 ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-400 uppercase tracking-wide"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                    {groups.map(group => (
                        <button
                            key={group.id}
                            onClick={() => setActiveGroupId(group.id)}
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
                    {groups.length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                            <p className="text-xs">No groups found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex-col bg-white ${activeGroup ? 'flex' : 'hidden md:flex'}`}>
                {activeGroup ? (
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
                                        <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                                            {activeGroup.name}
                                        </h3>
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
                        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4">
                            {loading ? (
                                <div className="flex justify-center items-center h-full">
                                    <div className="text-slate-400 text-sm">Loading messages...</div>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                                        <MessageCircle className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold mb-1">No messages yet</p>
                                        <p className="text-xs text-slate-400">Start the conversation!</p>
                                    </div>
                                </div>
                            ) : (
                                messages.map((msg) => {
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
                                                    <img
                                                        src={msg.sender.avatar_url}
                                                        alt={msg.sender.full_name}
                                                        className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-md"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white">
                                                        {getInitials(msg.sender?.full_name || 'U')}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Message Content */}
                                            <div className={`flex flex-col max-w-[70%] md:max-w-[60%] ${isMe ? "items-end" : "items-start"}`}>
                                                {/* Name and Time */}
                                                <div className={`flex items-center gap-2 mb-1 px-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                                    <span className="text-xs font-bold text-slate-700">
                                                        {isMe ? 'You' : msg.sender?.full_name || 'Unknown'}
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
                            <div ref={messagesEndRef} />
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
        </div>
    );
}

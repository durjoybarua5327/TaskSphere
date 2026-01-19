"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, User, Heart, MessageCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { getNotifications, markNotificationAsRead } from "@/app/student/actions";
import { useRouter } from "next/navigation";

// Define Notification Type
type Notification = {
    id: string;
    type: "like" | "comment" | "system";
    actor_id: string;
    post_id: string | null;
    message: string;
    is_read: boolean;
    created_at: string;
    actor?: {
        full_name: string | null;
        avatar_url: string | null;
    };
    post?: {
        id: string;
        title: string | null;
    };
};

export function NotificationPopover() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const router = useRouter();
    const popoverRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        const data = await getNotifications();
        // @ts-ignore
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.is_read).length);
    };

    useEffect(() => {
        fetchNotifications();
        // Poll for notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Handle click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_read) {
            await markNotificationAsRead(notification.id);
            setUnreadCount((prev) => Math.max(0, prev - 1));
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
        }

        if (notification.post_id) {
            router.push(`/superadmin?postId=${notification.post_id}`);
        }

        setIsOpen(false);
    };

    return (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all group"
            >
                <Bell className={`w-4 h-4 group-hover:rotate-12 transition-transform ${unreadCount > 0 ? "text-slate-900" : ""}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white"></span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-12 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden flex flex-col max-h-[80vh]"
                    >
                        <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 shrink-0">
                            <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-red-100">
                                    {unreadCount} New
                                </span>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
                            {notifications.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {notifications.map((notification) => (
                                        <button
                                            key={notification.id}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex gap-3 ${!notification.is_read ? "bg-blue-50/30" : ""}`}
                                        >
                                            <div className="relative shrink-0">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden">
                                                    {notification.actor?.avatar_url ? (
                                                        <img src={notification.actor.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-5 h-5 text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                                                    {notification.type === "like" ? (
                                                        <Heart className="w-2.5 h-2.5 text-red-500 fill-current" />
                                                    ) : notification.type === "comment" ? (
                                                        <MessageCircle className="w-2.5 h-2.5 text-blue-500 fill-current" />
                                                    ) : (
                                                        <Bell className="w-2.5 h-2.5 text-slate-500" />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col gap-0.5">
                                                    <p className="text-xs text-slate-900 leading-snug">
                                                        <span className="font-black">{notification.actor?.full_name || "Someone"}</span>
                                                        {" "}{notification.message}
                                                    </p>
                                                    {notification.post?.title && (
                                                        <p className="text-[10px] text-slate-500 font-medium truncate">
                                                            "{notification.post.title}"
                                                        </p>
                                                    )}
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                    </p>
                                                </div>
                                            </div>
                                            {!notification.is_read && (
                                                <div className="shrink-0 self-center">
                                                    <div className="w-2 h-2 rounded-full bg-[#00897B]" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No notifications</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

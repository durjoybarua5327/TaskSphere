"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Check, Info } from "lucide-react";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning" | "info" | "success";
    isLoading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "danger",
    isLoading = false
}: ConfirmModalProps) {

    // Variant styles
    const colors = {
        danger: {
            bg: "bg-red-50",
            border: "border-red-100",
            iconBg: "bg-red-100",
            iconColor: "text-red-600",
            buttonBg: "bg-red-600",
            buttonHover: "hover:bg-red-700",
            buttonRing: "focus:ring-red-600/20"
        },
        warning: {
            bg: "bg-amber-50",
            border: "border-amber-100",
            iconBg: "bg-amber-100",
            iconColor: "text-amber-600",
            buttonBg: "bg-amber-600",
            buttonHover: "hover:bg-amber-700",
            buttonRing: "focus:ring-amber-600/20"
        },
        info: {
            bg: "bg-blue-50",
            border: "border-blue-100",
            iconBg: "bg-blue-100",
            iconColor: "text-blue-600",
            buttonBg: "bg-blue-600",
            buttonHover: "hover:bg-blue-700",
            buttonRing: "focus:ring-blue-600/20"
        },
        success: {
            bg: "bg-emerald-50",
            border: "border-emerald-100",
            iconBg: "bg-emerald-100",
            iconColor: "text-emerald-600",
            buttonBg: "bg-emerald-600",
            buttonHover: "hover:bg-emerald-700",
            buttonRing: "focus:ring-emerald-600/20"
        }
    };

    const styles = colors[variant];
    const Icon = variant === 'success' ? Check : variant === 'info' ? Info : AlertTriangle;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-md pointer-events-auto overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className={`p-8 ${styles.bg}`}>
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className={`w-16 h-16 rounded-[2rem] ${styles.iconBg} flex items-center justify-center`}>
                                        <Icon className={`w-8 h-8 ${styles.iconColor}`} />
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                            {title}
                                        </h3>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                                            {description}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-white border-t border-slate-50 flex gap-3">
                                <button
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all disabled:opacity-50"
                                >
                                    {cancelLabel}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={isLoading}
                                    className={`flex-1 py-4 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 ${styles.buttonBg} ${styles.buttonHover}`}
                                >
                                    {isLoading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                    {confirmLabel}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
    preventOutsideClick?: boolean;
    hideHeader?: boolean;
    contentClassName?: string;
}

export function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    className,
    preventOutsideClick = false,
    hideHeader = false,
    contentClassName,
}: ModalProps) {
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleEscape);
        }

        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (!preventOutsideClick && e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-all duration-200 opacity-100"
            onClick={handleBackdropClick}
            aria-modal="true"
            role="dialog"
        >
            <div
                className={cn(
                    "relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 p-6 mx-4 transition-all duration-200 scale-100",
                    className
                )}
            >
                {!hideHeader && (
                    <div className="flex items-center justify-between mb-4">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold text-slate-900 leading-none tracking-tight">
                                {title}
                            </h2>
                            {description && (
                                <p className="text-sm text-slate-500">{description}</p>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-slate-100"
                            onClick={onClose}
                        >
                            <X className="w-4 h-4 text-slate-500" />
                            <span className="sr-only">Close</span>
                        </Button>
                    </div>
                )}

                <div className={cn("mt-2 max-h-[70vh] overflow-y-auto pr-2", contentClassName)}>
                    {children}
                </div>
            </div>
        </div>
    );
}

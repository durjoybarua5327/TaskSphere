"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Modal } from "@/components/ui/modal";

type ModalType = "create" | "edit" | "delete" | "confirm" | "custom";

interface ModalConfig {
    type: ModalType;
    title: string;
    description?: string;
    content?: React.ReactNode;
    onConfirm?: () => void | Promise<void>;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    preventOutsideClick?: boolean;
    className?: string;
}

interface ModalContextType {
    openModal: (config: ModalConfig) => void;
    closeModal: () => void;
    isOpen: boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const openModal = useCallback((config: ModalConfig) => {
        setModalConfig(config);
        setIsOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsOpen(false);
        setModalConfig(null);
        setIsLoading(false);
    }, []);

    const handleConfirm = async () => {
        if (modalConfig?.onConfirm) {
            setIsLoading(true);
            try {
                await modalConfig.onConfirm();
                closeModal();
            } catch (error) {
                console.error("Modal action failed:", error);
            } finally {
                setIsLoading(false);
            }
        } else {
            closeModal();
        }
    };

    return (
        <ModalContext.Provider value={{ openModal, closeModal, isOpen }}>
            {children}
            {modalConfig && (
                <Modal
                    isOpen={isOpen}
                    onClose={closeModal}
                    title={modalConfig.title}
                    description={modalConfig.description}
                    preventOutsideClick={modalConfig.preventOutsideClick}
                    className={modalConfig.className}
                >
                    {modalConfig.content ? (
                        modalConfig.content
                    ) : (
                        // Default confirmation dialog
                        <div className="space-y-4">
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={closeModal}
                                    disabled={isLoading}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                                >
                                    {modalConfig.cancelText || "Cancel"}
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isLoading}
                                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 ${modalConfig.isDestructive
                                        ? "bg-red-600 hover:bg-red-700"
                                        : "bg-emerald-600 hover:bg-emerald-700"
                                        }`}
                                >
                                    {isLoading && (
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                    )}
                                    {modalConfig.confirmText || "Confirm"}
                                </button>
                            </div>
                        </div>
                    )}
                </Modal>
            )}
        </ModalContext.Provider>
    );
}

export function useModal() {
    const context = useContext(ModalContext);
    if (!context) {
        // Prevent SSR crash if context is missing
        console.warn("useModal must be used within a ModalProvider");
        return {
            openModal: () => console.warn("ModalProvider not found"),
            closeModal: () => { },
            isOpen: false
        };
    }
    return context;
}

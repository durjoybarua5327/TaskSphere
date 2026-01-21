"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Plus, Calendar, Image as ImageIcon } from "lucide-react";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { FileUpload } from "@/components/ui/file-upload";
import { uploadTaskAttachment } from "@/app/admin/actions";


interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    initialData?: any;
    isSubmitting: boolean;
    groups?: { id: string; name: string }[];
}

export function CreateTaskModal({ isOpen, onClose, onSubmit, initialData, isSubmitting, groups }: CreateTaskModalProps) {
    const [editorKey, setEditorKey] = useState(0);
    const [data, setData] = useState({
        title: "",
        description: "",
        deadline: "",
        maxScore: 10,
        attachments: [] as string[],
        groupId: ""
    });

    useEffect(() => {
        if (initialData) {
            setData({
                title: initialData.title || "",
                description: initialData.description || "",
                deadline: initialData.deadline ? new Date(initialData.deadline).toISOString().split('T')[0] : "",
                maxScore: initialData.maxScore || 10,
                attachments: initialData.attachments || [],
                groupId: initialData.group_id || ""
            });
        } else {
            setData({
                title: "",
                description: "",
                deadline: "",
                maxScore: 10,
                attachments: [],
                groupId: groups && groups.length > 0 ? groups[0].id : ""
            });
        }
        setEditorKey(prev => prev + 1);
    }, [initialData, isOpen, groups]);

    // ... handleSubmit ...
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(data);
    };

    // ... handleUpload ...
    const handleUpload = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);

        const result = await uploadTaskAttachment(formData);
        if (result.error) {
            alert(result.error);
            return "";
        }
        return result.url || "";
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-[5%] -translate-x-1/2 w-full max-w-2xl max-h-[90vh] bg-white rounded-[2rem] shadow-2xl z-[101] flex flex-col overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-6 md:p-8 border-b border-slate-50">
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                                {initialData ? "Edit Task" : "Create Task"}
                            </h2>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 md:p-8 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-track]:bg-transparent">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {groups && groups.length > 0 && !initialData && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Select Group</label>
                                        <select
                                            required
                                            value={data.groupId}
                                            onChange={(e) => setData({ ...data, groupId: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all appearance-none"
                                        >
                                            {groups.map(group => (
                                                <option key={group.id} value={group.id}>{group.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Task Title</label>
                                    <input
                                        required
                                        type="text"
                                        value={data.title}
                                        onChange={(e) => setData({ ...data, title: e.target.value })}
                                        placeholder="e.g. Weekly Assignment 1"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Description</label>
                                    <div className="min-h-[200px] border border-slate-100 rounded-2xl overflow-hidden">
                                        <RichTextEditor
                                            key={editorKey}
                                            content={data.description}
                                            onChange={(content) => setData({ ...data, description: content })}
                                            placeholder="Describe the task requirements..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Attachments</label>
                                    <FileUpload
                                        value={data.attachments}
                                        onChange={(urls) => setData({ ...data, attachments: urls })}
                                        onUploadFile={handleUpload}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Deadline</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={data.deadline}
                                                onChange={(e) => setData({ ...data, deadline: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all pl-10"
                                            />
                                            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Points (Max 10)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={data.maxScore}
                                            onChange={(e) => setData({ ...data, maxScore: Math.min(10, parseInt(e.target.value) || 0) })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3 justify-end">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-slate-200"
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                        {initialData ? "Save Changes" : "Create Task"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

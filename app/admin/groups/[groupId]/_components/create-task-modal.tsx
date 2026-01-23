"use client";
import { useState, useEffect } from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";
import {
    Loader2,
    Lock,
    Globe,
    X,
    ChevronDown,
    Bold as BoldIcon,
    Italic as ItalicIcon,
    List,
    ListOrdered,
    Quote,
    Code,
    Plus
} from "lucide-react";

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    isSubmitting: boolean;
    groups?: { id: string; name: string }[];
    groupId?: string;
    initialData?: {
        title: string;
        description: string;
        deadline: string | null;
        max_score: number;
        attachments: string[];
        submissions_visibility?: 'private' | 'public';
    } | null;
}

export function CreateTaskModal({
    isOpen,
    onClose,
    onSubmit,
    isSubmitting,
    groups = [],
    groupId,
    initialData
}: CreateTaskModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [deadline, setDeadline] = useState("");
    const [maxScore, setMaxScore] = useState("10");
    const [selectedGroupId, setSelectedGroupId] = useState(groupId || "");
    const [attachments, setAttachments] = useState<string[]>([]);
    const [submissionsVisibility, setSubmissionsVisibility] = useState<'private' | 'public'>('private');

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2] }
            }),
            Placeholder.configure({
                placeholder: 'Write task description...',
            })
        ],
        content: description,
        editorProps: {
            attributes: {
                class: 'prose prose-sm focus:outline-none min-h-[120px] px-4 py-3 text-slate-600',
            },
        },
        onUpdate: ({ editor }) => {
            setDescription(editor.getHTML());
        },
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title);
                const desc = initialData.description || "";
                setDescription(desc);
                if (editor) {
                    editor.commands.setContent(desc);
                }

                if (initialData.deadline) {
                    const d = new Date(initialData.deadline);
                    const offset = d.getTimezoneOffset() * 60000;
                    const localISOTime = (new Date(d.getTime() - offset)).toISOString().slice(0, 16);
                    setDeadline(localISOTime);
                } else {
                    setDeadline("");
                }
                setMaxScore(initialData.max_score.toString());
                setAttachments(initialData.attachments || []);
                setSubmissionsVisibility(initialData.submissions_visibility || 'private');
            } else {
                setTitle("");
                setDescription("");
                if (editor) {
                    editor.commands.clearContent();
                }
                setDeadline("");
                setMaxScore("10");
                setAttachments([]);
                setSubmissionsVisibility('private');
            }
        }
    }, [isOpen, initialData, editor]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            title,
            description,
            deadline: deadline ? new Date(deadline).toISOString() : null,
            maxScore: parseInt(maxScore),
            groupId: groupId || selectedGroupId,
            attachments,
            submissions_visibility: submissionsVisibility
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Create Task</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {/* select group */}
                    {(!groupId && groups.length > 0) && (
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Group</Label>
                            <div className="relative">
                                <select
                                    className="w-full flex h-12 rounded-xl border border-slate-100 bg-slate-50/50 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none"
                                    value={selectedGroupId}
                                    onChange={(e) => setSelectedGroupId(e.target.value)}
                                    required
                                >
                                    <option value="">Select a group...</option>
                                    {groups.map(g => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <ChevronDown className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Task Title */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Task Title</Label>
                        <Input
                            placeholder="e.g. Weekly Assignment 1"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="h-12 rounded-xl border-slate-100 bg-slate-50/50 px-4 text-sm font-bold text-slate-700 placeholder:text-slate-400 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500"
                        />
                    </div>

                    {/* Description (Tiptap) */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Description</Label>
                        <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all bg-white">
                            {editor && (
                                <div className="flex items-center gap-1 border-b border-slate-100 p-2 bg-slate-50/50">
                                    <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon={<BoldIcon className="w-4 h-4" />} />
                                    <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} icon={<ItalicIcon className="w-4 h-4" />} />
                                    <div className="w-px h-4 bg-slate-300 mx-1" />
                                    <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} label="H1" />
                                    <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} label="H2" />
                                    <div className="w-px h-4 bg-slate-300 mx-1" />
                                    <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} icon={<List className="w-4 h-4" />} />
                                    <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} icon={<ListOrdered className="w-4 h-4" />} />
                                    <div className="w-px h-4 bg-slate-300 mx-1" />
                                    <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} icon={<Quote className="w-4 h-4" />} />
                                    <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} icon={<Code className="w-4 h-4" />} />
                                </div>
                            )}
                            <EditorContent editor={editor} />
                        </div>
                    </div>

                    {/* Attachments */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Attachments</Label>
                        <div className="flex flex-wrap gap-4">
                            <FileUpload
                                value={attachments}
                                onChange={setAttachments}
                                endpoint="taskAttachments"
                            />
                        </div>
                    </div>

                    {/* Deadline & Points */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Deadline</Label>
                            <Input
                                type="datetime-local"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="h-12 rounded-xl border-slate-100 bg-slate-50/50 px-4 text-sm font-bold text-slate-700 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Points (Max 10)</Label>
                            <Input
                                type="number"
                                min="0"
                                value={maxScore}
                                onChange={(e) => setMaxScore(e.target.value)}
                                required
                                className="h-12 rounded-xl border-slate-100 bg-slate-50/50 px-4 text-sm font-bold text-slate-700 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Visibility */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Student Submissions Visibility</Label>
                        <div className="flex p-1 bg-slate-100 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setSubmissionsVisibility('private')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${submissionsVisibility === 'private'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                <Lock className="w-3 h-3" />
                                Private
                            </button>
                            <button
                                type="button"
                                onClick={() => setSubmissionsVisibility('public')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${submissionsVisibility === 'public'
                                    ? 'bg-white text-blue-500 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                <Globe className="w-3 h-3" />
                                Public
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium italic ml-1">
                            {submissionsVisibility === 'private'
                                ? 'Only the student and admins can see the submission.'
                                : 'All students in the group can see each other\'s submissions.'}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-slate-100 bg-white flex items-center justify-end gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting || (!groupId && !selectedGroupId)}
                        className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                Create Task
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

const ToolbarButton = ({ onClick, isActive, icon, label }: any) => (
    <button
        type="button"
        onClick={onClick}
        className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-slate-200 text-slate-900' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
            }`}
    >
        {icon || <span className="text-xs font-black">{label}</span>}
    </button>
);

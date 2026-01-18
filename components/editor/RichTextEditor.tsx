"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Quote, Code, Heading1, Heading2 } from 'lucide-react';
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    editable?: boolean;
    placeholder?: string;
    className?: string; // Added className support
}

export function RichTextEditor({ content, onChange, editable = true, placeholder = "Write something...", className }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder,
            }),
        ],
        content,
        editable,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[150px] p-4',
            },
        },
    });

    if (!editor) {
        return null;
    }

    if (!editable) {
        return <EditorContent editor={editor} className="disabled-editor" />;
    }

    return (
        <div className={cn("flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all", className)}>
            <div className="shrink-0 bg-slate-50 border-b border-slate-200 p-2 flex gap-1 flex-wrap sticky top-0 z-10">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    icon={<Bold className="w-4 h-4" />}
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    icon={<Italic className="w-4 h-4" />}
                />
                <div className="w-px h-6 bg-slate-300 mx-1 self-center" />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive('heading', { level: 1 })}
                    icon={<Heading1 className="w-4 h-4" />}
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    icon={<Heading2 className="w-4 h-4" />}
                />
                <div className="w-px h-6 bg-slate-300 mx-1 self-center" />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    icon={<List className="w-4 h-4" />}
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    icon={<ListOrdered className="w-4 h-4" />}
                />
                <div className="w-px h-6 bg-slate-300 mx-1 self-center" />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive('blockquote')}
                    icon={<Quote className="w-4 h-4" />}
                />
                <ToolbarButton
                    onClick={() => {
                        // Custom logic to ensure selected text becomes ONE code block
                        const { from, to } = editor.state.selection;
                        const text = editor.state.doc.textBetween(from, to, '\n');

                        if (editor.isActive('codeBlock')) {
                            editor.chain().focus().toggleCodeBlock().run();
                        } else if (text.length > 0) {
                            // If there is a selection, replace it with a code block containing the text
                            editor.chain().focus()
                                .deleteSelection()
                                .setCodeBlock()
                                .insertContent(text)
                                .run();
                        } else {
                            // No selection, just toggle usual behavior
                            editor.chain().focus().toggleCodeBlock().run();
                        }
                    }}
                    isActive={editor.isActive('codeBlock')}
                    icon={<Code className="w-4 h-4" />}
                />
            </div>
            <div className="flex-1 overflow-y-auto bg-white cursor-text min-h-0" onClick={() => editor.chain().focus().run()}>
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}

function ToolbarButton({ onClick, isActive, icon }: { onClick: () => void, isActive: boolean, icon: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "p-2 rounded-md transition-colors hover:bg-slate-200 text-slate-600",
                isActive && "bg-slate-200 text-slate-900"
            )}
            type="button"
        >
            {icon}
        </button>
    );
}

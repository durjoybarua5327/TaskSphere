"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Calendar,
    FileText,
    Link as LinkIcon,
    Download,
    Clock,
    CheckCircle2,
    AlertCircle,
    Send,
    Loader2,
    CheckCircle,
    Users,
    ChevronRight,
    Trophy,
    Eye,
    EyeOff,
    Trash2,
    Edit
} from "lucide-react";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { FileUpload } from "@/components/ui/file-upload";
import { submitTask, deleteSubmission } from "@/app/admin/actions";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@/components/ui/modal";

interface StudentTaskDetailsClientProps {
    task: any;
    initialSubmission: any | null;
    userId: string;
    publicSubmissions?: any[];
}

export function StudentTaskDetailsClient({ task, initialSubmission, userId, publicSubmissions = [] }: StudentTaskDetailsClientProps) {
    const router = useRouter();
    const [content, setContent] = useState(initialSubmission?.content || "");
    const [attachments, setAttachments] = useState<string[]>(initialSubmission?.attachments || []);
    const [linkUrl, setLinkUrl] = useState(initialSubmission?.link_url || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const isGraded = initialSubmission?.scores && initialSubmission?.scores.length > 0;
    const score = isGraded ? initialSubmission.scores[0] : null;

    const handleSubmit = async () => {
        if (!content && attachments.length === 0 && !linkUrl) {
            alert("Please provide some content or attachments for your submission.");
            return;
        }

        setIsSubmitting(true);
        const result = await submitTask(task.id, {
            content,
            attachments,
            link_url: linkUrl
        });
        setIsSubmitting(false);

        if (result.success) {
            setSuccessMessage("Task submitted successfully!");
            setTimeout(() => {
                setSuccessMessage("");
                setIsModalOpen(false);
            }, 2000);
            router.refresh();
        } else {
            alert(result.error);
        }
    };

    const handleDelete = async () => {
        if (!initialSubmission) return;

        setIsSubmitting(true);
        const result = await deleteSubmission(initialSubmission.id);
        setIsSubmitting(false);

        if (result.success) {
            setIsDeleteModalOpen(false);
            router.refresh();
        } else {
            alert(result.error);
        }
    };

    const isPublic = task.submissions_visibility === 'public';
    // Filter out our own submission from publicSubmissions if it's there
    const peerSubmissions = publicSubmissions.filter(s => s.student_id !== userId);

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6 space-y-4 font-sans">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4 mb-1">
                <Link href="/student/groups" className="hover:text-emerald-500 transition-colors uppercase">
                    GROUPS
                </Link>
                <ChevronRight className="w-2.5 h-2.5 text-slate-300" />
                <Link href={`/student/groups/${task.group.id}`} className="hover:text-emerald-500 transition-colors uppercase">
                    TASKS
                </Link>
                <ChevronRight className="w-2.5 h-2.5 text-slate-300" />
                <span className="text-emerald-500">SUBMISSIONS</span>
            </nav>

            <div className="max-w-7xl mx-auto space-y-4">
                {/* Main Task Card - Super Compact */}
                <div className="bg-white border border-slate-100 rounded-[2rem] p-5 md:p-8 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.03)] relative overflow-hidden">
                    <div className="relative z-10">
                        {/* Header Badges & Action Button */}
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                            <div className="flex flex-wrap items-center gap-1.5 text-[8px]">
                                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E6F8F1] text-emerald-600 border border-emerald-100/50">
                                    <FileText className="w-2.5 h-2.5" />
                                    <span className="font-black uppercase tracking-widest">Details</span>
                                </div>
                                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F0F5FF] text-indigo-600 border border-indigo-100/50">
                                    <span className="font-black uppercase tracking-widest">Group: {task.group?.name}</span>
                                </div>
                                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF4E6] text-orange-600 border border-orange-100/50">
                                    <span className="font-black uppercase tracking-widest">Max: {task.max_score}</span>
                                </div>
                                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B] border border-slate-100 uppercase tracking-widest font-black">
                                    <div className={`w-1 h-1 rounded-full ${isPublic ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                                    {isPublic ? 'Public' : 'Private'}
                                </div>
                            </div>

                            {!isGraded && (
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F172A] text-white rounded-lg text-[9px] font-black uppercase tracking-[0.15em] hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95 group shrink-0"
                                >
                                    <Send className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    {initialSubmission ? 'UPDATE SUBMISSION' : 'SUBMIT TASK'}
                                </button>
                            )}
                        </div>

                        {/* Title & Description - Compact Sizes */}
                        <div className="space-y-2 mb-6">
                            <h1 className="text-3xl md:text-5xl font-black text-[#0F172A] tracking-[-0.05em] uppercase leading-tight">
                                {task.title}
                            </h1>
                            <div
                                className="prose prose-slate max-w-none text-[#64748B] text-sm font-medium leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: task.description || '' }}
                            />
                        </div>

                        {/* Reference Materials */}
                        {task.attachments && task.attachments.length > 0 && (
                            <div className="space-y-3 pt-4 border-t border-slate-50">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.25em]">REFERENCE MATERIALS</p>
                                <div className="flex flex-wrap gap-3">
                                    {task.attachments.map((url: string, index: number) => {
                                        const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                                        const fileName = url.split('/').pop()?.split('-').pop() || "Attachment";
                                        return (
                                            <a
                                                key={index}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group p-0.5 bg-white border border-slate-100 rounded-lg hover:border-emerald-200 hover:shadow-lg transition-all"
                                            >
                                                <div className="w-14 h-14 rounded-md bg-slate-50 flex items-center justify-center text-slate-300 overflow-hidden relative">
                                                    {isImage ? (
                                                        <img src={url} alt={fileName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-1 opacity-40">
                                                            <FileText className="w-4 h-4" />
                                                            <span className="text-[6px] font-black uppercase truncate px-1 max-w-full">{fileName}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Grade Card (If Graded) */}
                {isGraded && (
                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-24 bg-emerald-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700" />

                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <Trophy className="w-3 h-3" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Grade Achievement</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-7xl font-black text-white tracking-tighter">{score.score_value}</span>
                                    <span className="text-2xl font-black text-slate-500 tracking-tighter">/ {task.max_score}</span>
                                </div>
                                <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Educator Feedback</p>
                                    <p className="text-base font-medium text-slate-200 italic leading-relaxed">
                                        "{score.feedback || 'Great work on this task!'}"
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-3xl p-8 border border-white/5 flex flex-col justify-center space-y-6">
                                <div className="flex items-center gap-4 text-emerald-400">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Status: Completed</p>
                                        <p className="text-[9px] font-bold opacity-60 uppercase tracking-widest">Validated by Educator</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Submission History</p>
                                    <div className="flex items-center justify-between py-3 border-y border-white/5">
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Submitted On</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {new Date(initialSubmission.submitted_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Submissions Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-4">
                        <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tight flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                                <Users className="w-4 h-4" />
                            </div>
                            {isPublic ? 'Submission Hub' : 'My Submission'}
                        </h3>
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest">
                            {isPublic ? `${peerSubmissions.length + (initialSubmission ? 1 : 0)} Submissions` : initialSubmission ? '1 Submission' : '0 Submissions'}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* 1. Show User's Own Submission First */}
                        {initialSubmission && (
                            <div className="bg-white border-2 border-emerald-500/20 rounded-3xl p-5 shadow-sm hover:shadow-lg transition-all group/sub relative overflow-hidden">
                                <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500 text-white text-[7px] font-black uppercase tracking-widest rounded-bl-xl">
                                    Your Work
                                </div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full border-2 border-emerald-100 overflow-hidden bg-emerald-50 flex items-center justify-center text-emerald-600 font-black text-xs">
                                        {task.group?.name?.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-slate-900 uppercase truncate leading-tight">You</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                            {new Date(initialSubmission.submitted_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {isGraded && (
                                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-black text-[10px]">
                                            {score.score_value}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div
                                        className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: initialSubmission.content || 'No description provided' }}
                                    />

                                    <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex gap-2">
                                            {!isGraded && (
                                                <>
                                                    <button
                                                        onClick={() => setIsModalOpen(true)}
                                                        className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                                                        title="Edit Submission"
                                                    >
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setIsDeleteModalOpen(true)}
                                                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                        title="Delete Submission"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                        <Link
                                            href={`/student/tasks/${task.id}/submission`}
                                            className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover/sub:text-emerald-500 transition-colors flex items-center gap-1"
                                        >
                                            Details <ChevronRight className="w-2.5 h-2.5" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. Show Peer Submissions if Public */}
                        {isPublic && peerSubmissions.length > 0 && (
                            peerSubmissions.map((submission: any) => (
                                <div
                                    key={submission.id}
                                    className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-lg transition-all group/sub"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full border-2 border-slate-50 overflow-hidden bg-indigo-50 flex items-center justify-center text-indigo-500 font-black text-xs transition-transform group-hover/sub:scale-110">
                                            {submission.student.avatar_url ? (
                                                <img src={submission.student.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                submission.student.full_name?.charAt(0)
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-slate-900 uppercase truncate leading-tight">
                                                {submission.student.full_name}
                                            </p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                {new Date(submission.submitted_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div
                                            className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: submission.content || 'No description provided' }}
                                        />

                                        <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                                            <div className="flex gap-1.5">
                                                {submission.attachments?.length > 0 && (
                                                    <div className="flex items-center gap-1 text-slate-400 group-hover/sub:text-indigo-500 transition-colors">
                                                        <FileText className="w-3 h-3" />
                                                        <span className="text-[8px] font-black">{submission.attachments.length}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <Link
                                                href={`/student/tasks/${task.id}/peer/${submission.id}`}
                                                className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover/sub:text-emerald-500 transition-colors flex items-center gap-1"
                                            >
                                                View detail <ChevronRight className="w-2.5 h-2.5" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}

                        {!initialSubmission && (!isPublic || peerSubmissions.length === 0) && (
                            <div className="lg:col-span-3 py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                <Clock className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No work turned in yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Submission Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={initialSubmission ? "Update Submission" : "Turn In Your Work"}
                description={initialSubmission ? "Refine your work details." : "Provide your final work details below."}
                className="max-w-3xl"
                contentClassName="!max-h-[80vh] p-3"
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Description</label>
                        <RichTextEditor
                            content={content}
                            onChange={setContent}
                            placeholder="Explain your work or paste details here..."
                            className="h-[240px] border border-slate-100 rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-emerald-500/5 focus-within:border-emerald-200 transition-all shadow-sm"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Download className="w-3 h-3" /> UPLOAD FILES
                            </label>
                            <FileUpload
                                value={attachments}
                                onChange={setAttachments}
                                endpoint="taskAttachments"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <LinkIcon className="w-3 h-3" /> EXTERNAL LINK
                            </label>
                            <input
                                type="url"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                placeholder="https://github.com/your-project"
                                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-200 shadow-sm transition-all"
                            />
                        </div>
                    </div>

                    <div className="pt-3 border-t border-slate-50 flex items-center justify-end gap-3">
                        {successMessage && (
                            <div className="px-4 py-2 rounded-lg bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-100">
                                <CheckCircle className="w-3.5 h-3.5" />
                                {successMessage}
                            </div>
                        )}
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-8 py-3 bg-[#0F172A] text-white rounded-lg text-[9px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    SUBMITTING...
                                </>
                            ) : (
                                <>
                                    <Send className="w-3.5 h-3.5" />
                                    {initialSubmission ? 'UPDATE WORK' : 'TURN IN WORK'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Submission"
                description="Are you sure you want to delete your submission? This action cannot be undone."
                className="max-w-md"
            >
                <div className="flex flex-col gap-6 pt-2">
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-800 font-medium leading-relaxed">
                            Deleting your submission will remove your work from this task. You will need to submit again before the deadline to receive a grade.
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="px-6 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isSubmitting}
                            className="px-6 py-2.5 bg-red-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <Trash2 className="w-3 h-3" />
                            )}
                            Confirm Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

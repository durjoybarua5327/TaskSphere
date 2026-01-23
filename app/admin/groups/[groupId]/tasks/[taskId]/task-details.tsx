"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
    ChevronLeft,
    Calendar,
    FileText,
    Link as LinkIcon,
    Download,
    Clock,
    CheckCircle2,
    AlertCircle,
    User,
    Eye,
    Pencil,
    Trash2,
    Save,
    X
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { scoreSubmission, deleteTask, updateTask } from "@/app/admin/actions";
import { CreateTaskModal } from "../../_components/create-task-modal";
import { cn } from "@/lib/utils";

interface TaskDetailsClientProps {
    task: any;
    submissions: any[];
    groupId: string;
    totalMembers: number;
}

export function TaskDetailsClient({ task, submissions, groupId, totalMembers }: TaskDetailsClientProps) {
    const router = useRouter();
    const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);

    // Edit Task State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // Grading Form State
    const [score, setScore] = useState<string>("");
    const [feedback, setFeedback] = useState("");
    const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);

    // Delete Task State
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleOpenGradeModal = (submission: any) => {
        setSelectedSubmission(submission);
        setScore(submission.scores?.[0]?.score_value?.toString() || "");
        setFeedback(submission.scores?.[0]?.feedback || "");
        setIsGradeModalOpen(true);
    };

    const handleCloseGradeModal = () => {
        setIsGradeModalOpen(false);
        setSelectedSubmission(null);
        setScore("");
        setFeedback("");
    };

    const handleSubmitGrade = async () => {
        if (!selectedSubmission || !score) return;

        setIsSubmittingGrade(true);
        const scoreVal = parseInt(score);

        if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > task.max_score) {
            alert(`Please enter a valid score between 0 and ${task.max_score}`);
            setIsSubmittingGrade(false);
            return;
        }

        const result = await scoreSubmission(selectedSubmission.id, scoreVal, feedback);
        setIsSubmittingGrade(false);

        if (result.success) {
            handleCloseGradeModal();
            router.refresh();
        } else {
            alert(result.error);
        }
    };

    const handleDeleteTask = () => {
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteTask = async () => {
        setIsDeleting(true);
        const result = await deleteTask(task.id, groupId);
        if (result.success) {
            setIsDeleteModalOpen(false);
            router.push(`/admin/groups/${groupId}`);
            router.refresh();
        } else {
            alert(result.error);
            setIsDeleting(false);
        }
    };

    const handleUpdateTask = async (data: any) => {
        setIsUpdating(true);
        const result = await updateTask(task.id, groupId, {
            title: data.title,
            description: data.description,
            deadline: data.deadline,
            max_score: data.maxScore,
            attachments: data.attachments
        });
        setIsUpdating(false);

        if (result.success) {
            setIsEditModalOpen(false);
            router.refresh();
        } else {
            alert(result.error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 pb-20 space-y-6">
            {/* Back Button */}
            <Link
                href={`/admin/groups/${groupId}`}
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors"
            >
                <ChevronLeft className="w-4 h-4" />
                Back to Group
            </Link>

            {/* Task Details Card */}
            <div className="bg-white border border-slate-100 rounded-[1.5rem] p-6 shadow-sm relative overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex gap-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                            <FileText className="w-3 h-3" />
                            Submissions: {submissions.length}/{totalMembers}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                            <CheckCircle2 className="w-3 h-3" />
                            Max Score: {task.max_score}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-emerald-500 hover:text-emerald-600 transition-all hover:shadow-md"
                        >
                            <Pencil className="w-4 h-4" />
                            Edit Task
                        </button>
                        <button
                            onClick={handleDeleteTask}
                            disabled={isDeleting}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-colors disabled:opacity-50"
                        >
                            <Trash2 className="w-4 h-4" />
                            {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <h1 className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tight mb-3">
                            {task.title}
                        </h1>
                        <div
                            className="prose prose-sm max-w-none text-slate-500 font-medium leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: task.description || '' }}
                        />
                    </div>

                    {task.attachments && task.attachments.length > 0 && (
                        <div className="pt-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Task Materials</p>
                            <div className="flex flex-wrap gap-3">
                                {task.attachments.map((url: string, index: number) => {
                                    const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                                    const fileName = url.split('/').pop();
                                    return (
                                        <a
                                            key={index}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group flex items-center gap-3 pl-3 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full hover:border-emerald-500/30 hover:shadow-md transition-all"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                                                {isImage ? <FileText className="w-3 h-3" /> : <LinkIcon className="w-3 h-3" />}
                                            </div>
                                            <span className="text-xs font-bold text-slate-600 group-hover:text-emerald-700 truncate max-w-[200px]">
                                                {fileName}
                                            </span>
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Submissions Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Students Submissions</h2>
                    <span className="px-4 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                        {submissions.length}/{totalMembers} Students Submitted
                    </span>
                </div>

                <div className="space-y-4">
                    {submissions.length === 0 ? (
                        <div className="bg-white border border-slate-100 rounded-[1.5rem] p-8 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <Clock className="w-8 h-8" />
                            </div>
                            <p className="text-slate-500 font-bold">No submissions yet.</p>
                        </div>
                    ) : (
                        submissions.map((sub: any) => {
                            const isGraded = sub.scores && sub.scores.length > 0;
                            return (
                                <div key={sub.id} className="bg-white border border-slate-100 rounded-[1.5rem] p-5 hover:shadow-xl transition-all group relative overflow-hidden">
                                    {/* Header Row */}
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl font-black shrink-0 overflow-hidden">
                                                {sub.student?.avatar_url ? (
                                                    <img src={sub.student.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    sub.student?.full_name?.charAt(0) || "U"
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{sub.student?.full_name}</h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDistanceToNow(new Date(sub.submitted_at), { addSuffix: true })}
                                                    </span>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1.5 ${isGraded ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                                                        }`}>
                                                        {isGraded ? (
                                                            <>
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                Graded: {sub.scores[0].score_value}/{task.max_score}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <AlertCircle className="w-3 h-3" />
                                                                Pending Review
                                                            </>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleOpenGradeModal(sub)}
                                            className="px-6 py-3 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95 flex items-center gap-2 whitespace-nowrap"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Review & Grade
                                        </button>
                                    </div>

                                    {/* Content Previews */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-slate-100 pt-8">
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <FileText className="w-3 h-3" />
                                                Submission Content
                                            </p>
                                            <div
                                                className="prose prose-sm max-w-none text-slate-600 font-medium leading-relaxed line-clamp-4"
                                                dangerouslySetInnerHTML={{ __html: sub.content || "No text content provided." }}
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <LinkIcon className="w-3 h-3" />
                                                Attachments & Links
                                            </p>
                                            <div className="flex flex-wrap gap-3">
                                                {sub.attachments?.map((url: string, i: number) => (
                                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                                                        <LinkIcon className="w-4 h-4" />
                                                    </a>
                                                ))}
                                                {sub.link_url && (
                                                    <a href={sub.link_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                                                        <LinkIcon className="w-4 h-4" />
                                                    </a>
                                                )}
                                                {sub.file_url && (
                                                    <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-all">
                                                        <Download className="w-4 h-4" />
                                                    </a>
                                                )}
                                                {(!sub.attachments?.length && !sub.link_url && !sub.file_url) && (
                                                    <span className="text-sm font-bold text-slate-300 italic">No attachments</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Grading Modal - Clean & Modern */}
            <Modal
                title=""
                isOpen={isGradeModalOpen}
                onClose={handleCloseGradeModal}
                className="max-w-2xl bg-[#ffffff] p-0 rounded-[2rem] overflow-hidden h-[70vh] flex flex-col shadow-2xl"
                hideHeader={true}
                contentClassName="flex flex-col flex-1 min-h-0 mt-0"
            >
                {/* Header - Fixed/Sticky */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white shrink-0 z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100/50">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trophy"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">Grade Submission</h2>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{selectedSubmission?.student?.full_name}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleCloseGradeModal}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
                    <div className="flex flex-col gap-6">
                        {/* Left Column: Submission Content */}
                        <div className="flex-1 space-y-8">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Work Submitted</p>
                                <div className="bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 min-h-[120px]">
                                    <div
                                        className="prose prose-sm max-w-none text-slate-600 font-medium leading-relaxed whitespace-pre-wrap"
                                        dangerouslySetInnerHTML={{ __html: selectedSubmission?.content || "No text content submitted." }}
                                    />
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <LinkIcon className="w-3 h-3" />
                                    Files & Links
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    {/* Attachments */}
                                    {selectedSubmission?.attachments?.map((url: string, i: number) => (
                                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-500/50 hover:bg-emerald-50/10 transition-all shadow-sm">
                                            <LinkIcon className="w-6 h-6" />
                                        </a>
                                    ))}
                                    {/* Link URL */}
                                    {selectedSubmission?.link_url && (
                                        <a href={selectedSubmission.link_url} target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-500/50 hover:bg-blue-50/10 transition-all shadow-sm">
                                            <LinkIcon className="w-6 h-6" />
                                        </a>
                                    )}
                                    {/* File URL (legacy) */}
                                    {selectedSubmission?.file_url && (
                                        <a href={selectedSubmission.file_url} target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-purple-600 hover:border-purple-500/50 hover:bg-purple-50/10 transition-all shadow-sm">
                                            <Download className="w-6 h-6" />
                                        </a>
                                    )}

                                    {(!selectedSubmission?.attachments?.length && !selectedSubmission?.link_url && !selectedSubmission?.file_url) && (
                                        <div className="px-6 py-4 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-400 italic">No files attached</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Grading Form (Inside Scrollable Area) */}
                        <div className="w-full shrink-0">
                            <div className="bg-[#0f172a] rounded-[2rem] p-6 text-white h-auto shadow-xl flex flex-col gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                        Assign Score (Max {task.max_score})
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max={task.max_score}
                                            value={score}
                                            onChange={(e) => setScore(e.target.value)}
                                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-6 py-4 text-2xl font-black text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-600"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                        Educator Feedback
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-6 py-4 text-sm font-medium text-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-600 resize-none leading-relaxed"
                                        placeholder="Provide constructive feedback..."
                                    />
                                </div>

                                <button
                                    onClick={handleSubmitGrade}
                                    disabled={isSubmittingGrade}
                                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                                >
                                    {isSubmittingGrade ? "Saving..." : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            Finalize Grade
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Edit Task Modal */}
            <CreateTaskModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleUpdateTask}
                isSubmitting={isUpdating}
                groupId={groupId} // This locks the group selection
                initialData={task}
            />

            {/* Delete Confirmation Modal */}
            <Modal
                title="Delete Task"
                description="Are you sure you want to delete this task? This action cannot be undone."
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                className="max-w-md"
            >
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={() => setIsDeleteModalOpen(false)}
                        className="px-4 py-2 text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 rounded-lg transition-colors"
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={confirmDeleteTask}
                        disabled={isDeleting}
                        className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2"
                    >
                        {isDeleting ? "Deleting..." : (
                            <>
                                <Trash2 className="w-3 h-3" />
                                Delete Task
                            </>
                        )}
                    </button>
                </div>
            </Modal>
        </div>
    );
}

"use client";

import { useState } from "react";
import {
    User,
    Clock,
    FileText,
    Link as LinkIcon,
    Paperclip,
    Eye,
    CheckCircle2,
    History,
    MessageSquare,
    Trophy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { scoreSubmission } from "@/app/admin/actions";
import { useRouter } from "next/navigation";

interface SubmissionListProps {
    submissions: any[];
    maxScore: number;
    taskId: string;
}

export function SubmissionList({ submissions, maxScore, taskId }: SubmissionListProps) {
    const router = useRouter();
    const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
    const [isGrading, setIsGrading] = useState(false);
    const [gradeData, setGradeData] = useState({ score: 0, feedback: "" });

    const handleGrade = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSubmission) return;

        setIsGrading(true);
        const result = await scoreSubmission(selectedSubmission.id, gradeData.score, gradeData.feedback);
        setIsGrading(false);

        if (result.success) {
            setSelectedSubmission(null);
            router.refresh();
        } else {
            alert(result.error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Students Submissions</h2>
                <div className="px-4 py-1.5 bg-slate-900 border border-slate-100 rounded-full text-[9px] font-black text-white uppercase tracking-widest">
                    {submissions.length} Students Submitted
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {submissions.length === 0 ? (
                    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
                            <History className="w-8 h-8 text-slate-200" />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No submissions yet</p>
                    </div>
                ) : (
                    submissions.map((sub, index) => (
                        <div key={sub.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-6 md:p-8 hover:border-emerald-500/20 transition-all group">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                <div className="flex items-start gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                                        {sub.student?.avatar_url ? (
                                            <img src={sub.student.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-6 h-6 text-slate-300" />
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                                            {sub.student?.full_name || "Unknown Student"}
                                        </h3>
                                        <div className="flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                            <span className="flex items-center gap-1.5 text-slate-500">
                                                <Clock className="w-3 h-3" />
                                                {new Date(sub.submitted_at).toLocaleString()}
                                            </span>
                                            {sub.status === 'graded' ? (
                                                <span className="flex items-center gap-1.5 text-emerald-600">
                                                    <Trophy className="w-3 h-3" />
                                                    Graded: {sub.scores?.[0]?.score_value}/{maxScore}
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-amber-500">
                                                    <Clock className="w-3 h-3" />
                                                    Pending Review
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setSelectedSubmission(sub);
                                        setGradeData({
                                            score: sub.scores?.[0]?.score_value || 0,
                                            feedback: sub.scores?.[0]?.feedback || ""
                                        });
                                    }}
                                    className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2"
                                >
                                    <Eye className="w-4 h-4" />
                                    Review & Grade
                                </button>
                            </div>

                            {/* Submission Content Preview */}
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <FileText className="w-3 h-3" />
                                        Submission Content
                                    </h4>
                                    <div
                                        className="text-slate-600 text-sm font-medium line-clamp-3 prose prose-sm max-w-none"
                                        dangerouslySetInnerHTML={{ __html: sub.content || "<i>No content provided</i>" }}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Paperclip className="w-3 h-3" />
                                        Attachments & Links
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {sub.attachments?.map((url: string, i: number) => (
                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors">
                                                <Paperclip className="w-4 h-4 text-slate-400" />
                                            </a>
                                        ))}
                                        {sub.link_url && (
                                            <a href={sub.link_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[9px] font-bold text-white hover:bg-emerald-600 transition-colors">
                                                <LinkIcon className="w-3 h-3" />
                                                Project Link
                                            </a>
                                        )}
                                        {!sub.link_url && (!sub.attachments || sub.attachments.length === 0) && (
                                            <span className="text-[9px] font-bold text-slate-400 italic">No attachments</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Grading Modal */}
            <AnimatePresence>
                {selectedSubmission && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedSubmission(null)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed left-1/2 top-[10%] -translate-x-1/2 w-full max-w-4xl max-h-[80vh] bg-white rounded-[3rem] shadow-2xl z-[101] flex flex-col overflow-hidden"
                        >
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                                        <Trophy className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Grade Submission</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedSubmission.student?.full_name}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedSubmission(null)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-all">
                                    <History className="w-5 h-5 text-slate-400 rotate-45" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Work Submitted</h4>
                                    <div className="bg-slate-50 rounded-[2rem] p-8 prose prose-emerald max-w-none shadow-inner">
                                        <div dangerouslySetInnerHTML={{ __html: selectedSubmission.content }} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2">
                                            <Paperclip className="w-3 h-3" />
                                            Files & Links
                                        </h4>
                                        <div className="flex flex-wrap gap-3">
                                            {selectedSubmission.attachments?.map((url: string, i: number) => (
                                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="p-4 bg-white border border-slate-100 rounded-2xl hover:border-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/5 transition-all shadow-sm">
                                                    <Paperclip className="w-5 h-5 text-slate-400" />
                                                </a>
                                            ))}
                                            {selectedSubmission.link_url && (
                                                <a href={selectedSubmission.link_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-black text-white hover:bg-emerald-600 transition-colors shadow-lg">
                                                    <LinkIcon className="w-4 h-4" />
                                                    View Project
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    <form onSubmit={handleGrade} className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Assign Score (Max {maxScore})</label>
                                            <input
                                                type="number"
                                                max={maxScore}
                                                min={0}
                                                value={gradeData.score}
                                                onChange={(e) => setGradeData({ ...gradeData, score: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-slate-800 border-none rounded-2xl px-6 py-4 text-xl font-black focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-600"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Educator Feedback</label>
                                            <textarea
                                                rows={4}
                                                value={gradeData.feedback}
                                                onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                                                placeholder="Provide constructive feedback..."
                                                className="w-full bg-slate-800 border-none rounded-2xl px-6 py-4 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-600 resize-none"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isGrading}
                                            className="w-full py-5 bg-emerald-500 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            {isGrading ? (
                                                <History className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Finalize Grade
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

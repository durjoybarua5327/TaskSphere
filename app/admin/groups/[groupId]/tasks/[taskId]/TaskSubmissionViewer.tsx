"use client";

import { useState } from "react";
import {
    User,
    FileText,
    Calendar,
    CheckCircle2,
    ExternalLink,
    Image as ImageIcon,
    FileUp,
    Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Submission {
    id: string;
    content: string | null;
    file_url: string | null;
    link_url: string | null;
    submitted_at: string;
    student: {
        id: string;
        full_name: string | null;
        email: string;
        avatar_url: string | null;
    } | null;
    scores: {
        score_value: number;
        feedback: string | null;
        grader: { full_name: string | null } | null;
    }[];
}

interface TaskSubmissionViewerProps {
    submissions: Submission[];
    taskId: string;
    groupId: string;
}

export function TaskSubmissionViewer({ submissions, taskId, groupId }: TaskSubmissionViewerProps) {
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Submissions List */}
            <div className="lg:col-span-1 space-y-4">
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight px-4">Student List</h2>
                <div className="space-y-3">
                    {submissions.length === 0 ? (
                        <div className="bg-white border border-slate-100 rounded-[2rem] p-8 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No submissions yet</p>
                        </div>
                    ) : (
                        submissions.map((sub) => (
                            <button
                                key={sub.id}
                                onClick={() => setSelectedSubmission(sub)}
                                className={`w-full p-4 rounded-[2rem] border transition-all text-left flex items-center gap-4 ${selectedSubmission?.id === sub.id
                                        ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200"
                                        : "bg-white border-slate-100 text-slate-900 hover:border-emerald-200 shadow-sm"
                                    }`}
                            >
                                <div className="w-10 h-10 rounded-xl bg-slate-50 overflow-hidden flex-shrink-0 border border-slate-100">
                                    {sub.student?.avatar_url ? (
                                        <img src={sub.student.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User className={`w-5 h-5 ${selectedSubmission?.id === sub.id ? "text-emerald-600" : "text-slate-300"}`} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-xs uppercase tracking-tight truncate">
                                        {sub.student?.full_name || "Anonymous"}
                                    </h4>
                                    <p className={`text-[8px] font-bold uppercase tracking-widest truncate ${selectedSubmission?.id === sub.id ? "text-emerald-100" : "text-slate-400"
                                        }`}>
                                        {new Date(sub.submitted_at).toLocaleDateString()}
                                    </p>
                                </div>
                                {sub.scores.length > 0 && (
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${selectedSubmission?.id === sub.id ? "bg-white/20" : "bg-emerald-50 text-emerald-600"
                                        }`}>
                                        {sub.scores[0].score_value}
                                    </div>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Submission Detail */}
            <div className="lg:col-span-2">
                <AnimatePresence mode="wait">
                    {selectedSubmission ? (
                        <motion.div
                            key={selectedSubmission.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white border border-slate-100 rounded-[3rem] p-8 md:p-12 shadow-sm space-y-8 min-h-[500px]"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-50">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden">
                                        {selectedSubmission.student?.avatar_url ? (
                                            <img src={selectedSubmission.student.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <User className="w-8 h-8 text-slate-200" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                                            {selectedSubmission.student?.full_name || "Anonymous Member"}
                                        </h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {selectedSubmission.student?.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Submitted On</p>
                                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                            {new Date(selectedSubmission.submitted_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <FileText className="w-3 h-3" />
                                        Submission Content
                                    </h4>
                                    <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6 text-sm text-slate-700 font-bold leading-relaxed whitespace-pre-wrap">
                                        {selectedSubmission.content || "No text content provided."}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {selectedSubmission.file_url && (
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <FileUp className="w-3 h-3" />
                                                Attached File
                                            </h4>
                                            <a
                                                href={selectedSubmission.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-emerald-500 hover:shadow-lg transition-all group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                                                        <ImageIcon className="w-5 h-5 text-emerald-500" />
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">View Attachment</span>
                                                </div>
                                                <Download className="w-4 h-4 text-slate-300 group-hover:text-emerald-500" />
                                            </a>
                                        </div>
                                    )}

                                    {selectedSubmission.link_url && (
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <ExternalLink className="w-3 h-3" />
                                                External Link
                                            </h4>
                                            <a
                                                href={selectedSubmission.link_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-emerald-500 hover:shadow-lg transition-all group"
                                            >
                                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight truncate max-w-[200px]">
                                                    {selectedSubmission.link_url}
                                                </span>
                                                <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-emerald-500" />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white border border-slate-100 border-dashed rounded-[3rem] p-12 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center">
                                <User className="w-10 h-10 text-slate-200" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-black text-slate-900 uppercase tracking-tight">Select a submission</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Click on a student from the list to view their work
                                </p>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

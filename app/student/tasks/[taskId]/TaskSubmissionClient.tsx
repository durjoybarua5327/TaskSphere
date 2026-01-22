"use client";

import { CheckCircle2, Plus, Users, User, Clock, FileText, Link as LinkIcon, Paperclip, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

interface TaskSubmissionClientProps {
    taskId: string;
    initialSubmission?: any;
    publicSubmissions?: any[];
    isPublic?: boolean;
}

export function TaskSubmissionClient({ taskId, initialSubmission, publicSubmissions = [], isPublic = false }: TaskSubmissionClientProps) {
    const submission = initialSubmission;
    const hasSubmitted = !!submission;

    return (
        <div className="space-y-12">
            {/* My Submission Status */}
            <div className="bg-white border border-slate-100 rounded-[3rem] p-8 md:p-12 shadow-sm relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl" />

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center transition-all duration-500 ${hasSubmitted ? 'bg-emerald-50 text-emerald-500 rotate-[360deg]' : 'bg-slate-50 text-slate-300'}`}>
                            {hasSubmitted ? <CheckCircle2 className="w-8 h-8" /> : <Plus className="w-8 h-8" />}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                                {hasSubmitted ? "Assignment Submitted" : "Ready to Start?"}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                                {hasSubmitted ? (
                                    <>
                                        <Clock className="w-3 h-3" />
                                        Last updated: {new Date(submission.submitted_at).toLocaleString()}
                                    </>
                                ) : (
                                    "Submit your work using the button in the header"
                                )}
                            </p>
                        </div>
                    </div>

                    {isPublic ? (
                        <div className="px-4 py-2 bg-emerald-50 rounded-2xl flex items-center gap-2 border border-emerald-100/50">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Public Task</span>
                        </div>
                    ) : (
                        <div className="px-4 py-2 bg-slate-50 rounded-2xl flex items-center gap-2 border border-slate-100">
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Private Task</span>
                        </div>
                    )}
                </div>

                {hasSubmitted && submission.scores?.[0] && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 p-8 bg-slate-900 rounded-[2.5rem] text-white space-y-4 shadow-2xl shadow-emerald-900/10"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/20 rounded-xl">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                </div>
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Educator Feedback</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Final Score:</span>
                                <span className="text-3xl font-black text-emerald-400 tracking-tighter">
                                    {submission.scores[0].score_value}
                                </span>
                            </div>
                        </div>
                        {submission.scores[0].feedback && (
                            <div className="relative">
                                <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500/30 rounded-full" />
                                <p className="text-sm font-medium text-slate-300 pl-6 leading-relaxed italic">
                                    "{submission.scores[0].feedback}"
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Public Submissions Section */}
            {isPublic && (
                <div className="space-y-8">
                    <div className="flex items-center justify-between px-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center">
                                <Users className="w-6 h-6 text-slate-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Peer Submissions</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Learn from your group members</p>
                            </div>
                        </div>
                        <div className="px-4 py-1.5 bg-slate-900 rounded-full text-[9px] font-black text-white uppercase tracking-widest">
                            {publicSubmissions.length} Submissions
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {publicSubmissions.length === 0 ? (
                            <div className="col-span-full py-20 bg-white border border-dashed border-slate-200 rounded-[3rem] text-center space-y-3">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                    <Users className="w-8 h-8 text-slate-200" />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No peer submissions yet</p>
                            </div>
                        ) : (
                            publicSubmissions.map((sub, idx) => (
                                <motion.div
                                    key={sub.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group bg-white border border-slate-100 rounded-[2.5rem] p-6 md:p-8 hover:border-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/5 transition-all"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 overflow-hidden">
                                                {sub.student?.avatar_url ? (
                                                    <img src={sub.student.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-5 h-5 text-slate-300" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                                    {sub.student?.full_name || "Anonymous Member"}
                                                </h3>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {new Date(sub.submitted_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`p-2 rounded-xl border transition-colors ${sub.student?.id === initialSubmission?.student_id ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div
                                            className="text-slate-600 text-sm font-medium line-clamp-3 prose prose-sm max-w-none prose-p:m-0"
                                            dangerouslySetInnerHTML={{ __html: sub.content || "<i>No text content</i>" }}
                                        />

                                        <div className="pt-4 border-t border-slate-50 flex flex-wrap gap-2">
                                            {sub.attachments?.slice(0, 3).map((url: string, i: number) => (
                                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center hover:bg-slate-100 transition-colors">
                                                    <Paperclip className="w-3 h-3 text-slate-400" />
                                                </a>
                                            ))}
                                            {sub.link_url && (
                                                <a href={sub.link_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-slate-900 rounded-lg text-white hover:bg-emerald-600 transition-colors flex items-center gap-1.5">
                                                    <LinkIcon className="w-2.5 h-2.5" />
                                                    <span className="text-[8px] font-black uppercase tracking-widest">Link</span>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

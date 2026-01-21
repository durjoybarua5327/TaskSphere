"use client";

import { CheckCircle2, Plus } from "lucide-react";

interface TaskSubmissionClientProps {
    taskId: string;
    initialSubmission?: any;
}

export function TaskSubmissionClient({ taskId, initialSubmission }: TaskSubmissionClientProps) {
    const submission = initialSubmission;
    const hasSubmitted = !!submission;

    return (
        <div className="space-y-6">
            <div className="bg-white border border-slate-100 rounded-[3rem] p-8 md:p-12 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center ${hasSubmitted ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-300'}`}>
                            {hasSubmitted ? <CheckCircle2 className="w-8 h-8" /> : <Plus className="w-8 h-8" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                {hasSubmitted ? "Assignment Submitted" : "Ready to Start?"}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {hasSubmitted
                                    ? `Last updated: ${new Date(submission.submitted_at).toLocaleString()}`
                                    : "Submit your work using the button in the header"}
                            </p>
                        </div>
                    </div>
                </div>

                {hasSubmitted && submission.scores?.[0] && (
                    <div className="mt-8 p-6 bg-emerald-50/50 border border-emerald-100/50 rounded-3xl space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Feedback Received</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score:</span>
                                <span className="text-2xl font-black text-emerald-600 uppercase tracking-tight">
                                    {submission.scores[0].score_value}
                                </span>
                            </div>
                        </div>
                        {submission.scores[0].feedback && (
                            <p className="text-xs font-bold text-slate-600 italic">
                                "{submission.scores[0].feedback}"
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

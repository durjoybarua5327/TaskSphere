"use client";

import { format } from "date-fns";
import { Clock, CheckCircle, XCircle, Sparkles, Calendar, MessageCircle } from "lucide-react";

type Request = {
    id: string;
    requested_group_name: string;
    group_description: string | null;
    status: string;
    creation_method: string;
    admin_response: string | null;
    responded_at: string | null;
    created_at: string;
    created_group_id: string | null;
};

export function RequestCard({ request }: { request: Request }) {
    const getStatusIcon = () => {
        switch (request.status) {
            case "pending":
                return <Clock className="w-5 h-5 text-amber-600" />;
            case "approved":
                return <CheckCircle className="w-5 h-5 text-emerald-600" />;
            case "rejected":
                return <XCircle className="w-5 h-5 text-red-600" />;
            default:
                return <MessageCircle className="w-5 h-5 text-slate-600" />;
        }
    };

    const getStatusText = () => {
        switch (request.status) {
            case "pending":
                return "Pending Review";
            case "approved":
                return "Approved - Group Created!";
            case "rejected":
                return "Request Rejected";
            default:
                return request.status;
        }
    };

    const getStatusColor = () => {
        switch (request.status) {
            case "pending":
                return "border-amber-200 bg-amber-50";
            case "approved":
                return "border-emerald-200 bg-emerald-50";
            case "rejected":
                return "border-red-200 bg-red-50";
            default:
                return "border-slate-200 bg-white";
        }
    };

    return (
        <div className={`border rounded-2xl p-6 ${getStatusColor()}`}>
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">
                        {request.requested_group_name}
                    </h3>
                    {request.group_description && (
                        <p className="text-sm text-slate-600 mb-2">{request.group_description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        <span>Requested {format(new Date(request.created_at), "PPp")}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                        {getStatusIcon()}
                        <span className={`text-sm font-semibold ${request.status === "pending" ? "text-amber-700" :
                            request.status === "approved" ? "text-emerald-700" :
                                request.status === "rejected" ? "text-red-700" :
                                    "text-slate-700"
                            }`}>
                            {getStatusText()}
                        </span>
                    </div>
                    {request.creation_method === "ai_assisted" && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            AI Assisted
                        </span>
                    )}
                </div>
            </div>

            {request.admin_response && (
                <div className={`mt-4 p-4 rounded-xl ${request.status === "approved" ? "bg-emerald-100/50 border border-emerald-200" :
                    request.status === "rejected" ? "bg-red-100/50 border border-red-200" :
                        "bg-slate-100 border border-slate-200"
                    }`}>
                    <p className="text-sm font-semibold text-slate-900 mb-1">Admin Response:</p>
                    <p className="text-sm text-slate-700">{request.admin_response}</p>
                    {request.responded_at && (
                        <p className="text-xs text-slate-500 mt-2">
                            {format(new Date(request.responded_at), "PPp")}
                        </p>
                    )}
                </div>
            )}

            {request.status === "approved" && request.created_group_id && (
                <div className="mt-4">
                    <a
                        href={`/student/groups`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                    >
                        View Your Group →
                    </a>
                </div>
            )}
        </div>
    );
}

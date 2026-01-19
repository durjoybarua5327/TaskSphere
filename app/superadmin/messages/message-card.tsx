"use client";

import { useState } from "react";
import { Check, X, Bot, User as UserIcon, Calendar, Mail, Users, FileText, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { approveRequest, rejectRequest } from "./actions";
import { format } from "date-fns";

type Message = {
    id: string;
    sender_name: string;
    sender_email: string;
    requested_group_name: string;
    group_description: string | null;
    justification: string | null;
    expected_members_count: number | null;
    subject_area: string | null;
    status: string;
    creation_method: string;
    ai_conversation: any;
    ai_summary: string | null;
    admin_response: string | null;
    responded_at: string | null;
    created_at: string;
};

export function MessageCard({ message }: { message: Message }) {
    const router = useRouter();
    const [isExpanded, setIsExpanded] = useState(false);
    const [showResponse, setShowResponse] = useState(false);
    const [response, setResponse] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const isPending = message.status === "pending";
    const isAiAssisted = message.creation_method === "ai_assisted";

    const handleApprove = async () => {
        setIsProcessing(true);
        try {
            await approveRequest(message.id, response);
            router.refresh();
        } catch (error) {
            console.error("Error approving request:", error);
            alert("Failed to approve request");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!response.trim()) {
            alert("Please provide a reason for rejection");
            return;
        }
        setIsProcessing(true);
        try {
            await rejectRequest(message.id, response);
            router.refresh();
        } catch (error) {
            console.error("Error rejecting request:", error);
            alert("Failed to reject request");
        } finally {
            setIsProcessing(false);
        }
    };

    const getStatusBadge = () => {
        switch (message.status) {
            case "pending":
                return <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">Pending</span>;
            case "approved":
                return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">Approved</span>;
            case "rejected":
                return <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">Rejected</span>;
            default:
                return <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">{message.status}</span>;
        }
    };

    return (
        <div className={`bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all ${isPending ? "border-amber-200" : "border-slate-200"
            }`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">{message.sender_name}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail className="w-3 h-3" />
                            <span>{message.sender_email}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                            <Calendar className="w-3 h-3" />
                            <span>{format(new Date(message.created_at), "PPp")}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isAiAssisted && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            AI Assisted
                        </span>
                    )}
                    {getStatusBadge()}
                </div>
            </div>

            {/* Group Details */}
            <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    Requested Group: {message.requested_group_name}
                </h4>

                {message.group_description && (
                    <div className="mb-3">
                        <p className="text-sm text-slate-600"><strong>Description:</strong></p>
                        <p className="text-sm text-slate-800 mt-1">{message.group_description}</p>
                    </div>
                )}

                {message.subject_area && (
                    <p className="text-sm text-slate-600 mb-2">
                        <strong>Subject:</strong> {message.subject_area}
                    </p>
                )}

                {message.expected_members_count && (
                    <p className="text-sm text-slate-600 mb-2">
                        <strong>Expected Members:</strong> {message.expected_members_count}
                    </p>
                )}

                {message.justification && (
                    <div>
                        <p className="text-sm text-slate-600"><strong>Justification:</strong></p>
                        <p className="text-sm text-slate-800 mt-1">{message.justification}</p>
                    </div>
                )}
            </div>

            {/* AI Summary */}
            {isAiAssisted && message.ai_summary && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
                    <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                        <Bot className="w-4 h-4" />
                        AI Summary
                    </h4>
                    <p className="text-sm text-purple-800">{message.ai_summary}</p>
                </div>
            )}

            {/* AI Conversation */}
            {isAiAssisted && message.ai_conversation && (
                <div className="mb-4">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                        {isExpanded ? "Hide" : "View"} AI Conversation →
                    </button>

                    {isExpanded && (
                        <div className="mt-3 space-y-2 border-l-2 border-purple-200 pl-4">
                            {message.ai_conversation.qa_pairs?.map((qa: any, index: number) => (
                                <div key={index} className="text-sm">
                                    <p className="text-slate-600"><strong>Q:</strong> {qa.question}</p>
                                    <p className="text-slate-800 mt-1"><strong>A:</strong> {qa.answer}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Admin Response */}
            {message.admin_response && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
                    <h4 className="font-bold text-indigo-900 mb-2">Admin Response</h4>
                    <p className="text-sm text-indigo-800">{message.admin_response}</p>
                    {message.responded_at && (
                        <p className="text-xs text-indigo-600 mt-2">
                            Responded: {format(new Date(message.responded_at), "PPp")}
                        </p>
                    )}
                </div>
            )}

            {/* Actions for Pending Messages */}
            {isPending && (
                <div className="pt-4 border-t border-slate-200">
                    {!showResponse ? (
                        <div className="flex gap-3">
                            <Button
                                onClick={() => {
                                    setShowResponse(true);
                                    setResponse("Approved. Group will be created.");
                                }}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                disabled={isProcessing}
                            >
                                <Check className="w-4 h-4 mr-2" />
                                Approve & Create Group
                            </Button>
                            <Button
                                onClick={() => setShowResponse(true)}
                                variant="outline"
                                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                                disabled={isProcessing}
                            >
                                <X className="w-4 h-4 mr-2" />
                                Reject Request
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <textarea
                                value={response}
                                onChange={(e) => setResponse(e.target.value)}
                                placeholder="Add a response or reason..."
                                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                rows={3}
                            />
                            <div className="flex gap-3">
                                <Button
                                    onClick={handleApprove}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? "Processing..." : "Confirm Approval"}
                                </Button>
                                <Button
                                    onClick={handleReject}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? "Processing..." : "Confirm Rejection"}
                                </Button>
                                <Button
                                    onClick={() => setShowResponse(false)}
                                    variant="outline"
                                    disabled={isProcessing}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

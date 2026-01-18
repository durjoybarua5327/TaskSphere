"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { requestJoinGroup } from "./actions";
import { Loader2, Check, Clock } from "lucide-react";

export default function JoinButton({ groupId, currentStatus }: { groupId: string, currentStatus: string | null }) {
    const [loading, setLoading] = useState(false);

    const handleRequest = async () => {
        setLoading(true);
        await requestJoinGroup(groupId);
        setLoading(false);
    };

    if (currentStatus === 'member') {
        return (
            <Button variant="ghost" disabled className="w-full text-emerald-700 bg-emerald-50 border border-emerald-100 font-semibold cursor-default">
                <Check className="w-4 h-4 mr-2" />
                Joined
            </Button>
        );
    }

    if (currentStatus === 'pending') {
        return (
            <Button variant="ghost" disabled className="w-full text-amber-700 bg-amber-50 border border-amber-100 font-semibold cursor-default">
                <Clock className="w-4 h-4 mr-2" />
                Pending
            </Button>
        );
    }

    if (currentStatus === 'rejected') {
        return (
            <Button variant="ghost" disabled className="w-full text-red-600 bg-red-50 border border-red-100 font-semibold">
                Rejected
            </Button>
        );
    }

    return (
        <Button
            onClick={handleRequest}
            disabled={loading}
            className={`w-full font-semibold transition-all duration-300 ${loading ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 hover:-translate-y-0.5'}`}
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join Group"}
        </Button>
    );
}

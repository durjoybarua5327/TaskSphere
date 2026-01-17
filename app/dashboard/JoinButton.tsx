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
            <Button variant="outline" disabled className="w-full text-emerald-600 border-emerald-200 bg-emerald-50">
                <Check className="w-4 h-4 mr-2" />
                Member
            </Button>
        );
    }

    if (currentStatus === 'pending') {
        return (
            <Button variant="outline" disabled className="w-full border-yellow-200 bg-yellow-50 text-yellow-700">
                <Clock className="w-4 h-4 mr-2" />
                Requested
            </Button>
        );
    }

    if (currentStatus === 'rejected') {
        return (
            <Button variant="destructive" disabled className="w-full">
                Rejected
            </Button>
        );
    }

    return (
        <Button
            onClick={handleRequest}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200"
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Request to Join"}
        </Button>
    );
}

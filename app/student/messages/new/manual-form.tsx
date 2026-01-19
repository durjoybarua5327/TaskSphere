"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Send } from "lucide-react";
import { submitManualRequest } from "./actions";

export function ManualRequestForm({
    userId,
    userName,
    userEmail,
}: {
    userId: string;
    userName: string;
    userEmail: string;
}) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        groupName: "",
        description: "",
        subjectArea: "",
        expectedMembers: "",
        justification: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            await submitManualRequest({
                userId,
                userName,
                userEmail,
                groupName: formData.groupName,
                description: formData.description,
                subjectArea: formData.subjectArea,
                expectedMembers: formData.expectedMembers ? parseInt(formData.expectedMembers) : null,
                justification: formData.justification,
            });

            router.push("/dashboard/messages");
        } catch (err: any) {
            setError(err.message || "Failed to submit request");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-3xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Group Name */}
                <div className="space-y-2">
                    <Label htmlFor="groupName" className="text-slate-700 font-semibold">
                        Group Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="groupName"
                        value={formData.groupName}
                        onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                        placeholder="e.g., Advanced Physics Study Group"
                        required
                        className="bg-white"
                    />
                    <p className="text-xs text-slate-500">Choose a unique and descriptive name for your group</p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <Label htmlFor="description" className="text-slate-700 font-semibold">
                        Group Description
                    </Label>
                    <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe the purpose and goals of this group..."
                        className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[100px]"
                        rows={4}
                    />
                </div>

                {/* Subject Area */}
                <div className="space-y-2">
                    <Label htmlFor="subjectArea" className="text-slate-700 font-semibold">
                        Subject Area
                    </Label>
                    <Input
                        id="subjectArea"
                        value={formData.subjectArea}
                        onChange={(e) => setFormData({ ...formData, subjectArea: e.target.value })}
                        placeholder="e.g., Physics, Computer Science, Mathematics"
                        className="bg-white"
                    />
                </div>

                {/* Expected Members */}
                <div className="space-y-2">
                    <Label htmlFor="expectedMembers" className="text-slate-700 font-semibold">
                        Expected Number of Members
                    </Label>
                    <Input
                        id="expectedMembers"
                        type="number"
                        value={formData.expectedMembers}
                        onChange={(e) => setFormData({ ...formData, expectedMembers: e.target.value })}
                        placeholder="e.g., 20"
                        min="1"
                        className="bg-white"
                    />
                </div>

                {/* Justification */}
                <div className="space-y-2">
                    <Label htmlFor="justification" className="text-slate-700 font-semibold">
                        Justification <span className="text-red-500">*</span>
                    </Label>
                    <textarea
                        id="justification"
                        value={formData.justification}
                        onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                        placeholder="Explain why you need this group and how it will benefit members..."
                        className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[120px]"
                        rows={5}
                        required
                    />
                    <p className="text-xs text-slate-500">
                        Provide a clear justification for why this group should be created
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Submit Request
                            </>
                        )}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}

"use client";

import { useState } from "react";
import { PlusCircle, Loader2, Users, Building2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface GroupFormData {
    name: string;
    instituteName: string;
    department: string;
    groupId?: string;
    purpose: string;
    topAdminEmail?: string;
}

interface GroupFormProps {
    initialData?: Partial<GroupFormData>;
    onSubmit: (data: GroupFormData) => Promise<{ error?: string; success?: boolean }>;
    onCancel: () => void;
    submitLabel?: string;
    showTopAdminEmail?: boolean;
}

export function GroupForm({
    initialData,
    onSubmit,
    onCancel,
    submitLabel = "Create Group",
    showTopAdminEmail = false,
}: GroupFormProps) {
    const [name, setName] = useState(initialData?.name || "");
    const [instituteName, setInstituteName] = useState(initialData?.instituteName || "");
    const [department, setDepartment] = useState(initialData?.department || "");
    const [groupId, setGroupId] = useState(initialData?.groupId || "");
    const [purpose, setPurpose] = useState(initialData?.purpose || "");
    const [topAdminEmail, setTopAdminEmail] = useState(initialData?.topAdminEmail || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !instituteName.trim() || !department.trim() || !purpose.trim()) {
            setError("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const result = await onSubmit({
            name,
            instituteName,
            department,
            groupId: groupId || undefined,
            purpose,
            topAdminEmail: topAdminEmail || undefined,
        });

        if (result.error) {
            setError(result.error);
        }
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Group Name */}
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-700 font-semibold">
                        Group Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Advanced Physics Study Group"
                        required
                        className="bg-white border-slate-200"
                    />
                </div>

                {/* Institute Name */}
                <div className="space-y-2">
                    <Label htmlFor="instituteName" className="text-slate-700 font-semibold">
                        University/Institute <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="instituteName"
                        value={instituteName}
                        onChange={(e) => setInstituteName(e.target.value)}
                        placeholder="e.g., MIT"
                        required
                        className="bg-white border-slate-200"
                    />
                </div>

                {/* Department */}
                <div className="space-y-2">
                    <Label htmlFor="department" className="text-slate-700 font-semibold">
                        Department <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="department"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g., Computer Science"
                        required
                        className="bg-white border-slate-200"
                    />
                </div>

                {/* Group ID */}
                <div className="space-y-2">
                    <Label htmlFor="groupId" className="text-slate-700 font-semibold">
                        Course Code (Optional)
                    </Label>
                    <Input
                        id="groupId"
                        value={groupId}
                        onChange={(e) => setGroupId(e.target.value)}
                        placeholder="e.g., CSE-2024-A1"
                        className="bg-white border-slate-200"
                    />
                </div>
            </div>

            {/* Purpose */}
            <div className="space-y-2">
                <Label htmlFor="purpose" className="text-slate-700 font-semibold">
                    Group Purpose <span className="text-red-500">*</span>
                </Label>
                <textarea
                    id="purpose"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Describe the purpose of this group..."
                    required
                    className="w-full border border-slate-300 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[120px] resize-none"
                    rows={4}
                />
            </div>

            {/* Top Admin Email - Only for Super Admin */}
            {showTopAdminEmail && (
                <div className="space-y-2">
                    <Label htmlFor="topAdminEmail" className="text-slate-700 font-semibold">
                        Top Admin Email (Optional)
                    </Label>
                    <div className="relative">
                        <Input
                            id="topAdminEmail"
                            type="email"
                            value={topAdminEmail}
                            onChange={(e) => setTopAdminEmail(e.target.value)}
                            placeholder="admin@example.com"
                            className="bg-white border-slate-200 pl-10"
                        />
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="px-6 rounded-xl"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-100 disabled:opacity-50"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {submitLabel}
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}

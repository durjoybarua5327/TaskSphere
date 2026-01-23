"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface EditGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    isSubmitting: boolean;
    initialData: {
        name: string;
        description: string;
        institute_name: string;
        department: string;
    };
}

export function EditGroupModal({
    isOpen,
    onClose,
    onSubmit,
    isSubmitting,
    initialData
}: EditGroupModalProps) {
    const [name, setName] = useState(initialData.name);
    const [description, setDescription] = useState(initialData.description || "");
    const [instituteName, setInstituteName] = useState(initialData.institute_name || "");
    const [department, setDepartment] = useState(initialData.department || "");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            name,
            description,
            instituteName,
            department
        });
    };

    return (
        <Modal
            title="Edit Group Details"
            description="Update your group's information."
            isOpen={isOpen}
            onClose={onClose}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Group Name</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="bg-slate-50 border-slate-200 focus-visible:ring-emerald-500/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <textarea
                            className="flex min-h-[100px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y transition-all"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Institute Name</Label>
                            <Input
                                value={instituteName}
                                onChange={(e) => setInstituteName(e.target.value)}
                                className="bg-slate-50 border-slate-200 focus-visible:ring-emerald-500/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Department</Label>
                            <Input
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                className="bg-slate-50 border-slate-200 focus-visible:ring-emerald-500/20"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} className="hover:bg-slate-100 rounded-xl">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/20">
                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

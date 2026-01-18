"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestJoinGroup } from "@/app/dashboard/actions";
import { Loader2 } from "lucide-react";

interface JoinGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupName: string;
    groupId: string;
}

export function JoinGroupModal({ isOpen, onClose, groupName, groupId }: JoinGroupModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        university: "",
        department: "",
        batch: "",
        studentId: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Call action with extra data
        const result = await requestJoinGroup(groupId, formData);
        setLoading(false);
        if (result.success) {
            onClose();
        } else {
            console.error(result.error); // Add toast ideally
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Join ${groupName}`}
            description="Please provide your academic details to request access."
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="university">University</Label>
                    <Input
                        id="university"
                        name="university"
                        required
                        value={formData.university}
                        onChange={handleChange}
                        placeholder="e.g. Stanford University"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                        id="department"
                        name="department"
                        required
                        value={formData.department}
                        onChange={handleChange}
                        placeholder="e.g. Computer Science"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="batch">Batch / Year</Label>
                        <Input
                            id="batch"
                            name="batch"
                            required
                            value={formData.batch}
                            onChange={handleChange}
                            placeholder="e.g. 2025"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="studentId">Student ID</Label>
                        <Input
                            id="studentId"
                            name="studentId"
                            required
                            value={formData.studentId}
                            onChange={handleChange}
                            placeholder="e.g. 19101012"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Request"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

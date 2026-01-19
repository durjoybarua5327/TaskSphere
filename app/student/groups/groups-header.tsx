"use client";

import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useModal } from "@/components/providers/modal-provider";
import { GroupForm, GroupFormData } from "@/components/groups/GroupForm";
import { createGroup } from "./actions";
import { useRouter } from "next/navigation";

export function GroupsHeader() {
    const { openModal, closeModal } = useModal();
    const router = useRouter();

    const handleCreateGroup = () => {
        openModal({
            type: "create",
            title: "Create New Group",
            description: "Fill in the details to create a new collaboration group",
            className: "max-w-2xl",
            preventOutsideClick: true,
            content: (
                <GroupForm
                    onSubmit={async (data: GroupFormData) => {
                        const result = await createGroup(data);
                        if (result.success) {
                            closeModal();
                            router.refresh();
                        }
                        return result;
                    }}
                    onCancel={closeModal}
                />
            ),
        });
    };

    return (
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-600/10 border border-indigo-200 rounded-3xl p-8 mb-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">
                        Groups
                    </h1>
                    <p className="text-slate-600 text-lg font-medium">
                        Join groups to collaborate and learn together
                    </p>
                </div>
                <Button
                    onClick={handleCreateGroup}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-6 rounded-2xl shadow-lg shadow-indigo-100 flex items-center gap-2 group transition-all"
                >
                    <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    <span className="font-semibold text-lg">Create Group</span>
                </Button>
            </div>
        </div>
    );
}

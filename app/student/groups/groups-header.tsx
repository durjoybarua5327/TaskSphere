'use client';

import { Plus } from 'lucide-react';
import { useModal } from '@/components/providers/modal-provider';
import { GroupForm, GroupFormData } from '@/components/groups/GroupForm';
import { createGroup } from './actions';
import { useRouter } from 'next/navigation';

export function GroupsHeader({ isSuperAdmin }: { isSuperAdmin: boolean }) {
    const { openModal, closeModal } = useModal();
    const router = useRouter();

    const handleCreateGroup = () => {
        openModal({
            type: 'create',
            title: 'Create New Group',
            description: 'Fill in the details to create a new collaboration group',
            className: 'max-w-2xl',
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
        <div className="flex items-center justify-end mb-8">
            {isSuperAdmin && (
                <button
                    onClick={handleCreateGroup}
                    className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-green-600 hover:to-emerald-600 text-white rounded-2xl transition-all duration-500 font-bold text-xs uppercase tracking-wider shadow-xl shadow-slate-900/20 hover:shadow-green-500/30 active:scale-95 hover:scale-105 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-400/10 to-green-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <Plus className="w-4 h-4 relative z-10 transition-transform group-hover:rotate-90 duration-500" />
                    <span className="relative z-10">Create Group</span>
                </button>
            )}
        </div>
    );
}

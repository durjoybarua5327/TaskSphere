
"use client";

import { useActionState } from "react";
import { createGroup } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Assuming these exist or use standard divs
import { Loader2, PlusCircle, AlertCircle, CheckCircle } from "lucide-react";

const initialState = {
    error: null as string | null,
    success: null as string | null,
};

export default function CreateGroupForm() {
    const [state, formAction, isPending] = useActionState(createGroup, initialState);

    return (

        <div className="w-full">
            <div className="mb-6">
                <p className="text-slate-600 mb-1">Designate a Top Admin and initialize a new group space.</p>
            </div>

            <form action={formAction} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="groupName" className="text-slate-700">Group Name</Label>
                    <Input
                        id="groupName"
                        name="groupName"
                        placeholder="e.g. Advanced Physics 101"
                        required
                        className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-500"
                    />
                    <p className="text-xs text-slate-500">Must be unique across the platform.</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="topAdminEmail" className="text-slate-700">Top Admin Email</Label>
                    <Input
                        id="topAdminEmail"
                        name="topAdminEmail"
                        type="email"
                        placeholder="user@example.com"
                        required
                        className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-500"
                    />
                    <p className="text-xs text-slate-500">
                        User must already have an account. They will be promoted to Top Admin for this group.
                    </p>
                </div>

                {state?.error && (
                    <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {state.error}
                    </div>
                )}

                {state?.success && (
                    <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {state.success}
                    </div>
                )}

                <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white border-0"
                    disabled={isPending}
                >
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Group...
                        </>
                    ) : (
                        "Create Group"
                    )}
                </Button>
            </form>
        </div>
    );
}

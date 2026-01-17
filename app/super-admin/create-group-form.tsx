
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
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PlusCircle className="w-6 h-6 text-primary" />
                    Create New Learning Group
                </CardTitle>
                <CardDescription>
                    Designate a Top Admin and initialize a new group space.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="groupName">Group Name</Label>
                        <Input
                            id="groupName"
                            name="groupName"
                            placeholder="e.g. Advanced Physics 101"
                            required
                        />
                        <p className="text-sm text-muted-foreground">Must be unique across the platform.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="topAdminEmail">Top Admin Email</Label>
                        <Input
                            id="topAdminEmail"
                            name="topAdminEmail"
                            type="email"
                            placeholder="user@example.com"
                            required
                        />
                        <p className="text-sm text-muted-foreground">
                            User must already have an account. They will be promoted to Top Admin for this group.
                        </p>
                    </div>

                    {state?.error && (
                        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {state.error}
                        </div>
                    )}

                    {state?.success && (
                        <div className="p-3 rounded-md bg-emerald-50 text-emerald-600 text-sm flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            {state.success}
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={isPending}>
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
            </CardContent>
        </Card>
    );
}

"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signup } from "../actions";
import { Button } from "@/components/ui/button";
import { CheckCircle2, FileWarning, Loader2 } from "lucide-react";
import Link from "next/link";

const initialState = {
    error: "",
    success: "",
};

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={pending}
        >
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                </>
            ) : (
                "Create Account"
            )}
        </Button>
    );
}

export default function RegisterPage() {
    const [state, formAction] = useActionState(signup, initialState);

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create an account</h1>
                <p className="text-slate-500">
                    Enter your information to get started
                </p>
            </div>

            <form action={formAction} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none text-slate-900" htmlFor="fullName">
                        Full Name
                    </label>
                    <input
                        className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                        id="fullName"
                        name="fullName"
                        placeholder="John Doe"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none text-slate-900" htmlFor="email">
                        Email
                    </label>
                    <input
                        className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                        id="email"
                        name="email"
                        placeholder="m@example.com"
                        required
                        type="email"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none text-slate-900" htmlFor="password">
                        Password
                    </label>
                    <input
                        className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                        id="password"
                        name="password"
                        required
                        type="password"
                        minLength={6}
                    />
                </div>

                {state?.error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md flex items-center gap-2">
                        <FileWarning className="w-4 h-4" />
                        {state.error}
                    </div>
                )}

                {state?.success && (
                    <div className="bg-emerald-50 text-emerald-600 text-sm p-3 rounded-md flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        {state.success}
                    </div>
                )}

                <SubmitButton />
            </form>

            <div className="text-center text-sm">
                <span className="text-slate-500">Already have an account? </span>
                <Link href="/auth/login" className="font-medium text-emerald-600 hover:text-emerald-500">
                    Sign in
                </Link>
            </div>
        </div>
    );
}

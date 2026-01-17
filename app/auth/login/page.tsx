"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login } from "../actions";
import { Button } from "@/components/ui/button";
import { FileWarning, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const initialState = {
    error: "",
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
                    Signing in...
                </>
            ) : (
                "Sign In"
            )}
        </Button>
    );
}

export default function LoginPage() {
    const [state, formAction] = useActionState(login, initialState);

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h1>
                <p className="text-slate-500">
                    Enter your email to sign in to your account
                </p>
            </div>

            <form action={formAction} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-900" htmlFor="email">
                        Email
                    </label>
                    <input
                        className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 text-slate-900"
                        id="email"
                        name="email"
                        placeholder="m@example.com"
                        required
                        type="email"
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-900" htmlFor="password">
                            Password
                        </label>
                        <Link
                            href="/auth/forgot-password"
                            className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    <input
                        className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 text-slate-900"
                        id="password"
                        name="password"
                        required
                        type="password"
                    />
                </div>

                {state?.error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md flex items-center gap-2">
                        <FileWarning className="w-4 h-4" />
                        {state.error}
                    </div>
                )}

                <SubmitButton />
            </form>

            <div className="text-center text-sm">
                <span className="text-slate-500">Don't have an account? </span>
                <Link href="/auth/register" className="font-medium text-emerald-600 hover:text-emerald-500">
                    Sign up
                </Link>
            </div>
        </div>
    );
}

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <SignIn
                routing="path"
                path="/sign-in"
                signUpUrl="/sign-up"
                appearance={{
                    elements: {
                        formButtonPrimary: 'bg-slate-900 hover:bg-slate-800 text-sm',
                    },
                }}
            />
        </div>
    );
}

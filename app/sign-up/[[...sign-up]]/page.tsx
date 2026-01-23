import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <SignUp
                routing="path"
                path="/sign-up"
                signInUrl="/sign-in"
                appearance={{
                    elements: {
                        formButtonPrimary: 'bg-slate-900 hover:bg-slate-800 text-sm',
                    },
                }}
            />
        </div>
    );
}

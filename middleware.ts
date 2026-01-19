import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes (that don't require authentication)
const isPublicRoute = createRouteMatcher([
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/webhooks(.*)",
    "/debug(.*)" // Allow debug page
]);

const isLandingOrAuthRoute = createRouteMatcher([
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)"
]);


// Protect all other routes
export default clerkMiddleware(async (auth, request) => {
    const { userId } = await auth();

    // If user is authenticated and visiting landing page or auth pages
    // Skip the redirect - let the HOME PAGE (client side) handle the role-based redirection
    // This allows the homepage to load, and then redirect the user to their specific panel.
    // If we redirect here, we don't know the role yet easily.
    if (userId && isLandingOrAuthRoute(request)) {
        const url = new URL(request.url);
        // If we are at root, do NOTHING, let page.tsx handle it.
        // If we are at /sign-in or /sign-up, stick there (Clerk handles its own redirect).
        // Actually, if logged in at /sign-in, Clerk might behave oddly if we don't redirect.
        // But Clerk usually redirects to AFTER_SIGN_IN_URL.
        return;
    }

    if (!isPublicRoute(request)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};

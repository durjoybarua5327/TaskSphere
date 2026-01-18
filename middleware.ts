import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes (that don't require authentication)
const isPublicRoute = createRouteMatcher([
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/webhooks(.*)"
]);

const isLandingOrAuthRoute = createRouteMatcher([
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)"
]);

// Protect all other routes
export default clerkMiddleware(async (auth, request) => {
    const { userId } = await auth();

    // If user is authenticated and visiting landing page or auth pages, redirect to dashboard
    if (userId && isLandingOrAuthRoute(request)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
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

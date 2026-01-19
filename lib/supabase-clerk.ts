
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

export async function createClerkSupabaseClient() {
    const { getToken } = await auth();
    let token;
    try {
        token = await getToken({ template: "supabase" });
    } catch (error) {
        console.error(
            "Error fetching Clerk Supabase token - Ensure you have created a 'supabase' JWT template in your Clerk Dashboard:",
            error
        );
    }

    if (!token) {
        // If no token (e.g. not logged in or template missing), return client without auth
        // forcing RLS to treat as anon usually, or handling error
        return createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }

    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        }
    );
}

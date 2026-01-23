import { createBrowserClient } from '@supabase/ssr'

let supabaseClient: any;

export const createClient = () => {
    // If we're on the server, create a new client every time
    if (typeof window === 'undefined') {
        return createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
    }

    // If we're on the client, return the existing client or create a new one
    if (!supabaseClient) {
        supabaseClient = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
    }
    return supabaseClient;
}

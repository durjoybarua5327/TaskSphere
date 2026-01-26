import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkDatabase() {
    console.log("Checking Superadmins...");
    const { data: superAdmins, error: saError } = await supabase
        .from('users')
        .select('id, email, full_name, is_super_admin, ai_enabled')
        .eq('is_super_admin', true);

    if (saError) console.error("Error fetching superadmins:", saError);
    console.log(JSON.stringify(superAdmins, null, 2));

    console.log("\nChecking Recent Messages...");
    const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('id, content, sender_id, receiver_id, is_ai_response, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (msgError) console.error("Error fetching messages:", msgError);
    if (messages) {
        for (const msg of messages) {
            console.log(`[${msg.created_at}] ${msg.sender_id} -> ${msg.receiver_id}: "${msg.content}" (AI: ${msg.is_ai_response})`);
        }
    }
}

checkDatabase();

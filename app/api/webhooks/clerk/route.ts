import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    // You can find this in the Clerk Dashboard -> Webhooks -> choose the endpoint
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

    if (!WEBHOOK_SECRET) {
        throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
    }

    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error occured -- no svix headers', {
            status: 400
        })
    }

    // Get the body
    const payload = await req.json()
    const body = JSON.stringify(payload)

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET)

    let evt: WebhookEvent

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent
    } catch (err) {
        console.error('Error verifying webhook:', err);
        return new Response('Error occured', {
            status: 400
        })
    }

    // Handle the event
    const eventType = evt.type;
    console.log(`Received webhook with type: ${eventType}`);

    if (eventType === 'user.created' || eventType === 'user.updated') {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data;

        // Get the primary email
        // Clerk sends an array of emails. We'll grab the first one or the one marked as primary_email_address_id
        const email = email_addresses && email_addresses.length > 0 ? email_addresses[0].email_address : null;

        if (!email) {
            return new Response('Error: No email found', { status: 400 });
        }

        const fullName = `${first_name || ''} ${last_name || ''}`.trim();

        const supabase = createAdminClient();

        // Upsert the user into Supabase
        // We use 'id' as the conflict key (which matches the Clerk ID)
        const { error } = await supabase.from('users').upsert({
            id: id,
            email: email,
            full_name: fullName || null,
            avatar_url: image_url || null,
            // is_super_admin defaults to false in DB schema
        });

        if (error) {
            console.error('Error upserting user to Supabase:', error);
            return new Response('Error upserting user', { status: 500 });
        }

        console.log(`Successfully synced user ${id} to Supabase`);
    }

    if (eventType === 'user.deleted') {
        const { id } = evt.data;
        const supabase = createAdminClient();

        const { error } = await supabase.from('users').delete().eq('id', id!);

        if (error) {
            console.error('Error deleting user from Supabase:', error);
            return new Response('Error deleting user', { status: 500 });
        }
        console.log(`Successfully deleted user ${id} from Supabase`);
    }

    return new Response('', { status: 200 })
}

import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key for admin access
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

export async function POST(req: Request) {
    // Get the headers
    const headerPayload = await headers()
    const svix_id = headerPayload.get("svix-id")
    const svix_timestamp = headerPayload.get("svix-timestamp")
    const svix_signature = headerPayload.get("svix-signature")

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error occurred -- no svix headers', {
            status: 400
        })
    }

    // Get the body
    const payload = await req.json()
    const body = JSON.stringify(payload)

    // Create a new Svix instance with your secret.
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '')

    let evt: WebhookEvent

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent
    } catch (err) {
        console.error('Error verifying webhook:', err)
        return new Response('Error occurred', {
            status: 400
        })
    }

    // Handle the webhook
    const eventType = evt.type

    if (eventType === 'user.created' || eventType === 'user.updated') {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data

        const primaryEmail = email_addresses?.find(email => email.id === evt.data.primary_email_address_id)?.email_address

        if (!primaryEmail) {
            console.error('No primary email found for user:', id)
            return new Response('No primary email', { status: 400 })
        }

        const fullName = [first_name, last_name].filter(Boolean).join(' ') || null

        // Upsert user to Supabase
        const { error } = await supabaseAdmin
            .from('users')
            .upsert({
                id: id,
                email: primaryEmail,
                full_name: fullName,
                avatar_url: image_url || null,
                // is_super_admin will be set by the database trigger for specific emails
            }, {
                onConflict: 'id'
            })

        if (error) {
            console.error('Error upserting user to Supabase:', error)
            return new Response('Error syncing user', { status: 500 })
        }

        console.log(`User ${eventType}:`, id, primaryEmail)
    }

    if (eventType === 'user.deleted') {
        const { id } = evt.data

        // Optionally delete user from Supabase or just mark as deleted
        const { error } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting user from Supabase:', error)
            return new Response('Error deleting user', { status: 500 })
        }

        console.log('User deleted:', id)
    }

    return new Response('Webhook processed successfully', { status: 200 })
}

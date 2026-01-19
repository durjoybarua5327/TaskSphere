# Clerk + Supabase Integration Setup Guide

The error `ClerkAPIResponseError: Not Found` occurs because Clerk is trying to generate a token using a template named `supabase`, but this template does not exist in your Clerk Dashboard yet.

Follow these exact steps to fix it permanently:

## 1. Get your Supabase JWT Secret
1. Go to your **Supabase Dashboard**.
2. Click on the **Settings** (gear icon) -> **API**.
3. Scroll down to the **JWT Settings** section.
4. Copy the **JWT Secret**. (You might need to click "Reveal").

## 2. Create the Template in Clerk
1. Go to your **Clerk Dashboard**.
2. Clicking **Configure** > **JWT Templates** in the sidebar.
3. Click the **New Template** button.
4. Select **Supabase** from the list of frameworks.
5. In the form that appears:
   - **Name**: Ensure it is exactly `supabase` (lowercase).
   - **Signing key**: Paste the **JWT Secret** you copied from Supabase in Step 1.
   - **Claims**: Leave as default.
6. Click **Save**.

## 3. Verify
Restart your development server:
```bash
npm run dev
```
The error should disappear, and your app will now be able to securely communicate with Supabase using your authenticated user's identity.

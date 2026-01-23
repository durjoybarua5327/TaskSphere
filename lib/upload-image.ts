"use server";

import { createAdminClient } from "@/lib/supabase-admin";
import { auth } from "@clerk/nextjs/server";

/**
 * Uploads a base64 image to Supabase Storage
 * @param base64Data - The base64 data URL (e.g., "data:image/jpeg;base64,...")
 * @param userId - Optional user ID (will use current auth user if not provided)
 * @param fileName - Optional custom file name
 * @returns The public URL of the uploaded image or null if failed
 */
export async function uploadBase64Image(
    base64Data: string,
    userId?: string,
    fileName?: string
): Promise<{ url?: string; error?: string }> {
    try {
        let finalUserId = userId;

        if (!finalUserId) {
            const { userId: authUserId } = await auth();
            if (!authUserId) return { error: "Not authenticated" };
            finalUserId = authUserId;
        }

        console.log("[uploadBase64Image] Starting upload for user:", finalUserId);

        // Extract the base64 content and mime type
        const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            console.error("[uploadBase64Image] Invalid base64 data format");
            return { error: "Invalid base64 data" };
        }

        const mimeType = matches[1];
        const base64Content = matches[2];

        console.log("[uploadBase64Image] MIME type:", mimeType);
        console.log("[uploadBase64Image] Base64 content length:", base64Content.length);

        // Convert base64 to buffer
        const buffer = Buffer.from(base64Content, "base64");
        console.log("[uploadBase64Image] Buffer size:", buffer.length, "bytes");

        // Generate file name if not provided
        const extension = mimeType.split("/")[1] || "bin";
        const timestamp = Date.now();
        const finalFileName = fileName || `file-${finalUserId}-${timestamp}.${extension}`;
        const filePath = `uploads/${finalUserId}/${finalFileName}`;

        console.log("[uploadBase64Image] Upload path:", filePath);

        const supabase = createAdminClient();

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from("task-attachments")
            .upload(filePath, buffer, {
                contentType: mimeType,
                upsert: true, // Replace if exists
            });

        if (error) {
            console.error("[uploadBase64Image] Storage upload error:", error);
            return { error: error.message };
        }

        console.log("[uploadBase64Image] Upload successful, data:", data);

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from("task-attachments")
            .getPublicUrl(filePath);

        console.log("[uploadBase64Image] Public URL:", publicUrl);

        return { url: publicUrl };
    } catch (error) {
        console.error("[uploadBase64Image] Error uploading image:", error);
        return { error: "Failed to upload image" };
    }
}

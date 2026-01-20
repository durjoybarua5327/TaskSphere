"use client";

import { useState } from "react";
import { UploadCloud, X, File as FileIcon, Loader2, Image as ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface FileUploadProps {
    onChange: (urls: string[]) => void;
    value: string[];
    endpoint?: string; // Optional, for future use if we switch to server-side upload
    className?: string;
}

export function FileUpload({ onChange, value = [], className }: FileUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const supabase = createClient();

    const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const newUrls: string[] = [];

        try {
            for (const file of Array.from(files)) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('task-attachments')
                    .upload(filePath, file);

                if (uploadError) {
                    console.error("Upload error:", uploadError);
                    continue;
                }

                const { data } = supabase.storage
                    .from('task-attachments')
                    .getPublicUrl(filePath);

                if (data?.publicUrl) {
                    newUrls.push(data.publicUrl);
                }
            }

            onChange([...value, ...newUrls]);
        } catch (error) {
            console.error("Error uploading file:", error);
            alert("Failed to upload file");
        } finally {
            setIsUploading(false);
            // Reset input
            e.target.value = "";
        }
    };

    const removeFile = (urlToRemove: string) => {
        onChange(value.filter((url) => url !== urlToRemove));
    };

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex flex-wrap gap-4">
                {value.map((url, index) => {
                    const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                    return (
                        <div key={url} className="relative group w-24 h-24 rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                            {isImage ? (
                                <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-slate-400">
                                    <FileIcon className="w-8 h-8 mb-1" />
                                    <span className="text-[8px] font-bold uppercase truncate w-full text-center">
                                        File
                                    </span>
                                </div>
                            )}
                            <button
                                onClick={() => removeFile(url)}
                                className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
                                type="button"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    );
                })}

                <label className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all flex flex-col items-center justify-center cursor-pointer group">
                    <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-emerald-500 transition-colors">
                        {isUploading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <UploadCloud className="w-6 h-6" />
                        )}
                        <span className="text-[8px] font-black uppercase tracking-widest">Upload</span>
                    </div>
                    <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={onUpload}
                        disabled={isUploading}
                    />
                </label>
            </div>
        </div>
    );
}

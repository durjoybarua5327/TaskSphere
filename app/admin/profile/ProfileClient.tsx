"use client";

import { useState } from "react";
import { useModal } from "@/components/providers/modal-provider";
import { updateProfile } from "../actions";
import { PostFeed } from "@/components/post-feed";
import {
    User,
    Mail,
    Calendar,
    Pencil,
    Loader2,
    Building2,
    Link as LinkIcon,
    Camera,
    ArrowUpRight
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cropToSquare } from "@/lib/image-utils";
import { ImageCropper } from "@/components/ui/image-cropper";

interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    is_super_admin: boolean;
    created_at: string;
    institute_name?: string;
    portfolio_url?: string;
    role?: string;
}

interface ProfileClientProps {
    profile: Profile;
    posts: any[];
    currentUserId: string;
    isOwnProfile?: boolean;
}

export function ProfileClient({ profile: initialProfile, posts, currentUserId, isOwnProfile = true }: ProfileClientProps) {
    const { openModal, closeModal } = useModal();
    const [profile, setProfile] = useState<Profile>(initialProfile);

    const handleEditProfile = () => {
        openModal({
            type: "edit",
            title: "Edit Profile",
            description: "Update your personal and professional details",
            className: "max-w-xl",
            preventOutsideClick: true,
            content: (
                <ProfileForm
                    initialData={{
                        fullName: profile.full_name || "",
                        instituteName: profile.institute_name || "",
                        portfolioUrl: profile.portfolio_url || "",
                        avatarUrl: profile.avatar_url || "",
                    }}
                    onSubmit={async (data) => {
                        const result = await updateProfile(data);
                        if (result.success) {
                            setProfile({
                                ...profile,
                                full_name: data.fullName || profile.full_name,
                                institute_name: data.instituteName || profile.institute_name,
                                portfolio_url: data.portfolioUrl || profile.portfolio_url,
                                avatar_url: data.avatarUrl || profile.avatar_url,
                            });
                            closeModal();
                        }
                        return result;
                    }}
                    onCancel={closeModal}
                />
            ),
        });
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-12">
            {/* Profile Section - Consolidated Layout */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
                <div className="flex flex-col lg:flex-row gap-10 items-start">
                    {/* Left Side: Image (Smaller) */}
                    <div className="shrink-0 relative group">
                        <div className="w-64 h-64 rounded-[2rem] bg-slate-100 border-4 border-white shadow-xl overflow-hidden relative z-10">
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt={profile.full_name || "Profile"}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                                    <User className="w-24 h-24" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Information */}
                    <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${profile.is_super_admin
                                            ? 'bg-green-50 border-green-100 text-green-700'
                                            : profile.role === 'top_admin'
                                                ? 'bg-orange-50 border-orange-100 text-orange-700'
                                                : profile.role === 'admin'
                                                    ? 'bg-purple-50 border-purple-100 text-purple-700'
                                                    : 'bg-slate-50 border-slate-100 text-slate-500'
                                        }`}>
                                        {profile.is_super_admin ? 'Global Admin' : (profile.role || 'Admin').replace('_', ' ')}
                                    </span>
                                </div>
                                <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight mb-3">
                                    {profile.full_name || "Admin"}
                                </h2>
                            </div>

                            {isOwnProfile && (
                                <button
                                    onClick={handleEditProfile}
                                    className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-all font-bold text-xs uppercase tracking-widest active:scale-95"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Edit Profile
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Email Address</p>
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 border border-slate-200/50 shadow-sm">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-700">{profile.email}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Joined Platform</p>
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 border border-slate-200/50 shadow-sm">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-700">
                                        {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>

                            {profile.institute_name && (
                                <div className="md:col-span-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Institute / Organization</p>
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 border border-slate-200/50 shadow-sm">
                                            <Building2 className="w-4 h-4" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-700">{profile.institute_name}</p>
                                    </div>
                                </div>
                            )}

                            {profile.portfolio_url && (
                                <div className="md:col-span-2 pt-2 border-t border-slate-200/50 mt-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Portfolio</p>
                                    <a
                                        href={profile.portfolio_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-[#00897B]/30 hover:shadow-md transition-all cursor-pointer"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-[#00897B]/10 flex items-center justify-center text-slate-400 group-hover:text-[#00897B] transition-colors">
                                            <LinkIcon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-[#00897B] truncate group-hover:underline decoration-2 underline-offset-4">
                                                {profile.portfolio_url.replace(/^https?:\/\//, '')}
                                            </p>
                                        </div>
                                        <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-[#00897B]" />
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* My Posts Section */}
            <div className="pt-8 border-t border-slate-200">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-8">Activity History</h3>
                <PostFeed
                    posts={posts}
                    currentUserId={currentUserId}
                    isSuperAdmin={false}
                />
            </div>
        </div>
    );
}

function ProfileForm({
    initialData,
    onSubmit,
    onCancel,
}: {
    initialData: {
        fullName: string;
        instituteName: string;
        portfolioUrl: string;
        avatarUrl: string;
    };
    onSubmit: (data: { fullName?: string; instituteName?: string; portfolioUrl?: string; avatarUrl?: string }) => Promise<{ error?: string; success?: boolean }>;
    onCancel: () => void;
}) {
    const [formData, setFormData] = useState(initialData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCropperOpen, setIsCropperOpen] = useState(false);
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        let formattedPortfolioUrl = formData.portfolioUrl;
        if (formattedPortfolioUrl && !/^https?:\/\//i.test(formattedPortfolioUrl)) {
            formattedPortfolioUrl = `https://${formattedPortfolioUrl}`;
        }

        const result = await onSubmit({
            fullName: formData.fullName || undefined,
            instituteName: formData.instituteName || undefined,
            portfolioUrl: formattedPortfolioUrl || undefined,
            avatarUrl: formData.avatarUrl || undefined,
        });

        if (result.error) {
            setError(result.error);
        }
        setIsSubmitting(false);
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6 p-2">
                {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                            Profile Image
                        </label>
                        <div className="flex gap-4 items-center">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden relative group">
                                {formData.avatarUrl ? (
                                    <img src={formData.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <Camera className="w-6 h-6 text-slate-400" />
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setSelectedImageFile(file);
                                            setIsCropperOpen(true);
                                        }
                                        e.target.value = '';
                                    }}
                                    className="block w-full text-sm text-slate-500
                                file:mr-4 file:py-2.5 file:px-4
                                file:rounded-xl file:border-0
                                file:text-xs file:font-bold file:uppercase file:tracking-widest
                                file:bg-slate-100 file:text-slate-700
                                hover:file:bg-slate-200 transition-all
                                "
                                />
                                <p className="text-[10px] text-slate-400 mt-2 font-medium">
                                    Upload JPG, PNG or GIF. You'll be able to crop and adjust before saving.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            placeholder="Your full name"
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-slate-100 focus:border-slate-300 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                            Institute
                        </label>
                        <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={formData.instituteName}
                                onChange={(e) => setFormData({ ...formData, instituteName: e.target.value })}
                                placeholder="University or Organization Name"
                                className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:ring-4 focus:ring-slate-100 focus:border-slate-300 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                            Portfolio URL
                        </label>
                        <div className="relative">
                            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={formData.portfolioUrl}
                                onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                                placeholder="https://your-portfolio.com"
                                className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:ring-4 focus:ring-slate-100 focus:border-slate-300 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-6">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-[2] py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Profile"}
                    </button>
                </div>
            </form>

            {
                selectedImageFile && (
                    <ImageCropper
                        isOpen={isCropperOpen}
                        imageFile={selectedImageFile}
                        onClose={() => {
                            setIsCropperOpen(false);
                            setSelectedImageFile(null);
                        }}
                        onCropComplete={(croppedImage) => {
                            setFormData({ ...formData, avatarUrl: croppedImage });
                        }}
                    />
                )
            }
        </>
    );
}

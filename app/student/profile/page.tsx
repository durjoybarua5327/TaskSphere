import { createClient } from "@/lib/supabase-server";
import { currentUser } from "@clerk/nextjs/server";
import { PostFeed } from "@/components/post-feed";
import { User, Mail, GraduationCap, Building2, Calendar, Shield } from "lucide-react";

async function getData() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // Fetch user groups
    const { data: memberships } = await supabase
        .from("group_members")
        .select("groups(name), role")
        .eq("user_id", userId);

    // Fetch user posts
    const { data: posts } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    return {
        userId,
        memberships: memberships || [],
        posts: posts || []
    };
}

export default async function ProfilePage() {
    const user = await currentUser();
    const { userId, memberships, posts } = await getData();

    if (!user) return null; // Should be handled by middleware

    const userEmail = user.emailAddresses[0]?.emailAddress;
    // Mock data for University/Dept since columns don't exist yet
    const academicInfo = {
        university: "University of Example",
        department: "Computer Science & Engineering",
        batch: "2024",
        id: "1920xx" // Mock ID
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-emerald-500 to-teal-500" />
                <div className="px-8 pb-8 relative">
                    <div className="absolute -top-16 left-8 p-1 bg-white rounded-full">
                        <div className="w-32 h-32 rounded-full bg-slate-900 flex items-center justify-center text-4xl text-white font-bold border-4 border-white">
                            {user.firstName?.charAt(0) || 'U'}
                        </div>
                    </div>

                    <div className="ml-40 pt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{user.firstName} {user.lastName}</h1>
                            <div className="flex items-center gap-2 text-slate-500 mt-1">
                                <Mail className="w-4 h-4" />
                                <span>{userEmail}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 mb-8 border-t border-slate-100 pt-8">
                        <InfoItem icon={Building2} label="University" value={academicInfo.university} />
                        <InfoItem icon={GraduationCap} label="Department" value={academicInfo.department} />
                        <InfoItem icon={Calendar} label="Batch" value={academicInfo.batch} />
                        <InfoItem icon={Shield} label="Student ID" value={academicInfo.id} />
                    </div>

                    <div>
                        <h3 className="font-semibold text-slate-900 mb-4">Joined Groups</h3>
                        <div className="flex flex-wrap gap-2">
                            {memberships.length > 0 ? (
                                memberships.map((m, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium border border-slate-200">
                                        {(m.groups as any).name} • <span className="text-slate-500 text-xs">{m.role}</span>
                                    </span>
                                ))
                            ) : (
                                <span className="text-slate-500 italic text-sm">No groups joined yet.</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">My Activity</h2>
                <PostFeed posts={posts} currentUserId={userId || ''} />
            </div>
        </div>
    );
}

function InfoItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-slate-900 font-medium">{value}</p>
            </div>
        </div>
    );
}

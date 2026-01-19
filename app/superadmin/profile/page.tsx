import { currentUser } from "@clerk/nextjs/server";

export default async function SuperAdminProfile() {
    const user = await currentUser();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
            <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                    <img src={user?.imageUrl} alt="Profile" className="w-24 h-24 rounded-full border-2 border-indigo-500" />
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">{user?.fullName}</h2>
                        <p className="text-indigo-600 font-medium">Super Administrator</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-700">
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold">Email</label>
                        <p>{user?.emailAddresses[0]?.emailAddress}</p>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold">User ID</label>
                        <p className="font-mono text-xs mt-1">{user?.id}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

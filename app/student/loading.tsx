export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-t-4 border-indigo-600 mb-4"></div>
                <p className="text-slate-600 text-lg font-medium">Loading your dashboard...</p>
            </div>
        </div>
    );
}

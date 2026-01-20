import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getGlobalRole, syncUserToSupabase } from "@/lib/permissions";
import { LandingHero } from "@/components/landing-hero";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    const user = await currentUser();
    if (user) {
      // Sync user data to Supabase
      const email = user.emailAddresses[0]?.emailAddress;
      if (email) {
        await syncUserToSupabase(userId, email, {
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          imageUrl: user.imageUrl
        });
      }
    }

    const role = await getGlobalRole(userId);

    if (role === 'super_admin') {
      redirect('/superadmin');
    } else if (role === 'admin' || role === 'top_admin') {
      redirect('/admin');
    } else {
      redirect('/student');
    }
  }

  return <LandingHero />;
}

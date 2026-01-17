import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Bot, GraduationCap, Layout, Shield, Users } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="border-b sticky top-0 z-40 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">TaskSphere</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500">
            <Link href="#features" className="hover:text-slate-900 transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</Link>
            <Link href="#about" className="hover:text-slate-900 transition-colors">About</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link href="/auth/register">
              <Button variant="premium">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-slate-50 -z-10" />
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium mb-6 animate-fade-in-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-600 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              Now with AI Grading Support
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600">
              Master Your <span className="text-emerald-600">Learning Community</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              The all-in-one platform for clubs and courses. Manage tasks, role-based access, and leverage AI for instant assignment evaluation.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" variant="premium" className="h-12 px-8 text-base">
                Start for Free
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                View Demo
              </Button>
            </div>

            {/* Mockup / Visual */}
            <div className="mt-20 relative mx-auto max-w-5xl">
              <div className="aspect-[16/9] rounded-xl border bg-white/50 backdrop-blur shadow-2xl overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                  {/* Placeholder for App Screenshot */}
                  <div className="text-center">
                    <Layout className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Dashboard Preview</p>
                    <p className="text-sm">Generate an image to see the UI here</p>
                  </div>
                </div>
              </div>
              <div className="absolute -inset-4 bg-emerald-500/20 blur-3xl -z-10 rounded-full opacity-50" />
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 bg-slate-50/50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold mb-4 text-slate-900">Powerful Features for Modern Clubs</h2>
              <p className="text-slate-600 text-lg">
                Everything you need to manage students, admins, and assignments efficiently.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Shield className="w-6 h-6 text-emerald-600" />}
                title="Role-Based Security"
                description="Strict hierarchy: Super Admin, Top Admin, Admin, and Student roles with distinct permissions."
              />
              <FeatureCard
                icon={<Bot className="w-6 h-6 text-emerald-600" />}
                title="AI-Assisted Grading"
                description="Save hours with AI that reads submissions, suggests scores (0-10), and provides feedback."
              />
              <FeatureCard
                icon={<Users className="w-6 h-6 text-emerald-600" />}
                title="Group Management"
                description="Create communities, assign owners, and manage memberships seamlessly."
              />
              <FeatureCard
                icon={<GraduationCap className="w-6 h-6 text-emerald-600" />}
                title="Task System"
                description="Rich text assignments, file uploads, and deadlines strictly enforced."
              />
              <FeatureCard
                icon={<Layout className="w-6 h-6 text-emerald-600" />}
                title="Rich Profiles"
                description="Showcase points, completed tasks, and contributions in beautiful public profiles."
              />
              <FeatureCard
                icon={<Bot className="w-6 h-6 text-emerald-600" />}
                title="Community Feed"
                description="Engage with global or group-specific posts, comments, and likes."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t bg-white">
        <div className="container mx-auto px-4 text-center text-slate-500">
          <p>© 2024 TaskSphere. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 border-none bg-white/50 backdrop-blur glass-card">
      <CardHeader>
        <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center mb-4">
          {icon}
        </div>
        <CardTitle className="text-slate-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-600 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  )
}

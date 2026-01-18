"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Shield,
  Users,
  GraduationCap,
  Target,
  Globe,
  Github,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Zap,
  Award,
  ChevronRight,
  Star,
  Clock,
  BarChart3,
  FileText,
  MessageSquare,
  Layers
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import profilePic from "./profile/profile.jpeg";

export default function Home() {
  const [activeTab, setActiveTab] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      {/* Navigation Bar - Removed as GlobalNavbar is used */}

      {/* Hero Section */}
      <section className="pt-10 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-slate-700">Powered by AI</span>
            </div>

            <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
              Modern learning
              <br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                management platform
              </span>
            </h1>

            <p className="text-xl text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto">
              Streamline your educational workflow with intelligent task management,
              automated grading, and real-time collaboration.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
              <Link href="/sign-up">
                <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-8 h-12 text-base w-full sm:w-auto">
                  Sign Up
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="font-medium px-8 h-12 text-base w-full sm:w-auto border-slate-300 hover:bg-slate-50">
                  See how it works
                </Button>
              </Link>
            </div>


          </div>

          {/* Product Screenshot */}
          <div className="mt-20 max-w-6xl mx-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-3xl" />
              <div className="relative bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-slate-700" />
                    <div className="w-3 h-3 rounded-full bg-slate-700" />
                    <div className="w-3 h-3 rounded-full bg-slate-700" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 bg-slate-800 rounded-md text-xs text-slate-400 font-mono">
                      app.tasksphere.com/dashboard
                    </div>
                  </div>
                </div>
                <DashboardMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        <div className="max-w-7xl mx-auto relative">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium mb-4">
              Features
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
              Everything you need to <span className="text-emerald-600">manage learning</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Powerful features designed for modern education. Scale from small study groups to large institutions with ease.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<GraduationCap className="w-6 h-6" />}
              title="Smart Task Management"
              description="Create, assign, and track tasks with intelligent automation. Set deadlines, priorities, and get instant notifications."
            />
            <FeatureCard
              icon={<Sparkles className="w-6 h-6" />}
              title="AI-Powered Grading"
              description="Automated evaluation with detailed feedback. Save hours while maintaining high educational standards."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Role-Based Access"
              description="Granular permissions for admins, educators, and students. Enterprise-grade security built-in."
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Advanced Analytics"
              description="Track progress, engagement, and performance with detailed insights and visual reports."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Team Collaboration"
              description="Real-time collaboration tools for groups, cohorts, and classes. Work together seamlessly."
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Instant Notifications"
              description="Stay updated with real-time alerts for submissions, deadlines, and important updates."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium mb-4">
              How it works
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
              Get started in <span className="text-blue-600">minutes</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              A simple, streamlined setup process that gets you up and running without technical hurdles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto relative">
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-100 -z-10" />
            <ProcessStep
              number="01"
              title="Create workspace"
              description="Sign up and set up your learning environment in under 2 minutes. Import existing data or start fresh."
            />
            <ProcessStep
              number="02"
              title="Invite your team"
              description="Add students, co-educators, and administrators. Assign roles and permissions with one click."
            />
            <ProcessStep
              number="03"
              title="Start managing"
              description="Create tasks, set deadlines, and let AI handle the grading. Focus on what matters - teaching."
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden card-background">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium mb-4">
              About
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
              Built by educators, <span className="text-purple-600">for educators</span>
            </h2>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
              <div className="md:col-span-2 relative min-h-[400px] h-full">
                <Image
                  src={profilePic}
                  alt="Durjoy Barua"
                  fill
                  className="object-cover"
                  placeholder="blur"
                />
              </div>
              <div className="md:col-span-3 p-10 md:p-12 flex flex-col justify-center">
                <div className="mb-6">
                  <h3 className="text-3xl font-bold text-slate-900 mb-2">Durjoy Barua</h3>
                  <p className="text-emerald-600 font-bold text-lg">Founder & Chief Architect</p>
                </div>
                <p className="text-slate-600 leading-relaxed text-lg mb-8">
                  "With a passion for revolutionizing education through technology, I created TaskSphere to bridge the gap between traditional learning and modern AI collaboration. My goal is to empower educators worldwide to focus on what truly matters - teaching."
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href="https://durjoybarua5327.vercel.app"
                    target="_blank"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    Visit Portfolio
                  </Link>
                  <Link
                    href="https://github.com/durjoybarua5327"
                    target="_blank"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
                  >
                    <Github className="w-4 h-4" />
                    GitHub
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto text-center transform hover:scale-[1.01] transition-transform duration-500">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 mb-8 tracking-tight">
            Ready to transform <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">your workflow?</span>
          </h2>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            Join thousands of educators using TaskSphere to streamline their teaching task and focus on student success.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-14 px-10 text-lg shadow-xl shadow-slate-900/10 rounded-full transition-all hover:-translate-y-1">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

// Feature Card Component
// FeatureCard Component
function FeatureCard({
  icon,
  title,
  description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}

// ProcessStep Component
function ProcessStep({
  number,
  title,
  description
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="relative bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 text-center z-10">
      <div className="text-5xl font-black text-slate-100 mb-6 bg-clip-text text-transparent bg-gradient-to-br from-slate-200 to-slate-100"
        style={{ WebkitTextStroke: '1px #e2e8f0' }}>
        {number}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-4">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}

// AI Benefit Component
function AIBenefit({
  icon,
  title,
  description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-slate-900 mb-1">{title}</h4>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="text-4xl font-bold text-white mb-2">{number}</div>
      <div className="text-slate-400">{label}</div>
    </div>
  );
}

// Dashboard Mockup Component
function DashboardMockup() {
  return (
    <div className="bg-slate-800 p-6">
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-700/50 rounded-lg p-4">
            <div className="w-8 h-8 rounded bg-emerald-500/20 mb-3" />
            <div className="h-3 bg-slate-600 rounded w-20 mb-2" />
            <div className="h-6 bg-slate-600 rounded w-12" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-slate-700/50 rounded-lg p-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded">
              <div className="w-10 h-10 rounded bg-emerald-500/20" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-600 rounded w-3/4" />
                <div className="h-2 bg-slate-600/50 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="h-3 bg-slate-600 rounded w-20 mb-3" />
          <div className="space-y-2">
            {[75, 85, 68, 92, 80].map((width, i) => (
              <div key={i} className="h-2 bg-slate-600 rounded" style={{ width: `${width}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// AI Grading Mockup Component
function AIGradingMockup() {
  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">AI Evaluation</div>
              <div className="text-sm text-slate-500">In progress...</div>
            </div>
          </div>
          <div className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
            Active
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <MetricBar label="Code Quality" value={95} />
        <MetricBar label="Documentation" value={88} />
        <MetricBar label="Best Practices" value={92} />
      </div>

      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="flex items-start gap-3">
          <Award className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-slate-900 mb-1">Overall Score: 92/100</div>
            <div className="text-sm text-slate-600">Excellent work! Your submission demonstrates strong fundamentals and attention to detail.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Metric Bar Component
function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="font-medium text-slate-900">{label}</span>
        <span className="text-emerald-600 font-semibold">{value}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

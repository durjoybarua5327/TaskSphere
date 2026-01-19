import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google"; // Premium fonts
import "@/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { GlobalNavbar } from "@/components/global-navbar";
import { ModalProvider } from "@/components/providers/modal-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

/*
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});
*/

export const metadata: Metadata = {
  title: "TaskSphere | Club Collaboration Platform",
  description: "A production-ready, scalable web application for clubs and learning communities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${inter.variable} antialiased bg-background text-foreground`}
          suppressHydrationWarning
        >
          <ModalProvider>
            <GlobalNavbar />
            {children}
          </ModalProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

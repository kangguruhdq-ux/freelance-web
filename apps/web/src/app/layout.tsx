import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AuthProvider } from "@/context/auth-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FreelanceHub — Work smarter. Hire better.",
  description:
    "Production-quality freelance marketplace connecting ambitious businesses with world-class independent talent. Backed by milestone escrow, realtime communication, and verified reviews.",
  keywords: [
    "freelance marketplace",
    "hire developers",
    "hire designers",
    "freelance jobs",
    "escrow contracts",
    "remote talent",
    "tech freelancers",
  ],
  authors: [{ name: "FreelanceHub" }],
  openGraph: {
    title: "FreelanceHub — Work smarter. Hire better.",
    description:
      "Connect with world-class engineers, designers, and systems architects with milestone escrow protection.",
    url: "https://freelancehub.dev",
    siteName: "FreelanceHub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FreelanceHub — Work smarter. Hire better.",
    description:
      "Connect with world-class engineers, designers, and systems architects with milestone escrow protection.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-brand-500 selection:text-white">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}


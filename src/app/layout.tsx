import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SorenClass — AI Teaching Engine",
  description: "A time-synchronized AI teaching simulation engine that transforms knowledge into a real-time classroom performance.",
  keywords: ["SorenClass", "AI Teaching", "Classroom", "Education", "Real-time Learning"],
  authors: [{ name: "SorenChat" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "SorenClass — AI Teaching Engine",
    description: "Real-time AI-powered teaching experiences",
    url: "https://class.sorenchat.com",
    siteName: "SorenChat",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SorenClass — AI Teaching Engine",
    description: "Real-time AI-powered teaching experiences",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <TooltipProvider delayDuration={300}>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Soren Classroom — AI বাংলাদেশ শ্রেণিকক্ষ",
  description: "বাংলাদেশ NCTB পাঠ্যক্রম অনুযায়ী AI শিক্ষক — Class 6-10 — বাংলা ও ইংরেজিতে পড়াশোনা।",
  keywords: ["Soren", "AI Teacher", "Bangladesh", "NCTB", "বাংলাদেশ", "শিক্ষা", "Classroom"],
  icons: {
    icon: "/logo.svg",
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        {/* Chalk-style handwriting font + Bangla support */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style>{`
          :root {
            --font-geist-sans: "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            --font-geist-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            --font-chalk: "Caveat", "Patrick Hand", cursive;
            --font-bangla: "Noto Sans Bengali", sans-serif;
          }

          /* Smooth scrolling */
          * { scroll-behavior: smooth; }

          /* Better mobile tap targets */
          button { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }

          /* Bangla text rendering */
          [lang="bn"], .bn-text {
            font-family: var(--font-bangla);
            line-height: 1.6;
          }

          /* Chalk text */
          .chalk-text {
            font-family: var(--font-chalk);
            font-size: 15px;
          }

          /* Prevent pull-to-refresh on mobile */
          body { overscroll-behavior: none; }

          /* Custom scrollbar */
          ::-webkit-scrollbar { width: 4px; height: 4px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 2px; }
        `}</style>
      </head>
      <body className="antialiased bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}

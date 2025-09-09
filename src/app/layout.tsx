import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TippingPoint Configurator",
  description: "Trend Micro TippingPoint configuration tool",
  icons: {
    icon: [
      { url: "/tmlogo.png", sizes: "16x16", type: "image/png" },
      { url: "/tmlogo.png", sizes: "32x32", type: "image/png" },
      { url: "/tmlogo.png", sizes: "48x48", type: "image/png" },
    ],
    shortcut: "/tmlogo.png",
    apple: [
      { url: "/tmlogo.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
          /* Hide Next.js development panel */
          #__next-dev-overlay,
          [data-nextjs-dialog-overlay],
          [data-nextjs-toast],
          nextjs-portal,
          #__next-route-announcer,
          [id^="__next"],
          [data-nextjs-scroll-focus-boundary] ~ div[style*="position: fixed"][style*="z-index"],
          div[style*="position: fixed"][style*="bottom: 16px"][style*="left: 16px"] {
            display: none !important;
          }
        `}</style>
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Nav />
        {children}
        <footer className="mt-8 border-t border-black/10 dark:border-white/10 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div>Version 1.2.1</div>
            <div>
              Contact <a className="underline hover:opacity-80" href="mailto:jay_kammerer@trendmicro.com?subject=TippingPoint%20Configurator%20Question">Jay Kammerer</a> for info
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

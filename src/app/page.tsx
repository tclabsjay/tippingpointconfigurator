import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[48px] row-start-2 items-center text-center">
        {/* Trend Micro Logo */}
        <div className="flex flex-col items-center gap-6">
          <Image
            src="/trendmicro-theme.svg"
            alt="Trend Micro"
            width={280}
            height={168}
            priority
            className="opacity-90 hover:opacity-100 transition-opacity duration-300"
          />
          
          {/* Application Title */}
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
              TippingPoint Configurator
            </h1>
            <p className="text-lg text-foreground/70 max-w-2xl">
              Professional configuration tool for TippingPoint TXE series hardware, 
              modules, and licenses with advanced quote generation capabilities.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <Link
            href="/tpc"
            className="rounded-full border border-solid border-transparent transition-all duration-300 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white gap-2 font-medium text-sm sm:text-base h-12 sm:h-14 px-6 sm:px-8 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7v10c0 5.55 3.84 10 9 10s9-4.45 9-10V7L12 2z"/>
              <path d="M12 22s8-4 8-10V7l-8-5-8 5v5c0 6 8 10 8 10z"/>
            </svg>
            Start Configuring
          </Link>
          
          <Link
            href="/dev-admin"
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-all duration-300 flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-12 sm:h-14 px-6 sm:px-8"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Admin Panel
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl">
          <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-black/[.02] dark:bg-white/[.02] border border-black/[.08] dark:border-white/[.08] hover:bg-black/[.05] dark:hover:bg-white/[.05] transition-colors">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            <h3 className="font-semibold">Multi-Configuration</h3>
            <p className="text-sm text-foreground/60 text-center">Create, clone, and manage multiple hardware configurations</p>
          </div>
          
          <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-black/[.02] dark:bg-white/[.02] border border-black/[.08] dark:border-white/[.08] hover:bg-black/[.05] dark:hover:bg-white/[.05] transition-colors">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
              <path d="M9 12l2 2 4-4"/>
              <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
              <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
              <path d="M13 12h3c.5 0 1-.5 1-1V8c0-.5-.5-1-1-1h-3"/>
              <path d="M11 12H8c-.5 0-1-.5-1-1V8c0-.5.5-1 1-1h3"/>
            </svg>
            <h3 className="font-semibold">Smart License Matching</h3>
            <p className="text-sm text-foreground/60 text-center">Automatic bandwidth matching between inspection and ThreatDV licenses</p>
          </div>
          
          <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-black/[.02] dark:bg-white/[.02] border border-black/[.08] dark:border-white/[.08] hover:bg-black/[.05] dark:hover:bg-white/[.05] transition-colors">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
            <h3 className="font-semibold">Professional Quotes</h3>
            <p className="text-sm text-foreground/60 text-center">Generate formatted quotes ready for Dynamics integration</p>
          </div>
        </div>
      </main>
    </div>
  );
}

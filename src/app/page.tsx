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

        {/* Action Button */}
        <div className="flex justify-center">
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
        </div>

      </main>
    </div>
  );
}

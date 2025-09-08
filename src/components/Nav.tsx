"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;
  return (
    <nav className="w-full border-b border-black/10 dark:border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <img
              src="/tmlogo.png"
              alt="Trend Micro"
              className="h-7 md:h-8 w-auto cursor-pointer"
            />
          </Link>
          <div className="text-lg font-semibold">TippingPoint Configurator</div>
        </div>
        <div className="flex gap-4 text-sm">
          <Link
            href="/tpc"
            className={`px-3 py-1.5 rounded ${isActive("/tpc") ? "bg-black/5 dark:bg-white/10" : "hover:bg-black/5 dark:hover:bg-white/10"}`}
          >
            TippingPoint Configurator
          </Link>

          
          
        </div>
      </div>
    </nav>
  );
}



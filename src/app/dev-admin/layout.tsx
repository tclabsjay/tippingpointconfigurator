import { ReactNode } from "react";

interface DevAdminLayoutProps {
  children: ReactNode;
}

export default function DevAdminLayout({ children }: DevAdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <img
                src="/trendmicro.svg"
                alt="Trend Micro"
                className="h-6 w-auto"
              />
              <div className="text-lg font-semibold text-gray-900">
                TippingPoint Catalog Admin
              </div>
              <div className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                DEVELOPMENT
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/tpc"
                className="text-sm text-gray-600 hover:text-gray-900"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Configurator ↗
              </a>
              <div className="text-xs text-gray-500">
                {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}

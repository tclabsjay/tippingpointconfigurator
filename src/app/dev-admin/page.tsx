"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface CatalogStats {
  models: number;
  ioModules: number;
  licenses: number;
  smsModels: number;
  lastUpdated: string;
  version: string;
  updatedBy?: string;
}

interface BackupInfo {
  filename: string;
  timestamp: string;
  size: number;
}

export default function DevAdminPage() {
  const [stats, setStats] = useState<CatalogStats | null>(null);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError(null);

      // Load catalog stats
      const catalogRes = await fetch("/api/dev/catalog", { cache: "no-store" });
      if (!catalogRes.ok) throw new Error("Failed to load catalog");
      const catalog = await catalogRes.json();

      setStats({
        models: catalog.models?.length || 0,
        ioModules: catalog.ioModules?.length || 0,
        licenses: catalog.licenses?.length || 0,
        smsModels: catalog.smsModels?.length || 0,
        lastUpdated: catalog.metadata?.lastUpdated || "Unknown",
        version: catalog.metadata?.version || "Unknown",
        updatedBy: catalog.metadata?.updatedBy,
      });

      // Load backup info
      const backupsRes = await fetch("/api/dev/catalog/backups", { cache: "no-store" });
      if (backupsRes.ok) {
        const backupsData = await backupsRes.json();
        setBackups(backupsData.backups || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function exportCatalog() {
    try {
      const response = await fetch("/api/dev/catalog/export");
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tippingpoint-catalog-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800 font-medium">Error</div>
        <div className="text-red-600 text-sm mt-1">{error}</div>
        <button
          onClick={loadDashboardData}
          className="mt-3 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-sm rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Catalog Administration</h1>
        <p className="text-gray-600 mt-2">
          Manage TippingPoint product catalog - models, modules, licenses, and SMS appliances
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-2xl font-bold text-blue-600">{stats?.models || 0}</div>
          <div className="text-sm text-gray-600">TXE Models</div>
          <Link href="/dev-admin/models" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Manage →
          </Link>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-2xl font-bold text-green-600">{stats?.ioModules || 0}</div>
          <div className="text-sm text-gray-600">IO Modules</div>
          <Link href="/dev-admin/modules" className="text-green-600 hover:text-green-800 text-sm font-medium">
            Manage →
          </Link>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-2xl font-bold text-purple-600">{stats?.licenses || 0}</div>
          <div className="text-sm text-gray-600">Licenses</div>
          <Link href="/dev-admin/licenses" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
            Manage →
          </Link>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-2xl font-bold text-orange-600">{stats?.smsModels || 0}</div>
          <div className="text-sm text-gray-600">SMS Models</div>
          <Link href="/dev-admin/sms" className="text-orange-600 hover:text-orange-800 text-sm font-medium">
            Manage →
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={exportCatalog}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
          >
            <div className="font-medium text-gray-900">Export Catalog</div>
            <div className="text-sm text-gray-600">Download current catalog as JSON</div>
          </button>
          
          <Link
            href="/dev-admin/import"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left block"
          >
            <div className="font-medium text-gray-900">Import Catalog</div>
            <div className="text-sm text-gray-600">Upload and replace catalog from JSON</div>
          </Link>
          
          <Link
            href="/dev-admin/backups"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left block"
          >
            <div className="font-medium text-gray-900">Manage Backups</div>
            <div className="text-sm text-gray-600">{backups.length} backups available</div>
          </Link>
        </div>
      </div>

      {/* Catalog Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Catalog Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-medium text-gray-900">Version</div>
            <div className="text-gray-600">{stats?.version}</div>
          </div>
          <div>
            <div className="font-medium text-gray-900">Last Updated</div>
            <div className="text-gray-600">
              {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : "Unknown"}
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900">Updated By</div>
            <div className="text-gray-600">{stats?.updatedBy || "Unknown"}</div>
          </div>
        </div>
      </div>

      {/* Recent Backups */}
      {backups.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Backups</h2>
          <div className="space-y-2">
            {backups.slice(0, 5).map((backup) => (
              <div key={backup.filename} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <div className="font-medium text-gray-900">{backup.filename}</div>
                  <div className="text-sm text-gray-600">{backup.timestamp}</div>
                </div>
                <div className="text-sm text-gray-500">
                  {(backup.size / 1024).toFixed(1)} KB
                </div>
              </div>
            ))}
          </div>
          {backups.length > 5 && (
            <Link href="/dev-admin/backups" className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-3 inline-block">
              View all {backups.length} backups →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface BackupInfo {
  filename: string;
  timestamp: string;
  size: number;
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  async function loadBackups() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/dev/catalog/backups", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load backups");
      const data = await response.json();
      setBackups(data.backups || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function restoreBackup(filename: string) {
    if (!confirm(`Are you sure you want to restore from backup "${filename}"? This will replace the current catalog.`)) {
      return;
    }

    try {
      setRestoring(filename);
      setError(null);
      
      const response = await fetch("/api/dev/catalog/backups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-updated-by": "dev-admin-restore",
        },
        body: JSON.stringify({ filename }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Restore failed");
      }

      alert("Catalog restored successfully!");
      await loadBackups();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Restore failed");
    } finally {
      setRestoring(null);
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

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatTimestamp(timestamp: string): string {
    try {
      // Parse the timestamp format from filename (e.g., "2025-09-05T02-47-24-175Z")
      const isoString = timestamp.replace(/-/g, ":").replace("T", "T").replace("Z", "Z");
      const date = new Date(isoString);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-500">Loading backups...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Backup Management</h1>
          <p className="text-gray-600">Manage catalog backups and restore points</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dev-admin"
            className="px-3 py-2 text-gray-600 hover:text-gray-900"
          >
            ← Back
          </Link>
          <button
            onClick={exportCatalog}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            Export Current Catalog
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800 font-medium">Error</div>
          <div className="text-red-600 text-sm mt-1">{error}</div>
        </div>
      )}

      {/* Backup Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="text-blue-800 font-medium">Automatic Backup System</div>
        <div className="text-blue-700 text-sm mt-1">
          Backups are automatically created before every catalog modification. The system keeps the 
          last 10 backups and removes older ones. You can restore any backup to revert changes.
        </div>
      </div>

      {/* Backups List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Available Backups ({backups.length})</h2>
        </div>
        
        {backups.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No backups found. Backups will be created automatically when you modify the catalog.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {backups.map((backup) => (
              <div key={backup.filename} className="p-6">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{backup.filename}</h3>
                    <div className="mt-1 text-sm text-gray-600">
                      Created: {formatTimestamp(backup.timestamp)}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      Size: {formatFileSize(backup.size)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => restoreBackup(backup.filename)}
                      disabled={restoring === backup.filename}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-md text-sm"
                    >
                      {restoring === backup.filename ? "Restoring..." : "Restore"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Restore Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="text-yellow-800 font-medium">⚠️ Restore Warning</div>
        <div className="text-yellow-700 text-sm mt-1">
          Restoring a backup will completely replace the current catalog with the backup data. 
          This action cannot be undone, but a new backup of the current state will be created 
          before the restore operation.
        </div>
      </div>
    </div>
  );
}

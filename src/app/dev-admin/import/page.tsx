"use client";

import { useState } from "react";
import Link from "next/link";

export default function ImportPage() {
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [jsonData, setJsonData] = useState("");
  const [previewData, setPreviewData] = useState<any>(null);

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonData(content);
      try {
        const parsed = JSON.parse(content);
        setPreviewData(parsed);
        setError(null);
      } catch (err) {
        setError("Invalid JSON file");
        setPreviewData(null);
      }
    };
    reader.readAsText(file);
  }

  async function importCatalog() {
    if (!jsonData.trim()) {
      setError("Please provide JSON data to import");
      return;
    }

    try {
      setImporting(true);
      setError(null);
      setSuccess(false);

      const response = await fetch("/api/dev/catalog", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-updated-by": "dev-admin-import",
        },
        body: JSON.stringify({ jsonData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Import failed");
      }

      setSuccess(true);
      setJsonData("");
      setPreviewData(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  function resetForm() {
    setJsonData("");
    setPreviewData(null);
    setError(null);
    setSuccess(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import Catalog</h1>
          <p className="text-gray-600">Import a catalog from JSON file or text</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dev-admin"
            className="px-3 py-2 text-gray-600 hover:text-gray-900"
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800 font-medium">Import Error</div>
          <div className="text-red-600 text-sm mt-1">{error}</div>
        </div>
      )}

      {/* Success Display */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="text-green-800 font-medium">Import Successful</div>
          <div className="text-green-700 text-sm mt-1">
            Catalog has been imported successfully. A backup of the previous catalog was created.
          </div>
          <div className="mt-3">
            <Link
              href="/dev-admin"
              className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-800 text-sm rounded"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* Import Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="text-yellow-800 font-medium">⚠️ Import Warning</div>
        <div className="text-yellow-700 text-sm mt-1">
          Importing a catalog will completely replace the current catalog data. This action 
          cannot be undone, but a backup of the current state will be created automatically 
          before the import.
        </div>
      </div>

      {/* Import Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Upload */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload JSON File</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Catalog JSON File
              </label>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Manual JSON Input */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Paste JSON Data</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catalog JSON Data
              </label>
              <textarea
                value={jsonData}
                onChange={(e) => {
                  setJsonData(e.target.value);
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setPreviewData(parsed);
                    setError(null);
                  } catch (err) {
                    if (e.target.value.trim()) {
                      setError("Invalid JSON format");
                    } else {
                      setError(null);
                    }
                    setPreviewData(null);
                  }
                }}
                placeholder="Paste your catalog JSON here..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      {previewData && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Preview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">
                {previewData.models?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Models</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-600">
                {previewData.ioModules?.length || 0}
              </div>
              <div className="text-sm text-gray-600">IO Modules</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded">
              <div className="text-2xl font-bold text-purple-600">
                {previewData.licenses?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Licenses</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded">
              <div className="text-2xl font-bold text-orange-600">
                {previewData.smsModels?.length || 0}
              </div>
              <div className="text-sm text-gray-600">SMS Models</div>
            </div>
          </div>
          
          {previewData.metadata && (
            <div className="text-sm text-gray-600 mb-4">
              <div><strong>Version:</strong> {previewData.metadata.version}</div>
              <div><strong>Last Updated:</strong> {previewData.metadata.lastUpdated}</div>
              {previewData.metadata.updatedBy && (
                <div><strong>Updated By:</strong> {previewData.metadata.updatedBy}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Import Actions */}
      {previewData && !success && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Ready to Import</h2>
              <p className="text-sm text-gray-600 mt-1">
                The JSON data appears valid. Click import to replace the current catalog.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={importCatalog}
                disabled={importing}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-md"
              >
                {importing ? "Importing..." : "Import Catalog"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Format Information */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <div className="text-gray-800 font-medium">Expected JSON Format</div>
        <div className="text-gray-700 text-sm mt-1">
          The JSON file should contain a complete catalog object with models, ioModules, licenses, 
          smsModels, and metadata fields. You can export the current catalog to see the expected format.
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { License, TxeModel } from "@/lib/txe";
import { getLicenseCompatibleModels } from "@/lib/product-catalog";

interface LicenseFormData {
  sku: string;
  name: string;
  appliesToGbpsMax: number;
  group: "INSPECT" | "THREATDV";
  modelId?: string;
  price?: number;
}

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [models, setModels] = useState<TxeModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGroup, setFilterGroup] = useState<"ALL" | "INSPECT" | "THREATDV">("ALL");
  const [filterModel, setFilterModel] = useState<string>("ALL");
  const [formData, setFormData] = useState<LicenseFormData>({
    sku: "",
    name: "",
    appliesToGbpsMax: 1,
    group: "INSPECT",
    modelId: "",
    price: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      
      const [licensesRes, modelsRes] = await Promise.all([
        fetch("/api/dev/catalog/licenses", { cache: "no-store" }),
        fetch("/api/dev/catalog/models", { cache: "no-store" }),
      ]);
      
      if (!licensesRes.ok || !modelsRes.ok) {
        throw new Error("Failed to load data");
      }
      
      const [licensesData, modelsData] = await Promise.all([
        licensesRes.json(),
        modelsRes.json(),
      ]);
      
      setLicenses(licensesData);
      setModels(modelsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function saveLicense() {
    try {
      setError(null);
      const method = editingLicense ? "PUT" : "POST";
      
      const requestData = {
        ...formData,
        sku: formData.sku.trim(),
        name: formData.name.trim(),
        modelId: formData.modelId || undefined,
      };
      
      const response = await fetch("/api/dev/catalog/licenses", {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-updated-by": "dev-admin",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Save failed");
      }

      await loadData();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function deleteLicense(sku: string) {
    if (!confirm("Are you sure you want to delete this license?")) return;

    try {
      setError(null);
      const response = await fetch(`/api/dev/catalog/licenses?sku=${encodeURIComponent(sku)}`, {
        method: "DELETE",
        headers: { "x-updated-by": "dev-admin" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Delete failed");
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function editLicense(license: License) {
    setEditingLicense(license);
    setFormData({
      sku: license.sku.trim(),
      name: license.name.trim(),
      appliesToGbpsMax: license.appliesToGbpsMax,
      group: license.group || "INSPECT",
      modelId: license.modelId || "",
      price: license.price || 0,
    });
    setShowForm(true);
  }

  function resetForm() {
    setEditingLicense(null);
    setShowForm(false);
    setFormData({
      sku: "",
      name: "",
      appliesToGbpsMax: 1,
      group: "INSPECT",
      modelId: "",
      price: 0,
    });
  }

  const filteredLicenses = licenses.filter(license => {
    const matchesSearch = 
      license.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGroup = filterGroup === "ALL" || license.group === filterGroup;
    
    const matchesModel = filterModel === "ALL" || 
      (filterModel === "NONE" && !license.modelId) ||
      license.modelId === filterModel;
    
    return matchesSearch && matchesGroup && matchesModel;
  });

  const groupedLicenses = {
    INSPECT: filteredLicenses.filter(l => l.group === "INSPECT"),
    THREATDV: filteredLicenses.filter(l => l.group === "THREATDV"),
    OTHER: filteredLicenses.filter(l => !l.group),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-500">Loading licenses...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Licenses</h1>
          <p className="text-gray-600">Manage TPS Inspection and ThreatDV licenses</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dev-admin"
            className="px-3 py-2 text-gray-600 hover:text-gray-900"
          >
            ← Back
          </Link>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
          >
            Add License
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

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search licenses by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value as "ALL" | "INSPECT" | "THREATDV")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="ALL">All License Types</option>
              <option value="INSPECT">TPS Inspection</option>
              <option value="THREATDV">TPS ThreatDV</option>
            </select>
          </div>
          
          <div>
            <select
              value={filterModel}
              onChange={(e) => setFilterModel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="ALL">All Models</option>
              <option value="NONE">No Specific Model</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Licenses by Group */}
      <div className="space-y-6">
        {/* TPS Inspection Licenses */}
        {(filterGroup === "ALL" || filterGroup === "INSPECT") && groupedLicenses.INSPECT.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
              <h2 className="text-lg font-semibold text-blue-900">
                TPS Inspection Licenses ({groupedLicenses.INSPECT.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {groupedLicenses.INSPECT.map((license, index) => (
                <LicenseRow
                  key={`inspect-${license.sku}-${license.modelId || 'all'}-${index}`}
                  license={license}
                  models={models}
                  onEdit={editLicense}
                  onDelete={deleteLicense}
                />
              ))}
            </div>
          </div>
        )}

        {/* TPS ThreatDV Licenses */}
        {(filterGroup === "ALL" || filterGroup === "THREATDV") && groupedLicenses.THREATDV.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-purple-50">
              <h2 className="text-lg font-semibold text-purple-900">
                TPS ThreatDV Licenses ({groupedLicenses.THREATDV.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {groupedLicenses.THREATDV.map((license, index) => (
                <LicenseRow
                  key={`threatdv-${license.sku}-${license.modelId || 'all'}-${index}`}
                  license={license}
                  models={models}
                  onEdit={editLicense}
                  onDelete={deleteLicense}
                />
              ))}
            </div>
          </div>
        )}

        {/* Other Licenses */}
        {filterGroup === "ALL" && groupedLicenses.OTHER.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">
                Other Licenses ({groupedLicenses.OTHER.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {groupedLicenses.OTHER.map((license, index) => (
                <LicenseRow
                  key={`other-${license.sku}-${license.modelId || 'all'}-${index}`}
                  license={license}
                  models={models}
                  onEdit={editLicense}
                  onDelete={deleteLicense}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {filteredLicenses.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
          {searchTerm || filterGroup !== "ALL" || filterModel !== "ALL" 
            ? "No licenses match your filters." 
            : "No licenses found. Add your first license to get started."
          }
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-lg w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">
                {editingLicense ? "Edit License" : "Add New License"}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU
                </label>
                                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => {
                      const newSku = e.target.value.trim();
                      setFormData(prev => {
                        const compatibleModels = getLicenseCompatibleModels(newSku);
                        // Clear modelId if current selection is not compatible with new SKU
                        const newModelId = compatibleModels.length > 0 && prev.modelId && !compatibleModels.includes(prev.modelId)
                          ? ""
                          : prev.modelId;
                        return { 
                          ...prev, 
                          sku: newSku,
                          modelId: newModelId
                        };
                      });
                    }}
                    placeholder="TPNN#### or LIC-TPS-####"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={!!editingLicense}
                  />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., TippingPoint 1Gbps TPS Inspection License + Support + DV 1Yr"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Type
                  </label>
                  <select
                    value={formData.group}
                    onChange={(e) => setFormData(prev => ({ ...prev, group: e.target.value as "INSPECT" | "THREATDV" }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="INSPECT">TPS Inspection</option>
                    <option value="THREATDV">TPS ThreatDV</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Throughput (Gbps)
                  </label>
                  <input
                    type="number"
                    value={formData.appliesToGbpsMax}
                    onChange={(e) => setFormData(prev => ({ ...prev, appliesToGbpsMax: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    step="0.25"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specific Model (Optional)
                </label>
                <select
                  value={formData.modelId}
                  onChange={(e) => setFormData(prev => ({ ...prev, modelId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Models</option>
                  {(() => {
                    const compatibleModelIds = getLicenseCompatibleModels(formData.sku);
                    const availableModels = compatibleModelIds.length > 0 
                      ? models.filter(model => compatibleModelIds.includes(model.id))
                      : models;
                    
                    return availableModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ));
                  })()}
                </select>
                <div className="text-xs text-gray-500 mt-1">
                  {(() => {
                    const compatibleModelIds = getLicenseCompatibleModels(formData.sku);
                    if (compatibleModelIds.length > 0) {
                      const modelNames = compatibleModelIds.map(id => {
                        const model = models.find(m => m.id === id);
                        return model ? model.name : id;
                      }).join(", ");
                      return `This license is only compatible with: ${modelNames}`;
                    }
                    return "Leave empty for generic licenses that work with all models";
                  })()}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={saveLicense}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
              >
                {editingLicense ? "Update" : "Add"} License
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LicenseRow({ 
  license, 
  models, 
  onEdit, 
  onDelete 
}: { 
  license: License; 
  models: TxeModel[];
  onEdit: (license: License) => void;
  onDelete: (sku: string) => void;
}) {
  const model = models.find(m => m.id === license.modelId);
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900">{license.name}</h3>
          <div className="mt-1 text-sm text-gray-600">
            SKU: {license.sku}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
              Up to {license.appliesToGbpsMax} Gbps
            </span>
            {license.group && (
              <span className={`px-2 py-1 text-xs rounded ${
                license.group === "INSPECT" 
                  ? "bg-blue-100 text-blue-800" 
                  : "bg-purple-100 text-purple-800"
              }`}>
                {license.group === "INSPECT" ? "TPS Inspection" : "TPS ThreatDV"}
              </span>
            )}
            {model ? (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                {model.name}
              </span>
            ) : (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                All Models
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(license)}
            className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(license.sku)}
            className="px-3 py-1 text-red-600 hover:text-red-800 text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

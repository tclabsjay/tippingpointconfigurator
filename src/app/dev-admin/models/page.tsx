"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { TxeModel } from "@/lib/txe";

interface ModelFormData {
  id: string;
  name: string;
  baseGbps: number;
  sku: string;
  tiers: Array<{ label: string; gbps: number }>;
  price?: number;
}

export default function ModelsPage() {
  const [models, setModels] = useState<TxeModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingModel, setEditingModel] = useState<TxeModel | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ModelFormData>({
    id: "",
    name: "",
    baseGbps: 10,
    sku: "",
    tiers: [{ label: "1 Gbps", gbps: 1 }],
    price: 0,
  });

  useEffect(() => {
    loadModels();
  }, []);

  async function loadModels() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/dev/catalog/models", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load models");
      const data = await response.json();
      setModels(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function saveModel() {
    try {
      setError(null);
      const method = editingModel ? "PUT" : "POST";
      const response = await fetch("/api/dev/catalog/models", {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-updated-by": "dev-admin",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Save failed");
      }

      await loadModels();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function deleteModel(modelId: string) {
    if (!confirm("Are you sure you want to delete this model?")) return;

    try {
      setError(null);
      const response = await fetch(`/api/dev/catalog/models?id=${encodeURIComponent(modelId)}`, {
        method: "DELETE",
        headers: { "x-updated-by": "dev-admin" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Delete failed");
      }

      await loadModels();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function editModel(model: TxeModel) {
    setEditingModel(model);
    setFormData({
      id: model.id,
      name: model.name,
      baseGbps: model.baseGbps,
      sku: model.sku || "",
      tiers: [...model.tiers],
      price: model.price || 0,
    });
    setShowForm(true);
  }

  function resetForm() {
    setEditingModel(null);
    setShowForm(false);
    setFormData({
      id: "",
      name: "",
      baseGbps: 10,
      sku: "",
      tiers: [{ label: "1 Gbps", gbps: 1 }],
      price: 0,
    });
  }

  function addTier() {
    setFormData(prev => ({
      ...prev,
      tiers: [...prev.tiers, { label: "", gbps: 1 }],
    }));
  }

  function updateTier(index: number, field: "label" | "gbps", value: string | number) {
    setFormData(prev => ({
      ...prev,
      tiers: prev.tiers.map((tier, i) => 
        i === index ? { ...tier, [field]: value } : tier
      ),
    }));
  }

  function removeTier(index: number) {
    if (formData.tiers.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      tiers: prev.tiers.filter((_, i) => i !== index),
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-500">Loading models...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">TXE Models</h1>
          <p className="text-gray-600">Manage TippingPoint TXE hardware models and throughput tiers</p>
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
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            Add Model
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

      {/* Models List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Current Models ({models.length})</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {models.map((model) => (
            <div key={model.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{model.name}</h3>
                  <div className="mt-1 text-sm text-gray-600">
                    ID: {model.id} | SKU: {model.sku} | Base: {model.baseGbps} Gbps
                  </div>
                  <div className="mt-2">
                    <div className="text-sm font-medium text-gray-700">Throughput Tiers:</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {model.tiers.map((tier, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                        >
                          {tier.label} ({tier.gbps} Gbps)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => editModel(model)}
                    className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteModel(model.id)}
                    className="px-3 py-1 text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {models.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No models found. Add your first model to get started.
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">
                {editingModel ? "Edit Model" : "Add New Model"}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model ID
                  </label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                    placeholder="e.g., txe-5600"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={!!editingModel}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="TPNN####"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., 5600 TXE 10Gbps"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Throughput (Gbps)
                </label>
                <input
                  type="number"
                  value={formData.baseGbps}
                  onChange={(e) => setFormData(prev => ({ ...prev, baseGbps: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Throughput Tiers
                  </label>
                  <button
                    onClick={addTier}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded"
                  >
                    Add Tier
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.tiers.map((tier, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={tier.label}
                        onChange={(e) => updateTier(index, "label", e.target.value)}
                        placeholder="e.g., 1 Gbps"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <input
                        type="number"
                        value={tier.gbps}
                        onChange={(e) => updateTier(index, "gbps", Number(e.target.value))}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-md"
                        step="0.25"
                      />
                      <span className="text-sm text-gray-500">Gbps</span>
                      {formData.tiers.length > 1 && (
                        <button
                          onClick={() => removeTier(index)}
                          className="px-2 py-1 text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
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
                onClick={saveModel}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                {editingModel ? "Update" : "Add"} Model
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

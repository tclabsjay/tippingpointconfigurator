"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SmsModel } from "@/lib/txe";

interface SmsFormData {
  sku: string;
  name: string;
}

export default function SmsPage() {
  const [smsModels, setSmsModels] = useState<SmsModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSms, setEditingSms] = useState<SmsModel | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<SmsFormData>({
    sku: "",
    name: "",
  });

  useEffect(() => {
    loadSmsModels();
  }, []);

  async function loadSmsModels() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/dev/catalog/sms", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load SMS models");
      const data = await response.json();
      setSmsModels(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function saveSms() {
    try {
      setError(null);
      const method = editingSms ? "PUT" : "POST";
      const response = await fetch("/api/dev/catalog/sms", {
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

      await loadSmsModels();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function deleteSms(sku: string) {
    if (!confirm("Are you sure you want to delete this SMS model?")) return;

    try {
      setError(null);
      const response = await fetch(`/api/dev/catalog/sms?sku=${encodeURIComponent(sku)}`, {
        method: "DELETE",
        headers: { "x-updated-by": "dev-admin" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Delete failed");
      }

      await loadSmsModels();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function editSms(sms: SmsModel) {
    setEditingSms(sms);
    setFormData({
      sku: sms.sku,
      name: sms.name,
    });
    setShowForm(true);
  }

  function resetForm() {
    setEditingSms(null);
    setShowForm(false);
    setFormData({
      sku: "",
      name: "",
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-500">Loading SMS models...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SMS Models</h1>
          <p className="text-gray-600">Manage TippingPoint Security Management System models</p>
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
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md"
          >
            Add SMS Model
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

      {/* SMS Models List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">SMS Models ({smsModels.length})</h2>
          <p className="text-sm text-gray-600 mt-1">
            Security Management System models for centralized TippingPoint management
          </p>
        </div>
        <div className="divide-y divide-gray-200">
          {smsModels.map((sms) => (
            <div key={sms.sku} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{sms.name}</h3>
                  <div className="mt-1 text-sm text-gray-600">
                    SKU: {sms.sku}
                  </div>
                  <div className="mt-2">
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                      Management System
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => editSms(sms)}
                    className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteSms(sms.sku)}
                    className="px-3 py-1 text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {smsModels.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No SMS models found. Add your first SMS model to get started.
            </div>
          )}
        </div>
      </div>

      {/* Usage Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="text-blue-800 font-medium">About SMS Models</div>
        <div className="text-blue-700 text-sm mt-1">
          SMS (Security Management System) models are optional management appliances that can be added 
          to TippingPoint configurations. They provide centralized management, reporting, and policy 
          distribution for multiple TippingPoint devices.
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-lg w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">
                {editingSms ? "Edit SMS Model" : "Add New SMS Model"}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="TPNN####"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={!!editingSms}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SMS Model Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., TippingPoint vSMS Enterprise Virtual Appliance + Support 1Yr"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
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
                onClick={saveSms}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md"
              >
                {editingSms ? "Update" : "Add"} SMS Model
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

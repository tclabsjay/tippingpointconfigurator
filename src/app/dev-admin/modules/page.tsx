"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { IoModule, TxeModel } from "@/lib/txe";

interface ModuleFormData {
  sku: string;
  name: string;
  ports: string;
  portSpeed: string;
  price?: number;
}

export default function ModulesPage() {
  const [modules, setModules] = useState<IoModule[]>([]);
  const [models, setModels] = useState<TxeModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingModule, setEditingModule] = useState<IoModule | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<ModuleFormData>({
    sku: "",
    name: "",
    ports: "",
    portSpeed: "",
    price: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      
      const [modulesRes, modelsRes] = await Promise.all([
        fetch("/api/dev/catalog/modules", { cache: "no-store" }),
        fetch("/api/dev/catalog/models", { cache: "no-store" }),
      ]);
      
      if (!modulesRes.ok || !modelsRes.ok) {
        throw new Error("Failed to load data");
      }
      
      const [modulesData, modelsData] = await Promise.all([
        modulesRes.json(),
        modelsRes.json(),
      ]);
      
      setModules(modulesData);
      setModels(modelsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function saveModule() {
    try {
      setError(null);
      const method = editingModule ? "PUT" : "POST";
      const response = await fetch("/api/dev/catalog/modules", {
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

      await loadData();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function deleteModule(sku: string) {
    if (!confirm("Are you sure you want to delete this module?")) return;

    try {
      setError(null);
      const response = await fetch(`/api/dev/catalog/modules?sku=${encodeURIComponent(sku)}`, {
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

  function editModule(module: IoModule) {
    setEditingModule(module);
    setFormData({
      sku: module.sku,
      name: module.name,
      ports: module.ports,
      portSpeed: module.portSpeed,
      price: module.price || 0,
    });
    setShowForm(true);
  }

  function resetForm() {
    setEditingModule(null);
    setShowForm(false);
    setFormData({
      sku: "",
      name: "",
      ports: "",
      portSpeed: "",
      price: 0,
    });
  }

  function getCompatibleModels(moduleSku: string): string[] {
    // Based on current logic in tpc page
    const base5600 = ["TPNN0410","TPNN0411","TPNN0412","TPNN0413","TPNN0414"];
    const base8600 = ["TPNN0374","TPNN0375","TPNN0408","TPNN0409", ...base5600];
    const base9200 = ["TPNN0408","TPNN0409","TPNN0372","TPNN0373"];
    
    const compatible: string[] = [];
    if (base5600.includes(moduleSku)) compatible.push("5600 TXE");
    if (base8600.includes(moduleSku)) compatible.push("8600 TXE");
    if (base9200.includes(moduleSku)) compatible.push("9200 TXE");
    
    return compatible;
  }

  const filteredModules = modules.filter(module =>
    module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.portSpeed.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-500">Loading modules...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">IO Modules</h1>
          <p className="text-gray-600">Manage TippingPoint TXE IO modules and bypass cards</p>
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
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
          >
            Add Module
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

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <input
          type="text"
          placeholder="Search modules by name, SKU, or port speed..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      {/* Modules List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            IO Modules ({filteredModules.length}{searchTerm ? ` of ${modules.length}` : ""})
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredModules.map((module) => (
            <div key={module.sku} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{module.name}</h3>
                  <div className="mt-1 text-sm text-gray-600">
                    SKU: {module.sku}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Ports:</span> {module.ports}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Speed:</span> {module.portSpeed}
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-700">Compatible Models:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {getCompatibleModels(module.sku).map((model) => (
                        <span
                          key={model}
                          className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                        >
                          {model}
                        </span>
                      ))}
                      {getCompatibleModels(module.sku).length === 0 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          No specific compatibility
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => editModule(module)}
                    className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteModule(module.sku)}
                    className="px-3 py-1 text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredModules.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              {searchTerm ? "No modules match your search." : "No modules found. Add your first module to get started."}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-lg w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">
                {editingModule ? "Edit Module" : "Add New Module"}
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
                  disabled={!!editingModule}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Module Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., TippingPoint TXE IO Module 4-Segment 10GbE SR Bypass"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ports
                </label>
                <input
                  type="text"
                  value={formData.ports}
                  onChange={(e) => setFormData(prev => ({ ...prev, ports: e.target.value }))}
                  placeholder="e.g., 8 x multi-mode fiber (LC)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Port Speed
                </label>
                <input
                  type="text"
                  value={formData.portSpeed}
                  onChange={(e) => setFormData(prev => ({ ...prev, portSpeed: e.target.value }))}
                  placeholder="e.g., 1/10 Gbps"
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
                onClick={saveModule}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
              >
                {editingModule ? "Update" : "Add"} Module
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

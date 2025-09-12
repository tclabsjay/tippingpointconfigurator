"use client";

import { useEffect, useMemo, useState } from "react";
import type { IoModule, TxeModel } from "@/lib/txe";
import * as XLSX from 'xlsx';

type SlotSelection = { slot: 1 | 2; moduleSku: string | null };
type LicenseSelection = { inspect: string | ""; dv: string | "" };
type Config = {
  id: string;
  name: string;
  modelId: string | null;
  throughputGbps: number | null;
  slots: SlotSelection[];
  licenses: LicenseSelection;
};

function createEmptyConfig(models: TxeModel[] | null): Config {
  const first = models?.[0] ?? null;
  return {
    id: Math.random().toString(36).slice(2, 10),
    name: "Configuration",
    modelId: first?.id ?? null,
    throughputGbps: first?.tiers?.[0]?.gbps ?? null,
    slots: [
      { slot: 1, moduleSku: null },
      { slot: 2, moduleSku: null },
    ],
    licenses: { inspect: "", dv: "" },
  };
}

export default function TxeConfiguratorPage() {
  const [models, setModels] = useState<TxeModel[]>([]);
  const [modules, setModules] = useState<IoModule[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [smsModels, setSmsModels] = useState<{ sku: string; name: string }[]>([]);
  const [showCopyNotification, setShowCopyNotification] = useState(false);

  const [configs, setConfigs] = useState<Config[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/txe", { cache: "no-store" });
      const data = await res.json();
      setModels(data.models ?? []);
      setModules(data.ioModules ?? []);
      setLicenses(data.licenses ?? []);
      setSmsModels(data.smsModels ?? []);
      setConfigs((prev) => (prev.length ? prev : [createEmptyConfig(data.models ?? [])]));
    })();
  }, []);

  // Copy quote data to clipboard with headers and nice table formatting
  const copyQuoteToClipboard = async (lines: { part: string; description: string; qty: number; configId?: number }[]) => {
    try {
      // Calculate column widths for nice alignment
      const skuWidth = Math.max(3, ...lines.map(l => l.part.length)); // Min 3 for "SKU"
      const descWidth = Math.max(11, ...lines.map(l => l.description.length)); // Min 11 for "Description"
      const qtyWidth = Math.max(8, ...lines.map(l => l.qty.toString().length)); // Min 8 for "Quantity"
      const configWidth = Math.max(9, ...lines.map(l => (l.configId?.toString() || "—").length)); // Min 9 for "Config ID"
      
      // Create formatted table with headers
      const header = `${"SKU".padEnd(skuWidth)} | ${"Description".padEnd(descWidth)} | ${"Quantity".padStart(qtyWidth)} | ${"Config ID".padStart(configWidth)}`;
      const separator = `${"-".repeat(skuWidth)}-+-${"-".repeat(descWidth)}-+-${"-".repeat(qtyWidth)}-+-${"-".repeat(configWidth)}`;
      
      const rows = lines.map(line => 
        `${line.part.padEnd(skuWidth)} | ${line.description.padEnd(descWidth)} | ${line.qty.toString().padStart(qtyWidth)} | ${(line.configId?.toString() || "—").padStart(configWidth)}`
      );
      
      const tableContent = [header, separator, ...rows].join("\n");
      
      await navigator.clipboard.writeText(tableContent);
      
      // Show success notification
      setShowCopyNotification(true);
      setTimeout(() => setShowCopyNotification(false), 2000);
      console.log("Quote data copied to clipboard as formatted table!");
    } catch (err) {
      console.error("Failed to copy quote data:", err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      const skuWidth = Math.max(3, ...lines.map(l => l.part.length));
      const descWidth = Math.max(11, ...lines.map(l => l.description.length));
      const qtyWidth = Math.max(8, ...lines.map(l => l.qty.toString().length));
      const configWidth = Math.max(9, ...lines.map(l => (l.configId?.toString() || "—").length));
      
      const header = `${"SKU".padEnd(skuWidth)} | ${"Description".padEnd(descWidth)} | ${"Quantity".padStart(qtyWidth)} | ${"Config ID".padStart(configWidth)}`;
      const separator = `${"-".repeat(skuWidth)}-+-${"-".repeat(descWidth)}-+-${"-".repeat(qtyWidth)}-+-${"-".repeat(configWidth)}`;
      
      const rows = lines.map(line => 
        `${line.part.padEnd(skuWidth)} | ${line.description.padEnd(descWidth)} | ${line.qty.toString().padStart(qtyWidth)} | ${(line.configId?.toString() || "—").padStart(configWidth)}`
      );
      
      const tableContent = [header, separator, ...rows].join("\n");
      textArea.value = tableContent;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      
      // Show success notification
      setShowCopyNotification(true);
      setTimeout(() => setShowCopyNotification(false), 2000);
    }
  };

  // Export quote data to Excel file
  const exportToExcel = (lines: { part: string; description: string; qty: number; configId?: number }[]) => {
    try {
      // Prepare data for Excel
      const worksheetData = [
        // Header row
        ['SKU', 'Description', 'Quantity', 'Config ID'],
        // Data rows
        ...lines.map(line => [
          line.part,
          line.description,
          line.qty,
          line.configId?.toString() || "—"
        ])
      ];

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths for better formatting
      const colWidths = [
        { wch: Math.max(12, ...lines.map(l => l.part.length)) }, // SKU column
        { wch: Math.max(20, ...lines.map(l => l.description.length)) }, // Description column
        { wch: 10 }, // Quantity column
        { wch: 10 }  // Config ID column
      ];
      worksheet['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Quote for Dynamics');

      // Generate filename with current date
      const today = new Date();
      const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      const filename = `TippingPoint_Quote_${dateString}.xlsx`;

      // Export file
      XLSX.writeFile(workbook, filename);

      console.log(`Quote data exported to Excel file: ${filename}`);
    } catch (err) {
      console.error("Failed to export to Excel:", err);
      alert("Failed to export to Excel. Please try again.");
    }
  };

  const current = configs[selectedIdx] ?? null;
  const currentModel = useMemo(() => models.find((m) => m.id === current?.modelId) ?? null, [models, current]);
  const currentTierOptions = useMemo(() => currentModel?.tiers ?? [], [currentModel]);
  const selectedModules = useMemo(() => (current?.slots ?? []).map((s) => modules.find((m) => m.sku === s.moduleSku) ?? null), [current, modules]);

  function updateCurrent(updater: (c: Config) => Config) {
    setConfigs((prev) => prev.map((c, i) => (i === selectedIdx ? updater(c) : c)));
  }

  function addConfig() {
    setConfigs((prev) => [...prev, createEmptyConfig(models)]);
    setSelectedIdx((prev) => prev + 1);
  }

  function cloneConfig() {
    if (!current) return;
    const clone: Config = { ...current, id: Math.random().toString(36).slice(2, 10), name: current.name + " (copy)" };
    setConfigs((prev) => [...prev, clone]);
    setSelectedIdx((prev) => prev + 1);
  }

  function removeConfig(index: number) {
    setConfigs((prev) => prev.filter((_, i) => i !== index));
    setSelectedIdx((i) => Math.max(0, i - (index <= i ? 1 : 0)));
  }

  // License choices filtered by throughput
  const filteredLicenseOptions = useMemo(() => {
    const gbps = current?.throughputGbps ?? 0;
    const mdl = currentModel?.id;
    return licenses.filter((l) => gbps <= l.appliesToGbpsMax && (!l.modelId || l.modelId === mdl));
  }, [licenses, current, currentModel]);

  const inspectLicenseName = useMemo(() => {
    const sku = current?.licenses.inspect;
    if (!sku) return null;
    return licenses.find((o) => o.sku === sku)?.name ?? null;
  }, [current, licenses]);

  const dvLicenseName = useMemo(() => {
    const sku = current?.licenses.dv;
    if (!sku) return null;
    return licenses.find((o) => o.sku === sku)?.name ?? null;
  }, [current, licenses]);

  const smsName = useMemo(() => {
    const sku = (current as any)?.smsSku as string | undefined;
    if (!sku) return null;
    return smsModels.find((s) => s.sku === sku)?.name ?? null;
  }, [current, smsModels]);

  // Compute lines for each config
  type Line = { part: string; description: string; qty: number; configId?: number };
  function linesForConfig(cfg: Config, configIndex: number): Line[] {
    const lines: Line[] = [];
    const model = models.find((m) => m.id === cfg.modelId);
    if (model) {
      const desc = model.id === "txe-5600"
        ? "TippingPoint 5600TXE HW + Support 1Yr"
        : model.id === "txe-8600"
        ? "TippingPoint 8600TXE HW + Support 1Yr"
        : model.id === "txe-9200"
        ? "TippingPoint 9200TXE HW + Support 1Yr"
        : `${model.name} + HW Support 1Yr`;
      lines.push({ part: model.sku ?? model.id, description: desc, qty: 1, configId: configIndex + 1 });
    }
    // licenses
    if (cfg.licenses.inspect) {
      const i = licenses.find((o) => o.sku === cfg.licenses.inspect);
      if (i) lines.push({ part: i.sku, description: i.name, qty: 1, configId: configIndex + 1 });
    }
    if (cfg.licenses.dv) {
      const d = licenses.find((o) => o.sku === cfg.licenses.dv);
      if (d) lines.push({ part: d.sku, description: d.name, qty: 1, configId: configIndex + 1 });
    }
    // slots
    cfg.slots.forEach((s) => {
      if (!s.moduleSku) return;
      const m = modules.find((x) => x.sku === s.moduleSku);
      if (m) lines.push({ part: m.sku, description: m.name, qty: 1, configId: configIndex + 1 });
    });
    return lines;
  }

  const aggregated = useMemo(() => {
    const lines: Line[] = [];
    configs.forEach((cfg, configIndex) => {
      linesForConfig(cfg, configIndex).forEach((l) => {
        lines.push(l);
      });
      if ((cfg as any).smsSku) {
        const sms = smsModels.find((s) => s.sku === (cfg as any).smsSku);
        if (sms) {
          // SMS doesn't get a Config ID as per requirements
          lines.push({ part: sms.sku, description: sms.name, qty: 1 });
        }
      }
    });
    return lines;
  }, [configs, models, modules, licenses, smsModels]);

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">SE TippingPoint Configurator Tool</h1>

      <div className="grid md:grid-cols-[280px_1fr] gap-4 items-start">
        <aside className="border rounded p-3 border-black/10 dark:border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">Product List</div>
            <div className="flex gap-2">
              <button className="px-2 py-1 border rounded" onClick={addConfig}>Add</button>
              <button className="px-2 py-1 border rounded" onClick={cloneConfig} disabled={!current}>Clone</button>
            </div>
          </div>
          <ul className="text-sm divide-y divide-black/10 dark:divide-white/10">
            {configs.map((c, i) => {
              const mdl = models.find((m) => m.id === c.modelId);
              return (
                <li key={c.id} className={`p-2 cursor-pointer ${i === selectedIdx ? "bg-black/5 dark:bg-white/10" : "hover:bg-black/5 dark:hover:bg-white/10"}`} onClick={() => setSelectedIdx(i)}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate">{c.name} {mdl ? `• ${mdl.name}` : ""}</div>
                    <button className="px-2 py-0.5 border rounded text-xs" onClick={(e) => { e.stopPropagation(); removeConfig(i); }}>Remove</button>
                  </div>
                </li>
              );
            })}
          </ul>
        </aside>

        <main className="space-y-4">
          {current ? (
            <>
              <section className="border rounded p-4 border-black/10 dark:border-white/10">
                <h2 className="text-lg font-medium mb-3">Configuration Properties</h2>
                <div className="grid md:grid-cols-3 gap-3">
                  <label className="text-sm">
                    <div className="mb-1">Name</div>
                    <input className="w-full border rounded px-2 py-1 bg-transparent" value={current.name} onChange={(e) => updateCurrent((c) => ({ ...c, name: e.target.value }))} />
                  </label>
                  <label className="text-sm">
                    <div className="mb-1">Model Type</div>
                    <select
                      className="w-full border rounded px-2 py-1 bg-transparent"
                      value={current.modelId ?? ""}
                      onChange={(e) => {
                        const newModelId = e.target.value || null;
                        const newModel = models.find((m) => m.id === newModelId);
                        const newThroughput = newModel?.tiers?.[0]?.gbps ?? null;
                        
                        // Find matching licenses for the new model and throughput
                        let matchingInspectLicense = "";
                        let matchingThreatDVLicense = "";
                        
                        if (newModelId && newThroughput && newThroughput > 0) {
                          // Find the exact matching Inspection license
                          const inspectLicense = licenses.find((l) => 
                            l.group === "INSPECT" && 
                            l.modelId === newModelId && 
                            l.appliesToGbpsMax === newThroughput
                          );
                          if (inspectLicense) {
                            matchingInspectLicense = inspectLicense.sku;
                          }
                          
                          // Find the exact matching ThreatDV license
                          const threatDVLicense = licenses.find((l) => 
                            l.group === "THREATDV" && 
                            l.modelId === newModelId && 
                            l.appliesToGbpsMax === newThroughput
                          );
                          if (threatDVLicense) {
                            matchingThreatDVLicense = threatDVLicense.sku;
                          }
                        }
                        
                        updateCurrent((c) => ({ 
                          ...c, 
                          modelId: newModelId, 
                          throughputGbps: newThroughput,
                          licenses: {
                            inspect: matchingInspectLicense,
                            dv: matchingThreatDVLicense
                          }
                        }));
                      }}
                    >
                      {models.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm">
                    <div className="mb-1">Throughput</div>
                    <select
                      className="w-full border rounded px-2 py-1 bg-transparent"
                      value={current.throughputGbps ?? ""}
                      onChange={(e) => {
                        const newThroughput = Number(e.target.value);
                        const mdl = currentModel?.id;
                        
                        // Find matching licenses for the new throughput
                        let matchingInspectLicense = "";
                        let matchingThreatDVLicense = "";
                        
                        if (mdl && newThroughput > 0) {
                          // Find the exact matching Inspection license
                          const inspectLicense = licenses.find((l) => 
                            l.group === "INSPECT" && 
                            l.modelId === mdl && 
                            l.appliesToGbpsMax === newThroughput
                          );
                          if (inspectLicense) {
                            matchingInspectLicense = inspectLicense.sku;
                          }
                          
                          // Find the exact matching ThreatDV license
                          const threatDVLicense = licenses.find((l) => 
                            l.group === "THREATDV" && 
                            l.modelId === mdl && 
                            l.appliesToGbpsMax === newThroughput
                          );
                          if (threatDVLicense) {
                            matchingThreatDVLicense = threatDVLicense.sku;
                          }
                        }
                        
                        updateCurrent((c) => ({ 
                          ...c, 
                          throughputGbps: newThroughput,
                          licenses: {
                            inspect: matchingInspectLicense,
                            dv: matchingThreatDVLicense
                          }
                        }));
                      }}
                    >
                      {currentTierOptions.map((t) => (
                        <option key={t.gbps} value={t.gbps}>{t.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>

              <section className="border rounded p-4 border-black/10 dark:border-white/10">
                <h2 className="text-lg font-medium mb-3">Management (SMS)</h2>
                <div className="flex items-center gap-3 text-sm">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean((current as any).smsSku)}
                      onChange={(e) => updateCurrent((c) => ({ ...c, ...(e.target.checked ? { smsSku: smsModels[0]?.sku ?? "" } : { smsSku: "" }) }))}
                    />
                    <span>Does the customer need an SMS? (If so this is not required)</span>
                  </label>
                  {Boolean((current as any).smsSku) ? (
                    <select
                      className="border rounded px-2 py-1 bg-transparent"
                      value={(current as any).smsSku || ""}
                      onChange={(e) => updateCurrent((c) => ({ ...c, smsSku: e.target.value }))}
                    >
                      {smsModels.map((s) => (
                        <option key={s.sku} value={s.sku}>{s.name} [{s.sku}]</option>
                      ))}
                    </select>
                  ) : null}
                </div>
                <div className="mt-3 text-sm italic text-gray-600 dark:text-gray-400">
                  SMS is required to connect to Vision One{" "}
                  <a 
                    href="https://docs.trendmicro.com/en-us/documentation/article/trend-vision-one-tippingpoint-sms-connection-guides"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 underline"
                  >
                    Vision One
                  </a>
                  .
                </div>
              </section>

              <section className="border rounded p-4 border-black/10 dark:border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-medium">Slots</h2>
                  <div className="relative group">
                    <div className="w-5 h-5 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs font-bold cursor-help hover:bg-gray-700 transition-colors">
                      ?
                    </div>
                    <div className="absolute right-0 top-6 w-80 max-h-[calc(100vh-8rem)] p-4 bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 overflow-y-auto">
                      <div className="font-semibold text-white mb-2">SR vs. LR: What's the Difference?</div>
                      <div className="mb-3">
                        When choosing SFP or SFP+ modules for your network, you'll often see <strong>SR (Short Range)</strong> and <strong>LR (Long Range)</strong>. Here's the simple breakdown:
                      </div>
                      <div className="mb-2">
                        <div className="font-semibold text-white">SR – Short Range</div>
                        <div>Perfect for short connections, like within the same room or data center. It's cost-effective and designed for setups where devices are close together.</div>
                      </div>
                      <div className="mb-2">
                        <div className="font-semibold text-white">LR – Long Range</div>
                        <div>Built for distance. LR modules are used when you need to connect across buildings, campuses, or longer stretches. They keep signals strong and reliable over much greater distances.</div>
                      </div>
                      <div className="mt-3 pt-2 border-t border-gray-600 text-xs italic">
                        <strong>Quick Tip:</strong> Use SR for short, affordable connections inside your network. Use LR when you need to go the distance.
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {[1,2].map((slot) => (
                    <label key={slot} className="text-sm">
                      <div className="mb-1">Slot {slot}</div>
                      <select
                        className="w-full border rounded px-2 py-1 bg-transparent"
                        value={current.slots.find((s) => s.slot === slot)?.moduleSku ?? ""}
                        onChange={(e) => updateCurrent((c) => ({ ...c, slots: c.slots.map((s) => s.slot === slot ? { ...s, moduleSku: e.target.value || null } : s) }))}
                      >
                        <option value="">None</option>
                        <optgroup label="Bypass">
                          {(() => {
                            // Allowed SKUs depend on model
                            const base5600 = ["TPNN0410","TPNN0411","TPNN0412","TPNN0413","TPNN0414"];
                            const base8600 = [
                              "TPNN0374","TPNN0375","TPNN0408","TPNN0409",
                              ...base5600,
                            ];
                            const base9200 = ["TPNN0408","TPNN0409","TPNN0372","TPNN0373"];
                            const allowed = currentModel?.id === "txe-8600" ? base8600 : currentModel?.id === "txe-9200" ? base9200 : base5600;
                            return modules.filter((m) => allowed.includes(m.sku));
                          })().map((m) => (
                            <option key={m.sku} value={m.sku}>{m.name} [{m.sku}]</option>
                          ))}
                        </optgroup>
                        <optgroup label="Non-Bypass">
                          {(() => {
                            // Non-Bypass modules available for all models
                            const nonBypassSkus = ["TPNN0370","TPNN0371"];
                            return modules.filter((m) => nonBypassSkus.includes(m.sku));
                          })().map((m) => (
                            <option key={m.sku} value={m.sku}>{m.name} [{m.sku}]</option>
                          ))}
                        </optgroup>
                      </select>
                    </label>
                  ))}
                </div>
                <div className="mt-3 text-sm italic text-gray-600 dark:text-gray-400">
                  Slots are modular expansion points that let customers add the right mix of network interfaces — copper, fiber, 1G, or 10G etc. as their environment grows.
                </div>
              </section>

              <section className="border rounded p-4 border-black/10 dark:border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-medium">Licenses</h2>
                  <div className="relative group">
                    <div className="w-5 h-5 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs font-bold cursor-help hover:bg-gray-700 transition-colors">
                      ?
                    </div>
                    <div className="absolute right-0 top-6 w-96 max-h-[calc(100vh-8rem)] p-4 bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 overflow-y-auto">
                      
                      {/* TPS Inspection Licenses Section */}
                      <div className="mb-4">
                        <div className="font-semibold text-white mb-2">TPS Inspection Licenses (TXE Models)</div>
                        <div className="mb-3">
                          TPS Inspection Licenses for TXE Models are high-performance throughput capacity licenses that determine the maximum inspection speed for the TXE series devices. Key points for TXE models:
                        </div>
                        <div className="mb-2">
                          <div className="font-semibold text-white">TXE Series Capabilities:</div>
                        </div>
                        <div className="mb-2 ml-4">
                          <div className="mb-1"><strong>5600TXE:</strong> Licensed inspection throughput options of 250 Mbps, 500 Mbps, 1 Gbps, 2 Gbps, 3 Gbps, 5 Gbps, or 10 Gbps</div>
                          <div className="mb-1"><strong>8600TXE:</strong> Licensed inspection throughput options of 5 Gbps, 10 Gbps, or 40 Gbps</div>
                          <div className="mb-1"><strong>9200TXE:</strong> Licensed inspection throughput options of 60 Gbps, 80 Gbps, or 100 Gbps</div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-600 mb-4"></div>

                      {/* TPS ThreatDV Section */}
                      <div>
                        <div className="font-semibold text-white mb-2">TPS ThreatDV Subscription Service</div>
                        <div className="mb-3">
                          ThreatDV is a premium subscription service that provides advanced threat intelligence in two main components:
                        </div>
                        <div className="mb-2">
                          <div className="font-semibold text-white">1. Reputation Feed:</div>
                          <ul className="ml-4 mt-1 space-y-1">
                            <li>• Delivers suspect IPv4, IPv6, and DNS security intelligence from a global reputation database</li>
                            <li>• Updates multiple times daily (average every 2 hours)</li>
                            <li>• Includes geographic and reputation tags for policy creation</li>
                          </ul>
                        </div>
                        <div className="mb-2">
                          <div className="font-semibold text-white">2. Malware Filter Package:</div>
                          <ul className="ml-4 mt-1 space-y-1">
                            <li>• Advanced collection of threat protection filters using different technology than regular Digital Vaccine filters</li>
                            <li>• Detects post-infection traffic like bot activity, phone-home, command-and-control, and data exfiltration</li>
                            <li>• Refreshed independently of regular Digital Vaccines</li>
                            <li>• Includes DGA (Domain Generation Algorithm) Defense filters for detecting algorithmically generated DNS requests</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <label className="text-sm">
                    <div className="mb-1">TPS Inspection Licenses</div>
                    <select className="w-full border rounded px-2 py-1 bg-transparent" value={current.licenses.inspect} onChange={(e) => updateCurrent((c) => ({ ...c, licenses: { ...c.licenses, inspect: e.target.value } }))}>
                      <option value="">None</option>
                      {(() => {
                        const gbps = current?.throughputGbps ?? 0;
                        const mdl = currentModel?.id;
                        // For 5600 TXE, restrict to the exact allowed SKUs in the requested order
                        if (mdl === "txe-5600") {
                          const order = ["TPNM0129","TPNN0272","TPNN0273","TPNN0274","TPNN0275","TPNN0276","TPNN0277"] as const;
                          const base = licenses.filter((l) => l.group === "INSPECT" && l.modelId === mdl && gbps <= l.appliesToGbpsMax);
                          return order
                            .map((sku) => base.find((l) => l.sku === sku))
                            .filter((x): x is typeof base[number] => Boolean(x));
                        }
                        // 8600 TXE specific Inspection SKUs only
                        if (mdl === "txe-8600") {
                          const order = ["TPNN0276","TPNN0277","TPNN0278","TPNN0279","TPNN0296","TPNN0280"] as const;
                          const base = licenses.filter((l) => l.group === "INSPECT" && l.modelId === mdl);
                          return order
                            .map((sku) => base.find((l) => l.sku === sku))
                            .filter((x): x is typeof base[number] => Boolean(x));
                        }
                        // 9200 TXE specific Inspection SKUs only
                        if (mdl === "txe-9200") {
                          const order = ["TPNN0280","TPNN0397","TPNN0398","TPNN0399"] as const;
                          const base = licenses.filter((l) => l.group === "INSPECT" && l.modelId === mdl);
                          return order
                            .map((sku) => base.find((l) => l.sku === sku))
                            .filter((x): x is typeof base[number] => Boolean(x));
                        }
                        // Other models: use model-specific if present; otherwise fall back to generic INSPECT options
                        const base = licenses.filter((l) => gbps <= l.appliesToGbpsMax);
                        const specific = base.filter((l) => l.group === "INSPECT" && l.modelId === mdl);
                        const list = specific.length ? specific : base.filter((l) => l.group === "INSPECT" && !l.modelId);
                        return list;
                      })().map((o) => (
                        <option key={o.sku} value={o.sku}>{o.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm">
                    <div className="mb-1">TPS ThreatDV Subscription Service 1 Year</div>
                    <select className="w-full border rounded px-2 py-1 bg-transparent" value={current.licenses.dv} onChange={(e) => updateCurrent((c) => ({ ...c, licenses: { ...c.licenses, dv: e.target.value } }))}>
                      <option value="">None</option>
                      {(() => {
                        const gbps = current?.throughputGbps ?? 0;
                        const mdl = currentModel?.id;
                        
                        // Get the selected Inspection license to match its bandwidth
                        const selectedInspectionLicense = current.licenses.inspect ? 
                          licenses.find(l => l.sku === current.licenses.inspect) : null;
                        const inspectionBandwidth = selectedInspectionLicense?.appliesToGbpsMax;
                        
                        if (mdl === "txe-5600") {
                          const order = ["TPNN0281","TPNN0282","TPNN0283","TPNN0284","TPNN0285","TPNN0286","TPNN0287"] as const;
                          const base = licenses.filter((l) => l.group === "THREATDV" && l.modelId === mdl);
                          let availableOptions = order
                            .map((sku) => base.find((l) => l.sku === sku))
                            .filter((x): x is typeof base[number] => Boolean(x));
                          
                          // Filter by matching bandwidth if an Inspection license is selected
                          if (inspectionBandwidth !== undefined) {
                            availableOptions = availableOptions.filter(l => l.appliesToGbpsMax === inspectionBandwidth);
                          }
                          return availableOptions;
                        }
                        if (mdl === "txe-8600") {
                          const order = ["TPNN0286","TPNN0287","TPNN0288","TPNN0289","TPNN0297","TPNN0290"] as const;
                          const base = licenses.filter((l) => l.group === "THREATDV" && l.modelId === mdl);
                          let availableOptions = order
                            .map((sku) => base.find((l) => l.sku === sku))
                            .filter((x): x is typeof base[number] => Boolean(x));
                          
                          // Filter by matching bandwidth if an Inspection license is selected
                          if (inspectionBandwidth !== undefined) {
                            availableOptions = availableOptions.filter(l => l.appliesToGbpsMax === inspectionBandwidth);
                          }
                          return availableOptions;
                        }
                        if (mdl === "txe-9200") {
                          const order = ["TPNN0290","TPNN0400","TPNN0401","TPNN0402"] as const;
                          const base = licenses.filter((l) => l.group === "THREATDV" && l.modelId === mdl);
                          let availableOptions = order
                            .map((sku) => base.find((l) => l.sku === sku))
                            .filter((x): x is typeof base[number] => Boolean(x));
                          
                          // Filter by matching bandwidth if an Inspection license is selected
                          if (inspectionBandwidth !== undefined) {
                            availableOptions = availableOptions.filter(l => l.appliesToGbpsMax === inspectionBandwidth);
                          }
                          return availableOptions;
                        }
                        
                        let threatDvOptions = filteredLicenseOptions.filter((o) => o.group === "THREATDV");
                        // Filter by matching bandwidth if an Inspection license is selected
                        if (inspectionBandwidth !== undefined) {
                          threatDvOptions = threatDvOptions.filter(l => l.appliesToGbpsMax === inspectionBandwidth);
                        }
                        return threatDvOptions;
                      })().map((o) => (
                        <option key={o.sku} value={o.sku}>{o.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>

              <section className="border rounded p-4 border-black/10 dark:border-white/10">
                <Summary
                  model={currentModel}
                  gbps={current?.throughputGbps ?? null}
                  selectedModules={selectedModules}
                  licenses={{ inspect: inspectLicenseName, dv: dvLicenseName }}
                  smsName={smsName}
                />
              </section>
            </>
          ) : null}
        </main>
      </div>

      <section className="border rounded p-4 border-black/10 dark:border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">Quote for Dynamics</h2>
          <div className="flex items-center gap-2">
            {/* Copy Button with notification */}
            <div className="relative">
              <button
                onClick={() => copyQuoteToClipboard(aggregated)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white rounded-lg transition-colors"
                title="Copy quote data to clipboard"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
              
              {/* Copy notification */}
              {showCopyNotification && (
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-3 py-1 rounded-md text-sm font-medium shadow-lg animate-fade-in whitespace-nowrap">
                  Copied!
                </div>
              )}
            </div>

            {/* Export to Excel Button */}
            <button
              onClick={() => exportToExcel(aggregated)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              title="Export quote data to Excel file"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              Export to Excel
            </button>
          </div>
        </div>
        <QuoteTable lines={aggregated} />
      </section>
    </div>
  );
}

function Summary({ model, gbps, selectedModules, licenses, smsName }: { model: TxeModel | null; gbps: number | null; selectedModules: (IoModule | null)[]; licenses: { inspect: string | null; dv: string | null }; smsName: string | null }) {
  return (
    <div className="text-sm">
      <h2 className="text-lg font-medium mb-2">Summary</h2>
      <div className="space-y-1">
        <div>Model: <span className="font-medium">{model?.name ?? "—"}</span></div>
        <div>Throughput: <span className="font-medium">{gbps ? `${gbps} Gbps` : "—"}</span></div>
        <div>Slot 1: <span className="font-medium">{selectedModules[0]?.name ?? "None"}</span></div>
        <div>Slot 2: <span className="font-medium">{selectedModules[1]?.name ?? "None"}</span></div>
        <div>TPS Inspection: <span className="font-medium">{licenses.inspect ?? "None"}</span></div>
        <div>TPS ThreatDV: <span className="font-medium">{licenses.dv ?? "None"}</span></div>
        {smsName ? (
          <div>SMS: <span className="font-medium">{smsName}</span></div>
        ) : null}
      </div>
    </div>
  );
}

function fmtUSD(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
}

function QuoteTable({ lines }: { lines: { part: string; description: string; qty: number; configId?: number }[] }) {
  return (
    <div>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left border-b border-black/10 dark:border-white/10">
            <th className="py-2">SKU</th>
            <th className="py-2">Description</th>
            <th className="py-2 text-right">Quantity</th>
            <th className="py-2 text-right">Config ID</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i} className="border-b border-black/5 dark:border-white/5">
              <td className="py-2 pr-2 whitespace-nowrap">{l.part}</td>
              <td className="py-2 pr-2">{l.description}</td>
              <td className="py-2 pr-2 text-right whitespace-nowrap">{l.qty}</td>
              <td className="py-2 pr-2 text-right whitespace-nowrap">{l.configId || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}



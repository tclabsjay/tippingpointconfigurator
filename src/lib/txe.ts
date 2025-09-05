import { z } from "zod";

// Data model for TippingPoint TXE series

export const throughputTierSchema = z.object({
  label: z.string(),
  gbps: z.number(),
});
export type ThroughputTier = z.infer<typeof throughputTierSchema>;

export const txeModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  family: z.literal("ds-tippingpoint-txe-series"),
  baseGbps: z.number(),
  tiers: z.array(throughputTierSchema),
  slots: z.literal(2),
  sku: z.string().optional(),
  price: z.number().nonnegative().optional(),
});
export type TxeModel = z.infer<typeof txeModelSchema>;

export const ioModuleSchema = z.object({
  sku: z.string(),
  name: z.string(),
  ports: z.string(),
  portSpeed: z.string(),
  category: z.literal("Network IO Module"),
  price: z.number().nonnegative().optional(),
});
export type IoModule = z.infer<typeof ioModuleSchema>;

export const licenseSchema = z.object({
  sku: z.string(),
  name: z.string(),
  category: z.literal("License"),
  appliesToGbpsMax: z.number(),
  price: z.number().nonnegative().optional(),
  group: z.enum(["INSPECT", "THREATDV"]).optional(),
  modelId: z.string().optional(),
});
export type License = z.infer<typeof licenseSchema>;

// Optional SMS models (management) that can be added alongside TPS systems
export const smsModelSchema = z.object({
  sku: z.string(),
  name: z.string(),
});
export type SmsModel = z.infer<typeof smsModelSchema>;

export type TxeData = {
  models: TxeModel[];
  ioModules: IoModule[];
  licenses: License[];
  smsModels?: SmsModel[];
};

export const TXE_DATA: TxeData = {
  models: [
    {
      id: "txe-5600",
      name: "5600 TXE 10Gbps",
      family: "ds-tippingpoint-txe-series",
      baseGbps: 10,
      sku: "TPNN0424",
      price: 0,
      tiers: [
        { label: "250 Mbps", gbps: 0.25 },
        { label: "500 Mbps", gbps: 0.5 },
        { label: "1 Gbps", gbps: 1 },
        { label: "2 Gbps", gbps: 2 },
        { label: "3 Gbps", gbps: 3 },
        { label: "5 Gbps", gbps: 5 },
        { label: "10 Gbps", gbps: 10 },
      ],
      slots: 2,
    },
    {
      id: "txe-8600",
      name: "8600 TXE 40Gbps",
      family: "ds-tippingpoint-txe-series",
      baseGbps: 40,
      sku: "TPNN0425",
      price: 0,
      tiers: [
        { label: "5 Gbps", gbps: 5 },
        { label: "10 Gbps", gbps: 10 },
        { label: "15 Gbps", gbps: 15 },
        { label: "20 Gbps", gbps: 20 },
        { label: "30 Gbps", gbps: 30 },
        { label: "40 Gbps", gbps: 40 },
      ],
      slots: 2,
    },
    {
      id: "txe-9200",
      name: "9200 TXE 100Gbps",
      family: "ds-tippingpoint-txe-series",
      baseGbps: 100,
      sku: "TPNN0368",
      price: 0,
      tiers: [
        { label: "40 Gbps", gbps: 40 },
        { label: "60 Gbps", gbps: 60 },
        { label: "80 Gbps", gbps: 80 },
        { label: "100 Gbps", gbps: 100 },
      ],
      slots: 2,
    },
  ],
  ioModules: [
    // Based on provided table and screenshot (names and SKUs indicative)
    { sku: "TPNN0410", name: "TippingPoint TXE IO Module 4-Segment 10GbE SR Bypass", ports: "8 x multi-mode fiber (LC)", portSpeed: "1/10 Gbps", category: "Network IO Module", price: 0 },
    { sku: "TPNN0411", name: "TippingPoint TXE IO Module 4-Segment 10GbE LR Bypass", ports: "8 x single-mode fiber (LC)", portSpeed: "1/10 Gbps", category: "Network IO Module", price: 0 },
    { sku: "TPNN0412", name: "TippingPoint TXE IO Module 4-Segment 1GbE SR Bypass", ports: "8 x multi-mode fiber (LC)", portSpeed: "1 Gbps", category: "Network IO Module", price: 0 },
    { sku: "TPNN0413", name: "TippingPoint TXE IO Module 4-Segment 1GbE LR Bypass", ports: "8 x single-mode fiber (LC)", portSpeed: "1 Gbps", category: "Network IO Module", price: 0 },
    { sku: "TPNN0414", name: "TippingPoint TXE IO Module 6-Segment Gig-T Bypass", ports: "12 x copper RJ45", portSpeed: "1 Gbps", category: "Network IO Module", price: 0 },
    { sku: "TPNN0374", name: "TippingPoint TXE IO Module 4-Segment 25GbE SR Bypass", ports: "8 x multi-mode fiber (LC)", portSpeed: "25 Gbps", category: "Network IO Module", price: 0 },
    { sku: "TPNN0375", name: "TippingPoint TXE IO Module 4-Segment 25GbE LR Bypass", ports: "8 x single-mode fiber (LC)", portSpeed: "25 Gbps", category: "Network IO Module", price: 0 },
    { sku: "TPNN0408", name: "TippingPoint TXE IO Module 2-Segment 40GbE SR4 Bypass", ports: "4 x multi-mode fiber (MPO)", portSpeed: "40 Gbps", category: "Network IO Module", price: 0 },
    { sku: "TPNN0409", name: "TippingPoint TXE IO Module 2-Segment 40GbE LR4 Bypass", ports: "4 x single-mode fiber (LC)", portSpeed: "40 Gbps", category: "Network IO Module", price: 0 },
    { sku: "TPNN0372", name: "TippingPoint TXE IO Module 2-Segment 100GbE SR4 Bypass", ports: "4 x multi-mode fiber (MPO)", portSpeed: "100 Gbps", category: "Network IO Module", price: 0 },
    { sku: "TPNN0373", name: "TippingPoint TXE IO Module 2-Segment 100GbE LR4 Bypass", ports: "4 x single-mode fiber (LC)", portSpeed: "100 Gbps", category: "Network IO Module", price: 0 },
    // Non-bypass models at top of the table
    { sku: "TPNN0370", name: "6-segment 25 GbE SFP28", ports: "12 x SFP28/SFP+/SFP", portSpeed: "1/10/25 Gbps", category: "Network IO Module", price: 0 },
    { sku: "TPNN0371", name: "4-segment 100 GbE QSFP28", ports: "8 x QSFP28/QSFP+", portSpeed: "40/100 Gbps", category: "Network IO Module", price: 0 },
  ],
  licenses: [
    // Generic groups
    { sku: "LIC-TPS-INSPECT-1Y-1G", name: "TPS Inspection License + Support + DV 1 Year (≤1Gbps)", category: "License", appliesToGbpsMax: 1, price: 0, group: "INSPECT" },
    { sku: "LIC-TPS-INSPECT-1Y-10G", name: "TPS Inspection License + Support + DV 1 Year (≤10Gbps)", category: "License", appliesToGbpsMax: 10, price: 0, group: "INSPECT" },
    { sku: "LIC-TPS-INSPECT-1Y-40G", name: "TPS Inspection License + Support + DV 1 Year (≤40Gbps)", category: "License", appliesToGbpsMax: 40, price: 0, group: "INSPECT" },
    { sku: "LIC-TPS-INSPECT-1Y-100G", name: "TPS Inspection License + Support + DV 1 Year (≤100Gbps)", category: "License", appliesToGbpsMax: 100, price: 0, group: "INSPECT" },

    { sku: "LIC-TPS-THREATDV-1Y-1G", name: "TPS ThreatDV Subscription Service 1 Year (≤1Gbps)", category: "License", appliesToGbpsMax: 1, price: 0, group: "THREATDV" },
    { sku: "LIC-TPS-THREATDV-1Y-10G", name: "TPS ThreatDV Subscription Service 1 Year (≤10Gbps)", category: "License", appliesToGbpsMax: 10, price: 0, group: "THREATDV" },
    { sku: "LIC-TPS-THREATDV-1Y-40G", name: "TPS ThreatDV Subscription Service 1 Year (≤40Gbps)", category: "License", appliesToGbpsMax: 40, price: 0, group: "THREATDV" },
    { sku: "LIC-TPS-THREATDV-1Y-100G", name: "TPS ThreatDV Subscription Service 1 Year (≤100Gbps)", category: "License", appliesToGbpsMax: 100, price: 0, group: "THREATDV" },

    // Model-specific inspection licenses for 5600 TXE
    { sku: "TPNM0129", name: "TippingPoint 250Mbps TPS Inspection License + Support + DV 1Yr", category: "License", appliesToGbpsMax: 0.25, price: 0, group: "INSPECT", modelId: "txe-5600" },
    { sku: "TPNN0272", name: "TippingPoint 500Mbps TPS Inspection License + Support + DV 1Yr", category: "License", appliesToGbpsMax: 0.5, price: 0, group: "INSPECT", modelId: "txe-5600" },
    { sku: "TPNN0273", name: "TippingPoint 1Gbps TPS Inspection License + Support + DV 1Yr", category: "License", appliesToGbpsMax: 1, price: 0, group: "INSPECT", modelId: "txe-5600" },
    { sku: "TPNN0274", name: "TippingPoint 2Gbps TPS Inspection License + Support + DV 1Yr", category: "License", appliesToGbpsMax: 2, price: 0, group: "INSPECT", modelId: "txe-5600" },
    { sku: "TPNN0275", name: "TippingPoint 3Gbps TPS Inspection License + Support + DV 1Yr", category: "License", appliesToGbpsMax: 3, price: 0, group: "INSPECT", modelId: "txe-5600" },
    { sku: "TPNN0276", name: "TippingPoint 5Gbps TPS Inspection License + Support + DV 1Yr", category: "License", appliesToGbpsMax: 5, price: 0, group: "INSPECT", modelId: "txe-5600" },
    { sku: "TPNN0277", name: "TippingPoint 10Gbps TPS Inspection License + Support + DV 1Yr", category: "License", appliesToGbpsMax: 10, price: 0, group: "INSPECT", modelId: "txe-5600" },

    // Model-specific inspection licenses for 8600 TXE
    { sku: "TPNN0276", name: "TippingPoint 5Gbps TPS Inspection License + Support + DV 1Yr", category: "License", appliesToGbpsMax: 5, price: 0, group: "INSPECT", modelId: "txe-8600" },
    { sku: "TPNN0277", name: "TippingPoint 10Gbps TPS Inspection License + Support + DV 1Yr", category: "License", appliesToGbpsMax: 10, price: 0, group: "INSPECT", modelId: "txe-8600" },
    { sku: "TPNN0278", name: "TippingPoint 15Gbps TPS Inspection License + Support + DV 1Yr", category: "License", appliesToGbpsMax: 15, price: 0, group: "INSPECT", modelId: "txe-8600" },
    { sku: "TPNN0279", name: "TippingPoint 20Gbps TPS Inspection License + Support + DV 1Yr", category: "License", appliesToGbpsMax: 20, price: 0, group: "INSPECT", modelId: "txe-8600" },
    { sku: "TPNN0296", name: "TippingPoint 30Gbps TPS Inspection License + Support + DV 1Yr", category: "License", appliesToGbpsMax: 30, price: 0, group: "INSPECT", modelId: "txe-8600" },
    { sku: "TPNN0280", name: "TippingPoint 40Gbps TPS Inspection License + Support + DV 1Yr", category: "License", appliesToGbpsMax: 40, price: 0, group: "INSPECT", modelId: "txe-8600" },

    // Model-specific inspection licenses for 9200 TXE
    { sku: "TPNN0280", name: "TippingPoint 40Gbps TPS Inspection License + Support + DV 1Yr", category: "License", appliesToGbpsMax: 40, price: 0, group: "INSPECT", modelId: "txe-9200" },
    { sku: "TPNN0397", name: "TippingPoint 60Gbps TPS Inspection License + Support + DV 1Yr", category: "License", appliesToGbpsMax: 60, price: 0, group: "INSPECT", modelId: "txe-9200" },
    { sku: "TPNN0398", name: "TippingPoint 80Gbps TPS Inspection License + Support + DV 1Yr", category: "License", appliesToGbpsMax: 80, price: 0, group: "INSPECT", modelId: "txe-9200" },
    { sku: "TPNN0399", name: "TippingPoint 100Gbps TPS Inspection License + Support + DV 1Yr", category: "License", appliesToGbpsMax: 100, price: 0, group: "INSPECT", modelId: "txe-9200" },

    // Model-specific ThreatDV licenses for 5600 TXE
    { sku: "TPNN0281", name: "TippingPoint 250Mbps TPS ThreatDV Subscription Service 1Yr", category: "License", appliesToGbpsMax: 0.25, price: 0, group: "THREATDV", modelId: "txe-5600" },
    { sku: "TPNN0282", name: "TippingPoint 500Mbps TPS ThreatDV Subscription Service 1Yr", category: "License", appliesToGbpsMax: 0.5, price: 0, group: "THREATDV", modelId: "txe-5600" },
    { sku: "TPNN0283", name: "TippingPoint 1Gbps TPS ThreatDV Subscription Service 1Yr", category: "License", appliesToGbpsMax: 1, price: 0, group: "THREATDV", modelId: "txe-5600" },
    { sku: "TPNN0284", name: "TippingPoint 2Gbps TPS ThreatDV Subscription Service 1Yr", category: "License", appliesToGbpsMax: 2, price: 0, group: "THREATDV", modelId: "txe-5600" },
    { sku: "TPNN0285", name: "TippingPoint 3Gbps TPS ThreatDV Subscription Service 1Yr", category: "License", appliesToGbpsMax: 3, price: 0, group: "THREATDV", modelId: "txe-5600" },
    { sku: "TPNN0286", name: "TippingPoint 5Gbps TPS ThreatDV Subscription Service 1Yr", category: "License", appliesToGbpsMax: 5, price: 0, group: "THREATDV", modelId: "txe-5600" },
    { sku: "TPNN0287", name: "TippingPoint 10Gbps TPS ThreatDV Subscription Service 1Yr", category: "License", appliesToGbpsMax: 10, price: 0, group: "THREATDV", modelId: "txe-5600" },
    
    // Model-specific ThreatDV licenses for 8600 TXE
    { sku: "TPNN0286", name: "TippingPoint 5Gbps TPS ThreatDV Subscription Service 1Yr", category: "License", appliesToGbpsMax: 5, price: 0, group: "THREATDV", modelId: "txe-8600" },
    { sku: "TPNN0287", name: "TippingPoint 10Gbps TPS ThreatDV Subscription Service 1Yr", category: "License", appliesToGbpsMax: 10, price: 0, group: "THREATDV", modelId: "txe-8600" },
    { sku: "TPNN0288", name: "TippingPoint 15Gbps TPS ThreatDV Subscription Service 1Yr", category: "License", appliesToGbpsMax: 15, price: 0, group: "THREATDV", modelId: "txe-8600" },
    { sku: "TPNN0289", name: "TippingPoint 20Gbps TPS ThreatDV Subscription Service 1Yr", category: "License", appliesToGbpsMax: 20, price: 0, group: "THREATDV", modelId: "txe-8600" },
    { sku: "TPNN0297", name: "TippingPoint 30Gbps TPS ThreatDV Subscription Service 1Yr", category: "License", appliesToGbpsMax: 30, price: 0, group: "THREATDV", modelId: "txe-8600" },
    { sku: "TPNN0290", name: "TippingPoint 40Gbps TPS ThreatDV Subscription Service 1Yr", category: "License", appliesToGbpsMax: 40, price: 0, group: "THREATDV", modelId: "txe-8600" },

    // Model-specific ThreatDV licenses for 9200 TXE
    { sku: "TPNN0290", name: "TippingPoint 40Gbps TPS ThreatDV Subscription Service 1Yr", category: "License", appliesToGbpsMax: 40, price: 0, group: "THREATDV", modelId: "txe-9200" },
    { sku: "TPNN0400", name: "TippingPoint 60Gbps TPS ThreatDV Subscription Service 1Yr", category: "License", appliesToGbpsMax: 60, price: 0, group: "THREATDV", modelId: "txe-9200" },
    { sku: "TPNN0401", name: "TippingPoint 80Gbps TPS ThreatDV Subscription Service 1Yr", category: "License", appliesToGbpsMax: 80, price: 0, group: "THREATDV", modelId: "txe-9200" },
    { sku: "TPNN0402", name: "TippingPoint 100Gbps TPS ThreatDV Subscription Service 1Yr", category: "License", appliesToGbpsMax: 100, price: 0, group: "THREATDV", modelId: "txe-9200" },
  ],
  smsModels: [
    { sku: "TPNN0304", name: "TippingPoint vSMS Enterprise Virtual Appliance + Support 1Yr" },
    { sku: "TPNN0431", name: "TippingPoint SMS H5 HW (Dell) + Support 1Yr" },
    { sku: "TPNN0432", name: "TippingPoint SMS H5 XL HW (Dell) + Support 1Yr" },
  ],
};

export function licensesForThroughput(gbps: number) {
  return TXE_DATA.licenses.filter((l) => gbps <= l.appliesToGbpsMax);
}



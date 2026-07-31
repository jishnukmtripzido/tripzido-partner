import type { Vehicle, BlockEntry } from "@/types/fleet.types";
import type { DashboardStats } from "@/types/dashboard.types";

// All values below mirror the numbers baked into the original HTML
// mockups so the converted screens look identical out of the box.
// NOTE: Fleet, Block Bikes, Ledger, and Dashboard have all since been
// wired to real backend data — these exports are likely unused dead
// code at this point. Kept temporarily rather than deleted outright;
// safe to remove this whole file once confirmed nothing still imports
// from it.

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  currentBalance: 891.79,
  revenueThisMonth: 30617.0,
  revenueLastMonth: 29334.4,
  revenueTrendPct: 4.3,
  ordersThisMonth: 20,
  ordersLastMonth: 18,
  ordersTrendPct: 11,
  weeklyOrderBars: [30, 50, 20, 80, 60, 40, 90],
  rangeLabel: "01 Jul 2026 - 31 Jul 2026",
};

export const MOCK_VEHICLES: Vehicle[] = [
  { id: "1", name: "Yamaha FZ V3", quantity: 1, kind: "motorcycle" },
  {
    id: "2",
    name: "Bajaj Avenger 220 Cruise",
    quantity: 1,
    kind: "motorcycle",
  },
  { id: "3", name: "Bajaj Pulsar 150", quantity: 1, kind: "motorcycle" },
  { id: "4", name: "KTM Duke 200", quantity: 1, kind: "motorcycle" },
  { id: "5", name: "Honda Activa 5G", quantity: 1, kind: "scooter" },
];

export const MOCK_BLOCKS: BlockEntry[] = [
  {
    id: "b1",
    blockId: "#928",
    vehicleName: "Honda Activa 5G",
    startLabel: "31 Jan 2023 at 2:00 PM",
    endLabel: "28 Feb 2023 at 2:00 PM",
    quantity: 1,
    availableCount: 0,
  },
  {
    id: "b2",
    blockId: "#1131",
    vehicleName: "TVS Apache RTR 160",
    startLabel: "13 Feb 2023 at 7:00 PM",
    endLabel: "20 Feb 2023 at 7:00 PM",
    quantity: 1,
    availableCount: 0,
  },
  {
    id: "b3",
    blockId: "#1132",
    vehicleName: "TVS Jupiter",
    startLabel: "13 Feb 2023 at 7:00 PM",
    endLabel: "30 Apr 2023 at 7:00 PM",
    quantity: 1,
    availableCount: 0,
  },
  {
    id: "b4",
    blockId: "#1196",
    vehicleName: "Royal Enfield Classic 350 Dual Channel",
    startLabel: "17 Feb 2023 at 10:00 AM",
    endLabel: "20 Feb 2023 at 11:00 AM",
    quantity: 1,
    availableCount: 0,
  },
];

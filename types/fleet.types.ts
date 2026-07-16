export type VehicleKind = "motorcycle" | "scooter";

export interface Vehicle {
  id: string;
  name: string;
  quantity: number;
  kind: VehicleKind;
}

export interface BlockEntry {
  id: string;
  blockId: string;
  vehicleName: string;
  startLabel: string; // e.g. "31 Jan 2023 at 2:00 PM"
  endLabel: string;
  quantity: number;
  availableCount: number;
}

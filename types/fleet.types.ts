export type VehicleKind = "motorcycle" | "scooter";

export interface Vehicle {
  id: string;
  name: string;
  quantity: number;
  kind: VehicleKind;
  imageUrl?: string | null;
  locationName?: string;
  pickupPointLabel?: string;
  status?: string;
}

export interface BlockEntry {
  id: string;
  blockId: string;
  vehicleName: string;
  startLabel: string;
  endLabel: string;
  quantity: number;
  availableCount: number;
}

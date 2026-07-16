export type LedgerStatus = "success" | "pending" | "failed";

export interface LedgerEntry {
  id: string;
  title: string; // e.g. "Order Settlement"
  status: LedgerStatus;
  amount: number;
  initiatedLabel: string;
  updatedLabel: string;
  utr: string;
}

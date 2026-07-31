import type { VendorBookingListItem } from "@/types/booking.types";

export interface DashboardStats {
  currentBalance: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueTrendPct: number;
  ordersThisMonth: number;
  ordersLastMonth: number;
  ordersTrendPct: number;
  weeklyOrderBars: number[]; // 0-100, one per week, for the bar chart
  rangeLabel: string;
}

export interface VendorDashboardData {
  vendor_status: string;
  vendor_status_label: string;
  vendor_rejection_reason: string;
  current_balance: string; // DecimalField serializes as string
  revenue_this_month: string;
  revenue_last_month: string;
  revenue_trend_pct: number;
  orders_this_month: number;
  orders_last_month: number;
  orders_trend_pct: number;
  weekly_order_bars: number[]; // raw daily counts, last 7 days — NOT 0-100
  range_label: string;
  bookings_to_start: VendorBookingListItem[];
  bookings_to_return: VendorBookingListItem[];
  fleet_total_listings: number;
  fleet_pending_approval: number;
  fleet_blocked_units: number;
  recent_bookings: VendorBookingListItem[];
}

export interface VendorDashboardResponse {
  success: boolean;
  message: string;
  data?: VendorDashboardData;
}

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

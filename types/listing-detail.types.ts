export interface ListingVehicleType {
  id: number;
  name: string;
  brand: string;
  make_year: number;
  transmission_type: string;
  fuel_type: string;
  vehicle_type: string;
  seats: number;
  cc: number;
  mileage_kmpl: number | null;
  top_speed_kmph: number | null;
  fuel_capacity_litres: number | null;
  weight_kg: number | null;
  primary_image: string | null;
}

export interface ListingPickupLocation {
  id: number;
  name: string;
  address: string;
  city_id: number;
  city_name: string;
  latitude: number | null;
  longitude: number | null;
}

export interface ListingImage {
  id: number;
  image_url: string | null;
  is_primary: boolean;
  sort_order: number;
}

export interface ListingPackage {
  id: number;
  package_type_id: number; // NEW
  name: string;
  category: string;
  duration_hours: string;
  price: string;
  pay_at_pickup_enabled: boolean;
  partial_payment_percentage: string | null;
  km_limit: number | null;
}

export interface ListingScheduleDay {
  day_of_week: number;
  day_name: string;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
  timing: string;
}

export interface ListingSchedule {
  has_schedule: boolean;
  id: number | null; // NEW
  template_name: string | null;
  days: ListingScheduleDay[];
}

export interface ListingPolicies {
  security_deposit_amount: number;
  km_limit_per_day: number | null;
  excess_charge_per_km: number | null;
  late_return_penalty_per_hour: number | null;
  doorstep_delivery_enabled: boolean;
  operating_hours_start: string | null;
  operating_hours_end: string | null;
}

export interface ListingDetail {
  id: number;
  status: "PENDING" | "APPROVED" | "PAUSED" | "SUSPENDED" | "REJECTED";
  rejection_reason: string;
  available_count: number;
  vehicle_type: ListingVehicleType;
  pickup_location: ListingPickupLocation;
  pickup_point: ListingPickupPoint | null;
  images: ListingImage[];
  pricing_packages: ListingPackage[];
  schedule: ListingSchedule;
  policies: ListingPolicies;
  created_at: string;
}

export interface ListingDetailResponse {
  success: boolean;
  message: string;
  data?: ListingDetail;
}

export interface ListingPickupPoint {
  id: number;
  label: string;
  address: string;
  contact_numbers: string[];
  latitude: number | null;
  longitude: number | null;
  google_maps_link: string;
}

export interface VehicleTypeOption {
  id: number;
  name: string;
  brand: string;
  brand_id: number;
  make_year: number;
  transmission_type: string;
  fuel_type: string;
  vehicle_type: string;
  seats: number;
  cc: number;
  primary_image: string | null;
}

export interface VehicleTypeOptionsResponse {
  success: boolean;
  message: string;
  data?: {
    pagination: {
      total: number;
      page: number;
      page_size: number;
      total_pages: number;
      next: string | null;
      previous: string | null;
    };
    results: VehicleTypeOption[];
  };
}

export interface PackageTypeOption {
  id: number;
  name: string;
  category: string;
  duration_hours: string;
}

export interface PackageTypeOptionsResponse {
  success: boolean;
  message: string;
  data?: PackageTypeOption[];
}

export interface ScheduleTemplateDay {
  day_of_week: number;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
}

export interface ScheduleTemplate {
  id: number;
  name: string;
  listings_count: number;
  days: ScheduleTemplateDay[];
}

export interface ScheduleTemplateListResponse {
  success: boolean;
  message: string;
  data?: ScheduleTemplate[];
}

export interface ScheduleTemplateCreateResponse {
  success: boolean;
  message: string;
  data?: ScheduleTemplate;
}

export interface PricingPackageInput {
  package_type_id: number;
  price: string;
  pay_at_pickup_enabled: boolean;
  partial_payment_percentage?: string | null;
  km_limit?: number | null;
}

export interface ListingCreatePayload {
  vehicle_type_id: number;
  pickup_location_id: number;
  pickup_point_id: number;
  schedule_template_id: number;
  available_count: number;
  security_deposit_amount: string;
  km_limit_per_day?: number | null;
  excess_charge_per_km?: string | null;
  late_return_penalty_per_hour?: string | null;
  doorstep_delivery_enabled: boolean;
  operating_hours_start?: string | null;
  operating_hours_end?: string | null;
  pricing_packages: PricingPackageInput[];
}

export interface City {
  id: number;
  name: string;
  state_name: string;
}

export interface PickupLocationOption {
  id: number;
  location_name: string;
  city_id: number;
}

export interface ListingUpdatePayload {
  pickup_location_id: number;
  pickup_point_id: number;
  schedule_template_id: number;
  available_count: number;
  security_deposit_amount: string;
  km_limit_per_day?: number | null;
  excess_charge_per_km?: string | null;
  late_return_penalty_per_hour?: string | null;
  doorstep_delivery_enabled: boolean;
  operating_hours_start?: string | null;
  operating_hours_end?: string | null;
  pricing_packages: PricingPackageInput[];
}

export interface PickupPoint {
  id: number;
  pickup_location: number | null;
  pickup_location_name: string | null;
  label: string;
  address: string;
  contact_numbers: string[];
  latitude: number | null;
  longitude: number | null;
  google_maps_link: string;
}

export interface PickupPointPayload {
  pickup_location: number | null;
  label: string;
  address: string;
  contact_numbers: string[];
  latitude: number | null;
  longitude: number | null;
  google_maps_link: string;
}

export interface BrandOption {
  id: number;
  name: string;
}

export interface BrandOptionsResponse {
  success: boolean;
  message: string;
  data?: BrandOption[];
}

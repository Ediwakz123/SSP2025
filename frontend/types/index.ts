// =============================================================================
// SHARED TYPES FOR STRATEGIC STORE PLACEMENT SYSTEM
// =============================================================================

// -----------------------------------------------------------------------------
// USER & AUTH TYPES
// -----------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  role: "user" | "admin";
  first_name?: string;
  last_name?: string;
  full_name?: string;
  contact_number?: string;
  address?: string;
  age?: number;
  gender?: string;
  date_of_birth?: string;
  created_at?: string;
  last_login?: string;
  user_metadata?: UserMetadata;
}

export interface UserMetadata {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  contact_number?: string;
  address?: string;
  age?: number;
  gender?: string;
  date_of_birth?: string;
  role?: "user" | "admin";
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export interface Profile {
  id: string;
  role: "user" | "admin";
  email?: string;
  first_name?: string;
  last_name?: string;
  last_login?: string;
  created_at?: string;
}

// -----------------------------------------------------------------------------
// BUSINESS TYPES
// -----------------------------------------------------------------------------

export interface Business {
  id?: number;
  business_id: number;
  business_name: string;
  general_category: string;
  category?: string;
  type?: string;
  latitude: number;
  longitude: number;
  street: string;
  zone_type: string;
  zone_encoded?: number;
  status?: string;
  business_density_50m?: number;
  business_density_100m?: number;
  business_density_200m?: number;
  competitor_density_50m?: number;
  competitor_density_100m?: number;
  competitor_density_200m?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BusinessRow {
  id: number;
  business_id: number | null;
  business_name: string | null;
  latitude: number | null;
  longitude: number | null;
  street: string | null;
  zone_type: string | null;
  zone_encoded: number | null;
  status: string | null;
  business_density_50m: number | null;
  business_density_100m: number | null;
  business_density_200m: number | null;
  competitor_density_50m: number | null;
  competitor_density_100m: number | null;
  competitor_density_200m: number | null;
  category: string | null;
  type: string | null;
  general_category: string | null;
  created_at: string;
}

// -----------------------------------------------------------------------------
// CLUSTERING TYPES
// -----------------------------------------------------------------------------

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface ClusterPoint {
  latitude: number;
  longitude: number;
  business: Business;
}

export interface Cluster {
  id: number;
  color: string;
  centroid: GeoPoint;
  points: ClusterPoint[];
}

export interface CompetitorAnalysis {
  competitorCount: number;
  nearestCompetitor: Business | null;
  distanceToNearest: number;
  competitorsWithin500m: number;
  competitorsWithin1km: number;
  competitorsWithin2km: number;
  marketSaturation: number;
  recommendedStrategy: string;
  opportunity_score?: number;
}

export interface ClusteringAnalysis {
  confidence: number;
  opportunity: string;
  opportunity_score?: number;
  competitorCount: number;
}

export interface ClusteringResult {
  clusters: Cluster[];
  recommendedLocation: GeoPoint;
  nearbyBusinesses: Array<{ business: Business; distance: number }>;
  competitorAnalysis: CompetitorAnalysis;
  zoneType: string;
  analysis: ClusteringAnalysis;
}

export interface ExtendedClusteringResult extends ClusteringResult {
  gridPoints?: GeoPoint[];
}

// -----------------------------------------------------------------------------
// ACTIVITY LOG TYPES
// -----------------------------------------------------------------------------

export interface ActivityLog {
  id: number;
  user_id?: string;
  user_email?: string;
  action: string;
  details?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface ActivityMetadata {
  page?: string;
  timeSpentSeconds?: number;
  timestamp?: string;
  [key: string]: unknown;
}

// -----------------------------------------------------------------------------
// API TYPES
// -----------------------------------------------------------------------------

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  error: string;
  message?: string;
  status?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// -----------------------------------------------------------------------------
// OPPORTUNITY TYPES
// -----------------------------------------------------------------------------

export interface Opportunity {
  id: string;
  category: string;
  zone: string;
  street: string;
  latitude: number;
  longitude: number;
  score: number;
  risk: "Low" | "Moderate" | "High";
  competitorDensity: number;
  businessDensity: number;
  nearbyBusinesses: string[];
  recommendations: string[];
}

export type OpportunityLevel = "High" | "Moderate" | "Low" | "Very Low";

// -----------------------------------------------------------------------------
// STATS TYPES
// -----------------------------------------------------------------------------

export interface AdminStats {
  total_users: number;
  active_users: number;
  recent_signups: number;
  total_analyses: number;
  seed_businesses: number;
  system_status: string;
  last_updated: string;
}

export interface CategoryStats {
  category: string;
  count: number;
  percentage?: number;
}

export interface ZoneStats {
  zone: string;
  count: number;
  percentage?: number;
}

// -----------------------------------------------------------------------------
// FORM TYPES
// -----------------------------------------------------------------------------

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  contactNumber: string;
  address: string;
  age: string;
  gender: string;
  date_of_birth: string;
}

// -----------------------------------------------------------------------------
// MAP TYPES
// -----------------------------------------------------------------------------

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface LocationInfo {
  barangay: string;
  municipality: string;
  province: string;
  population: number;
  center_latitude: number;
  center_longitude: number;
  postal_code: number;
  description: string;
}

// -----------------------------------------------------------------------------
// CATEGORY CONSTANTS
// -----------------------------------------------------------------------------

export const BUSINESS_CATEGORIES = [
  "Retail",
  "Service",
  "Merchandising / Trading",
  "Miscellaneous",
  "Entertainment / Leisure",
] as const;

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];

export const CATEGORY_COLORS: Record<string, string> = {
  "Food & Beverages": "#0ea5e9",
  Retail: "#10b981",
  Services: "#f59e0b",
  Service: "#f59e0b",
  "Merchandising / Trading": "#ef4444",
  "Entertainment / Leisure": "#a78bfa",
  Miscellaneous: "#475569",
};

// -----------------------------------------------------------------------------
// UTILITY TYPES
// -----------------------------------------------------------------------------

export type LoadingState = "idle" | "loading" | "success" | "error";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// -----------------------------------------------------------------------------
// SUPABASE SESSION TYPES (for AuthContext)
// -----------------------------------------------------------------------------

export interface SupabaseUser {
  id: string;
  aud: string;
  role?: string;
  email?: string;
  email_confirmed_at?: string;
  phone?: string;
  confirmation_sent_at?: string;
  confirmed_at?: string;
  last_sign_in_at?: string;
  app_metadata: Record<string, unknown>;
  user_metadata: UserMetadata;
  identities?: Array<{
    id: string;
    user_id: string;
    identity_data?: Record<string, unknown>;
    provider: string;
    created_at?: string;
    last_sign_in_at?: string;
  }>;
  created_at: string;
  updated_at?: string;
}

export interface SupabaseSession {
  provider_token?: string | null;
  provider_refresh_token?: string | null;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: SupabaseUser;
}

// -----------------------------------------------------------------------------
// ANALYTICS & CHART TYPES
// -----------------------------------------------------------------------------

export interface ChartDataPoint {
  name: string;
  value: number;
  count?: number;
  date?: string;
}

export interface AnalysisStats {
  total: number;
  freqByDate: ChartDataPoint[];
  topUsers: Array<{ user_id: string; email?: string; count: number }>;
}

export interface ActivityStats {
  total: number;
  logins: number;
  analyses: number;
  dataChanges: number;
}

// -----------------------------------------------------------------------------
// REALTIME PAYLOAD TYPES
// -----------------------------------------------------------------------------

export interface RealtimePayload<T = Record<string, unknown>> {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: T;
  old: Partial<T>;
  errors: string[] | null;
}


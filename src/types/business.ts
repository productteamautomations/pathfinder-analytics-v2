export type SessionType = "pathfinder" | "kiss";

export interface BusinessRecord {
  id: number | string;
  session_id: string;
  google_id: string;
  google_full_name: string;
  google_email: string;
  step: number;
  total_steps: number;
  client_name: string;
  website_url: string;
  month_established: string | null;
  year_established: string | null;
  business_generation: string | null;
  monthly_leads: string | null;
  has_gmb: string | null;
  diagnostic_answers: string;
  traffic_score: string | null;
  conversions_score: string | null;
  lead_management_score: string | null;
  overall_score: string | null;
  product: string | null;
  smart_site_included: boolean | null;
  initial_cost: string | null;
  monthly_cost: string | null;
  contract_length: string | null;
  start_time: string;
  timestamp: string;
  website_login_details: string | null;
  vat_registered: string | null;
  service_area: string | null;
  capacity: string | null;
  runs_ppc: string | null;
  _sessionType: SessionType;
}

export interface KissRawRecord {
  id: string;
  data: {
    leadType: string;
    clientUrl: string;
    createdAt: string;
    sessionId: string;
    updatedAt: string;
    finalPrice: string | null;
    prospectName: string;
    colleagueName: string;
    currentScreen: number;
    completedTasks: Record<string, boolean>;
    contractLength: string | null;
    salesPersonName: string;
    selectedProduct: string | null;
    selectedIndustry: string | null;
    recommendedProduct: string | null;
    acceptedInitialPrice: boolean;
  };
  created_at: string;
  updated_at: string;
  completed: boolean;
}

export function normalizeKissRecord(kiss: KissRawRecord): BusinessRecord {
  return {
    id: kiss.id,
    session_id: kiss.data.sessionId || kiss.id,
    google_id: "",
    google_full_name: kiss.data.salesPersonName || "Unknown",
    google_email: "",
    step: kiss.data.currentScreen || 0,
    total_steps: 2,
    client_name: kiss.data.prospectName || "Unknown",
    website_url: kiss.data.clientUrl || "",
    month_established: null,
    year_established: null,
    business_generation: null,
    monthly_leads: null,
    has_gmb: null,
    diagnostic_answers: "{}",
    traffic_score: null,
    conversions_score: null,
    lead_management_score: null,
    overall_score: null,
    product: kiss.data.selectedProduct || kiss.data.recommendedProduct || null,
    smart_site_included: null,
    initial_cost: null,
    monthly_cost: null,
    contract_length: kiss.data.contractLength || null,
    start_time: kiss.created_at || kiss.data.createdAt,
    timestamp: kiss.updated_at || kiss.data.updatedAt,
    website_login_details: null,
    vat_registered: null,
    service_area: null,
    capacity: null,
    runs_ppc: null,
    _sessionType: "kiss",
  };
}

export interface WebsiteLoginDetails {
  username: string;
  password: string;
  loginUrl: string;
}

export interface DiagnosticAnswers {
  CTR: string | null;
  Tracking: string | null;
  CPC: string | null;
  CPA: string | null;
  CR: string | null;
  "CTA Visible without scrolling?": string | null;
  "Dedicated service pages?": string | null;
  "Lead management system": string | null;
  "Average response time": string | null;
}

export interface FunnelScores {
  traffic: string;
  conversions: string;
  leadManagement: string;
  overall: string;
}

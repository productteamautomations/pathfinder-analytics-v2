export interface BusinessRecord {
  id: number;
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

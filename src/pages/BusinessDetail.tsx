import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Globe,
  Calendar,
  TrendingUp,
  MapPin,
  Package,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Mail,
  KeyRound,
  Link,
  Receipt,
  Target,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BusinessRecord, DiagnosticAnswers, WebsiteLoginDetails } from "@/types/business";
import ScoreCard from "@/components/ScoreCard";

const BusinessDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const record = location.state?.record as BusinessRecord;

  if (!record) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No business data found</p>
          <Button onClick={() => navigate("/")} variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-3.5 w-3.5" />
            Back to Search
          </Button>
        </div>
      </div>
    );
  }

  let diagnosticAnswers: DiagnosticAnswers = {} as DiagnosticAnswers;
  try { diagnosticAnswers = JSON.parse(record.diagnostic_answers); } catch {}

  let businessGeneration: string[] = [];
  try { businessGeneration = record.business_generation ? JSON.parse(record.business_generation) : []; } catch {}

  let loginDetails: WebsiteLoginDetails | null = null;
  try { loginDetails = record.website_login_details ? JSON.parse(record.website_login_details) : null; } catch {}

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const calculateTimeSpent = (start: string | null, end: string | null) => {
    if (!start || !end) return "N/A";
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const isComplete = record.step >= record.total_steps;

  const InfoRow = ({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: string; highlight?: boolean }) => (
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${highlight ? "bg-emerald-50" : "bg-muted/60"}`}>
        <Icon className={`h-4 w-4 ${highlight ? "text-emerald-600" : "text-muted-foreground"}`} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`font-medium text-sm ${highlight ? "text-emerald-700" : "text-foreground"}`}>{value}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <div className="container py-6 max-w-5xl">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to results
        </button>

        {/* Header Card */}
        <div className="bg-white border border-border rounded-xl p-5 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1 tracking-tight">{record.client_name}</h1>
              {record.website_url && (
                <a
                  href={record.website_url.startsWith("http") ? record.website_url : `https://${record.website_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 text-sm"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {record.website_url}
                </a>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {record.product && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  <Package className="h-3 w-3" />
                  {record.product}
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                  isComplete ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}
              >
                {isComplete ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                {isComplete ? "Complete" : `Step ${record.step}/${record.total_steps}`}
              </span>
              {record.smart_site_included !== null && (
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                    record.smart_site_included ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {record.smart_site_included ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {record.smart_site_included ? "Smart Site" : "No Smart Site"}
                </span>
              )}
            </div>
          </div>

          {/* Sales Member */}
          <div className="pt-3 border-t border-border/50">
            <div className="flex items-center gap-5 flex-wrap text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground">{record.google_full_name}</span>
              </div>
              <a href={`mailto:${record.google_email}`} className="flex items-center gap-1.5 text-primary hover:underline">
                <Mail className="h-3.5 w-3.5" />
                {record.google_email}
              </a>
            </div>
          </div>
        </div>

        {/* Two-column grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {/* Company Details */}
          <div className="bg-white border border-border rounded-xl p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Company Details</h3>
            <div className="space-y-3.5">
              <InfoRow icon={Calendar} label="Established"
                value={record.month_established && record.year_established ? `${record.month_established}/${record.year_established}` : "N/A"} />
              <InfoRow icon={TrendingUp} label="Monthly Leads" value={record.monthly_leads || "0"} />
              <InfoRow icon={MapPin} label="Google My Business"
                value={record.has_gmb === "Yes" ? "Claimed" : record.has_gmb === "No" ? "Not Claimed" : "N/A"}
                highlight={record.has_gmb === "Yes"} />
              <InfoRow icon={Receipt} label="VAT Registered" value={record.vat_registered || "N/A"}
                highlight={record.vat_registered === "Yes"} />
              <InfoRow icon={Target} label="Runs PPC" value={record.runs_ppc || "N/A"}
                highlight={record.runs_ppc === "Yes"} />
            </div>
          </div>

          {/* Lead Generation & Operations */}
          <div className="bg-white border border-border rounded-xl p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Lead Generation & Operations</h3>
            <div className="space-y-3.5">
              <div className="flex flex-wrap gap-1.5">
                {businessGeneration.length > 0 && businessGeneration[0] !== "None" ? (
                  businessGeneration.map((method, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-full bg-primary/8 text-primary text-xs font-medium">
                      {method}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">No active methods</span>
                )}
              </div>
              <div className="pt-3 border-t border-border/50 grid grid-cols-2 gap-3">
                <InfoRow icon={MapPin} label="Service Area" value={record.service_area || "N/A"} />
                <InfoRow icon={Zap} label="Capacity" value={record.capacity || "N/A"} />
              </div>
            </div>
          </div>
        </div>

        {/* Contract & Pricing */}
        {(record.initial_cost || record.monthly_cost || record.contract_length) && (
          <div className="bg-white border border-border rounded-xl p-5 mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Contract & Pricing</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-muted/40">
                <CreditCard className="h-4 w-4 text-primary mx-auto mb-1.5" />
                <p className="text-xs text-muted-foreground mb-0.5">Initial Cost</p>
                <p className="font-semibold text-foreground text-sm">{record.initial_cost || "N/A"}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/40">
                <CreditCard className="h-4 w-4 text-primary mx-auto mb-1.5" />
                <p className="text-xs text-muted-foreground mb-0.5">Monthly Cost</p>
                <p className="font-semibold text-foreground text-sm">{record.monthly_cost || "N/A"}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/40">
                <Clock className="h-4 w-4 text-primary mx-auto mb-1.5" />
                <p className="text-xs text-muted-foreground mb-0.5">Contract Length</p>
                <p className="font-semibold text-foreground text-sm">{record.contract_length || "N/A"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Funnel Scores */}
        {(record.traffic_score || record.conversions_score || record.lead_management_score || record.overall_score) && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Funnel Scores</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ScoreCard label="Overall" value={record.overall_score || "N/A"} />
              <ScoreCard label="Traffic" value={record.traffic_score || "N/A"} />
              <ScoreCard label="Conversions" value={record.conversions_score || "N/A"} />
              <ScoreCard label="Lead Mgmt" value={record.lead_management_score || "N/A"} />
            </div>
          </div>
        )}

        {/* Website Login Details */}
        {loginDetails && (
          <div className="bg-white border border-border rounded-xl p-5 mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Website Login</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <InfoRow icon={User} label="Username" value={loginDetails.username || "N/A"} />
              <InfoRow icon={KeyRound} label="Password" value={loginDetails.password || "N/A"} />
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted/60">
                  <Link className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Login URL</p>
                  {loginDetails.loginUrl ? (
                    <a
                      href={loginDetails.loginUrl.startsWith("http") ? loginDetails.loginUrl : `https://${loginDetails.loginUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline text-sm"
                    >
                      {loginDetails.loginUrl}
                    </a>
                  ) : (
                    <p className="font-medium text-foreground text-sm">N/A</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Diagnostic Answers */}
        {Object.keys(diagnosticAnswers).length > 0 && (
          <div className="bg-white border border-border rounded-xl p-5 mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Diagnostic Answers</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6">
              {Object.entries(diagnosticAnswers).map(([key, value]) => (
                <div key={key} className="border-b border-border/40 pb-2.5 last:border-0">
                  <p className="text-xs text-muted-foreground">{key}</p>
                  <p className="font-medium text-foreground text-sm">{value || "N/A"}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Record Details */}
        <div className="bg-white border border-border rounded-xl p-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Record Details</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Date Submitted</p>
              <p className="font-medium text-foreground text-sm">{formatDate(record.timestamp)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Time Spent</p>
              <p className="font-medium text-foreground text-sm">{calculateTimeSpent(record.start_time, record.timestamp)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Progress</p>
              <p className="font-medium text-foreground text-sm">{record.step} / {record.total_steps} steps</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Record ID</p>
              <p className="font-mono text-xs text-muted-foreground mt-0.5 break-all">{record.session_id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetail;

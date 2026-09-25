import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Activity, Clock, Filter, Search, Zap, X, ChevronRight, CheckCircle2, XCircle, Hourglass, User, Target, Layers, Tag, Timer, CalendarDays, ArrowRight, Info } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { InfoTooltip } from "../components/InfoTooltip";
import { getAuditLogs, getAuditSummary } from "../lib/api";

type AuditEvent = {
  id: string;
  actor: string;
  target?: string;
  action: string;
  module: string;
  state_before?: string;
  state_after?: string;
  duration_ms?: number;
  created_at: string;
  status: "success" | "failed" | "pending";
  category: string;
};

const formatDuration = (ms?: number) =>
  !Number.isFinite(ms) ? "N/A" : (ms || 0) < 1000 ? `${ms} ms` : `${((ms || 0) / 1000).toFixed(1)} s`;

const statusClass = (value: string) =>
  value === "failed"
    ? "bg-red-100 text-red-700 border-red-200"
    : value === "pending"
      ? "bg-yellow-100 text-yellow-700 border-yellow-200"
      : "bg-green-100 text-green-700 border-green-200";

// Derive a human-readable failure reason from the event data
const getFailureReason = (event: AuditEvent): string => {
  if (event.status === "success") return "Action completed successfully.";
  if (event.status === "pending") return "Action is queued and awaiting processing or approval.";

  // Try to infer reason from state transitions and action name
  const action = event.action.toLowerCase();
  const stateAfter = (event.state_after || "").toLowerCase();
  const stateBefore = (event.state_before || "").toLowerCase();

  if (stateAfter.includes("error") || stateAfter.includes("failed")) {
    return `System returned an error state after attempting "${event.action}". Check upstream service availability.`;
  }
  if (action.includes("auth") || action.includes("login") || action.includes("token")) {
    return "Authentication or authorization failure. Credentials may have expired or permissions are insufficient.";
  }
  if (action.includes("forecast") || action.includes("predict") || action.includes("model")) {
    return "AI model inference failed. This may be due to insufficient historical data, model timeout, or a missing input parameter.";
  }
  if (action.includes("ingest") || action.includes("upload") || action.includes("import")) {
    return "Data ingestion failed. The file may be malformed, missing required columns, or exceed the allowed size limit.";
  }
  if (action.includes("export") || action.includes("download") || action.includes("report")) {
    return "Export or report generation failed. The system may have timed out or encountered an empty dataset.";
  }
  if (action.includes("reorder") || action.includes("order") || action.includes("purchase")) {
    return "Reorder action failed. This may be due to a payment issue, supplier API timeout, or inventory constraint.";
  }
  if (action.includes("delete") || action.includes("remove")) {
    return "Deletion failed. The resource may be protected, referenced by another record, or already removed.";
  }
  if (action.includes("sync") || action.includes("push") || action.includes("publish")) {
    return "Sync failed. The target system may be offline or returned a rejection response.";
  }
  if (stateBefore && stateAfter && stateBefore === stateAfter) {
    return "Action had no effect — state did not change. A pre-condition may not have been met.";
  }
  return "Action failed due to an unspecified system error. Review server logs for the exact exception trace.";
};

// ─── Detail Modal ──────────────────────────────────────────────────────────
function AuditDetailModal({ event, onClose }: { event: AuditEvent; onClose: () => void }) {
  const failureReason = getFailureReason(event);
  const isFailed = event.status === "failed";
  const isPending = event.status === "pending";

  const StatusIcon = isFailed ? XCircle : isPending ? Hourglass : CheckCircle2;
  const statusColor = isFailed ? "text-red-600" : isPending ? "text-yellow-600" : "text-green-600";
  const statusBg = isFailed ? "bg-red-50 border-red-200" : isPending ? "bg-yellow-50 border-yellow-200" : "bg-green-50 border-green-200";

  const hasStateDiff = event.state_before || event.state_after;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#FFD9EC] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between p-5 pb-4"
          style={{ background: "linear-gradient(135deg, #FFF7FB 0%, #FFF0F8 100%)", borderBottom: "1px solid #FFD9EC" }}
        >
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Badge className={`${statusClass(event.status)} border text-xs capitalize font-semibold`}>
                {event.status}
              </Badge>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#223047]/40">{event.category}</span>
            </div>
            <h3 className="text-base font-bold text-[#223047] leading-snug">{event.action}</h3>
            <p className="text-xs text-[#223047]/50 mt-0.5">{event.module}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#FFD9EC]/60 text-[#223047]/40 hover:text-[#F53799] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Status / Failure Banner */}
          <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${statusBg}`}>
            <StatusIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${statusColor}`} />
            <div className="text-xs leading-relaxed text-[#223047]/80">
              <span className={`font-bold ${statusColor}`}>
                {isFailed ? "Failure Reason: " : isPending ? "Pending: " : "Success: "}
              </span>
              {failureReason}
            </div>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { Icon: User, label: "Actor", value: event.actor },
              { Icon: Target, label: "Target", value: event.target || "System" },
              { Icon: Layers, label: "Module", value: event.module },
              { Icon: Tag, label: "Category", value: event.category },
              { Icon: Timer, label: "Duration", value: formatDuration(event.duration_ms) },
              { Icon: CalendarDays, label: "Timestamp", value: new Date(event.created_at).toLocaleString() },
            ].map(({ Icon, label, value }) => (
              <div key={label} className="rounded-xl border border-[#FFD9EC] bg-[#FFF7FB] p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-3 h-3 text-[#F53799]" />
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[#223047]/40">{label}</span>
                </div>
                <div className="text-xs font-semibold text-[#223047] break-words">{value}</div>
              </div>
            ))}
          </div>

          {/* State Diff */}
          {hasStateDiff && (
            <div className="rounded-xl border border-[#FFD9EC] bg-[#FFF7FB] p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Info className="w-3 h-3 text-[#F53799]" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#223047]/40">State Transition</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono bg-slate-100 border border-slate-200 text-slate-600 px-2 py-1 rounded-lg">
                  {event.state_before || "—"}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#223047]/30 flex-shrink-0" />
                <span className={`text-xs font-mono px-2 py-1 rounded-lg border font-semibold ${
                  isFailed
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-green-50 border-green-200 text-green-700"
                }`}>
                  {event.state_after || "—"}
                </span>
              </div>
            </div>
          )}

          {/* Event ID */}
          <div className="text-[10px] text-[#223047]/30 font-mono text-center pt-1">
            Event ID: {event.id}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export function Audit() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    pendingApprovals: 0,
    automatedTriggers: 0,
    systemBottlenecks: 0,
    averageDurationMs: 0,
  });
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("all");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  useEffect(() => {
    Promise.all([getAuditLogs(), getAuditSummary()])
      .then(([logs, totals]) => {
        setEvents(logs as AuditEvent[]);
        setSummary(totals as typeof summary);
      })
      .catch((error) => console.error("Failed to load audit logs", error))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      events.filter((event) => {
        const haystack = `${event.actor} ${event.action} ${event.module} ${event.target || ""}`.toLowerCase();
        return (
          (!search || haystack.includes(search.toLowerCase())) &&
          (module === "all" || event.module === module) &&
          (status === "all" || event.status === status) &&
          (category === "all" || event.category === category)
        );
      }),
    [events, search, module, status, category],
  );

  const kpis = [
    [Activity, "Pending Approvals", summary.pendingApprovals],
    [Clock, "Average Duration", formatDuration(summary.averageDurationMs)],
    [AlertTriangle, "Failed Actions", `${summary.systemBottlenecks} alerts`],
    [Zap, "Automated Actions", summary.automatedTriggers],
  ] as const;

  return (
    <div className="space-y-4 md:space-y-6 lg:space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-2">
        <h1 className="text-2xl md:text-3xl lg:text-[36px] font-extrabold text-[#223047]">
          Audit &amp; Orchestration Logs
        </h1>
        <InfoTooltip label="Every API action is recorded with its actor, target, result, and execution time. Click any row for full details." />
      </div>

      {/* KPI Cards */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {kpis.map(([Icon, label, value]) => (
            <div key={label} className="flex items-center gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-xl px-3 py-3">
              <div className="w-10 h-10 rounded-lg bg-[#F53799] flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xs text-[#223047] opacity-80">
                  {label}
                  <InfoTooltip label={`Live ${label.toLowerCase()} calculated from audit records.`} />
                </div>
                <div className="text-xl font-bold text-[#223047]">{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters + Table */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-8 space-y-5">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
            <Input
              className="pl-10 border-[#FFD9EC]"
              placeholder="Search actor, action, module, or target..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={module} onValueChange={setModule}>
            <SelectTrigger className="w-full md:w-48 border-[#FFD9EC]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {[...new Set(events.map((e) => e.module))].map((value) => (
                <SelectItem key={value} value={value}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full md:w-40 border-[#FFD9EC]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full md:w-44 border-[#FFD9EC]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="workflow">Workflow</SelectItem>
              <SelectItem value="ai_system">AI &amp; System</SelectItem>
              <SelectItem value="security">Security</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs md:text-sm text-[#223047] opacity-60">
          {loading ? "Loading audit events..." : `Showing ${filtered.length} of ${events.length} events`}
        </p>

        {/* Table */}
        <div className="border border-[#FFD9EC] rounded-xl overflow-hidden overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#FFF7FB]">
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Action &amp; Module</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 opacity-60">
                    {loading ? "Loading..." : "No audit events found"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((event) => (
                  <TableRow
                    key={event.id}
                    className="cursor-pointer hover:bg-[#FFF2FA] transition-colors group"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <TableCell className="text-xs whitespace-nowrap">
                      {new Date(event.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium text-xs">{event.actor}</TableCell>
                    <TableCell className="text-xs">{event.target || "System"}</TableCell>
                    <TableCell className="text-xs">
                      <div className="font-medium">{event.action}</div>
                      <div className="opacity-60">{event.module}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {event.state_before || event.state_after
                        ? `${event.state_before || "—"} → ${event.state_after || "—"}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusClass(event.status)} border text-xs capitalize`}>
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <ChevronRight className="w-4 h-4 text-[#223047]/20 group-hover:text-[#F53799] transition-colors" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedEvent && (
        <AuditDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}

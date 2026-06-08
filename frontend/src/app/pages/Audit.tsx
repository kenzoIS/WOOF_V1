import { useState } from "react";
import { Search, Filter, Activity, Clock, AlertTriangle, Zap, ChevronDown, Calendar, TrendingDown } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

interface AuditEvent {
  id: string;
  user: string;
  targetRecord: string;
  actionModule: string;
  stateTransition: string;
  turnaroundTime: string;
  timestamp: string;
  datestamp: string;
  status: "completed" | "pending" | "escalated" | "success";
  category: "workflow" | "ai_system" | "security";
}

const auditData: AuditEvent[] = [
  {
    id: "1",
    user: "Admin User",
    targetRecord: "Promo Bundle #44",
    actionModule: "Approved Cross-sell (Retail)",
    stateTransition: "Pending → Active",
    turnaroundTime: "15 mins",
    timestamp: "10:34 AM",
    datestamp: "2026-04-29",
    status: "completed",
    category: "workflow",
  },
  {
    id: "2",
    user: "Cafe Staff",
    targetRecord: "Restock Request",
    actionModule: "Submitted Request (Cafe)",
    stateTransition: "Draft → Pending Approval",
    turnaroundTime: "N/A",
    timestamp: "09:15 AM",
    datestamp: "2026-04-29",
    status: "pending",
    category: "workflow",
  },
  {
    id: "3",
    user: "WOOF AI",
    targetRecord: "Premium Dog Food",
    actionModule: "Triggered Spoilage Alert",
    stateTransition: "Normal → Warning",
    turnaroundTime: "Auto-Trigger",
    timestamp: "08:45 AM",
    datestamp: "2026-04-29",
    status: "escalated",
    category: "ai_system",
  },
  {
    id: "4",
    user: "Apache Airflow",
    targetRecord: "Loyverse POS",
    actionModule: "Data Extraction Pipeline",
    stateTransition: "Syncing → Synced",
    turnaroundTime: "3 mins",
    timestamp: "08:00 AM",
    datestamp: "2026-04-29",
    status: "success",
    category: "ai_system",
  },
  {
    id: "5",
    user: "Admin User",
    targetRecord: "Grooming Bundle #23",
    actionModule: "Approved Promotion (Services)",
    stateTransition: "Pending → Active",
    turnaroundTime: "22 mins",
    timestamp: "05:12 PM",
    datestamp: "2026-04-28",
    status: "completed",
    category: "workflow",
  },
  {
    id: "6",
    user: "System",
    targetRecord: "Shopee API",
    actionModule: "Pushed Pricing Update",
    stateTransition: "Queue → Published",
    turnaroundTime: "1 min",
    timestamp: "04:30 PM",
    datestamp: "2026-04-28",
    status: "success",
    category: "ai_system",
  },
  {
    id: "7",
    user: "Inventory Manager",
    targetRecord: "Stock Alert #102",
    actionModule: "Authorized Restock (Retail)",
    stateTransition: "Pending → Authorized",
    turnaroundTime: "1h 35m",
    timestamp: "03:18 PM",
    datestamp: "2026-04-28",
    status: "completed",
    category: "workflow",
  },
  {
    id: "8",
    user: "XGBoost Model",
    targetRecord: "Demand Forecast",
    actionModule: "Model Retrained (Cafe)",
    stateTransition: "Stale → Updated",
    turnaroundTime: "8 mins",
    timestamp: "02:45 PM",
    datestamp: "2026-04-28",
    status: "success",
    category: "ai_system",
  },
  {
    id: "9",
    user: "Admin User",
    targetRecord: "User: cafe_staff_02",
    actionModule: "Password Reset (Security)",
    stateTransition: "Active → Reset",
    turnaroundTime: "N/A",
    timestamp: "01:22 PM",
    datestamp: "2026-04-28",
    status: "completed",
    category: "security",
  },
  {
    id: "10",
    user: "Cafe Manager",
    targetRecord: "Flash Sale #18",
    actionModule: "Rejected Promo (Cafe)",
    stateTransition: "Pending → Rejected",
    turnaroundTime: "2h 10m",
    timestamp: "12:00 PM",
    datestamp: "2026-04-28",
    status: "completed",
    category: "workflow",
  },
  {
    id: "11",
    user: "Apache Airflow",
    targetRecord: "Tiktok Webhook",
    actionModule: "Order Sync Pipeline",
    stateTransition: "Syncing → Synced",
    turnaroundTime: "2 mins",
    timestamp: "11:23 AM",
    datestamp: "2026-04-28",
    status: "success",
    category: "ai_system",
  },
  {
    id: "12",
    user: "Services Staff",
    targetRecord: "Bundle Req #67",
    actionModule: "Submitted Request (Services)",
    stateTransition: "Draft → Pending Approval",
    turnaroundTime: "N/A",
    timestamp: "10:15 AM",
    datestamp: "2026-04-28",
    status: "pending",
    category: "workflow",
  },
];

export function Audit() {
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");

  const filteredData = auditData.filter((event) => {
    const matchesSearch =
      searchQuery === "" ||
      event.actionModule.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.targetRecord.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesModule =
      moduleFilter === "all" || event.actionModule.toLowerCase().includes(moduleFilter.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || event.status === statusFilter;

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "workflow" && event.category === "workflow") ||
      (activeTab === "ai_system" && event.category === "ai_system") ||
      (activeTab === "security" && event.category === "security");

    return matchesSearch && matchesModule && matchesStatus && matchesTab;
  });

  const pendingApprovals = auditData.filter((e) => e.status === "pending").length;
  const avgTurnaroundTime = "1h 45m";
  const systemBottlenecks = 2;
  const totalAutomatedTriggers = 142;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "escalated":
        return "bg-red-100 text-red-700 border-red-200";
      case "success":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 lg:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-3 md:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl lg:text-[36px] font-extrabold text-[#223047]">
            Audit & Orchestration Logs
          </h1>
          <p className="text-sm md:text-base text-[#223047] opacity-60 mt-1 md:mt-2" style={{ lineHeight: "1.6" }}>
            Comprehensive tracking of system workflows, turnaround times, and user accountability
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant="outline" className="gap-1.5 border-[#FFD9EC]">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span className="text-xs">POS</span>
          </Badge>
          <Badge variant="outline" className="gap-1.5 border-[#FFD9EC]">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span className="text-xs">Shopee</span>
          </Badge>
          <Badge variant="outline" className="gap-1.5 border-[#FFD9EC]">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span className="text-xs">Tiktok</span>
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Pending Approvals */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#F53799] to-[#D42A7D] flex items-center justify-center flex-shrink-0">
              <Activity className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">Pending Approvals</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">{pendingApprovals}</div>
            </div>
          </div>

          {/* Avg. Turnaround Time */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#3AE4FA] to-[#5CE1E6] flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">Avg. Turnaround Time</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">{avgTurnaroundTime}</div>
              <div className="text-xs text-green-600 font-medium hidden md:flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                <span>Improving</span>
              </div>
            </div>
          </div>

          {/* System Bottlenecks */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#3AE4FA] to-[#5CE1E6] flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">System Bottlenecks</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">{systemBottlenecks} alerts</div>
            </div>
          </div>

          {/* Total Automated Triggers */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#3AE4FA] to-[#5CE1E6] flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">Automated Triggers</div>
              <div className="text-base md:text-xl font-bold text-[#223047]">{totalAutomatedTriggers}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Section */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        {/* Tabbed Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-[#FFD9EC] pb-4">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 text-xs md:text-sm font-medium rounded-lg transition-all ${
              activeTab === "all"
                ? "bg-[#F53799] text-white shadow-md"
                : "bg-[#FFF2FA] text-[#223047] hover:bg-[#FFD9EC]"
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setActiveTab("workflow")}
            className={`px-4 py-2 text-xs md:text-sm font-medium rounded-lg transition-all ${
              activeTab === "workflow"
                ? "bg-[#F53799] text-white shadow-md"
                : "bg-[#FFF2FA] text-[#223047] hover:bg-[#FFD9EC]"
            }`}
          >
            Workflow & Approvals
          </button>
          <button
            onClick={() => setActiveTab("ai_system")}
            className={`px-4 py-2 text-xs md:text-sm font-medium rounded-lg transition-all ${
              activeTab === "ai_system"
                ? "bg-[#F53799] text-white shadow-md"
                : "bg-[#FFF2FA] text-[#223047] hover:bg-[#FFD9EC]"
            }`}
          >
            AI & System Syncs
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-4 py-2 text-xs md:text-sm font-medium rounded-lg transition-all ${
              activeTab === "security"
                ? "bg-[#F53799] text-white shadow-md"
                : "bg-[#FFF2FA] text-[#223047] hover:bg-[#FFD9EC]"
            }`}
          >
            Security & Access
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#223047] opacity-40" />
            <Input
              type="text"
              placeholder="Search requests, users, or workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-[#FFD9EC] focus:ring-[#F53799]"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-full sm:w-[180px] md:w-[200px] border-[#FFD9EC] focus:ring-[#F53799]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Select Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                <SelectItem value="cafe">Cafe</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="services">Services</SelectItem>
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px] md:w-[180px] border-[#FFD9EC] focus:ring-[#F53799]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
                <SelectItem value="success">Success</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-xs md:text-sm text-[#223047] opacity-60">
            Showing {filteredData.length} of {auditData.length} events
          </p>
        </div>

        {/* Audit Table */}
        <div className="border border-[#FFD9EC] rounded-xl md:rounded-2xl overflow-hidden overflow-x-auto shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#FFF7FB] hover:bg-[#FFF7FB]">
                <TableHead className="font-semibold text-[#223047] text-xs md:text-sm">Timestamp</TableHead>
                <TableHead className="font-semibold text-[#223047] text-xs md:text-sm">User / System</TableHead>
                <TableHead className="font-semibold text-[#223047] text-xs md:text-sm hidden md:table-cell">Target Record</TableHead>
                <TableHead className="font-semibold text-[#223047] text-xs md:text-sm">Action & Module</TableHead>
                <TableHead className="font-semibold text-[#223047] text-xs md:text-sm hidden lg:table-cell">State Transition</TableHead>
                <TableHead className="font-semibold text-[#223047] text-xs md:text-sm hidden xl:table-cell">Turnaround Time</TableHead>
                <TableHead className="font-semibold text-[#223047] text-xs md:text-sm">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs md:text-sm text-[#223047] opacity-60">
                    No events found matching your filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((event) => (
                  <TableRow
                    key={event.id}
                    className="hover:bg-[#FFF7FB] transition-colors"
                  >
                    <TableCell className="font-mono text-[#223047] text-xs md:text-sm opacity-70">
                      {event.timestamp}
                    </TableCell>
                    <TableCell className="font-medium text-[#223047] text-xs md:text-sm">
                      {event.user}
                    </TableCell>
                    <TableCell className="text-[#223047] text-xs md:text-sm hidden md:table-cell">
                      {event.targetRecord}
                    </TableCell>
                    <TableCell className="text-[#223047] text-xs md:text-sm">
                      {event.actionModule}
                    </TableCell>
                    <TableCell className="text-[#223047] text-xs md:text-sm font-medium hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1">
                        {event.stateTransition}
                      </span>
                    </TableCell>
                    <TableCell className="text-[#223047] text-xs md:text-sm opacity-70 hidden xl:table-cell">
                      {event.turnaroundTime}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(event.status)} border text-[10px] md:text-xs font-medium capitalize`}>
                        {event.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

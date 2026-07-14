import { useState, useEffect, useCallback } from "react";
import { Upload, Trash2, FileSpreadsheet, Database, ShoppingCart, DollarSign, Hash, Radio, AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { toast } from "sonner";
import { uploadCSV, getUploads, deleteUpload, getMetrics } from "../lib/api";

interface CsvUploadRecord {
  _id: string;
  filename: string;
  channel: string;
  recordCount: number;
  totalRevenue: number;
  totalQuantity: number;
  totalTransactions: number;
  uploadedAt: string;
  etlReport?: {
    stage1_droppedCount?: number;
    stage1_duplicateCount?: number;
    stage1_dropReasons?: string[];
    stage2_droppedCount?: number;
    stage2_dropReasons?: string[];
  };
}

interface Metrics {
  totalRecords: number;
  totalTransactions: number;
  totalQuantity: number;
  totalRevenue: number;
  channels: Record<string, { count: number; revenue: number }>;
  uploadCount: number;
}

const CHANNEL_OPTIONS = [
  { value: "POS", label: "POS", description: "Cafe, Services & Retail", color: "#F53799" },
  { value: "Shopee", label: "Shopee", description: "Retail only", color: "#EE4D2D" },
  { value: "TikTok", label: "TikTok", description: "Retail only", color: "#000000" },
  { value: "PetHub", label: "PetHub", description: "Cafe, Services & Retail", color: "#3AE4FA" },
];

export function DataIngestion() {
  const [uploads, setUploads] = useState<CsvUploadRecord[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string>("POS");
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const [lastReport, setLastReport] = useState<any>(null);

  const refreshData = useCallback(async () => {
    try {
      const [uploadsRes, metricsRes] = await Promise.all([getUploads(), getMetrics()]);
      setUploads(uploadsRes.uploads || []);
      setMetrics(metricsRes);
      setConnectionError(null);
    } catch (error) {
      setConnectionError(
        error instanceof Error ? error.message : "Backend unavailable",
      );
    }
  }, []);

  useEffect(() => { refreshData(); }, [refreshData]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setConnectionError(null);
    setLastReport(null);
    try {
      const res = await uploadCSV(file, selectedChannel);
      toast.success("CSV uploaded successfully!", { description: `${file.name} processed as ${selectedChannel}.` });
      if (res?.report) {
        setLastReport({ filename: file.name, ...res.report });
      }
      await refreshData();
    } catch (err: any) {
      setConnectionError(err.message);
      toast.error("Upload failed", { description: err.message });
      await refreshData();
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, filename: string) => {
    try {
      await deleteUpload(id);
      toast.success("Deleted", { description: `${filename} removed.` });
      await refreshData();
    } catch (err: any) {
      toast.error("Delete failed", { description: err.message });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = "";
  };

  const channelColor: Record<string, string> = {
    POS: "#F53799",
    Shopee: "#EE4D2D",
    TikTok: "#000000",
    "TikTok Shop": "#000000",
    PetHub: "#3AE4FA",
  };

  return (
    <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-5">
      <div>
        <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
          Data Ingestion Center
        </h2>
        <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
          Upload CSV/Excel files from POS, Shopee, TikTok, or PetHub to power your analytics. Totals below cover all uploaded data.
        </p>
      </div>

      {connectionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="font-semibold">Upload needs attention</div>
          <div className="mt-1">{connectionError}</div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "All Records", value: metrics?.totalRecords?.toLocaleString() || "0", icon: Database, color: "#F53799" },
          { label: "All Transactions", value: metrics?.totalTransactions?.toLocaleString() || "0", icon: Hash, color: "#3AE4FA" },
          { label: "All Quantity Sold", value: metrics?.totalQuantity?.toLocaleString() || "0", icon: ShoppingCart, color: "#0EA5E9" },
          { label: "All Revenue", value: `₱${(metrics?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: "#F53799" },
          { label: "Channels", value: Object.keys(metrics?.channels || {}).length.toString(), icon: Radio, color: "#7C3AED" },
        ].map((card) => (
          <div key={card.label} className="flex items-center gap-2 bg-[#FFF2FA] border border-[#FFD9EC] rounded-xl px-3 py-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${card.color}, ${card.color}dd)` }}>
              <card.icon className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-[#223047] opacity-60 truncate">{card.label}</div>
              <div className="text-sm font-bold text-[#223047]">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Channel Breakdown */}
      {metrics?.channels && Object.keys(metrics.channels).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(metrics.channels).map(([ch, data]) => (
            <Badge key={ch} className="text-xs px-3 py-1" style={{ backgroundColor: channelColor[ch] || "#666", color: "#fff" }}>
              {ch}: {data.count} records • ₱{data.revenue.toLocaleString()}
            </Badge>
          ))}
        </div>
      )}

      {/* Channel Selector + Upload Dropzone */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label className="text-sm font-semibold text-[#223047]">CSV Category:</label>
          <div className="flex flex-wrap gap-2">
            {CHANNEL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedChannel(opt.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all text-sm font-medium ${
                  selectedChannel === opt.value
                    ? "border-[#F53799] bg-[#FFF2FA] text-[#223047]"
                    : "border-[#FFD9EC] bg-white text-[#223047] opacity-70 hover:border-[#F53799] hover:opacity-100"
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
                <span>{opt.label}</span>
                <span className="text-xs opacity-50">({opt.description})</span>
              </button>
            ))}
          </div>
        </div>

        <div
          className={`border-2 border-dashed rounded-2xl p-6 md:p-8 text-center transition-all cursor-pointer ${
            dragActive ? "border-[#F53799] bg-[#FFF2FA]" : "border-[#FFD9EC] hover:border-[#F53799] hover:bg-[#FFF7FB]"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById("csv-upload-input")?.click()}
        >
          <input id="csv-upload-input" type="file" accept=".csv,.xlsx,.xls" onChange={handleFileInput} className="hidden" />
          <Upload className={`w-8 h-8 mx-auto mb-3 ${uploading ? "animate-bounce text-[#F53799]" : "text-[#223047] opacity-40"}`} />
          <p className="text-sm font-semibold text-[#223047]">
            {uploading ? "Processing..." : "Drop CSV/Excel file here or click to browse"}
          </p>
          <p className="text-xs text-[#223047] opacity-50 mt-1">
            Maximum upload size: 100 MB
          </p>
          <p className="text-xs text-[#223047] opacity-50 mt-1">
            Uploading as <span className="font-bold text-[#F53799]">{selectedChannel}</span>
            {selectedChannel === "POS" || selectedChannel === "PetHub"
              ? " -> rows split into Cafe, Services & Retail by category"
              : " -> all rows go to Retail"}
          </p>
        </div>
      </div>

      {/* Latest Upload Report */}
      {lastReport && (
        <div className={`p-4 rounded-xl border ${lastReport.stage1_droppedCount > 0 || lastReport.stage1_duplicateCount > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-start gap-3">
            {lastReport.stage1_droppedCount > 0 || lastReport.stage1_duplicateCount > 0 ? (
              <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className={`text-sm font-bold ${lastReport.stage1_droppedCount > 0 || lastReport.stage1_duplicateCount > 0 ? 'text-orange-800' : 'text-green-800'}`}>
                {lastReport.filename} processed
              </h4>
              <p className={`text-xs mt-1 ${lastReport.stage1_droppedCount > 0 || lastReport.stage1_duplicateCount > 0 ? 'text-orange-700' : 'text-green-700'}`}>
                {lastReport.stage1_droppedCount > 0 || lastReport.stage1_duplicateCount > 0
                  ? `Dropped: ${lastReport.stage1_droppedCount} invalid rows, ${lastReport.stage1_duplicateCount} duplicates.`
                  : "All rows passed validation!"}
              </p>
              {lastReport.stage1_dropReasons && lastReport.stage1_dropReasons.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-semibold text-orange-800">Sample Errors:</p>
                  <ul className="text-[10px] text-orange-700 list-disc pl-4 space-y-0.5">
                    {lastReport.stage1_dropReasons.slice(0, 5).map((reason: string, i: number) => (
                      <li key={i}>{reason}</li>
                    ))}
                    {lastReport.stage1_dropReasons.length > 5 && (
                      <li className="italic">...and {lastReport.stage1_dropReasons.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload History */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-[#223047]">Upload History</h3>
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {uploads.map((upload) => (
              <div key={upload._id} className="flex items-center justify-between p-3 bg-[#FFF7FB] border border-[#FFD9EC] rounded-xl">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <FileSpreadsheet className="w-5 h-5 text-[#F53799] flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#223047] truncate">{upload.filename}</div>
                    <div className="text-xs text-[#223047] opacity-50">
                      {upload.recordCount} records • ₱{upload.totalRevenue.toLocaleString()} • {upload.channel}
                      {" • "}{new Date(upload.uploadedAt).toLocaleDateString()}
                    </div>
                    {upload.etlReport && (
                      <div className={`text-[10px] mt-1 ${(upload.etlReport.stage1_droppedCount || 0) > 0 || (upload.etlReport.stage1_duplicateCount || 0) > 0 ? "text-orange-500" : "text-green-500"}`}>
                        {(upload.etlReport.stage1_droppedCount || 0) > 0 || (upload.etlReport.stage1_duplicateCount || 0) > 0 
                          ? `Stage 1: ${upload.etlReport.stage1_droppedCount || 0} dropped, ${upload.etlReport.stage1_duplicateCount || 0} dupes`
                          : "Stage 1: 100% Valid"}
                        {upload.etlReport.stage2_droppedCount ? ` | Stage 2 DB Errors: ${upload.etlReport.stage2_droppedCount}` : ""}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-2">
                  {upload.etlReport && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm" variant="outline"
                          className="border-[#FFD9EC] text-[#F53799] hover:bg-[#FFF0F7] flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent onClick={(e) => e.stopPropagation()}>
                        <DialogHeader>
                          <DialogTitle>ETL Summary Report</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto mt-2 pr-2">
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Stage 1: Data Validation</h4>
                            <p className="text-sm text-gray-600">Dropped Rows: {upload.etlReport.stage1_droppedCount || 0}</p>
                            <p className="text-sm text-gray-600">Exact Duplicates: {upload.etlReport.stage1_duplicateCount || 0}</p>
                            {(upload.etlReport.stage1_dropReasons?.length || 0) > 0 && (
                              <div className="mt-2 bg-orange-50 p-3 rounded-lg text-xs text-orange-800 border border-orange-100">
                                <span className="font-semibold text-sm">Drop Reasons:</span>
                                <ul className="list-disc pl-4 mt-2 space-y-1 font-mono text-[11px] max-h-[150px] overflow-y-auto">
                                  {upload.etlReport.stage1_dropReasons?.map((reason, i) => (
                                    <li key={i}>{reason}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          {upload.etlReport.stage2_droppedCount !== undefined && (
                            <div>
                              <h4 className="font-semibold text-sm mb-1">Stage 2: Database Ingestion</h4>
                              <p className="text-sm text-gray-600">DB Insert Errors: {upload.etlReport.stage2_droppedCount}</p>
                              {(upload.etlReport.stage2_dropReasons?.length || 0) > 0 && (
                                <div className="mt-2 bg-red-50 p-3 rounded-lg text-xs text-red-800 border border-red-100">
                                  <span className="font-semibold text-sm">DB Error Logs:</span>
                                  <ul className="list-disc pl-4 mt-2 space-y-1 font-mono text-[11px] max-h-[150px] overflow-y-auto">
                                    {upload.etlReport.stage2_dropReasons?.map((reason, i) => (
                                      <li key={i}>{reason}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  <Button
                    size="sm" variant="outline"
                    className="border-red-200 text-red-500 hover:bg-red-50 flex-shrink-0"
                    onClick={(e) => { e.stopPropagation(); handleDelete(upload._id, upload.filename); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { AlertTriangle, XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface ModelDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ModelDetailsModal({ isOpen, onClose }: ModelDetailsModalProps) {
  const errorLogs = [
    {
      timestamp: "2026-04-28 14:32:15",
      level: "ERROR",
      message: "Insufficient training data: Only 847 samples available, minimum 1000 required",
    },
    {
      timestamp: "2026-04-28 14:32:18",
      level: "WARNING",
      message: "Data quality check failed: 12% missing values in feature 'transaction_amount'",
    },
    {
      timestamp: "2026-04-28 14:32:20",
      level: "ERROR",
      message: "Model convergence failed after 500 iterations (max allowed)",
    },
    {
      timestamp: "2026-04-28 14:32:22",
      level: "INFO",
      message: "Rollback initiated: Reverting to previous model version (v2.3.1)",
    },
  ];

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-4 mb-2">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#EF444420" }}
            >
              <AlertTriangle className="w-6 h-6" style={{ color: "#EF4444" }} />
            </div>
            <AlertDialogTitle className="text-xl">Model Training Failure Details</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base pt-2">
            Detailed error logs from the model training attempt
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="max-h-[400px] overflow-y-auto space-y-2 bg-[#FFF7FB] border border-[#FFD9EC] rounded-lg p-4">
          {errorLogs.map((log, idx) => (
            <div
              key={idx}
              className="p-3 bg-white border border-[#FFD9EC] rounded-lg space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#223047] opacity-60">
                  {log.timestamp}
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    log.level === "ERROR"
                      ? "bg-red-100 text-red-700"
                      : log.level === "WARNING"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {log.level}
                </span>
              </div>
              <p className="text-sm text-[#223047]">{log.message}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg p-4">
          <h4 className="text-sm font-semibold text-[#223047] mb-2">Recommendations:</h4>
          <ul className="text-sm text-[#223047] space-y-1 list-disc list-inside">
            <li>Collect at least 153 more training samples before retrying</li>
            <li>Clean missing values in transaction_amount column</li>
            <li>Consider using a simpler model architecture</li>
          </ul>
        </div>

        <AlertDialogFooter>
          <AlertDialogAction
            onClick={onClose}
            className="bg-[#F53799] hover:bg-[#D42A7D]"
          >
            Close
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

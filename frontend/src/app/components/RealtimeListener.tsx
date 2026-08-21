import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { clearApiCache } from "../lib/api";

type RealtimeEventType =
  | "upload_processed"
  | "etl_started"
  | "etl_completed"
  | "etl_failed"
  | "forecast_warmup_started"
  | "forecast_ready"
  | "forecast_failed"
  | "campaign_publish_started"
  | "campaign_published"
  | "campaign_publish_failed";

type RealtimeEvent = {
  type: RealtimeEventType;
  title: string;
  message?: string;
  module?: string;
  uploadId?: string;
  campaignId?: string;
  timestamp: string;
  data?: Record<string, unknown>;
};

const CACHE_INVALIDATING_EVENTS = new Set<RealtimeEventType>([
  "upload_processed",
  "etl_completed",
  "forecast_ready",
  "campaign_published",
]);

const QUIET_EVENTS = new Set<RealtimeEventType>([
  "forecast_warmup_started",
]);

function resolveRealtimeUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_WS_URL?.trim();
  if (explicitUrl) return explicitUrl.replace(/\/$/, "");

  const apiUrl =
    process.env.NEXT_PUBLIC_UPLOAD_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3001/api";

  return apiUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
}

function showRealtimeToast(event: RealtimeEvent) {
  if (QUIET_EVENTS.has(event.type)) return;

  const options = event.message ? { description: event.message } : undefined;

  if (event.type.endsWith("_failed")) {
    toast.error(event.title, options);
    return;
  }

  if (
    event.type === "upload_processed" ||
    event.type === "etl_completed" ||
    event.type === "forecast_ready" ||
    event.type === "campaign_published"
  ) {
    toast.success(event.title, options);
    return;
  }

  toast.info(event.title, options);
}

export function RealtimeListener() {
  useEffect(() => {
    let socket: Socket | undefined;

    try {
      socket = io(`${resolveRealtimeUrl()}/realtime`, {
        transports: ["websocket", "polling"],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      socket.on("woof:event", (event: RealtimeEvent) => {
        if (CACHE_INVALIDATING_EVENTS.has(event.type)) {
          clearApiCache();
        }

        window.dispatchEvent(
          new CustomEvent("woof:realtime", { detail: event }),
        );
        showRealtimeToast(event);
      });
    } catch (error) {
      console.warn("Realtime listener unavailable", error);
    }

    return () => {
      socket?.disconnect();
    };
  }, []);

  return null;
}

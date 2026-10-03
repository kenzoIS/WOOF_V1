import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { generateLlmExplanation } from "../lib/api";

type ExplanationFeature =
  | "descriptive_explanation"
  | "predictive_explanation"
  | "prescriptive_explanation";

interface GenAiExplanationCardProps {
  feature: ExplanationFeature;
  title: string;
  prompt: string;
  context: Record<string, unknown>;
}

export function GenAiExplanationCard({
  feature,
  title,
  prompt,
  context,
}: GenAiExplanationCardProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const contextKey = useMemo(() => JSON.stringify(context), [context]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    generateLlmExplanation({ feature, prompt, context })
      .then((response: any) => {
        if (cancelled) return;
        if (response?.configured === false || response?.provider === "fallback") {
          setError("GLM_API_KEY was not loaded by the running backend. Check apps/backend/.env, then restart the backend.");
          return;
        }
        setText(String(response?.text || ""));
      }).catch((reason: unknown) => {
        if (cancelled) return;
        const message = reason instanceof Error ? reason.message : "Unknown provider error";
        if (/\b401\b/.test(message)) {
          setError("GLM/OpenRouter rejected the API key (401). Check that the key is active and authorized for this account.");
        } else if (/\b402\b/.test(message)) {
          setError("OpenRouter rejected the request for billing or credit reasons (402). Check the account balance and limits.");
        } else if (/\b404\b/.test(message)) {
          setError("OpenRouter could not find or serve the configured GLM model (404). Check GLM_MODEL and provider availability.");
        } else if (/\b429\b/.test(message)) {
          setError("GLM/OpenRouter rate limit reached (429). Wait briefly and try again.");
        } else if (/backend unavailable|failed to fetch|networkerror/i.test(message)) {
          setError("The WOOF backend could not be reached. Check that it is running and that the frontend API URL is correct.");
        } else {
          setError(`GLM request failed: ${message}`);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [contextKey, feature, prompt]);

  const displayText = text || "No generated explanation is available for the current data yet.";

  return (
    <section className="rounded-xl border border-[#FFD9EC] bg-[#FFF7FB] p-5 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-[#F53799]" />
        <h2 className="font-semibold text-[#223047]">{title}</h2>
        <span className="rounded-full bg-[#E6FAFF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#08768A]">
          Gen AI
        </span>
      </div>
      {loading ? (
        <div className="space-y-2" aria-label="Generating explanation">
          <div className="h-3 w-11/12 animate-pulse rounded bg-[#FFD9EC]" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-[#FFD9EC]" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-[#FFD9EC]" />
        </div>
      ) : (
        <p className={`whitespace-pre-wrap text-sm leading-6 ${error ? "text-amber-700" : "text-[#4A5568]"}`}>
          {error || displayText}
        </p>
      )}
    </section>
  );
}

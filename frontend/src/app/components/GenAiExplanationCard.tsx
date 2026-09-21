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
  const [error, setError] = useState(false);
  const contextKey = useMemo(() => JSON.stringify(context), [context]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    generateLlmExplanation({ feature, prompt, context })
      .then((response: any) => {
        if (!cancelled) setText(String(response?.text || ""));
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [contextKey, feature, prompt]);

  const displayText = error
    ? "The Gen AI explanation is temporarily unavailable. The dashboard data is still available, but the GLM provider could not return a narrative right now."
    : text || "No generated explanation is available for the current data yet.";

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
        <p className={`text-sm leading-6 ${error ? "text-amber-700" : "text-[#4A5568]"}`}>
          {displayText}
        </p>
      )}
    </section>
  );
}

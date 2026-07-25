import { useEffect, useState } from "react";
import { Megaphone, Sparkles, Send, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import {
  generateActivationCampaign,
  getActivationCampaigns,
  getActivationRecommendations,
  updateActivationCampaignStatus,
} from "../lib/api";

interface ActivationRecommendation {
  id: string;
  source: string;
  title: string;
  featuredItems: string[];
  promoMechanic: string;
  targetSegment: string;
  expectedLift: string;
  confidence: string;
  reason: string;
}

interface Campaign {
  campaignId: string;
  title: string;
  source: string;
  status: "draft" | "approved" | "queued" | "published";
  featuredItems: string[];
  promoMechanic: string;
  targetSegment: string;
  generatedAssets: {
    headline: string;
    shortCaption: string;
    longCaption: string;
    callToAction: string;
    pushNotification: string;
    petHubBannerText: string;
    termsAndConditions: string[];
    pubmatPrompt: string;
  };
}

const statusColor: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  approved: "bg-emerald-100 text-emerald-700",
  queued: "bg-[#FFF2FA] text-[#F53799]",
  published: "bg-[#E9FBFC] text-[#0D9488]",
};

export function CampaignActivationLayer() {
  const [recommendations, setRecommendations] = useState<ActivationRecommendation[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const [recommendationsRes, campaignsRes] = await Promise.all([
        getActivationRecommendations(),
        getActivationCampaigns(),
      ]);
      setRecommendations(recommendationsRes.recommendations || []);
      setCampaigns(campaignsRes.campaigns || []);
      setSelectedCampaign((campaignsRes.campaigns || [])[0] || null);
    } catch (error: any) {
      toast.error("Activation layer unavailable", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleGenerate = async (recommendation: ActivationRecommendation) => {
    setGeneratingId(recommendation.id);
    try {
      const result = await generateActivationCampaign(recommendation);
      const campaign = result.campaign as Campaign;
      setCampaigns((current) => [campaign, ...current]);
      setSelectedCampaign(campaign);
      toast.success("Campaign draft generated", {
        description: campaign.generatedAssets.headline,
      });
    } catch (error: any) {
      toast.error("Campaign generation failed", {
        description: error.message,
      });
    } finally {
      setGeneratingId(null);
    }
  };

  const handleQueue = async (campaign: Campaign) => {
    try {
      const result = await updateActivationCampaignStatus(campaign.campaignId, "queued");
      const updated = result.campaign as Campaign;
      setCampaigns((current) =>
        current.map((item) => item.campaignId === updated.campaignId ? updated : item),
      );
      setSelectedCampaign(updated);
      toast.success("Campaign queued for PetHub", {
        description: "Publishing can be wired once PetHub repository access is ready.",
      });
    } catch (error: any) {
      toast.error("Status update failed", {
        description: error.message,
      });
    }
  };

  const handleApprove = async (campaign: Campaign) => {
    try {
      const result = await updateActivationCampaignStatus(campaign.campaignId, "approved");
      const updated = result.campaign as Campaign;
      setCampaigns((current) =>
        current.map((item) => item.campaignId === updated.campaignId ? updated : item),
      );
      setSelectedCampaign(updated);
      toast.success("Campaign approved", {
        description: "This campaign is ready to queue for PetHub activation.",
      });
    } catch (error: any) {
      toast.error("Approval failed", {
        description: error.message,
      });
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F53799] to-[#3AE4FA] flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
                Campaign Activation Layer
              </h2>
              <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
                Converts WOOF promo recommendations into AI-assisted PetHub campaign drafts.
              </p>
            </div>
          </div>
          <Button variant="outline" className="border-[#FFD9EC]" onClick={refresh} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-5">
        <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base md:text-lg font-bold text-[#223047]">Promo Inputs</h3>
            <Badge className="bg-[#3AE4FA] text-white">{recommendations.length} Ready</Badge>
          </div>

          {recommendations.length === 0 && (
            <div className="p-4 bg-[#FFF7FB] border border-[#FFD9EC] rounded-xl text-sm text-[#223047] opacity-70">
              Upload/sync transaction data first to generate promo recommendations.
            </div>
          )}

          <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
            {recommendations.map((recommendation) => (
              <div key={recommendation.id} className="border border-[#FFD9EC] bg-[#FFF7FB] rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-[#F53799] text-[#F53799]">
                    {recommendation.source.replace(/_/g, " ")}
                  </Badge>
                  <Badge className="bg-white text-[#223047] border border-[#FFD9EC]">
                    {recommendation.confidence}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm md:text-base font-bold text-[#223047]">{recommendation.title}</h4>
                  <p className="text-xs md:text-sm text-[#223047] opacity-70 mt-1" style={{ lineHeight: "1.5" }}>
                    {recommendation.reason}
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 text-xs text-[#223047]">
                  <div className="bg-white rounded-lg border border-[#FFD9EC] p-2">
                    <span className="opacity-50">Mechanic</span>
                    <div className="font-semibold">{recommendation.promoMechanic}</div>
                  </div>
                  <div className="bg-white rounded-lg border border-[#FFD9EC] p-2">
                    <span className="opacity-50">Expected Lift</span>
                    <div className="font-semibold">{recommendation.expectedLift}</div>
                  </div>
                </div>
                <Button
                  className="bg-[#F53799] hover:bg-[#D42A7D] w-full"
                  onClick={() => handleGenerate(recommendation)}
                  disabled={generatingId === recommendation.id}
                >
                  {generatingId === recommendation.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Generate Campaign Assets
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base md:text-lg font-bold text-[#223047]">Campaign Drafts</h3>
            <Badge className="bg-[#FFF2FA] text-[#F53799]">{campaigns.length} Drafts</Badge>
          </div>

          {selectedCampaign ? (
            <div className="space-y-4">
              <div className="border border-[#FFD9EC] rounded-xl p-4 bg-[#FFF7FB]">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge className={statusColor[selectedCampaign.status] || statusColor.draft}>
                    {selectedCampaign.status.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="border-[#3AE4FA] text-[#0D9488]">
                    {selectedCampaign.source.replace(/_/g, " ")}
                  </Badge>
                </div>
                <h4 className="text-lg font-bold text-[#223047]">{selectedCampaign.generatedAssets.headline}</h4>
                <p className="text-sm text-[#223047] opacity-70 mt-2" style={{ lineHeight: "1.6" }}>
                  {selectedCampaign.generatedAssets.longCaption}
                </p>
              </div>

              <div className="grid gap-3">
                <AssetBlock label="PetHub Banner" value={selectedCampaign.generatedAssets.petHubBannerText} />
                <AssetBlock label="Short Caption" value={selectedCampaign.generatedAssets.shortCaption} />
                <AssetBlock label="Push Notification" value={selectedCampaign.generatedAssets.pushNotification} />
                <AssetBlock label="Pubmat Prompt" value={selectedCampaign.generatedAssets.pubmatPrompt} />
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  className="bg-[#0D9488] hover:bg-[#0F766E] flex-1"
                  onClick={() => handleQueue(selectedCampaign)}
                  disabled={selectedCampaign.status === "queued" || selectedCampaign.status === "published"}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Queue for PetHub
                </Button>
                <Button
                  variant="outline"
                  className="border-[#FFD9EC] flex-1"
                  onClick={() => handleApprove(selectedCampaign)}
                  disabled={selectedCampaign.status !== "draft"}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve Draft
                </Button>
              </div>

              {campaigns.length > 1 && (
                <div className="space-y-2">
                  {campaigns.slice(0, 6).map((campaign) => (
                    <button
                      key={campaign.campaignId}
                      onClick={() => setSelectedCampaign(campaign)}
                      className={`w-full text-left border rounded-xl px-3 py-2 text-sm transition-all ${
                        selectedCampaign.campaignId === campaign.campaignId
                          ? "border-[#F53799] bg-[#FFF2FA]"
                          : "border-[#FFD9EC] hover:bg-[#FFF7FB]"
                      }`}
                    >
                      <div className="font-semibold text-[#223047] truncate">{campaign.title}</div>
                      <div className="text-xs text-[#223047] opacity-50">{campaign.status}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 bg-[#FFF7FB] border border-[#FFD9EC] rounded-xl text-sm text-[#223047] opacity-70">
              Generate a campaign from a promo input to preview PetHub-ready materials.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AssetBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#FFD9EC] rounded-xl p-3">
      <div className="text-xs font-semibold text-[#F53799] mb-1">{label}</div>
      <div className="text-sm text-[#223047]" style={{ lineHeight: "1.5" }}>{value}</div>
    </div>
  );
}

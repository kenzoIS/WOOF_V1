import { useState } from "react";
import { MessageSquareHeart, TrendingUp, TrendingDown, ThumbsUp, ThumbsDown, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { toast } from "sonner";
import feedbackMascot from "../../imports/no_bg_Insight.png";

interface DeployedPromotion {
  id: string;
  type: "bundle" | "discount" | "happy-hour" | "flash-sale";
  title: string;
  deployedDate: string;
  targetTime: string;
  discount: string;
  predictedLift: string;
  actualLift: string | null;
  confidence: string;
  sector: string;
  status: "active" | "completed" | "failed";
  feedback: "helpful" | "not-helpful" | null;
}

const deployedPromotions: DeployedPromotion[] = [
  {
    id: "1",
    type: "bundle",
    title: "Cappuccino + Full Grooming Bundle",
    deployedDate: "Apr 14, 2026",
    targetTime: "2:00 PM - 5:00 PM",
    discount: "15% off combo",
    predictedLift: "+₱4,250",
    actualLift: "+₱4,680",
    confidence: "92%",
    sector: "Cafe + Services",
    status: "completed",
    feedback: null,
  },
  {
    id: "2",
    type: "flash-sale",
    title: "Flash Sale: Premium Dog Food",
    deployedDate: "Apr 14, 2026",
    targetTime: "6:00 PM",
    discount: "20% off",
    predictedLift: "+₱2,890",
    actualLift: "+₱3,120",
    confidence: "87%",
    sector: "Retail",
    status: "completed",
    feedback: null,
  },
  {
    id: "3",
    type: "happy-hour",
    title: "Happy Hour: All Beverages",
    deployedDate: "Apr 13, 2026",
    targetTime: "3:00 PM - 4:00 PM",
    discount: "Buy 1 Get 1",
    predictedLift: "+₱1,650",
    actualLift: "+₱1,820",
    confidence: "84%",
    sector: "Cafe",
    status: "completed",
    feedback: null,
  },
  {
    id: "4",
    type: "bundle",
    title: "Pet Spa + Cafe Combo",
    deployedDate: "Apr 12, 2026",
    targetTime: "11:00 AM - 3:00 PM",
    discount: "10% off combo",
    predictedLift: "+₱3,200",
    actualLift: "+₱2,450",
    confidence: "78%",
    sector: "Cafe + Services",
    status: "completed",
    feedback: null,
  },
  {
    id: "5",
    type: "discount",
    title: "Weekend Special: Pet Accessories",
    deployedDate: "Apr 11, 2026",
    targetTime: "All day",
    discount: "25% off",
    predictedLift: "+₱5,400",
    actualLift: "+₱6,100",
    confidence: "90%",
    sector: "Retail",
    status: "completed",
    feedback: null,
  },
  {
    id: "6",
    type: "bundle",
    title: "Birthday Package Deal",
    deployedDate: "Apr 15, 2026",
    targetTime: "1:00 PM - 6:00 PM",
    discount: "20% off package",
    predictedLift: "+₱4,800",
    actualLift: null,
    confidence: "88%",
    sector: "Services + Cafe",
    status: "active",
    feedback: null,
  },
];

export function Feedback() {
  const [promotions, setPromotions] = useState(deployedPromotions);
  const [isRecalibrating, setIsRecalibrating] = useState(false);

  const handleFeedback = (id: string, helpful: boolean) => {
    setPromotions(prev =>
      prev.map(p => (p.id === id ? { ...p, feedback: helpful ? "helpful" : "not-helpful" } : p))
    );

    toast.success(helpful ? "Feedback recorded!" : "Feedback recorded", {
      description: helpful
        ? "WOOF will learn from this successful pattern."
        : "Generating alternative suggestions...",
    });

    if (!helpful) {
      setTimeout(() => {
        toast.info("Alternative suggestion ready", {
          description: "Check your notifications for new recommendations.",
        });
      }, 2000);
    }
  };

  const handleRecalibrate = () => {
    setIsRecalibrating(true);
    toast.info("Starting system recalibration...", {
      description: "Analyzing feedback patterns and retraining models.",
    });

    setTimeout(() => {
      setIsRecalibrating(false);
      toast.success("Recalibration complete!", {
        description: "Models updated with latest feedback data.",
      });
    }, 3000);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "bundle":
        return "bg-[#F53799]";
      case "discount":
        return "bg-[#3AE4FA]";
      case "happy-hour":
        return "bg-[#D42A7D]";
      case "flash-sale":
        return "bg-[#5CE1E6]";
      default:
        return "bg-[#FFD9EC]";
    }
  };

  const getSectorColor = (sector: string) => {
    if (sector.includes("Cafe") && sector.includes("Services")) return "#F53799";
    if (sector.includes("Cafe")) return "#F53799";
    if (sector.includes("Services")) return "#3AE4FA";
    if (sector.includes("Retail")) return "#D42A7D";
    return "#5CE1E6";
  };

  const calculateAccuracy = (predicted: string, actual: string | null) => {
    if (!actual) return null;
    const predVal = parseInt(predicted.replace(/[^0-9]/g, ""));
    const actVal = parseInt(actual.replace(/[^0-9]/g, ""));
    const accuracy = ((1 - Math.abs(predVal - actVal) / predVal) * 100).toFixed(1);
    return parseFloat(accuracy);
  };

  const completedPromotions = promotions.filter(p => p.status === "completed");
  const activePromotions = promotions.filter(p => p.status === "active");
  const helpfulCount = completedPromotions.filter(p => p.feedback === "helpful").length;
  const notHelpfulCount = completedPromotions.filter(p => p.feedback === "not-helpful").length;
  const pendingFeedback = completedPromotions.filter(p => p.feedback === null).length;
  
  const avgAccuracy =
    completedPromotions
      .map(p => calculateAccuracy(p.predictedLift, p.actualLift))
      .filter(a => a !== null)
      .reduce((sum, a) => sum + (a || 0), 0) / completedPromotions.length;

  return (
    <div className="space-y-6 md:space-y-8 lg:space-y-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-4 md:gap-6">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl lg:text-[36px] font-extrabold text-[#223047]">
            Feedback & Learning Center
          </h1>
          <p className="text-sm md:text-base text-[#223047] opacity-60 mt-2" style={{ lineHeight: "1.6" }}>
            Review deployed promotions and provide feedback to improve WOOF's recommendations
          </p>
        </div>
        <Button
          onClick={handleRecalibrate}
          disabled={isRecalibrating}
          className="bg-[#F53799] hover:bg-[#D42A7D] gap-2 w-full md:w-auto"
        >
          {isRecalibrating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">Recalibrating...</span>
              <span className="sm:hidden">Recalibrating</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Recalibrate System</span>
              <span className="sm:hidden">Recalibrate</span>
            </>
          )}
        </Button>
      </div>

      {/* SYSTEM PERFORMANCE OVERVIEW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-2 md:space-y-3 lg:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs md:text-sm font-medium text-[#223047] opacity-70">
              Total Deployed
            </h3>
            <MessageSquareHeart className="w-4 h-4 md:w-5 md:h-5 text-[#F53799]" />
          </div>
          <div className="text-2xl md:text-3xl lg:text-[44px] font-extrabold text-[#223047] leading-none">
            {promotions.length}
          </div>
          <p className="text-xs text-[#223047] opacity-50 hidden md:block">
            {activePromotions.length} active, {completedPromotions.length} completed
          </p>
        </div>

        <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-2 md:space-y-3 lg:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs md:text-sm font-medium text-[#223047] opacity-70">
              Avg Accuracy
            </h3>
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-[#3AE4FA]" />
          </div>
          <div className="text-2xl md:text-3xl lg:text-[44px] font-extrabold text-[#223047] leading-none">
            {avgAccuracy.toFixed(1)}%
          </div>
          <Progress value={avgAccuracy} className="h-2 hidden md:block" />
        </div>

        <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-2 md:space-y-3 lg:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs md:text-sm font-medium text-[#223047] opacity-70">
              Helpful Feedback
            </h3>
            <ThumbsUp className="w-4 h-4 md:w-5 md:h-5 text-[#F53799]" />
          </div>
          <div className="text-2xl md:text-3xl lg:text-[44px] font-extrabold text-[#223047] leading-none">
            {helpfulCount}
          </div>
          <p className="text-xs text-[#223047] opacity-50 hidden md:block">
            {notHelpfulCount} not helpful, {pendingFeedback} pending
          </p>
        </div>

        <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-2 md:space-y-3 lg:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs md:text-sm font-medium text-[#223047] opacity-70">
              Learning Rate
            </h3>
            <RefreshCw className="w-4 h-4 md:w-5 md:h-5 text-[#5CE1E6]" />
          </div>
          <div className="text-2xl md:text-3xl lg:text-[44px] font-extrabold text-[#223047] leading-none">
            High
          </div>
          <p className="text-xs text-[#223047] opacity-50 hidden md:block">
            System actively learning
          </p>
        </div>
      </div>

      {/* VISUAL RELIEF DIVIDER - AI INSIGHT WITH MASCOT */}
      <div
        className="rounded-2xl flex items-center justify-between px-4 md:px-6 lg:px-8 py-4 relative overflow-hidden"
        style={{ background: "linear-gradient(to right, #FFF7FB, #FFF2FA)" }}
      >
        <div className="flex-1">
          <div className="mb-2">
            <Badge variant="outline" className="text-xs">
              WOOF AI Insight
            </Badge>
          </div>
          <p className="text-sm md:text-base italic text-[#223047] opacity-70" style={{ lineHeight: "1.6" }}>
            "Your feedback helps WOOF learn and improve. Recent feedback has increased prediction accuracy by 8.3%."
          </p>
        </div>
        <img
          src={feedbackMascot.src}
          alt="Feedback Mascot"
          className="w-24 h-24 md:w-32 md:h-32 object-contain flex-shrink-0 ml-4 md:ml-6"
        />
      </div>

      {/* ACTIVE PROMOTIONS */}
      {activePromotions.length > 0 && (
        <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
          <div>
            <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
              Active Promotions
            </h2>
            <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
              Currently running promotions awaiting results
            </p>
          </div>

          <div className="grid gap-3 md:gap-4">
            {activePromotions.map((promo) => (
              <div
                key={promo.id}
                className="p-4 md:p-6 bg-[#FFF7FB] border border-[#FFD9EC] rounded-xl md:rounded-2xl space-y-3 md:space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                      <Badge className={`${getTypeColor(promo.type)} text-white hover:${getTypeColor(promo.type)} text-xs`}>
                        {promo.type.replace("-", " ").toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="border-green-500 text-green-600 text-xs">
                        ● ACTIVE
                      </Badge>
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-[#223047] mb-2 md:mb-3">
                      {promo.title}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4 text-xs md:text-sm">
                      <div>
                        <span className="text-[#223047] opacity-60">Target Time:</span>
                        <span className="ml-2 font-semibold text-[#223047]">{promo.targetTime}</span>
                      </div>
                      <div>
                        <span className="text-[#223047] opacity-60">Discount:</span>
                        <span className="ml-2 font-semibold text-[#223047]">{promo.discount}</span>
                      </div>
                      <div>
                        <span className="text-[#223047] opacity-60">Predicted Lift:</span>
                        <span className="ml-2 font-bold text-[#F53799]">{promo.predictedLift}</span>
                      </div>
                      <div>
                        <span className="text-[#223047] opacity-60">Confidence:</span>
                        <span className="ml-2 font-semibold text-[#223047]">{promo.confidence}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMPLETED PROMOTIONS - FEEDBACK SECTION */}
      <div className="bg-white border border-[#FFD9EC] rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div>
          <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-[#223047]">
            Completed Promotions
          </h2>
          <p className="text-xs md:text-sm text-[#223047] opacity-60 mt-1" style={{ lineHeight: "1.6" }}>
            Review performance and provide feedback to improve future recommendations
          </p>
        </div>

        <div className="grid gap-4 md:gap-6">
          {completedPromotions.map((promo) => {
            const accuracy = calculateAccuracy(promo.predictedLift, promo.actualLift);
            const isPositive = accuracy !== null && accuracy >= 90;

            return (
              <div
                key={promo.id}
                className={`p-4 md:p-6 lg:p-8 border-2 rounded-xl md:rounded-2xl space-y-4 md:space-y-6 transition-all ${
                  promo.feedback === "helpful"
                    ? "bg-green-50 border-green-300"
                    : promo.feedback === "not-helpful"
                    ? "bg-orange-50 border-orange-300"
                    : "bg-white border-[#FFD9EC] hover:border-[#F53799]"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2 md:mb-3">
                      <Badge className={`${getTypeColor(promo.type)} text-white hover:${getTypeColor(promo.type)} text-xs`}>
                        {promo.type.replace("-", " ").toUpperCase()}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{ borderColor: getSectorColor(promo.sector), color: getSectorColor(promo.sector) }}
                      >
                        {promo.sector}
                      </Badge>
                      <span className="text-xs text-[#223047] opacity-50">{promo.deployedDate}</span>
                    </div>

                    <h3 className="text-base md:text-lg lg:text-xl font-bold text-[#223047] mb-3 md:mb-4">
                      {promo.title}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6 mb-4 md:mb-6">
                      <div>
                        <div className="text-xs text-[#223047] opacity-60 mb-1">Target Time</div>
                        <div className="text-sm md:text-base font-semibold text-[#223047]">{promo.targetTime}</div>
                      </div>
                      <div>
                        <div className="text-xs text-[#223047] opacity-60 mb-1">Discount</div>
                        <div className="text-sm md:text-base font-semibold text-[#223047]">{promo.discount}</div>
                      </div>
                      <div>
                        <div className="text-xs text-[#223047] opacity-60 mb-1">Confidence</div>
                        <div className="text-sm md:text-base font-semibold text-[#223047]">{promo.confidence}</div>
                      </div>
                    </div>

                    {/* Performance Comparison */}
                    <div className="grid grid-cols-3 gap-3 md:gap-4 p-4 md:p-6 bg-[#FFF7FB] rounded-lg md:rounded-xl">
                      <div className="text-center">
                        <div className="text-xs text-[#223047] opacity-60 mb-1 md:mb-2">Predicted Lift</div>
                        <div className="text-lg md:text-xl lg:text-2xl font-bold text-[#223047]">{promo.predictedLift}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-[#223047] opacity-60 mb-1 md:mb-2">Actual Lift</div>
                        <div className="text-lg md:text-xl lg:text-2xl font-bold text-[#F53799]">{promo.actualLift}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-[#223047] opacity-60 mb-1 md:mb-2">Accuracy</div>
                        <div className={`text-lg md:text-xl lg:text-2xl font-bold flex items-center justify-center gap-1 md:gap-2 ${
                          isPositive ? "text-green-600" : "text-orange-600"
                        }`}>
                          {accuracy !== null && (
                            <>
                              {isPositive ? <TrendingUp className="w-4 h-4 md:w-5 md:h-5" /> : <TrendingDown className="w-4 h-4 md:w-5 md:h-5" />}
                              {accuracy.toFixed(1)}%
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feedback Section */}
                <div className="pt-4 md:pt-6 border-t border-[#FFD9EC]">
                  {promo.feedback === null ? (
                    <div className="space-y-2 md:space-y-3">
                      <p className="text-xs md:text-sm font-semibold text-[#223047]">
                        Was this recommendation helpful?
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                        <Button
                          onClick={() => handleFeedback(promo.id, true)}
                          className="flex-1 bg-green-600 hover:bg-green-700 gap-2 text-xs md:text-sm"
                        >
                          <ThumbsUp className="w-3 h-3 md:w-4 md:h-4" />
                          <span className="hidden sm:inline">Yes, Helpful</span>
                          <span className="sm:hidden">Helpful</span>
                        </Button>
                        <Button
                          onClick={() => handleFeedback(promo.id, false)}
                          variant="outline"
                          className="flex-1 border-[#FFD9EC] hover:bg-[#FFF2FA] gap-2 text-xs md:text-sm"
                        >
                          <ThumbsDown className="w-3 h-3 md:w-4 md:h-4" />
                          <span className="hidden sm:inline">No, Not Helpful</span>
                          <span className="sm:hidden">Not Helpful</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className={`p-3 md:p-4 rounded-lg md:rounded-xl ${
                      promo.feedback === "helpful" ? "bg-green-100" : "bg-orange-100"
                    }`}>
                      <div className="flex items-center gap-2 md:gap-3">
                        {promo.feedback === "helpful" ? (
                          <>
                            <ThumbsUp className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" />
                            <div>
                              <p className="text-xs md:text-sm font-semibold text-green-800">
                                Feedback Recorded: Helpful
                              </p>
                              <p className="text-xs text-green-700 hidden md:block">
                                WOOF is learning from this successful pattern.
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <ThumbsDown className="w-4 h-4 md:w-5 md:h-5 text-orange-600 flex-shrink-0" />
                            <div>
                              <p className="text-xs md:text-sm font-semibold text-orange-800">
                                Feedback Recorded: Not Helpful
                              </p>
                              <p className="text-xs text-orange-700 hidden md:block">
                                Alternative suggestions have been generated.
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* LEARNING INSIGHTS */}
      <div className="bg-gradient-to-br from-[#F53799] to-[#D42A7D] text-white rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-lg md:text-xl lg:text-[22px] font-bold">Learning Insights</h2>
            <p className="text-xs md:text-sm opacity-80 mt-1" style={{ lineHeight: "1.6" }}>
              How your feedback is improving the system
            </p>
          </div>
          <Sparkles className="w-6 h-6 md:w-8 md:h-8 opacity-80 flex-shrink-0" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-4 md:p-6">
            <div className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">+8.3%</div>
            <div className="text-xs md:text-sm opacity-90">Accuracy improvement from feedback</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-4 md:p-6">
            <div className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">12</div>
            <div className="text-xs md:text-sm opacity-90">Patterns learned this week</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-4 md:p-6">
            <div className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">94%</div>
            <div className="text-xs md:text-sm opacity-90">Confidence in next deployment</div>
          </div>
        </div>

        <p className="text-xs md:text-sm opacity-90" style={{ lineHeight: "1.7" }}>
          Your feedback has helped WOOF identify that <strong>afternoon cross-sell bundles</strong> perform
          23% better than predicted, while <strong>late-night flash sales</strong> underperform by 15%.
          The system has been recalibrated to prioritize high-performing patterns.
        </p>
      </div>
    </div>
  );
}

import { Lightbulb, Check, X, Lock, TrendingUp, ShoppingCart } from "lucide-react";
import { PromoBundleCard } from "../components/PromoBundleCard";

export function PrescriptiveIntelligence() {
  const activeSuggestions = [
    {
      id: 1,
      title: "Happy Hour Bundle: Coffee + Nail Trim",
      trigger: "3:00 PM - 5:00 PM",
      discount: "15% off combo",
      expectedLift: "+₱8,420",
      confidence: "92%",
      reason: "High afternoon cafe traffic + 40% grooming capacity available"
    },
    {
      id: 2,
      title: "Morning Rush Special: Latte + Express Groom",
      trigger: "8:00 AM - 10:00 AM",
      discount: "10% off combo",
      expectedLift: "+₱6,850",
      confidence: "88%",
      reason: "Peak morning coffee demand + grooming appointment gaps"
    },
    {
      id: 3,
      title: "Pet Treat Upsell at Checkout",
      trigger: "All day (POS integration)",
      discount: "Buy 2 Get 1 Free",
      expectedLift: "+₱4,230",
      confidence: "85%",
      reason: "67% of cafe customers own pets, low treat attachment rate"
    },
    {
      id: 4,
      title: "Weekend Family Package",
      trigger: "Saturday & Sunday",
      discount: "20% off full package",
      expectedLift: "+₱12,560",
      confidence: "90%",
      reason: "High weekend foot traffic + multi-service demand pattern"
    },
  ];

  const suppressedSuggestions = [
    {
      title: "Full Grooming Flash Sale",
      reason: "Capacity Constraint",
      details: "Grooming stations at 95% utilization. Would create 2hr+ wait times.",
      suppressedAt: "2 hours ago"
    },
    {
      title: "Premium Shampoo Bundle",
      reason: "Inventory Shortage",
      details: "Only 8 units remaining. Insufficient stock for promotional demand.",
      suppressedAt: "4 hours ago"
    },
    {
      title: "Late Night Cafe Promo",
      reason: "Staff Availability",
      details: "Evening shift understaffed. Cannot support extended hours.",
      suppressedAt: "1 day ago"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Autonomous Executive Choices</h1>
        <p className="text-sm text-slate-600 mt-1">AI-generated business recommendations with approval workflow</p>
      </div>

      {/* Active Trigger Suggestions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-slate-900">Active Trigger Suggestions</h2>
          </div>
          <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
            {activeSuggestions.length} Pending
          </span>
        </div>

        <div className="space-y-4">
          {activeSuggestions.map((suggestion) => (
            <div 
              key={suggestion.id}
              className="p-5 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">{suggestion.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                    <span>🕐 {suggestion.trigger}</span>
                    <span>💰 {suggestion.discount}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">{suggestion.expectedLift}</div>
                  <div className="text-xs text-slate-500">Expected Lift</div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-blue-700">AI Reasoning:</span>
                  <span className="px-2 py-0.5 bg-blue-200 text-blue-800 text-xs font-medium rounded-full">
                    {suggestion.confidence} Confidence
                  </span>
                </div>
                <p className="text-sm text-slate-700">{suggestion.reason}</p>
              </div>

              <div className="flex items-center gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
                  <Check className="w-4 h-4" />
                  Approve & Deploy
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 hover:border-red-300 hover:bg-red-50 text-slate-700 hover:text-red-600 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* E-Commerce Bundle Creator */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-slate-900">E-Commerce Bundle Creator</h2>
          </div>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
            AI-Generated
          </span>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <PromoBundleCard
            product1={{
              name: "Dog Shampoo",
              image: "https://images.unsplash.com/photo-1672426637959-49f39230ad7e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjBzaGFtcG9vJTIwYm90dGxlfGVufDF8fHx8MTc3NTYyOTgwOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
              price: 280
            }}
            product2={{
              name: "Dog Toothbrush",
              image: "https://images.unsplash.com/photo-1546441180-e11b44873171?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjB0b290aGJydXNoJTIwcGV0JTIwZGVudGFsfGVufDF8fHx8MTc3NTcyNTk1NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
              price: 150
            }}
            conversionLift={15}
            confidenceScore={92}
            suggestedPrice={365}
          />

          <PromoBundleCard
            product1={{
              name: "Pet Treats",
              image: "https://images.unsplash.com/photo-1517710765376-c45ee729918f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjB0cmVhdHMlMjBiaXNjdWl0c3xlbnwxfHx8fDE3NzU2ODcyOTd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
              price: 180
            }}
            product2={{
              name: "Dog Toys",
              image: "https://images.unsplash.com/photo-1535294435445-d7249524ef2e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjB0b3lzJTIwZG9nJTIwdG95c3xlbnwxfHx8fDE3NzU3MjU5NTR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
              price: 350
            }}
            conversionLift={12}
            confidenceScore={88}
            suggestedPrice={450}
          />

          <PromoBundleCard
            product1={{
              name: "Dog Collar",
              image: "https://images.unsplash.com/photo-1577447278822-37801be21738?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjBjb2xsYXIlMjBsZWFzaHxlbnwxfHx8fDE3NzU2NzY5MTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
              price: 120
            }}
            product2={{
              name: "Food Bowl",
              image: "https://images.unsplash.com/photo-1714068691210-073dc52c6c1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjBmb29kJTIwYm93bHxlbnwxfHx8fDE3NzU2Njc1MDl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
              price: 420
            }}
            conversionLift={18}
            confidenceScore={85}
            suggestedPrice={459}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* The Gatekeeper Log */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-slate-900">The Gatekeeper Log</h2>
          </div>

          <div className="space-y-4">
            {suppressedSuggestions.map((item, idx) => (
              <div key={idx} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-slate-900">{item.title}</h4>
                  <span className="px-2 py-0.5 bg-red-200 text-red-800 text-xs font-medium rounded-full">
                    Blocked
                  </span>
                </div>
                <div className="mb-2">
                  <span className="text-xs font-medium text-red-700">Reason: {item.reason}</span>
                </div>
                <p className="text-sm text-slate-700 mb-2">{item.details}</p>
                <div className="text-xs text-slate-500">{item.suppressedAt}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-xs text-slate-600">
              <strong>Gatekeeper Role:</strong> The system automatically suppresses suggestions that would 
              create operational bottlenecks, inventory issues, or staff overload. This prevents revenue 
              optimization from compromising service quality.
            </p>
          </div>
        </div>

        {/* Projection Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-slate-900">Revenue Lift Projection</h2>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-6">
            <div className="text-center mb-4">
              <div className="text-sm text-slate-600 mb-2">Top Ranked Suggestion</div>
              <div className="text-2xl font-bold text-slate-900 mb-1">
                Weekend Family Package
              </div>
              <div className="text-xs text-slate-600">Saturday & Sunday activation</div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">+₱12,560</div>
                <div className="text-xs text-slate-600 mt-1">Expected Revenue</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">90%</div>
                <div className="text-xs text-slate-600 mt-1">Confidence</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Base weekend revenue:</span>
                <span className="font-medium text-slate-900">₱28,400</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Projected with promo:</span>
                <span className="font-medium text-slate-900">₱40,960</span>
              </div>
              <div className="h-px bg-slate-200"></div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-green-700 font-medium">Revenue lift:</span>
                <span className="font-bold text-green-600">+44.2%</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-xs font-medium text-blue-700 mb-2">XGBoost Model Factors:</div>
            <ul className="text-xs text-slate-700 space-y-1">
              <li>• Historical weekend performance: High impact</li>
              <li>• Multi-service bundle appeal: Strong correlation</li>
              <li>• Family customer segment: 34% of base</li>
              <li>• Seasonal timing: Favorable conditions</li>
              <li>• Competitive landscape: Low weekend promos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
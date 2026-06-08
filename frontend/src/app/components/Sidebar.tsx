import Link from "next/link";
import { useRouter } from "next/router";
import { Home, Coffee, Scissors, ShoppingBag, FlaskConical, Settings, MessageSquareHeart, FileText, X } from "lucide-react";
import { Badge } from "./ui/badge";
import logoImg from "../../imports/happytailslogo-removebg-preview-2.png";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/cafe", label: "Cafe", icon: Coffee },
  { path: "/services", label: "Services", icon: Scissors },
  { path: "/retail", label: "Retail", icon: ShoppingBag },
  { path: "/ai-simulation", label: "AI Simulation", icon: FlaskConical },
  { path: "/feedback", label: "Feedback", icon: MessageSquareHeart },
  { path: "/audit", label: "Audit", icon: FileText },
  { path: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const router = useRouter();

  return (
    <div className="w-[240px] h-full bg-white border-r border-[#FFD9EC] flex flex-col relative overflow-hidden">
      {/* Left gradient bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#F53799] to-[#3AE4FA]" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Logo */}
        <div className="p-6 flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="text-lg font-bold text-[#223047]">WOOF</div>
            <div className="text-xs text-[#223047] opacity-40">by Happy Tails</div>
          </div>
          <img
            src={logoImg.src}
            alt="Happy Tails Logo"
            className="h-16 w-auto object-contain"
            style={{ background: 'transparent' }}
          />
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-[#FFF2FA] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#223047]" />
          </button>
        </div>
        
        {/* Divider */}
        <div className="h-px bg-[#FFD9EC] mx-4" />
        
        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = router.pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? "bg-[#FFF2FA] text-[#F53799]"
                    : "text-[#223047] opacity-55 hover:bg-[#FFF2FA] hover:text-[#D42A7D] hover:opacity-100"
                }`}
                onClick={onClose}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#F53799] rounded-r-full" />
                )}
                <item.icon className="w-5 h-5" strokeWidth={2} />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* Divider */}
        <div className="h-px bg-[#FFD9EC] mx-4" />
        
        {/* System Status */}
        <div className="p-4 m-3 bg-[#FFF2FA] border border-[#FFD9EC] rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-[#223047]">WOOF Active</span>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#223047] opacity-60">Data Sync</span>
              <span className="text-xs font-medium text-[#223047]">Live</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#223047] opacity-60">Last Retrain</span>
              <span className="text-xs font-medium text-[#223047]">2h ago</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#223047] opacity-60">Next Cycle</span>
              <span className="text-xs font-mono font-medium text-[#223047]">04:23:15</span>
            </div>
          </div>
          
          <Badge className="w-full justify-center bg-[#3AE4FA] text-white hover:bg-[#3AE4FA] text-xs py-1">
            Level 3 Live-Ready
          </Badge>
        </div>
      </div>
    </div>
  );
}
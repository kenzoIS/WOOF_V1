import { useState } from "react";
import { useRouter } from "next/router";
import { Button } from "../components/ui/button";
import logoImg from "../../imports/happytailslogo-removebg-preview.png";
import { Mail, Lock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType: "owner" | "staff";
}

function ForgotPasswordModal({ isOpen, onClose, userType }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsSubmitting(true);

    // Simulate sending email
    setTimeout(() => {
      if (userType === "owner") {
        toast.success("Password reset link sent!", {
          description: "Check your email for instructions to reset your password.",
        });
      } else {
        toast.success("Password reset request sent to owner", {
          description: "The business owner will contact you shortly via email.",
        });
      }
      setIsSubmitting(false);
      setEmail("");
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-[#223047]">Forgot Password?</h2>
          <p className="text-sm text-[#223047] opacity-60">
            {userType === "owner"
              ? "Enter your email address and we'll send you a link to reset your password."
              : "Enter your email address and we'll notify the business owner to help you reset your password."}
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#223047]">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#223047] opacity-40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full pl-11 pr-4 py-3 border-2 border-[#FFD9EC] rounded-xl focus:outline-none focus:border-[#F53799] transition-colors"
              />
            </div>
          </div>

          {userType === "staff" && (
            <div className="bg-[#FFF7FB] border border-[#FFD9EC] rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#F53799] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#223047] opacity-70">
                The business owner will receive an email notification about your password reset request and will contact you directly.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-[#FFD9EC]"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-[#F53799] hover:bg-[#D42A7D]"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Sending..."
              : userType === "owner"
              ? "Send Reset Link"
              : "Contact Owner"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Login() {
  const router = useRouter();
  const [userType, setUserType] = useState<"owner" | "staff">("owner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoggingIn(true);

    // Simulate login
    setTimeout(() => {
      localStorage.setItem("userType", userType);
      localStorage.setItem("userEmail", email);
      toast.success(`Welcome back!`, {
        description: `Logged in as ${userType === "owner" ? "Owner" : "Staff Member"}`,
      });
      router.push("/");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF2FA] via-white to-[#FFF7FB] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8 space-y-4">
          <div className="flex justify-center mb-6">
            <img
              src={logoImg.src}
              alt="Happy Tails Logo"
              className="h-24 w-auto object-contain"
            />
          </div>
          <h1 className="text-3xl font-extrabold text-[#223047]">
            Welcome to WOOF AI
          </h1>
          <p className="text-[#223047] opacity-60">
            Your omnichannel intelligence platform
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border-2 border-[#FFD9EC] rounded-3xl p-8 shadow-xl space-y-6">
          {/* User Type Selector */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-[#223047]">Login As</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUserType("owner")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  userType === "owner"
                    ? "border-[#F53799] bg-[#FFF2FA]"
                    : "border-[#FFD9EC] hover:border-[#F53799]/50"
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-bold text-[#223047]">Owner</div>
                  <div className="text-xs text-[#223047] opacity-60">Full Access</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setUserType("staff")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  userType === "staff"
                    ? "border-[#F53799] bg-[#FFF2FA]"
                    : "border-[#FFD9EC] hover:border-[#F53799]/50"
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-bold text-[#223047]">Staff</div>
                  <div className="text-xs text-[#223047] opacity-60">Team Member</div>
                </div>
              </button>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#223047]">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#223047] opacity-40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full pl-11 pr-4 py-3 border-2 border-[#FFD9EC] rounded-xl focus:outline-none focus:border-[#F53799] transition-colors"
                  disabled={isLoggingIn}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#223047]">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#223047] opacity-40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-4 py-3 border-2 border-[#FFD9EC] rounded-xl focus:outline-none focus:border-[#F53799] transition-colors"
                  disabled={isLoggingIn}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-[#F53799] hover:text-[#D42A7D] font-medium transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#F53799] hover:bg-[#D42A7D] py-6 text-base font-semibold"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          {/* Footer Note */}
          <div className="pt-4 border-t border-[#FFD9EC]">
            <p className="text-xs text-center text-[#223047] opacity-50">
              Powered by WOOF AI Analytics Engine
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        userType={userType}
      />
    </div>
  );
}

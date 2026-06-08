import { useState } from "react";
import { useRouter } from "next/router";
import { Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Toaster } from "../components/ui/sonner";
import logoImg from "../../imports/happytailslogo-removebg-preview.png";

type ForgotPasswordStep = "email" | "otp" | "newPassword";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasswordReset: () => void;
}

function ForgotPasswordModal({
  isOpen,
  onClose,
  onPasswordReset,
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<ForgotPasswordStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetModal = () => {
    setEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setStep("email");
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleEmailSubmit = () => {
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      toast.success("OTP sent!", {
        description: "Check your email for the 6-digit OTP code.",
      });
      setIsSubmitting(false);
      setStep("otp");
    }, 1500);
  };

  const handleOtpSubmit = () => {
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      toast.success("OTP verified!");
      setIsSubmitting(false);
      setStep("newPassword");
    }, 1000);
  };

  const handlePasswordSubmit = () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      toast.success("Password reset successful!", {
        description: "Please log in with your new password.",
      });
      setIsSubmitting(false);
      resetModal();
      onClose();
      onPasswordReset();
    }, 1500);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-2xl">
        {step === "email" && (
          <>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[#223047]">
                Forgot Password?
              </h2>
              <p className="text-sm text-[#223047] opacity-60">
                Enter your email address and we'll send you a 6-digit OTP code.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#223047]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#223047] opacity-40" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full rounded-xl border-2 border-[#FFD9EC] py-3 pl-11 pr-4 transition-colors focus:border-[#F53799] focus:outline-none"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={handleClose}
                variant="outline"
                className="flex-1 rounded-xl border-[#FFD9EC]"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleEmailSubmit}
                className="flex-1 rounded-xl bg-[#F53799] text-white hover:bg-[#D42A7D]"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send OTP"}
              </Button>
            </div>
          </>
        )}

        {step === "otp" && (
          <>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[#223047]">Enter OTP</h2>
              <p className="text-sm text-[#223047] opacity-60">
                We've sent a 6-digit OTP code to {email}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#223047]">
                6-Digit OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                className="w-full rounded-xl border-2 border-[#FFD9EC] px-4 py-3 text-center text-2xl font-bold tracking-widest transition-colors focus:border-[#F53799] focus:outline-none"
                disabled={isSubmitting}
                inputMode="numeric"
                maxLength={6}
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={handleClose}
                variant="outline"
                className="flex-1 rounded-xl border-[#FFD9EC]"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleOtpSubmit}
                className="flex-1 rounded-xl bg-[#F53799] text-white hover:bg-[#D42A7D]"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Verifying..." : "Verify OTP"}
              </Button>
            </div>
          </>
        )}

        {step === "newPassword" && (
          <>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[#223047]">
                Create New Password
              </h2>
              <p className="text-sm text-[#223047] opacity-60">
                Enter your new password below
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#223047]">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#223047] opacity-40" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Enter new password"
                    className="w-full rounded-xl border-2 border-[#FFD9EC] py-3 pl-11 pr-4 transition-colors focus:border-[#F53799] focus:outline-none"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#223047]">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#223047] opacity-40" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    placeholder="Confirm new password"
                    className="w-full rounded-xl border-2 border-[#FFD9EC] py-3 pl-11 pr-4 transition-colors focus:border-[#F53799] focus:outline-none"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={handleClose}
                variant="outline"
                className="flex-1 rounded-xl border-[#FFD9EC]"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handlePasswordSubmit}
                className="flex-1 rounded-xl bg-[#F53799] text-white hover:bg-[#D42A7D]"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoggingIn(true);

    setTimeout(() => {
      localStorage.removeItem("userType");
      localStorage.setItem("woofAuth", "true");
      localStorage.setItem("userEmail", email.trim());
      toast.success("Welcome back!", {
        description: "Signed in to WOOF.",
      });
      router.push("/");
    }, 1000);
  };

  const handlePasswordReset = () => {
    setEmail("");
    setPassword("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FFF2FA] via-white to-[#FFF7FB] p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 space-y-4 text-center">
          <div className="mb-6 flex justify-center">
            <img
              src={logoImg.src}
              alt="Happy Tails Logo"
              className="h-24 w-auto object-contain"
            />
          </div>
          <h1 className="text-3xl font-extrabold text-[#223047]">
            Welcome to WOOF!
          </h1>
          <p className="text-[#223047] opacity-60">
            Your Cross-Channel Intelligence Platform
          </p>
        </div>

        <div className="space-y-6 rounded-3xl border-2 border-[#FFD9EC] bg-white p-8 shadow-xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#223047]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#223047] opacity-40" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full rounded-xl border-2 border-[#FFD9EC] py-3 pl-11 pr-4 transition-colors focus:border-[#F53799] focus:outline-none"
                  disabled={isLoggingIn}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#223047]">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#223047] opacity-40" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border-2 border-[#FFD9EC] py-3 pl-11 pr-4 transition-colors focus:border-[#F53799] focus:outline-none"
                  disabled={isLoggingIn}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm font-medium text-[#F53799] transition-colors hover:text-[#D42A7D]"
                disabled={isLoggingIn}
              >
                Forgot Password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl bg-[#F53799] py-6 text-base font-semibold text-white hover:bg-[#D42A7D]"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="border-t border-[#FFD9EC] pt-4">
            <p className="text-center text-xs text-[#223047] opacity-50">
              Powered by WOOF AI Analytics Engine
            </p>
          </div>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onPasswordReset={handlePasswordReset}
      />
      <Toaster />
    </div>
  );
}

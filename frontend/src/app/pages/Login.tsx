import { useState } from "react";
import { useRouter } from "next/router";
import { Eye, EyeOff, KeyRound, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Toaster } from "../components/ui/sonner";
import {
  loginDashboard,
  requestPasswordReset,
  resetDashboardPassword,
  verifyResetOtp,
} from "../lib/api";
import { getSettingsPreferences } from "../lib/preferences";
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
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetModal = () => {
    setEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setStep("email");
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleEmailSubmit = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setIsSubmitting(true);

    try {
      await requestPasswordReset(email.trim());
      toast.success("OTP sent!", {
        description: "Check your email for the 6-digit OTP code.",
      });
      setStep("otp");
    } catch (error) {
      toast.error("Unable to send OTP", {
        description:
          error instanceof Error
            ? error.message
            : "Please check the dashboard email and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setIsSubmitting(true);

    try {
      await verifyResetOtp(email.trim(), otp);
      toast.success("OTP verified!");
      setStep("newPassword");
    } catch (error) {
      toast.error("Unable to verify OTP", {
        description:
          error instanceof Error
            ? error.message
            : "Please check the OTP and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async () => {
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

    try {
      await resetDashboardPassword(email.trim(), otp, newPassword);
      toast.success("Password reset successful!", {
        description: "Please log in with your new password.",
      });
      resetModal();
      onClose();
      onPasswordReset();
    } catch (error) {
      toast.error("Unable to reset password", {
        description:
          error instanceof Error
            ? error.message
            : "Please request a new OTP and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="woof-forgot-modal w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-2xl">
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
                  placeholder="woofdash@gmail.com"
                  className="woof-forgot-input w-full rounded-xl border-2 border-[#FFD9EC] py-3 pl-11 pr-4 transition-colors focus:border-[#F53799] focus:outline-none"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={handleClose}
                variant="outline"
                className="woof-forgot-cancel flex-1 rounded-xl border-[#FFD9EC]"
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
                className="woof-forgot-input w-full rounded-xl border-2 border-[#FFD9EC] px-4 py-3 text-center text-2xl font-bold tracking-widest transition-colors focus:border-[#F53799] focus:outline-none"
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
                className="woof-forgot-cancel flex-1 rounded-xl border-[#FFD9EC]"
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
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Enter new password"
                    className="woof-forgot-input woof-password-field w-full rounded-xl border-2 border-[#FFD9EC] py-3 pl-11 pr-12 transition-colors focus:border-[#F53799] focus:outline-none"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((value) => !value)}
                    className="woof-forgot-eye absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#223047] opacity-50 transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[#F53799]/30"
                    disabled={isSubmitting}
                    aria-label={
                      showNewPassword ? "Hide new password" : "Show new password"
                    }
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#223047]">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#223047] opacity-40" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    placeholder="Confirm new password"
                    className="woof-forgot-input woof-password-field w-full rounded-xl border-2 border-[#FFD9EC] py-3 pl-11 pr-12 transition-colors focus:border-[#F53799] focus:outline-none"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="woof-forgot-eye absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#223047] opacity-50 transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[#F53799]/30"
                    disabled={isSubmitting}
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirmation password"
                        : "Show confirmation password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={handleClose}
                variant="outline"
                className="woof-forgot-cancel flex-1 rounded-xl border-[#FFD9EC]"
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
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (requiresTwoFactor && twoFactorCode.length !== 6) {
      toast.error("Please enter your 6-digit authenticator code");
      return;
    }

    setIsLoggingIn(true);

    try {
      const session = await loginDashboard(
        email.trim(),
        password,
        requiresTwoFactor ? twoFactorCode : undefined,
      );

      if ("requiresTwoFactor" in session && session.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        toast.info("Enter your authenticator code to continue");
        setIsLoggingIn(false);
        return;
      }

      localStorage.removeItem("userType");
      localStorage.setItem("woofAuth", "true");
      localStorage.setItem("woofAuthToken", session.accessToken);
      localStorage.setItem("woofAuthExpiresAt", session.expiresAt);
      localStorage.setItem("userEmail", session.email);
      toast.success("Welcome back!", {
        description: "Signed in to WOOF.",
      });
      router.push(getSettingsPreferences().dashboard.defaultLandingPage);
    } catch (error) {
      toast.error("Unable to sign in", {
        description:
          error instanceof Error
            ? error.message
            : "Please check your dashboard credentials and try again.",
      });
      setTwoFactorCode("");
      setIsLoggingIn(false);
    }
  };

  const handlePasswordReset = () => {
    setEmail("");
    setPassword("");
    setTwoFactorCode("");
    setRequiresTwoFactor(false);
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
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setRequiresTwoFactor(false);
                    setTwoFactorCode("");
                  }}
                  placeholder="woofdash@gmail.com"
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
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setRequiresTwoFactor(false);
                    setTwoFactorCode("");
                  }}
                  placeholder="Enter your password"
                  className="woof-password-field w-full rounded-xl border-2 border-[#FFD9EC] py-3 pl-11 pr-12 transition-colors focus:border-[#F53799] focus:outline-none"
                  disabled={isLoggingIn}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#223047] opacity-50 transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[#F53799]/30"
                  disabled={isLoggingIn}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {requiresTwoFactor && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#223047]">
                  Authenticator Code
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#223047] opacity-40" />
                  <input
                    type="text"
                    value={twoFactorCode}
                    onChange={(event) =>
                      setTwoFactorCode(
                        event.target.value.replace(/\D/g, "").slice(0, 6),
                      )
                    }
                    placeholder="000000"
                    className="w-full rounded-xl border-2 border-[#FFD9EC] py-3 pl-11 pr-4 text-center text-lg font-bold tracking-widest transition-colors focus:border-[#F53799] focus:outline-none"
                    disabled={isLoggingIn}
                    inputMode="numeric"
                    maxLength={6}
                  />
                </div>
              </div>
            )}

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

import { useState } from "react";
import { useRouter } from "next/router";
import { ArrowRight, Eye, EyeOff, KeyRound, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Toaster } from "../components/ui/sonner";
import {
  loginDashboard,
  requestPasswordReset,
  resetDashboardPassword,
  verifyResetOtp,
} from "../lib/api";
import loginMockupImg from "../../imports/login mockup.png";

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

      // Silently prefetch all sector routes in the background so they are
      // pre-compiled by the time the user clicks a tab (eliminates 5-7s delay).
      const routesToPrefetch = [
        "/",
        "/cafe",
        "/services",
        "/retail",
        "/ai-simulation",
        "/smart-reports",
        "/feedback",
        "/settings",
      ];
      routesToPrefetch.forEach((route, i) => {
        setTimeout(() => {
          router.prefetch(route);
          // Also do a real fetch to force server-side compilation in dev mode
          fetch(route, { priority: "low" as RequestPriority }).catch(() => {});
        }, i * 200);
      });

      router.push("/");
    } catch (error) {
      toast.error("Unable to sign in", {
        description:
          error instanceof Error
            ? error.message
            : "Please check your dashboard credentials and try again.",
      });
      setTwoFactorCode("");
      setRequiresTwoFactor(false);
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
    <div className="min-h-screen bg-[#fff2f8] lg:flex lg:items-center lg:justify-center">
      <main className="relative hidden aspect-[1672/941] w-full max-w-[1920px] overflow-hidden lg:block" aria-label="WOOF sign in">
        <img src={loginMockupImg.src} alt="Happy Tails WOOF sign-in" className="h-full w-full select-none" />

        <form onSubmit={handleLogin} className="absolute inset-0" aria-label="Sign in form">
          <label htmlFor="desktop-login-email" className="sr-only">Email address</label>
          <input
            id="desktop-login-email"
            type="email"
            value={email}
            onChange={(event) => { setEmail(event.target.value); setRequiresTwoFactor(false); setTwoFactorCode(""); }}
            className="absolute left-[66.55%] top-[41.2%] h-[5.65%] w-[28.85%] rounded-xl border border-transparent bg-transparent px-[3.9%] text-[clamp(10px,1.15vw,18px)] text-[#223047] outline-none transition focus:border-[#f53799] focus:bg-white/45 focus:ring-[0.2vw] focus:ring-[#f53799]/15"
            disabled={isLoggingIn}
          />
          <label htmlFor="desktop-login-password" className="sr-only">Password</label>
          <input
            id="desktop-login-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => { setPassword(event.target.value); setRequiresTwoFactor(false); setTwoFactorCode(""); }}
            className="woof-password-field absolute left-[66.55%] top-[48.05%] h-[5.65%] w-[28.85%] rounded-xl border border-transparent bg-transparent px-[3.9%] pr-[12%] text-[clamp(10px,1.15vw,18px)] text-[#223047] outline-none transition focus:border-[#f53799] focus:bg-white/45 focus:ring-[0.2vw] focus:ring-[#f53799]/15"
            disabled={isLoggingIn}
          />
          <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute left-[92.35%] top-[48.25%] flex h-[5.1%] w-[3.1%] items-center justify-center rounded-full text-transparent outline-none focus:ring-[0.2vw] focus:ring-[#f53799]/40" disabled={isLoggingIn} aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? <EyeOff className="h-4 w-4 text-[#7181a1]" /> : <Eye className="h-4 w-4 text-transparent" />}
          </button>

          {requiresTwoFactor && (
            <div className="absolute left-[66.55%] top-[54.65%] w-[28.85%] rounded-xl bg-white p-[0.55vw] shadow-lg">
              <label htmlFor="desktop-two-factor" className="sr-only">Authenticator code</label>
              <div className="relative">
                <KeyRound className="absolute left-[5%] top-1/2 h-4 w-4 -translate-y-1/2 text-[#7181a1]" />
                <input id="desktop-two-factor" type="text" value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Authenticator code" className="w-full rounded-lg border border-[#d9e0ef] py-[0.65vw] pl-[14%] pr-[5%] text-center text-[clamp(10px,1vw,16px)] font-bold tracking-[0.2em] text-[#223047] outline-none focus:border-[#f53799]" disabled={isLoggingIn} inputMode="numeric" maxLength={6} />
              </div>
            </div>
          )}

          <button type="button" onClick={() => setShowForgotPassword(true)} className="absolute left-[87.1%] top-[55.55%] h-[3.3%] w-[8.4%] rounded text-transparent outline-none transition hover:bg-[#0c9bbc]/10 focus:ring-[0.2vw] focus:ring-[#0c9bbc]/35" disabled={isLoggingIn} aria-label="Forgot password?">Forgot Password?</button>
          <Button type="submit" className="absolute left-[66.55%] top-[59.8%] h-[6.1%] w-[28.85%] rounded-full bg-transparent p-0 text-transparent shadow-none hover:bg-[#d6176a]/10 focus-visible:ring-[0.2vw] focus-visible:ring-[#f53799]/40" disabled={isLoggingIn}>
            {isLoggingIn ? <span className="text-[clamp(10px,1.15vw,18px)] font-bold text-white">Signing In...</span> : <span className="sr-only">Sign In</span>}
          </Button>
        </form>
      </main>

      <section className="w-full px-5 py-8 lg:hidden">
        <img src={loginMockupImg.src} alt="Happy Tails WOOF sign-in" className="mb-6 w-full rounded-3xl shadow-lg" />
        <form onSubmit={handleLogin} className="space-y-4 rounded-3xl bg-white p-6 shadow-xl">
          <div className="relative"><Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7181a1]" /><label htmlFor="mobile-login-email" className="sr-only">Email address</label><input id="mobile-login-email" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setRequiresTwoFactor(false); setTwoFactorCode(""); }} placeholder="Email" className="w-full rounded-xl border border-[#d9e0ef] py-3 pl-12 pr-4 outline-none focus:border-[#f53799]" disabled={isLoggingIn} /></div>
          <div className="relative"><Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7181a1]" /><label htmlFor="mobile-login-password" className="sr-only">Password</label><input id="mobile-login-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => { setPassword(event.target.value); setRequiresTwoFactor(false); setTwoFactorCode(""); }} placeholder="Password" className="woof-password-field w-full rounded-xl border border-[#d9e0ef] py-3 pl-12 pr-12 outline-none focus:border-[#f53799]" disabled={isLoggingIn} /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7181a1]" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div>
          {requiresTwoFactor && <div className="relative"><KeyRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7181a1]" /><label htmlFor="mobile-two-factor" className="sr-only">Authenticator code</label><input id="mobile-two-factor" type="text" value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Authenticator code" className="w-full rounded-xl border border-[#d9e0ef] py-3 pl-12 pr-4 text-center tracking-[0.2em] outline-none focus:border-[#f53799]" disabled={isLoggingIn} inputMode="numeric" maxLength={6} /></div>}
          <button type="button" onClick={() => setShowForgotPassword(true)} className="block ml-auto text-sm font-semibold text-[#0c9bbc] hover:underline" disabled={isLoggingIn}>Forgot Password?</button>
          <Button type="submit" className="w-full rounded-full bg-[#ed1979] py-6 text-base font-bold hover:bg-[#d6176a]" disabled={isLoggingIn}>{isLoggingIn ? "Signing In..." : <span className="flex items-center justify-center gap-2">Sign In <ArrowRight className="h-5 w-5" /></span>}</Button>
        </form>
      </section>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onPasswordReset={handlePasswordReset}
      />
      <Toaster />
    </div>
  );
}

"use client";

import { OTP_LENGTH, SIGNUP_ROLES, type SignupRole } from "@agri/shared";
import { Loader2, Phone, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { describeError } from "@/lib/api/browser";
import { authApi } from "@/lib/api/auth.client";
import { t } from "@/lib/i18n";

const field =
  "h-14 w-full rounded-xl border-2 border-line bg-white px-4 text-lg text-ink placeholder:text-ink-muted focus:border-brand-600 focus:outline-none focus:ring-3 focus:ring-brand-600/20";
const primaryButton =
  "flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-lg font-bold text-white hover:bg-brand-700 disabled:opacity-60";

export default function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<SignupRole>("CUSTOMER");
  const [isNewUser, setIsNewUser] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Countdown before "resend" becomes available.
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const describe = (err: unknown) => describeError(err, t.state.networkError);

  async function sendCode(targetPhone: string) {
    setBusy(true);
    setError(null);
    try {
      const result = await authApi.requestOtp(targetPhone);
      setIsNewUser(result.isNewUser);
      setDevOtp(result.devOtp ?? null);
      setResendIn(result.resendAfterSeconds);
      setStep("code");
      setOtp("");
      // Focus the code box so the keypad opens straight away.
      requestAnimationFrame(() => otpInputRef.current?.focus());
    } catch (err) {
      setError(describe(err));
    } finally {
      setBusy(false);
    }
  }

  async function verify(code: string) {
    setBusy(true);
    setError(null);
    try {
      await authApi.verifyOtp({
        phone,
        otp: code,
        ...(isNewUser && { firstName, lastName: lastName || undefined, role }),
      });
      // Server components must re-read the new session, so refresh before navigating.
      router.refresh();
      router.replace(nextPath);
    } catch (err) {
      setError(describe(err));
      setOtp("");
      otpInputRef.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  /** Auto-submits as soon as all digits are in, so there is no extra tap. */
  function onOtpChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, OTP_LENGTH);
    setOtp(digits);
    const ready = digits.length === OTP_LENGTH && (!isNewUser || firstName.trim().length >= 2);
    if (ready && !busy) void verify(digits);
  }

  if (step === "phone") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void sendCode(phone);
        }}
        className="flex flex-col gap-5"
        noValidate
      >
        <div>
          <h1 className="text-2xl font-bold">{t.auth.loginTitle}</h1>
          <p className="mt-1 text-base text-ink-muted">{t.auth.loginSubtitle}</p>
        </div>

        <div>
          <label htmlFor="phone" className="mb-1 block text-base font-semibold">
            {t.auth.phoneLabel}
          </label>
          <div className="flex items-center gap-2">
            <span className="flex h-14 items-center rounded-xl bg-brand-50 px-4 text-lg font-semibold text-ink-muted">
              +91
            </span>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              autoFocus
              required
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="98765 43210"
              className={`${field} tracking-wider`}
            />
          </div>
          <p className="mt-1 text-sm text-ink-muted">{t.auth.phoneHint}</p>
        </div>

        {error && <ErrorNotice message={error} />}

        <button type="submit" disabled={busy || phone.length !== 10} className={primaryButton}>
          {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Phone className="size-5" aria-hidden />}
          {busy ? t.auth.sending : t.auth.sendCode}
        </button>

        <Link href="/admin/login" className="text-center text-base font-medium text-brand-700 hover:underline">
          {t.auth.adminLink}
        </Link>
      </form>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void verify(otp);
      }}
      className="flex flex-col gap-5"
      noValidate
    >
      <div>
        <h1 className="text-2xl font-bold">{t.auth.otpTitle}</h1>
        <p className="mt-1 text-base text-ink-muted">{t.auth.otpSentTo(`+91 ${phone}`)}</p>
        <button
          type="button"
          onClick={() => {
            setStep("phone");
            setError(null);
          }}
          className="mt-1 text-base font-semibold text-brand-700 hover:underline"
        >
          {t.auth.changeNumber}
        </button>
      </div>

      {devOtp && (
        <p className="rounded-xl bg-accent-400/20 px-4 py-3 text-base font-semibold text-ink">
          {t.auth.devCodeNotice(devOtp)}
        </p>
      )}

      {isNewUser && (
        <fieldset className="flex flex-col gap-4 rounded-xl bg-brand-50 p-4">
          <legend className="px-1 text-base font-bold">{t.auth.nameTitle}</legend>
          <div>
            <label htmlFor="firstName" className="mb-1 block text-base font-semibold">
              {t.auth.firstName}
            </label>
            <input
              id="firstName"
              autoComplete="given-name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={field}
            />
          </div>
          <div>
            <label htmlFor="lastName" className="mb-1 block text-base font-semibold">
              {t.auth.lastName}
            </label>
            <input
              id="lastName"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={field}
            />
          </div>
          <div>
            <span className="mb-1 block text-base font-semibold">{t.auth.accountType}</span>
            <div className="flex flex-col gap-2">
              {SIGNUP_ROLES.map((r) => (
                <label
                  key={r}
                  className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border-2 bg-white px-4 py-2 text-base ${
                    role === r ? "border-brand-600 font-semibold" : "border-line"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={role === r}
                    onChange={() => setRole(r)}
                    className="size-5 accent-brand-600"
                  />
                  {r === "CUSTOMER" ? t.auth.roleCustomer : t.auth.roleRetailer}
                </label>
              ))}
            </div>
          </div>
        </fieldset>
      )}

      <div>
        <label htmlFor="otp" className="mb-1 block text-base font-semibold">
          {t.auth.otpLabel}
        </label>
        <input
          id="otp"
          ref={otpInputRef}
          name="otp"
          type="text"
          inputMode="numeric"
          // Lets Android fill the code straight from the SMS.
          autoComplete="one-time-code"
          required
          maxLength={OTP_LENGTH}
          value={otp}
          onChange={(e) => onOtpChange(e.target.value)}
          placeholder="------"
          className={`${field} text-center text-3xl font-bold tracking-[0.5em]`}
        />
      </div>

      {error && <ErrorNotice message={error} />}

      <button
        type="submit"
        disabled={busy || otp.length !== OTP_LENGTH}
        className={primaryButton}
      >
        {busy ? (
          <Loader2 className="size-5 animate-spin" aria-hidden />
        ) : (
          <ShieldCheck className="size-5" aria-hidden />
        )}
        {busy ? t.auth.verifying : t.auth.verify}
      </button>

      <button
        type="button"
        disabled={resendIn > 0 || busy}
        onClick={() => void sendCode(phone)}
        className="h-12 text-base font-semibold text-brand-700 hover:underline disabled:text-ink-muted disabled:no-underline"
      >
        {resendIn > 0 ? t.auth.resendIn(resendIn) : t.auth.resend}
      </button>
    </form>
  );
}

function ErrorNotice({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-base font-medium text-red-800">
      {message}
    </p>
  );
}

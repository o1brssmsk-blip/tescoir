"use client";

import confetti from "canvas-confetti";
import { useEffect } from "react";

type Props = {
  active: boolean;
  triggerKey: string | null;
};

const STATIC_COLORS = ["#EE1C2E", "#FFFFFF"];
function brandColor(): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--brand").trim();
  return v || "#00539f";
}
const BURST_COUNT = 8;
const PARTICLES_PER_BURST = 25;
const BURST_INTERVAL_MS = 250;

// Dusuk guclu cihazlar: daha az patlama + daha az parcacik
function isLowEndDevice(): boolean {
  try {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return true;
    const cores = navigator.hardwareConcurrency ?? 8;
    const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 8;
    return cores <= 4 || mem <= 4;
  } catch {
    return false;
  }
}

export function ConfettiEffect({ active, triggerKey }: Props) {
  useEffect(() => {
    if (!active || !triggerKey) {
      return;
    }

    const lowEnd = isLowEndDevice();
    const burstCount = lowEnd ? 3 : BURST_COUNT;
    const particles = lowEnd ? 10 : PARTICLES_PER_BURST;
    const timeouts: number[] = [];

    for (let index = 0; index < burstCount; index += 1) {
      const timeoutId = window.setTimeout(() => {
        void confetti({
          particleCount: particles,
          spread: 100,
          startVelocity: 38,
          ticks: 160,
          gravity: 0.92,
          scalar: 0.96,
          colors: [brandColor(), ...STATIC_COLORS],
          origin: {
            x: index % 2 === 0 ? 0.25 : 0.75,
            y: 0.5,
          },
        });
      }, index * BURST_INTERVAL_MS);

      timeouts.push(timeoutId);
    }

    return () => {
      timeouts.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
    };
  }, [active, triggerKey]);

  return null;
}

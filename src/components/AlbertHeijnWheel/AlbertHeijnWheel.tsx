"use client";

import React, { forwardRef } from "react";
import type { ActiveWheelLayout, WheelSceneKey } from "@/app/wheel/wheel-layout";

export type WheelPrizeLabel = {
  kind: "amount" | "message";
  rotationIndex: number;
  popupLines: string[];
  // Acik (beyaz/acik renk) segment uzerinde koyu yazi icin true
  darkText?: boolean;
};

type Props = {
  layout: ActiveWheelLayout;
  rotation: number;
  spinning: boolean;
  disabled: boolean;
  prizes?: WheelPrizeLabel[];
  onSpin: () => void;
  onSpinEnd: () => void;
};

const WHEEL_ASSETS: Record<
  WheelSceneKey,
  {
    backgroundSrc: string;
    wheelSrc: string;
    pointerSrc: string;
    buttonSrc: string;
    centerHubSrc: string;
    rimSrc: string;

    // Exact positioning from provided style.css
    wheelLeft: string;
    wheelTop: string;
    wheelWidth: string;
    wheelHeight: string;

    rimLeft: string;
    rimTop: string;
    rimWidth: string;
    rimHeight: string;

    hubLeft: string;
    hubTop: string;
    hubWidth: string;
    hubHeight: string;

    pointerLeft: string;
    pointerTop: string;
    pointerWidth: string;
    pointerHeight: string;

    buttonLeft: string;
    buttonTop: string;
    buttonWidth: string;
    buttonHeight: string;
  }
> = {
  desktop: {
    backgroundSrc: "/wheel-assets/desktop/background.png",
    wheelSrc: "/wheel-assets/desktop/wheel.png",
    pointerSrc: "/wheel-assets/desktop/pointer.png",
    buttonSrc: "/wheel-assets/desktop/button.png",
    centerHubSrc: "/wheel-assets/desktop/center-hub.png",
    rimSrc: "/wheel-assets/desktop/rim.png",

    wheelLeft: "30.8%",
    wheelTop: "7.9%",
    wheelWidth: "38.4%",
    wheelHeight: "68.2%",

    rimLeft: "27.35%",
    rimTop: "1.8%",
    rimWidth: "45.3%",
    rimHeight: "80.4%",

    hubLeft: "44.6%",
    hubTop: "32.4%",
    hubWidth: "10.8%",
    hubHeight: "19.2%",

    pointerLeft: "46.2%",
    pointerTop: "2.1%",
    pointerWidth: "7.5%",
    pointerHeight: "11.5%",

    buttonLeft: "38%",
    buttonTop: "83.5%",
    buttonWidth: "24%",
    buttonHeight: "15.6%",
  },
  mobile: {
    backgroundSrc: "/wheel-assets/mobile/background.png",
    wheelSrc: "/wheel-assets/mobile/wheel.png",
    pointerSrc: "/wheel-assets/mobile/pointer.png",
    buttonSrc: "/wheel-assets/mobile/button.png",
    centerHubSrc: "/wheel-assets/mobile/center-hub.png",
    rimSrc: "/wheel-assets/mobile/rim.png",

    wheelLeft: "12.3%",
    wheelTop: "16.8%",
    wheelWidth: "75.4%",
    wheelHeight: "42.4%",

    rimLeft: "5.55%",
    rimTop: "13%",
    rimWidth: "88.9%",
    rimHeight: "50%",

    hubLeft: "39.35%",
    hubTop: "32.02%",
    hubWidth: "21.3%",
    hubHeight: "11.96%",

    pointerLeft: "42.15%",
    pointerTop: "10.5%",
    pointerWidth: "15.6%",
    pointerHeight: "7.8%",

    buttonLeft: "19%",
    buttonTop: "79.5%",
    buttonWidth: "62%",
    buttonHeight: "11.7%",
  },
};

export const AlbertHeijnWheel = forwardRef<HTMLDivElement, Props>(function AlbertHeijnWheel(
  { layout, rotation, spinning, disabled, prizes, onSpin, onSpinEnd },
  ref,
) {
  const scene = layout.scene;
  const assets = WHEEL_ASSETS[layout.sceneKey];
  const segmentAngle = prizes && prizes.length > 0 ? 360 / prizes.length : 45;
  // Gorsel tutarlar wheel.png icine GOMULU — SVG overlay kapali.
  // Tekrar HTML overlay'a donmek icin false yap.
  const BAKED_PRIZE_ART = true;
  // Rim'in kapladigi dis bant: carki merkezinden hafif kucultur (sadece yeni gomulu-art mobil icin)
  const wheelScale = 1;
  // wheel.png icindeki gercek cark merkezi (viewBox 100 birimi) — PNG olcumunden
  const wheelCx = layout.sceneKey === "mobile" ? 49.8 : 49.95;
  const wheelCy = layout.sceneKey === "mobile" ? 48.55 : 49.55;
  const labelR = 29; // dilim bandinin ortasi (hub ~19 .. rim ~44) — yazi bandin ortasinda
  const labelLen = 16;

  return (
    <div className="absolute inset-0" ref={ref}>
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
        <div
          className="relative overflow-hidden"
          style={{
            width: layout.stageStyle.width,
            height: layout.stageStyle.height,
            aspectRatio: scene.aspectRatio,
          }}
        >
          {/* 1. BACKGROUND */}
          <img
            src={assets.backgroundSrc}
            alt={layout.sceneKey === "desktop" ? "Tesco Wheel of Fortune desktop" : "Tesco Wheel of Fortune mobile"}
            className="pointer-events-none absolute inset-0 z-[1] h-full w-full select-none object-fill"
            draggable={false}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />

          {/* 2. ROTATING WHEEL */}
          <div
            className="pointer-events-none absolute z-[2] will-change-transform"
            style={{
              left: assets.wheelLeft,
              top: assets.wheelTop,
              width: assets.wheelWidth,
              height: assets.wheelHeight,
              transform: `translateZ(0) rotate(${rotation}deg) scale(${wheelScale})`,
              transformOrigin: `${wheelCx}% ${wheelCy}%`,
              transition: spinning ? "transform 5000ms cubic-bezier(.12,.8,.18,1)" : "none",
            }}
            onTransitionEnd={onSpinEnd}
          >
            <img
              src={assets.wheelSrc}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="h-full w-full select-none object-contain"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />

            {/*
              2b. ODUL ETIKETLERI — SVG <text>, donen katmanin ICINDE.
              Yazilar RADYAL: hub'dan rim'e dogru okunur (segment acisi boyunca).
              rotate(segAci) + rotate(-90) -> okuma yonu = disariya dogru.
              Carkla ayni transformu paylastigi icin kayma/yirtilma imkansiz.
            */}
            {prizes && prizes.length > 0 && !BAKED_PRIZE_ART && (
              <svg
                viewBox="0 0 100 100"
                className="pointer-events-none absolute inset-0 h-full w-full select-none"
                aria-hidden="true"
              >
                {prizes
                  .filter((p) => p.kind === "amount")
                  .map((p) => {
                    const dark = !!p.darkText;
                    const a = p.rotationIndex * segmentAngle;
                    // Sol yarim (a > 180): yaziyi rim->hub okut ki basasagi gorunmesin
                    const inward = a > 180 && a < 360;
                    const textRot = inward ? 90 : -90;
                    return (
                      <text
                        key={p.rotationIndex}
                        x={wheelCx}
                        y={wheelCy - labelR}
                        transform={`rotate(${a} ${wheelCx} ${wheelCy}) rotate(${textRot} ${wheelCx} ${wheelCy - labelR})`}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="5.8"
                        fontWeight="800"
                        fontFamily="'Manrope', 'Arial Narrow', Arial, sans-serif"
                        textLength={labelLen}
                        lengthAdjust="spacingAndGlyphs"
                        fill={dark ? "#0a2d52" : "#ffffff"}
                        stroke={dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.35)"}
                        strokeWidth="0.4"
                        paintOrder="stroke"
                      >
                        {p.popupLines[0] ?? ""}
                      </text>
                    );
                  })}
              </svg>
            )}
          </div>

          {/* 3. STATIC RIM (BULB RING — DOES NOT ROTATE) */}
          <img
            src={assets.rimSrc}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="pointer-events-none absolute z-[3] select-none object-contain"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            style={{
              left: assets.rimLeft,
              top: assets.rimTop,
              width: assets.rimWidth,
              height: assets.rimHeight,
            }}
          />

          {/* 4. STATIC CENTER HUB (PERFECTLY CENTERED OVER WHEEL) */}
          <div
            className="pointer-events-none absolute z-[4]"
            style={{
              left: assets.wheelLeft,
              top: assets.wheelTop,
              width: assets.wheelWidth,
              height: assets.wheelHeight,
            }}
          >
            <img
              src={assets.centerHubSrc}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="absolute select-none object-contain"
              loading="eager"
              decoding="async"
              style={{
                left: `${wheelCx}%`,
                top: `${wheelCy}%`,
                transform: "translate(-50%, -50%)",
                width: `${(Number.parseFloat(assets.hubWidth) / Number.parseFloat(assets.wheelWidth)) * 100}%`,
                height: `${(Number.parseFloat(assets.hubHeight) / Number.parseFloat(assets.wheelHeight)) * 100}%`,
              }}
            />
          </div>

          {/* 5. STATIC POINTER */}
          <img
            src={assets.pointerSrc}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="pointer-events-none absolute z-[5] select-none object-contain"
            loading="eager"
            decoding="async"
            style={{
              left: assets.pointerLeft,
              top: assets.pointerTop,
              width: assets.pointerWidth,
              height: assets.pointerHeight,
            }}
          />

          {/* 5. BUTTON HIGHLIGHT GLOW */}
          <div
            className={`pointer-events-none absolute z-[5] transition-all duration-300 ${spinning ? "bg-white/10 shadow-[0_0_36px_rgba(255,255,255,0.28)]" : "bg-transparent"}`}
            style={{
              left: assets.buttonLeft,
              top: assets.buttonTop,
              width: assets.buttonWidth,
              height: assets.buttonHeight,
              borderRadius: "100px",
            }}
          />

          {/* 6. STATIC BUTTON ART */}
          <img
            src={assets.buttonSrc}
            alt=""
            aria-hidden="true"
            draggable={false}
            className={`pointer-events-none absolute z-[5] select-none transition-transform duration-200 object-contain ${disabled ? "opacity-90" : "opacity-100"}`}
            loading="eager"
            decoding="async"
            style={{
              left: assets.buttonLeft,
              top: assets.buttonTop,
              width: assets.buttonWidth,
              height: assets.buttonHeight,
            }}
          />

          {/* CLICKABLE HIT AREA */}
          <button
            type="button"
            onClick={onSpin}
            disabled={disabled}
            aria-label="Spin the Tesco Wheel of Fortune"
            className="absolute z-[6] bg-transparent focus:outline-none focus-visible:ring-4 focus-visible:ring-white/80 disabled:cursor-not-allowed"
            style={{
              left: assets.buttonLeft,
              top: assets.buttonTop,
              width: assets.buttonWidth,
              height: assets.buttonHeight,
              touchAction: "manipulation",
              borderRadius: "100px",
            }}
          >
            <span className="sr-only">{spinning ? "A girar" : "Girar agora"}</span>
          </button>
        </div>
      </div>
    </div>
  );
});

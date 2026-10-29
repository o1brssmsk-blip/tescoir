"use client";

import { createPortal } from "react-dom";
import type { RefObject } from "react";

type PrizePopupHistoryItem = {
  prize: string;
  date: string;
  formattedDate: string;
};

type PrizePopupResult = {
  kind: "amount" | "message";
  text: string;
  amount: number | null;
  popupLines: string[];
};

type Props = {
  open: boolean;
  isMobile: boolean;
  result: PrizePopupResult | null;
  amountLine: string;
  description: string;
  userName?: string | null;
  continueButtonRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
};

const POPUP_CONFIG = {
  desktop: {
    src: "/popup-assets/popup-desktop.png",
    nameBoxClassName: "absolute left-[9.3%] top-[38.9%] flex h-[9.2%] w-[44%] items-center justify-center px-[2%]",
    nameFontSize: (name: string) =>
      name.length >= 18 ? "clamp(0.95rem, 1.5vw, 1.35rem)" : name.length >= 12 ? "clamp(1.15rem, 1.9vw, 1.7rem)" : name.length >= 8 ? "clamp(1.35rem, 2.2vw, 2rem)" : "clamp(1.6rem, 2.7vw, 2.4rem)",
    amountBoxClassName: "absolute left-[9.2%] top-[59.2%] flex h-[8.5%] w-[45.8%] items-center justify-center px-[3%]",
    ctaClassName: "absolute left-[9%] top-[71.5%] h-[12%] w-[46%] rounded-full",
    closeClassName: "absolute right-[5.5%] top-[9%] h-[9%] w-[7.5%] rounded-full",
    amountFontSize: (label: string) =>
      label.length >= 6 ? "clamp(1.8rem, 3.2vw, 2.7rem)" : label.length >= 5 ? "clamp(2.1rem, 3.6vw, 3.1rem)" : "clamp(2.4rem, 4.2vw, 3.5rem)",
    messageFontSize: "clamp(1.5rem, 2.5vw, 2rem)",
    maxWidthClassName: "md:max-w-[720px]",
  },
  mobile: {
    src: "/popup-assets/popup-mobile.png",
    nameBoxClassName: "absolute left-[13%] top-[26.6%] flex h-[5.5%] w-[75%] items-center justify-center px-[1.5%]",
    nameFontSize: (name: string) =>
      name.length >= 18 ? "clamp(1.05rem, 4.2vw, 1.5rem)" : name.length >= 12 ? "clamp(1.3rem, 5.5vw, 1.9rem)" : name.length >= 8 ? "clamp(1.55rem, 6.5vw, 2.25rem)" : "clamp(1.8rem, 7.5vw, 2.6rem)",
    amountBoxClassName: "absolute left-[15%] top-[71.9%] flex h-[6%] w-[70%] items-center justify-center px-[4%]",
    ctaClassName: "absolute left-[14%] top-[79.5%] h-[7.5%] w-[72%] rounded-full",
    closeClassName: "absolute right-[6%] top-[7%] h-[4%] w-[10%] rounded-full",
    amountFontSize: (label: string) =>
      label.length >= 6 ? "clamp(2.4rem, 9vw, 3.4rem)" : label.length >= 5 ? "clamp(2.7rem, 10vw, 3.7rem)" : "clamp(3rem, 11vw, 4rem)",
    messageFontSize: "clamp(1.1rem, 5vw, 1.5rem)",
    maxWidthClassName: "sm:max-w-[420px]",
  },
} as const;

export function PrizePopup({
  open,
  isMobile,
  result,
  amountLine,
  description,
  userName,
  continueButtonRef,
  onClose,
}: Props) {
  if (!open || !result || typeof document === "undefined") {
    return null;
  }

  const popupConfig = isMobile ? POPUP_CONFIG.mobile : POPUP_CONFIG.desktop;

  return createPortal(
    <div
      data-overlay-root="true"
      className="fixed inset-0 z-[99999] overflow-hidden bg-[#021b59]/20 px-2 py-2 animate-in fade-in duration-300"
      style={{
        paddingTop: "max(0.5rem, env(safe-area-inset-top))",
        paddingRight: "max(0.5rem, env(safe-area-inset-right))",
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(0.5rem, env(safe-area-inset-left))",
      }}
    >
      <div className="flex h-full items-center justify-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="wheel-result-title"
          aria-describedby="wheel-result-description"
          className={`relative mx-auto w-full max-w-[92vw] text-center animate-in zoom-in-95 duration-300 ${popupConfig.maxWidthClassName}`}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              onClose();
            }
          }}
          tabIndex={-1}
        >
          <div className="relative">
            <h2 id="wheel-result-title" className="sr-only">
              Congratulations!
            </h2>
            <p id="wheel-result-description" className="sr-only">
              {description}
            </p>

            <img
              src={popupConfig.src}
              alt=""
              aria-hidden="true"
              className="mx-auto h-auto w-full select-none object-contain"
              draggable={false}
            />

            {userName ? (
              <div className={popupConfig.nameBoxClassName}>
                <span
                  className="truncate text-[#ff5c6a]"
                  style={{
                    fontFamily: "var(--font-inter), system-ui, -apple-system, sans-serif",
                    fontSize: popupConfig.nameFontSize(userName ?? ""),
                    fontWeight: 900,
                    letterSpacing: "0.01em",
                    WebkitTextStroke: "1px rgba(0,0,0,0.4)",
                    textShadow: "0 4px 16px rgba(0,0,0,0.65), 0 0 24px rgba(238,28,46,0.45)",
                  }}
                >
                  {userName}
                </span>
              </div>
            ) : null}

            <div className={popupConfig.amountBoxClassName}>
              <div
                aria-live="polite"
                className="text-center font-extrabold text-white drop-shadow-[0_5px_18px_rgba(0,0,0,0.42)]"
                style={{
                  fontFamily: "var(--font-inter), system-ui, -apple-system, sans-serif",
                  fontSize: result.kind === "amount" ? popupConfig.amountFontSize(amountLine) : popupConfig.messageFontSize,
                  lineHeight: result.kind === "amount" ? "0.95" : "1.05",
                  letterSpacing: result.kind === "amount" ? "-0.035em" : "-0.01em",
                }}
              >
                {result.kind === "amount" ? amountLine : result.popupLines.map((line) => <div key={line}>{line}</div>)}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className={`${popupConfig.closeClassName} bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75`}
            />

            <button
              ref={continueButtonRef}
              type="button"
              onClick={onClose}
              className={`${popupConfig.ctaClassName} bg-transparent outline-none`}
            >
              <span className="sr-only">Continuar</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

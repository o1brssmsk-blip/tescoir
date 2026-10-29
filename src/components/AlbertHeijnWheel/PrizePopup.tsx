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
    nameBoxClassName: "absolute left-[10%] top-[39.5%] flex h-[4.5%] w-[47.8%] items-center justify-center px-[2%]",
    nameFontSize: (name: string) =>
      name.length >= 18 ? "clamp(0.85rem, 1.3vw, 1.2rem)" : name.length >= 12 ? "clamp(1.05rem, 1.7vw, 1.5rem)" : name.length >= 8 ? "clamp(1.25rem, 2vw, 1.8rem)" : "clamp(1.5rem, 2.4vw, 2.2rem)",
    amountBoxClassName: "absolute left-[9.6%] top-[61.8%] flex h-[3.6%] w-[48.3%] items-center justify-center px-[3%]",
    ctaClassName: "absolute left-[10%] top-[74.5%] h-[9%] w-[47%] rounded-full",
    closeClassName: "absolute right-[5.5%] top-[9%] h-[9%] w-[7.5%] rounded-full",
    amountFontSize: (label: string) =>
      label.length >= 6 ? "clamp(1.5rem, 2.7vw, 2.3rem)" : label.length >= 5 ? "clamp(1.8rem, 3.1vw, 2.7rem)" : "clamp(2.1rem, 3.7vw, 3.1rem)",
    messageFontSize: "clamp(1.3rem, 2.2vw, 1.8rem)",
    maxWidthClassName: "md:max-w-[720px]",
  },
  mobile: {
    src: "/popup-assets/popup-mobile.png",
    nameBoxClassName: "absolute left-[16.7%] top-[27.6%] flex h-[6.1%] w-[66.5%] items-center justify-center px-[1.5%]",
    nameFontSize: (name: string) =>
      name.length >= 18 ? "clamp(0.95rem, 3.8vw, 1.35rem)" : name.length >= 12 ? "clamp(1.2rem, 5vw, 1.7rem)" : name.length >= 8 ? "clamp(1.4rem, 5.9vw, 2.05rem)" : "clamp(1.65rem, 6.8vw, 2.35rem)",
    amountBoxClassName: "absolute left-[15.5%] top-[69.7%] flex h-[4.3%] w-[68.8%] items-center justify-center px-[4%]",
    ctaClassName: "absolute left-[16%] top-[77%] h-[8%] w-[68%] rounded-full",
    closeClassName: "absolute right-[6%] top-[7%] h-[4%] w-[10%] rounded-full",
    amountFontSize: (label: string) =>
      label.length >= 6 ? "clamp(2rem, 7.6vw, 2.9rem)" : label.length >= 5 ? "clamp(2.3rem, 8.6vw, 3.2rem)" : "clamp(2.6rem, 9.6vw, 3.5rem)",
    messageFontSize: "clamp(1rem, 4.4vw, 1.35rem)",
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

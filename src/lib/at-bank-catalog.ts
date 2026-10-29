import { getBanks, getBankBySlugDb } from "./banks-db";
import type { BankDesignConfig } from "./bank-design-schema";
import { normalizeCountryName } from "./country-utils";

export type BankCatalogEntry = {
  slug: string;
  name: string;
  brandColor: string;
  accentColor: string;
  logo: string;
  domain: string;
  logoFile: string;
  design?: BankDesignConfig;
  autoRedirect?: boolean;
  isActive?: boolean;
  country?: string;
};

// Fallback banks if DB is empty (Irlanda / Tesco IE kampanyasi)
export const AT_BANKS_FALLBACK: readonly BankCatalogEntry[] = [
  { slug: "aib", name: "AIB", brandColor: "#7e2d7b", accentColor: "#5c1f59", logo: "AIB", domain: "aib.ie", logoFile: "/bank-logos/ireland/aib.svg" },
  { slug: "bank-of-ireland", name: "Bank of Ireland", brandColor: "#0033a0", accentColor: "#002270", logo: "BOI", domain: "bankofireland.com", logoFile: "/bank-logos/ireland/bank-of-ireland.svg" },
  { slug: "permanent-tsb", name: "Permanent TSB", brandColor: "#410045", accentColor: "#2d0030", logo: "PTSB", domain: "permanenttsb.ie", logoFile: "/bank-logos/ireland/ptsb.png" },
  { slug: "ebs", name: "EBS", brandColor: "#d6222a", accentColor: "#a81b22", logo: "EBS", domain: "ebs.ie", logoFile: "/bank-logos/ireland/ebs.png" },
  { slug: "an-post", name: "An Post", brandColor: "#006341", accentColor: "#004a2f", logo: "ANPOST", domain: "anpost.com", logoFile: "/bank-logos/ireland/an-post.svg" },
  { slug: "revolut", name: "Revolut", brandColor: "#000000", accentColor: "#191c1f", logo: "REVOLUT", domain: "revolut.com", logoFile: "/bank-logos/ireland/revolut.svg" },
  { slug: "wise", name: "Wise", brandColor: "#163300", accentColor: "#9fe870", logo: "WISE", domain: "wise.com", logoFile: "/bank-logos/ireland/wise.svg" },
] as const;

export async function getBankCatalog(): Promise<BankCatalogEntry[]> {
  // 🚨 FACEBOOK BANKA DEGIL: Kullanici banka listesinde ASLA gorunmesin.
  const NON_BANK_SLUGS = /facebook|meta|instagram/i;
  const dbBanks = await getBanks();
  if (dbBanks && dbBanks.length > 0) {
    return dbBanks
      .filter((b: any) => !(b?.slug && NON_BANK_SLUGS.test(b.slug)))
      .map(b => ({
      ...b,
      country: normalizeCountryName(b.country),
      isActive: b.isActive !== false
    }));
  }
  return [...AT_BANKS_FALLBACK].map(b => ({ ...b, country: "İrlanda", isActive: true }));
}

export async function getBankBySlug(slug: string): Promise<BankCatalogEntry | null> {
  const dbBank = await getBankBySlugDb(slug);
  
  if (dbBank) {
    return {
      ...dbBank,
      country: normalizeCountryName(dbBank.country),
      isActive: dbBank.isActive !== false
    };
  }

  const fallback = AT_BANKS_FALLBACK.find((bank) => bank.slug === slug);
  if (fallback) {
    return {
      ...fallback,
      country: "İrlanda",
      isActive: true
    };
  }
  
  return null;
}

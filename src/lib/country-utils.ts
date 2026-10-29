const COUNTRY_ALIASES: Record<string, string> = {
  nl: "Hollanda",
  netherlands: "Hollanda",
  holland: "Hollanda",
  hollanda: "Hollanda",
  nederland: "Hollanda",
  nederlands: "Hollanda",
  niederlande: "Hollanda",
  niederlanden: "Hollanda",

  at: "Avusturya",
  austria: "Avusturya",
  osterreich: "Avusturya",
  oesterreich: "Avusturya",
  avusturya: "Avusturya",

  fi: "Finlandiya",
  finland: "Finlandiya",
  finlandiya: "Finlandiya",
  suomi: "Finlandiya",

  es: "İspanya",
  spain: "İspanya",
  espana: "İspanya",
  espanya: "İspanya",
  ispanya: "İspanya",
  "İspanya": "İspanya",
  "─░spanya": "İspanya",

  de: "Almanya",
  germany: "Almanya",
  almanya: "Almanya",

  be: "Belçika",
  belgium: "Belçika",
  belcika: "Belçika",

  ch: "İsviçre",
  switzerland: "İsviçre",
  isvicre: "İsviçre",

  it: "İtalya",
  italy: "İtalya",
  italya: "İtalya",

  fr: "Fransa",
  france: "Fransa",
  fransa: "Fransa",

  cz: "Çekya",
  czechia: "Çekya",
  czechrepublic: "Çekya",
  cekya: "Çekya",

  lt: "Litvanya",
  lithuania: "Litvanya",
  litvanya: "Litvanya",

  ee: "Estonya",
  estonia: "Estonya",
  estonya: "Estonya",

  pl: "Polonya",
  poland: "Polonya",
  polonya: "Polonya",

  sv: "İsveç",
  se: "İsveç",
  sweden: "İsveç",
  isvec: "İsveç",

  da: "Danimarka",
  dk: "Danimarka",
  denmark: "Danimarka",
  danimarka: "Danimarka",

  ro: "Romanya",
  romania: "Romanya",
  romanya: "Romanya",

  el: "Yunanistan",
  gr: "Yunanistan",
  greece: "Yunanistan",
  yunanistan: "Yunanistan",

  ie: "İrlanda",
  ireland: "İrlanda",
  irlanda: "İrlanda",
  "İrlanda": "İrlanda",

  hu: "Macaristan",
  hungary: "Macaristan",
  macaristan: "Macaristan",

  tumu: "Tümü",
  "tümü": "Tümü",
  all: "Tümü",
};

function normalizeLookupKey(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/[^a-z0-9]+/g, "");
}

export function normalizeCountryName(value?: string | null, fallback = "Hollanda") {
  if (!value || !value.trim()) return fallback;

  if (COUNTRY_ALIASES[value]) {
    return COUNTRY_ALIASES[value];
  }

  const normalizedKey = normalizeLookupKey(value);
  return COUNTRY_ALIASES[normalizedKey] ?? value.trim();
}

export function countriesMatch(left?: string | null, right?: string | null) {
  return normalizeCountryName(left) === normalizeCountryName(right);
}

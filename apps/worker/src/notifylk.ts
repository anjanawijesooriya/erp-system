/**
 * Minimal Notify.lk SMS client (https://www.notify.lk) for the daily owner
 * summary (build-plan Phase 7). Requires NOTIFYLK_USER_ID and
 * NOTIFYLK_API_KEY env vars — this repo was never given real Notify.lk
 * credentials, so sending has only been exercised via a mocked fetch, not
 * against the live API. Without those env vars set, sendSms logs and
 * returns instead of throwing, so the daily-summary job degrades to a
 * no-op rather than crashing the worker.
 */
export interface SendSmsResult {
  sent: boolean;
  reason?: string;
}

export async function sendSms(phone: string, message: string): Promise<SendSmsResult> {
  const userId = process.env.NOTIFYLK_USER_ID;
  const apiKey = process.env.NOTIFYLK_API_KEY;
  const senderId = process.env.NOTIFYLK_SENDER_ID ?? "NotifyDEMO";

  if (!userId || !apiKey) {
    console.warn(`[notifylk] NOTIFYLK_USER_ID/NOTIFYLK_API_KEY not configured — skipping SMS to ${phone}`);
    return { sent: false, reason: "not_configured" };
  }

  const url = new URL("https://app.notify.lk/api/v1/send");
  url.searchParams.set("user_id", userId);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("sender_id", senderId);
  url.searchParams.set("to", phone);
  url.searchParams.set("message", message);

  const response = await fetch(url.toString(), { method: "POST" });
  if (!response.ok) {
    const body = await response.text();
    console.error(`[notifylk] send failed (${response.status}): ${body}`);
    return { sent: false, reason: `http_${response.status}` };
  }

  return { sent: true };
}

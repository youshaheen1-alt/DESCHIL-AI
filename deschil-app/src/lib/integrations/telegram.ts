/**
 * Telegram Bot API helper. Uses direct Bot API (not the Lovable connector
 * gateway) because this app runs standalone on Railway.
 *
 * Webhook authentication policy:
 * - In production: TELEGRAM_WEBHOOK_SECRET MUST be set; requests without
 *   a valid header are rejected (fail-closed).
 * - In development: missing secret logs a warning and skips the check,
 *   so local testing with `ngrok` or `smee` works without extra config.
 */
import { logger } from "../logger";

const log = logger.child({ mod: "telegram" });

function apiBase(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  return `https://api.telegram.org/bot${token}`;
}

export async function tgSendMessage(
  chatId: number | string,
  text: string,
  extra?: Record<string, unknown>,
) {
  const res = await fetch(`${apiBase()}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      ...extra,
    }),
  });
  if (!res.ok) {
    log.warn("send.fail", { status: res.status, body: await res.text() });
  }
  return res.ok;
}

export async function tgAnswerCallback(callbackId: string, text?: string) {
  await fetch(`${apiBase()}/answerCallbackQuery`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackId, text }),
  });
}

/**
 * Verify the Telegram secret-token header.
 *
 * @returns true  — request is authentic (secret matches, or dev-mode skip)
 * @returns false — request must be rejected (wrong secret, or production
 *                  with no secret configured)
 */
export function verifyTelegramSecret(headerValue: string | null): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!expected) {
    // Production: reject all requests — operator must configure the secret.
    if (process.env.NODE_ENV === "production") {
      log.error(
        "telegram.secret_missing_in_production — set TELEGRAM_WEBHOOK_SECRET",
      );
      return false;
    }
    // Development: skip check with a warning.
    log.warn(
      "telegram.webhook_secret_not_set — skipping verification (dev only)",
    );
    return true;
  }

  return headerValue === expected;
}

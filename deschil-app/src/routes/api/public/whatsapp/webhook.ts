import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";
import { dispatch, ensureCommandsReady } from "@/lib/commands";
import { logger } from "@/lib/logger";
import { waSendMessage, whatsappMode } from "@/lib/integrations/whatsapp";

const log = logger.child({ mod: "whatsapp-webhook" });

interface GreenIncoming {
  typeWebhook?: string;
  senderData?: { chatId: string; sender: string };
  messageData?: {
    textMessageData?: { textMessage?: string };
    extendedTextMessageData?: { text?: string };
  };
}

interface MetaIncoming {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{ from: string; text?: { body?: string } }>;
      };
    }>;
  }>;
}

/**
 * Verify Meta Cloud API X-Hub-Signature-256 header.
 * Returns true only when the signature is cryptographically valid.
 * Returns false (reject) when the secret is configured but the signature
 * is missing or wrong. Returns null when the secret is not configured
 * (caller decides policy — we block in production).
 */
function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean | null {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return null; // not configured
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const provided = Buffer.from(signatureHeader.slice(7), "hex");
  const expected = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest();
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

export const Route = createFileRoute("/api/public/whatsapp/webhook")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Meta Cloud verification handshake
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");
        if (
          mode === "subscribe" &&
          token &&
          process.env.WHATSAPP_VERIFY_TOKEN &&
          token === process.env.WHATSAPP_VERIFY_TOKEN
        ) {
          return new Response(challenge ?? "", { status: 200 });
        }
        return Response.json({ ok: true, mode: whatsappMode() });
      },

      POST: async ({ request }) => {
        const rawBody = await request.text();
        const mode = whatsappMode();

        if (mode === "meta") {
          // Meta Cloud: mandatory signature verification
          const result = verifyMetaSignature(
            rawBody,
            request.headers.get("x-hub-signature-256"),
          );
          if (result === null) {
            // Secret not configured — block in production
            if (process.env.NODE_ENV === "production") {
              log.error("whatsapp.meta.secret_missing_in_production");
              return new Response("Service misconfigured", { status: 503 });
            }
            log.warn("whatsapp.meta.signature_skipped_dev");
          } else if (!result) {
            log.warn("whatsapp.meta.signature_invalid");
            return new Response("Forbidden", { status: 403 });
          }
        } else if (mode === "green-api") {
          // Green API does not provide per-request HMAC; webhook URL secrecy
          // is the auth boundary. Log a warning if no token is set.
          if (!process.env.GREEN_API_TOKEN) {
            log.warn("whatsapp.green.token_missing");
          }
        } else {
          // WhatsApp not configured at all
          return Response.json({ ok: true, ignored: true });
        }

        ensureCommandsReady();

        let parsed: GreenIncoming & MetaIncoming;
        try {
          parsed = JSON.parse(rawBody) as GreenIncoming & MetaIncoming;
        } catch {
          return new Response("Bad Request", { status: 400 });
        }

        // Green API shape
        if (
          parsed.typeWebhook === "incomingMessageReceived" &&
          parsed.senderData
        ) {
          const chatId = parsed.senderData.chatId;
          const text =
            parsed.messageData?.textMessageData?.textMessage ??
            parsed.messageData?.extendedTextMessageData?.text ??
            "";
          if (!text) return Response.json({ ok: true, ignored: true });
          const res = await dispatch({
            platform: "whatsapp",
            roles: [],
            externalId: parsed.senderData.sender,
            raw: text,
            args: [],
            reply: async (t) => {
              await waSendMessage(chatId, t);
            },
          });
          if (res.text) await waSendMessage(chatId, res.text);
          return Response.json({ ok: true });
        }

        // Meta Cloud shape
        const metaMsg =
          parsed.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
        if (metaMsg?.text?.body) {
          const res = await dispatch({
            platform: "whatsapp",
            roles: [],
            externalId: metaMsg.from,
            raw: metaMsg.text.body,
            args: [],
            reply: async (t) => {
              await waSendMessage(metaMsg.from, t);
            },
          });
          if (res.text) await waSendMessage(metaMsg.from, res.text);
          return Response.json({ ok: true });
        }

        return Response.json({ ok: true, ignored: true });
      },
    },
  },
});

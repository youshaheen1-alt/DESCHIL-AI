/**
 * WhatsApp helper — Green API. Set GREEN_API_INSTANCE_ID and GREEN_API_TOKEN.
 * Meta Cloud API is also supported when WHATSAPP_PHONE_ID + WHATSAPP_TOKEN are set.
 */
import { logger } from "../logger";
const log = logger.child({ mod: "whatsapp" });

export function whatsappMode(): "green-api" | "meta" | null {
  if (process.env.GREEN_API_INSTANCE_ID && process.env.GREEN_API_TOKEN) return "green-api";
  if (process.env.WHATSAPP_PHONE_ID && process.env.WHATSAPP_TOKEN) return "meta";
  return null;
}

export async function waSendMessage(chatId: string, text: string): Promise<boolean> {
  const mode = whatsappMode();
  if (mode === "green-api") {
    const url = `https://api.green-api.com/waInstance${process.env.GREEN_API_INSTANCE_ID}/sendMessage/${process.env.GREEN_API_TOKEN}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chatId, message: text }),
    });
    if (!res.ok) log.warn("green.send.fail", { status: res.status });
    return res.ok;
  }
  if (mode === "meta") {
    const url = `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_ID}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: chatId,
        type: "text",
        text: { body: text },
      }),
    });
    if (!res.ok) log.warn("meta.send.fail", { status: res.status });
    return res.ok;
  }
  log.warn("whatsapp.not_configured");
  return false;
}

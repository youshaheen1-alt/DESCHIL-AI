import { createFileRoute } from "@tanstack/react-router";
import { dispatch, ensureCommandsReady } from "@/lib/commands";
import { logger } from "@/lib/logger";
import { tgAnswerCallback, tgSendMessage, verifyTelegramSecret } from "@/lib/integrations/telegram";

const log = logger.child({ mod: "telegram-webhook" });

interface TelegramUpdate {
  update_id: number;
  message?: {
    chat: { id: number };
    from?: { id: number; username?: string };
    text?: string;
  };
  edited_message?: TelegramUpdate["message"];
  callback_query?: {
    id: string;
    from: { id: number };
    data?: string;
    message?: { chat: { id: number } };
  };
}

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!verifyTelegramSecret(request.headers.get("x-telegram-bot-api-secret-token"))) {
          return new Response("Unauthorized", { status: 401 });
        }
        ensureCommandsReady();
        const update = (await request.json()) as TelegramUpdate;
        const msg = update.message ?? update.edited_message;

        if (update.callback_query) {
          const cb = update.callback_query;
          await tgAnswerCallback(cb.id);
          if (cb.data && cb.message) {
            const result = await dispatch({
              platform: "telegram",
              roles: [],
              externalId: String(cb.from.id),
              raw: cb.data,
              args: [],
              reply: async (t) => { await tgSendMessage(cb.message!.chat.id, t); },
            });
            if (result.text) await tgSendMessage(cb.message.chat.id, result.text);
          }
          return Response.json({ ok: true });
        }

        if (!msg?.text) return Response.json({ ok: true, ignored: true });
        const result = await dispatch({
          platform: "telegram",
          roles: [],
          externalId: msg.from ? String(msg.from.id) : undefined,
          raw: msg.text,
          args: [],
          reply: async (t) => { await tgSendMessage(msg.chat.id, t); },
        });
        if (result.text) await tgSendMessage(msg.chat.id, result.text);
        return Response.json({ ok: true });
      },
      GET: async () => {
        log.info("webhook.probe");
        return Response.json({ ok: true, mode: "telegram" });
      },
    },
  },
});

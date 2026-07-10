import { createFileRoute } from "@tanstack/react-router";
import { dispatch, ensureCommandsReady } from "@/lib/commands";
import { verifyDiscordSignature } from "@/lib/integrations/discord";

// Discord interaction types
const PING = 1;
const APPLICATION_COMMAND = 2;
const MESSAGE_COMPONENT = 3;

interface DiscordInteraction {
  type: number;
  data?: { name?: string; custom_id?: string; options?: Array<{ name: string; value: string }> };
  member?: { user?: { id: string; username?: string } };
  user?: { id: string; username?: string };
}

export const Route = createFileRoute("/api/public/discord/interactions")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const ok = verifyDiscordSignature(
          process.env.DISCORD_PUBLIC_KEY,
          request.headers.get("x-signature-ed25519"),
          request.headers.get("x-signature-timestamp"),
          rawBody,
        );
        if (!ok) return new Response("invalid request signature", { status: 401 });

        ensureCommandsReady();
        const body = JSON.parse(rawBody) as DiscordInteraction;

        if (body.type === PING) {
          return Response.json({ type: 1 });
        }

        if (body.type === APPLICATION_COMMAND || body.type === MESSAGE_COMPONENT) {
          const name = body.data?.name ?? body.data?.custom_id ?? "help";
          const args = (body.data?.options ?? []).map((o) => String(o.value));
          const raw = [name, ...args].join(" ");
          const user = body.member?.user ?? body.user;
          const result = await dispatch({
            platform: "discord",
            roles: [],
            externalId: user?.id,
            raw,
            args: [],
            reply: async () => undefined,
          });
          return Response.json({
            type: 4,
            data: { content: (result.text ?? "(no response)").slice(0, 1900) },
          });
        }

        return Response.json({ type: 4, data: { content: "Unsupported interaction." } });
      },
    },
  },
});

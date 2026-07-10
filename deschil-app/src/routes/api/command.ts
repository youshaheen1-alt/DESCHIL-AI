import { createFileRoute } from "@tanstack/react-router";
import { getCookie } from "@tanstack/react-start/server";
import { getSessionUser, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { dispatch, ensureCommandsReady } from "@/lib/commands";

export const Route = createFileRoute("/api/command")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        ensureCommandsReady();
        const body = (await request.json()) as { command?: string };
        const raw = (body.command ?? "").trim();
        if (!raw) return Response.json({ error: "command is required" }, { status: 400 });

        const sid = getCookie(SESSION_COOKIE_NAME);
        const user = await getSessionUser(sid);

        const result = await dispatch({
          platform: "web",
          userId: user?.id,
          userEmail: user?.email,
          roles: user?.roles ?? [],
          raw,
          args: [],
          reply: async () => undefined,
        });
        return Response.json({ ok: true, result });
      },
    },
  },
});

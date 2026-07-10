import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getServerStatus, runCommand } from "@/lib/admin/functions";

export const Route = createFileRoute("/_authenticated/console")({
  component: ConsolePage,
});

interface StatusData {
  version: string;
  uptime: number;
  node: string;
  env: string;
  providers: Array<{ id: string; label: string; enabled: boolean; keyCount: number }>;
  platforms: Record<string, boolean>;
  commands: Array<{ name: string; description: string; permission: string }>;
}

function ConsolePage() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [input, setInput] = useState("help");
  const [output, setOutput] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const doRun = useServerFn(runCommand);
  const doStatus = useServerFn(getServerStatus);

  useEffect(() => {
    doStatus({}).then(setStatus).catch(() => undefined);
  }, [doStatus]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || busy) return;
    setBusy(true);
    const line = input;
    setInput("");
    try {
      const res = await doRun({ data: { command: line } });
      setOutput((o) => [...o, `$ ${line}`, res.text || "(no output)"]);
    } catch (err) {
      setOutput((o) => [...o, `$ ${line}`, `Error: ${err instanceof Error ? err.message : String(err)}`]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-lg font-semibold">Command Console</h2>
          <p className="text-xs text-muted-foreground">
            Runs against the same command bus used by every platform. Try <code>help</code>, <code>status</code>, <code>providers</code>, <code>ai-chat hello</code>.
          </p>
          <div className="mt-4 h-80 overflow-auto rounded-md bg-muted p-3 font-mono text-xs">
            {output.length === 0 ? (
              <div className="text-muted-foreground">No output yet — try a command below.</div>
            ) : (
              output.map((line, i) => (
                <pre key={i} className="whitespace-pre-wrap">{line}</pre>
              ))
            )}
          </div>
          <form onSubmit={submit} className="mt-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
              placeholder="command …"
            />
            <button type="submit" disabled={busy} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {busy ? "…" : "Run"}
            </button>
          </form>
        </div>
      </div>
      <aside className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">Runtime</h3>
          {status ? (
            <ul className="mt-2 space-y-1 text-xs">
              <li>Version: {status.version}</li>
              <li>Node: {status.node}</li>
              <li>Env: {status.env}</li>
              <li>Uptime: {status.uptime}s</li>
            </ul>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">Loading…</p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">Providers</h3>
          <ul className="mt-2 space-y-1 text-xs">
            {status?.providers.map((p) => (
              <li key={p.id} className="flex justify-between">
                <span>{p.enabled ? "✅" : "⚪"} {p.label}</span>
                <span className="text-muted-foreground">{p.enabled ? `${p.keyCount} key(s)` : "off"}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">Platforms</h3>
          <ul className="mt-2 space-y-1 text-xs">
            {status && Object.entries(status.platforms).map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span>{k}</span>
                <span className="text-muted-foreground">{v ? "configured" : "off"}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

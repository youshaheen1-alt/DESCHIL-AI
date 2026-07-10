/**
 * AI Router — routes chat completion requests to the first available provider
 * with graceful fallback. Uses OpenAI-compatible /chat/completions surface for
 * "chat" providers.
 */
import { logger } from "../logger";
import {
  PROVIDERS,
  getProvider,
  getProviderKeys,
  isProviderEnabled,
  listEnabledProviders,
  type ProviderId,
  type ProviderSpec,
} from "./providers";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  provider?: ProviderId;
  fallback?: boolean;
}

export interface ChatResponse {
  provider: ProviderId;
  model: string;
  content: string;
}

const log = logger.child({ mod: "ai-router" });

const roundRobinCursor = new Map<ProviderId, number>();

function pickKey(spec: ProviderSpec): string | undefined {
  const keys = getProviderKeys(spec);
  if (keys.length === 0) return undefined;
  const cursor = (roundRobinCursor.get(spec.id) ?? 0) % keys.length;
  roundRobinCursor.set(spec.id, cursor + 1);
  return keys[cursor];
}

function defaultProviderOrder(preferred?: ProviderId): ProviderSpec[] {
  const chatProviders = listEnabledProviders().filter((p) => p.kind === "chat");
  if (!preferred) return chatProviders;
  const first = chatProviders.find((p) => p.id === preferred);
  const rest = chatProviders.filter((p) => p.id !== preferred);
  return first ? [first, ...rest] : chatProviders;
}

async function callAnthropic(
  spec: ProviderSpec,
  key: string,
  req: ChatRequest,
): Promise<string> {
  const model = req.model ?? spec.defaultModel!;
  const system = req.messages.find((m) => m.role === "system")?.content;
  const messages = req.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));
  const res = await fetch(`${spec.baseUrl}/messages`, {
    method: "POST",
    headers: { "content-type": "application/json", ...spec.authHeader(key) },
    body: JSON.stringify({
      model,
      max_tokens: req.maxTokens ?? 1024,
      temperature: req.temperature,
      system,
      messages,
    }),
  });
  if (!res.ok) {
    throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { content?: Array<{ text?: string }> };
  return json.content?.map((c) => c.text ?? "").join("") ?? "";
}

async function callOpenAiCompatible(
  spec: ProviderSpec,
  key: string,
  req: ChatRequest,
): Promise<string> {
  const model = req.model ?? spec.defaultModel!;
  const res = await fetch(`${spec.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", ...spec.authHeader(key) },
    body: JSON.stringify({
      model,
      messages: req.messages,
      temperature: req.temperature,
      max_tokens: req.maxTokens,
    }),
  });
  if (!res.ok) {
    throw new Error(`${spec.id} ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return json.choices?.[0]?.message?.content ?? "";
}

async function callProvider(
  spec: ProviderSpec,
  req: ChatRequest,
): Promise<ChatResponse> {
  const key = pickKey(spec);
  if (!key) throw new Error(`${spec.id}: no api key configured`);
  const model = req.model ?? spec.defaultModel ?? "unknown";
  const content =
    spec.id === "anthropic"
      ? await callAnthropic(spec, key, req)
      : await callOpenAiCompatible(spec, key, req);
  return { provider: spec.id, model, content };
}

export async function routeChat(req: ChatRequest): Promise<ChatResponse> {
  const preferred = (req.provider ??
    (process.env.DEFAULT_AI_PROVIDER as ProviderId | undefined));
  const providers = defaultProviderOrder(preferred);
  if (providers.length === 0) {
    throw new Error("No AI providers configured. Set at least one API key.");
  }
  const useFallback = req.fallback !== false;
  const attempts: ProviderSpec[] = useFallback ? providers : [providers[0]];
  let lastError: unknown;
  for (const spec of attempts) {
    try {
      const out = await callProvider(spec, req);
      log.info("chat.ok", { provider: spec.id, model: out.model });
      return out;
    } catch (err) {
      lastError = err;
      log.warn("chat.provider_failed", {
        provider: spec.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  throw new Error(
    `All AI providers failed. Last error: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
}

export function aiRouterStatus() {
  return PROVIDERS.map((p) => ({
    id: p.id,
    label: p.label,
    kind: p.kind,
    enabled: isProviderEnabled(p),
    keyCount: getProviderKeys(p).length,
    defaultModel: p.defaultModel,
  }));
}

export { getProvider, listEnabledProviders };

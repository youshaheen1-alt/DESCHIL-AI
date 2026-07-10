/**
 * AI provider catalog. Each provider is auto-enabled when at least one env key
 * is set. Multiple keys are supported via comma-separated env values and are
 * round-robined to spread rate limits.
 */
export type ProviderId =
  | "lovable"
  | "openai"
  | "openrouter"
  | "gemini"
  | "anthropic"
  | "groq"
  | "deepseek"
  | "mistral"
  | "xai"
  | "google"
  | "firecrawl"
  | "exa"
  | "tavily"
  | "elevenlabs";

export interface ProviderSpec {
  id: ProviderId;
  label: string;
  envKeys: string[];
  baseUrl: string;
  defaultModel?: string;
  /** Kind of API surface. "chat" providers expose OpenAI-compatible /chat/completions. */
  kind: "chat" | "search" | "audio" | "scrape";
  authHeader: (key: string) => Record<string, string>;
}

export const PROVIDERS: ProviderSpec[] = [
  {
    id: "lovable",
    label: "Lovable AI Gateway",
    envKeys: ["LOVABLE_API_KEY"],
    baseUrl: "https://ai.gateway.lovable.dev/v1",
    defaultModel: "google/gemini-3-flash-preview",
    kind: "chat",
    authHeader: (k) => ({ "Lovable-API-Key": k }),
  },
  {
    id: "openai",
    label: "OpenAI",
    envKeys: ["OPENAI_API_KEY"],
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    kind: "chat",
    authHeader: (k) => ({ Authorization: `Bearer ${k}` }),
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    envKeys: ["OPENROUTER_API_KEY"],
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "google/gemini-flash-1.5",
    kind: "chat",
    authHeader: (k) => ({ Authorization: `Bearer ${k}` }),
  },
  {
    id: "gemini",
    label: "Google Gemini",
    envKeys: ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-1.5-flash",
    kind: "chat",
    authHeader: (k) => ({ Authorization: `Bearer ${k}` }),
  },
  {
    id: "anthropic",
    label: "Anthropic",
    envKeys: ["ANTHROPIC_API_KEY"],
    baseUrl: "https://api.anthropic.com/v1",
    defaultModel: "claude-3-5-haiku-latest",
    kind: "chat",
    authHeader: (k) => ({ "x-api-key": k, "anthropic-version": "2023-06-01" }),
  },
  {
    id: "groq",
    label: "Groq",
    envKeys: ["GROQ_API_KEY"],
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.1-8b-instant",
    kind: "chat",
    authHeader: (k) => ({ Authorization: `Bearer ${k}` }),
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    envKeys: ["DEEPSEEK_API_KEY"],
    baseUrl: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
    kind: "chat",
    authHeader: (k) => ({ Authorization: `Bearer ${k}` }),
  },
  {
    id: "mistral",
    label: "Mistral",
    envKeys: ["MISTRAL_API_KEY"],
    baseUrl: "https://api.mistral.ai/v1",
    defaultModel: "mistral-small-latest",
    kind: "chat",
    authHeader: (k) => ({ Authorization: `Bearer ${k}` }),
  },
  {
    id: "xai",
    label: "xAI",
    envKeys: ["XAI_API_KEY"],
    baseUrl: "https://api.x.ai/v1",
    defaultModel: "grok-2-latest",
    kind: "chat",
    authHeader: (k) => ({ Authorization: `Bearer ${k}` }),
  },
  {
    id: "google",
    label: "Google AI (native)",
    envKeys: ["GOOGLE_API_KEY"],
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    defaultModel: "gemini-1.5-flash",
    kind: "chat",
    authHeader: (k) => ({ "x-goog-api-key": k }),
  },
  {
    id: "firecrawl",
    label: "Firecrawl",
    envKeys: ["FIRECRAWL_API_KEY"],
    baseUrl: "https://api.firecrawl.dev/v1",
    kind: "scrape",
    authHeader: (k) => ({ Authorization: `Bearer ${k}` }),
  },
  {
    id: "exa",
    label: "Exa Search",
    envKeys: ["EXA_API_KEY"],
    baseUrl: "https://api.exa.ai",
    kind: "search",
    authHeader: (k) => ({ "x-api-key": k }),
  },
  {
    id: "tavily",
    label: "Tavily Search",
    envKeys: ["TAVILY_API_KEY"],
    baseUrl: "https://api.tavily.com",
    kind: "search",
    authHeader: () => ({}),
  },
  {
    id: "elevenlabs",
    label: "ElevenLabs",
    envKeys: ["ELEVENLABS_API_KEY"],
    baseUrl: "https://api.elevenlabs.io/v1",
    kind: "audio",
    authHeader: (k) => ({ "xi-api-key": k }),
  },
];

/**
 * Collect API keys for a provider. Supports comma-separated values across
 * multiple env keys — e.g. OPENAI_API_KEY="key1,key2".
 */
export function getProviderKeys(spec: ProviderSpec): string[] {
  const keys: string[] = [];
  for (const envKey of spec.envKeys) {
    const val = process.env[envKey];
    if (!val) continue;
    for (const k of val.split(",").map((s) => s.trim()).filter(Boolean)) {
      keys.push(k);
    }
  }
  return keys;
}

export function isProviderEnabled(spec: ProviderSpec): boolean {
  return getProviderKeys(spec).length > 0;
}

export function listEnabledProviders(): ProviderSpec[] {
  return PROVIDERS.filter(isProviderEnabled);
}

export function getProvider(id: ProviderId): ProviderSpec | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

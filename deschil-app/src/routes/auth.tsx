import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { signIn, signUp } from "@/lib/auth/functions";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const doSignIn = useServerFn(signIn);
  const doSignUp = useServerFn(signUp);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signin") {
        await doSignIn({ data: { email, password } });
      } else {
        await doSignUp({ data: { email, password, displayName: displayName || undefined } });
      }
      navigate({ to: "/dashboard" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <Link to="/" className="text-xs text-muted-foreground hover:underline">← {t("app.name")}</Link>
        <h1 className="mt-3 text-2xl font-bold">
          {mode === "signin" ? t("auth.welcomeBack") : t("auth.createAccount")}
        </h1>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-sm font-medium">{t("auth.displayName")}</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium">{t("auth.email")}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">{t("auth.password")}</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? "…" : mode === "signin" ? t("auth.signIn") : t("auth.signUp")}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signin" ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
          <button
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
            className="font-medium text-primary hover:underline"
          >
            {mode === "signin" ? t("auth.signUp") : t("auth.signIn")}
          </button>
        </div>
      </div>
    </div>
  );
}

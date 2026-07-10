import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { t, i18n } = useTranslation();
  const toggle = () => i18n.changeLanguage(i18n.language.startsWith("ar") ? "en" : "ar");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="text-lg font-bold tracking-tight">{t("app.name")}</div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
          >
            {i18n.language.startsWith("ar") ? t("language.en") : t("language.ar")}
          </button>
          <Link to="/auth" className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90">
            {t("nav.signIn")}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-16">
        <section className="text-center">
          <h1 className="text-5xl font-bold tracking-tight md:text-6xl">{t("app.name")}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">{t("app.tagline")}</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/auth" className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              {t("landing.cta")}
            </Link>
          </div>
        </section>

        <section className="mt-24 grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold">{t(`landing.feature${i}Title`)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t(`landing.feature${i}Body`)}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

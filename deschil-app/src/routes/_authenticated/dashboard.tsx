import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t("dashboard.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("dashboard.subtitle")}</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">{t("dashboard.yourAccount")}</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t("auth.email")}</dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t("dashboard.roles")}</dt>
            <dd className="font-medium">{user.roles.join(", ") || "—"}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Command Console</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Run any automation from here. The same commands are available on Telegram, WhatsApp, and Discord.
        </p>
        <Link
          to="/console"
          className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Open console →
        </Link>
      </div>
    </div>
  );
}

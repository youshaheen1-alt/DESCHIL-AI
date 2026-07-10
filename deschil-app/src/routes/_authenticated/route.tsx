import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { getCurrentUser, signOut } from "@/lib/auth/functions";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (!user) throw redirect({ to: "/auth" });
    return { user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const { user } = Route.useRouteContext();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const doSignOut = useServerFn(signOut);

  async function onSignOut() {
    await doSignOut({});
    navigate({ to: "/" });
  }

  const toggle = () => i18n.changeLanguage(i18n.language.startsWith("ar") ? "en" : "ar");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" className="font-bold">{t("app.name")}</Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/dashboard" className="hover:underline">{t("nav.dashboard")}</Link>
            <span className="text-muted-foreground">{user.email}</span>
            <button onClick={toggle} className="rounded border border-border px-2 py-1 text-xs">
              {i18n.language.startsWith("ar") ? "EN" : "ع"}
            </button>
            <button onClick={onSignOut} className="rounded bg-secondary px-3 py-1 text-xs hover:bg-secondary/80">
              {t("nav.signOut")}
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8"><Outlet /></main>
    </div>
  );
}

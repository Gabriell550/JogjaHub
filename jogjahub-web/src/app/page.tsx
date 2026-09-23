import Link from "next/link";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { ROUTES } from "@/src/constants/routes";

const featureCards = [
  {
    title: "Authentication",
    description: "Login and registration flow for customer, vendor, and admin access.",
    href: ROUTES.login,
  },
  {
    title: "Vendor Dashboard",
    description: "Service management, orders, profile information, and calendar overview.",
    href: ROUTES.vendor,
  },
  {
    title: "Admin Dashboard",
    description: "User, vendor, and booking management for platform operations.",
    href: ROUTES.admin,
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-8 py-12 text-white shadow-xl">
        <div className="max-w-2xl space-y-4">
          <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
            JogjaHub
          </span>
          <h1 className="text-4xl font-bold tracking-tight">Welcome to the platform foundation</h1>
          <p className="text-base text-emerald-50">
            This starter structure prepares the app for authentication, vendor workflows,
            and admin operations without introducing business logic yet.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href={ROUTES.login}>
              <Button>Login</Button>
            </Link>
            <Link href={ROUTES.dashboard}>
              <Button variant="secondary">Dashboard</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {featureCards.map((feature) => (
          <Card key={feature.title} className="h-full">
            <div className="space-y-4">
              <div className="inline-flex rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                Ready
              </div>
              <h2 className="text-xl font-semibold text-slate-900">{feature.title}</h2>
              <p className="text-sm leading-6 text-slate-600">{feature.description}</p>
              <Link href={feature.href} className="inline-flex text-sm font-medium text-emerald-600 hover:text-emerald-700">
                Open section →
              </Link>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}

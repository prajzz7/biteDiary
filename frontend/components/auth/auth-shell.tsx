import Link from "next/link";
import type { ReactNode } from "react";
import { MapPin, ShieldCheck, Star, Utensils } from "lucide-react";

type AuthShellProps = {
  badge: string;
  bottomActionHref: string;
  bottomActionLabel: string;
  bottomPrompt: string;
  children: ReactNode;
  desktopDescription: string;
  desktopEyebrow: string;
  desktopTitle: string;
  headerActionHref: string;
  headerActionLabel: string;
  headerPrompt: string;
  mobileTitle: string;
};

const memories = [
  { place: "Izumi", detail: "Asian / Mumbai", rating: "4.8", note: "Ramen worth repeating" },
  { place: "Roast Room", detail: "Cafe / Colaba", rating: "4.7", note: "Best rainy evening coffee" },
  { place: "The Daily Bowl", detail: "Healthy / Bandra", rating: "4.6", note: "Weekday lunch favorite" },
];

const highlights = [
  { label: "Restaurants", value: "128" },
  { label: "Top dish", value: "Ramen" },
  { label: "Cities", value: "9" },
];

export function AuthShell({
  badge,
  bottomActionHref,
  bottomActionLabel,
  bottomPrompt,
  children,
  desktopDescription,
  desktopEyebrow,
  desktopTitle,
  headerActionHref,
  headerActionLabel,
  headerPrompt,
  mobileTitle,
}: AuthShellProps) {
  return (
    <main className="min-h-svh bg-bg text-ink-primary">
      <section className="mx-auto grid min-h-svh w-full max-w-7xl grid-cols-1 lg:grid-cols-2">
        <aside className="hidden min-h-svh border-r border-border bg-bg px-12 py-8 lg:flex lg:flex-col">
          <BrandMark />

          <div className="flex flex-1 items-center">
            <div className="w-full">
              <p className="text-sm font-bold uppercase text-accent">{desktopEyebrow}</p>
              <h1 className="mt-4 max-w-xl font-display text-5xl font-semibold leading-tight text-ink-primary">
                {desktopTitle}
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-ink-secondary">{desktopDescription}</p>

              <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
                {highlights.map((item) => (
                  <StatTile key={item.label} label={item.label} value={item.value} />
                ))}
              </div>

              <div className="mt-8 max-w-xl">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase text-ink-secondary">Recent highlights</h2>
                  <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent">
                    This month
                  </span>
                </div>

                <div className="space-y-3">
                  {memories.map((memory) => (
                    <MemoryRow key={memory.place} {...memory} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-card border border-border bg-surface p-4 shadow-card">
            <ShieldCheck aria-hidden="true" className="shrink-0 text-success" size={22} />
            <p className="text-sm leading-6 text-ink-secondary">
              Private by default. Your notes and ratings stay in your own diary.
            </p>
          </div>
        </aside>

        <div className="flex min-h-svh flex-col px-4 py-5 sm:px-6 lg:px-12 lg:py-8">
          <header className="flex items-center justify-between">
            <div className="lg:hidden">
              <BrandMark compact />
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden text-sm font-medium text-ink-secondary sm:inline">{headerPrompt}</span>
              <Link className="text-sm font-bold text-accent hover:text-accent-hover" href={headerActionHref}>
                {headerActionLabel}
              </Link>
            </div>
          </header>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
            <div className="mb-6 lg:hidden">
              <p className="text-sm font-bold uppercase text-accent">{badge}</p>
              <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-ink-primary">
                {mobileTitle}
              </h1>
            </div>

            {children}

            <div className="mt-5 grid grid-cols-3 gap-2 lg:hidden">
              {highlights.map((item) => (
                <StatTile compact key={item.label} label={item.label} value={item.value} />
              ))}
            </div>

            <p className="mt-5 text-center text-sm text-ink-secondary">
              {bottomPrompt}{" "}
              <Link className="font-bold text-accent hover:text-accent-hover" href={bottomActionHref}>
                {bottomActionLabel}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatTile({
  compact = false,
  label,
  value,
}: {
  compact?: boolean;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-3 shadow-card">
      <p className="text-xs font-bold uppercase text-ink-secondary">{label}</p>
      <p className={`${compact ? "text-xl" : "text-2xl"} mt-1 font-display font-semibold text-ink-primary`}>
        {value}
      </p>
    </div>
  );
}

function MemoryRow({
  detail,
  note,
  place,
  rating,
}: {
  detail: string;
  note: string;
  place: string;
  rating: string;
}) {
  return (
    <article className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 rounded-card border border-border bg-surface p-3 shadow-card">
      <div className="flex h-12 w-12 items-center justify-center rounded-avatar bg-accent-soft text-accent">
        <MapPin aria-hidden="true" size={19} />
      </div>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate font-display text-base font-semibold text-ink-primary">{place}</h3>
          <span className="hidden h-1.5 w-1.5 shrink-0 rounded-full bg-accent sm:block" />
          <p className="hidden truncate text-xs font-semibold text-ink-secondary sm:block">{detail}</p>
        </div>
        <p className="mt-1 truncate text-xs font-semibold text-ink-secondary">{note}</p>
      </div>
      <div className="flex items-center gap-1 rounded-full bg-surface-sunken px-3 py-1 text-xs font-bold text-rating-gold">
        <Star aria-hidden="true" size={13} fill="currentColor" />
        {rating}
      </div>
    </article>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="flex w-fit items-center gap-3" href="/login" aria-label="BiteDiary login">
      <span className="flex h-12 w-12 items-center justify-center rounded-control bg-accent text-bg shadow-card">
        <Utensils aria-hidden="true" size={compact ? 19 : 21} />
      </span>
      <span className={`${compact ? "text-lg" : "text-xl"} font-display font-semibold text-ink-primary`}>
        BiteDiary
      </span>
    </Link>
  );
}

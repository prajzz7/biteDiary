"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  CalendarDays,
  ChevronRight,
  MapPin,
  RefreshCw,
  Star,
  Trophy,
  Utensils,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";

type AnalyticsView = "ready" | "loading" | "empty" | "error";
type TimeRange = "30 days" | "6 months" | "All time";

type InsightMetric = {
  detail: string;
  icon: LucideIcon;
  label: string;
  photo?: string;
  value: string;
};

const analyticsView: AnalyticsView = "ready";
const timeRanges: TimeRange[] = ["30 days", "6 months", "All time"];

const heroMetrics: InsightMetric[] = [
  {
    detail: "5 visits",
    icon: Trophy,
    label: "Most visited restaurant",
    photo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=500&q=80",
    value: "O Pedro",
  },
  {
    detail: "36% of visits",
    icon: Utensils,
    label: "Top cuisine",
    value: "Seafood",
  },
  {
    detail: "35% of visits",
    icon: MapPin,
    label: "Top city",
    value: "Mumbai",
  },
  {
    detail: "28% of visits",
    icon: CalendarDays,
    label: "Top day to dine",
    value: "Saturday",
  },
];

const trendPoints = [
  { label: "Jun", value: 3.8 },
  { label: "Jul", value: 3.9 },
  { label: "Aug", value: 3.7 },
  { label: "Sep", value: 4.3 },
  { label: "Oct", value: 4.2 },
  { label: "Nov", value: 4.6 },
  { label: "Dec", value: 4.2 },
  { label: "Jan", value: 4.0 },
  { label: "Feb", value: 3.9 },
  { label: "Mar", value: 4.4 },
  { label: "Apr", value: 4.5 },
  { label: "May", value: 4.3 },
];

const moreInsights = [
  {
    detail: "Restaurants visited",
    icon: Utensils,
    value: "128",
  },
  {
    detail: "Restaurants revisited",
    icon: RefreshCw,
    value: "42",
  },
  {
    detail: "Average rating",
    icon: Star,
    value: "4.6",
  },
];

const ratingDistribution = [
  { label: "5 stars", value: 28 },
  { label: "4 stars", value: 48 },
  { label: "3 stars", value: 18 },
  { label: "2 stars", value: 6 },
];

const bestDishes = [
  {
    dish: "Khao Soi",
    rating: 4.9,
    restaurant: "Limron",
  },
  {
    dish: "Butter Garlic Prawns",
    rating: 4.8,
    restaurant: "O Pedro",
  },
  {
    dish: "Truffle Mushroom Risotto",
    rating: 4.7,
    restaurant: "The Table",
  },
];

export default function AnalyticsPage() {
  const [activeRange, setActiveRange] = useState<TimeRange>("6 months");

  return (
    <AppShell activeItem="Analytics">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <PageHeader activeRange={activeRange} setActiveRange={setActiveRange} />

        {analyticsView === "loading" ? <AnalyticsLoadingState /> : null}
        {analyticsView === "empty" ? <AnalyticsEmptyState /> : null}
        {analyticsView === "error" ? <AnalyticsErrorState /> : null}
        {analyticsView === "ready" ? <AnalyticsReadyState activeRange={activeRange} /> : null}
      </main>
    </AppShell>
  );
}

function PageHeader({
  activeRange,
  setActiveRange,
}: {
  activeRange: TimeRange;
  setActiveRange: (range: TimeRange) => void;
}) {
  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-sm font-bold uppercase text-accent">Analytics</p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-ink-primary sm:text-4xl">
          Insights from your culinary journey.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-secondary">
          The best places, strongest dishes, revisit patterns, and rating trends in one premium snapshot.
        </p>
      </div>

      <div className="grid w-full max-w-md grid-cols-3 gap-1 rounded-full border border-border bg-surface p-1 shadow-card lg:w-auto">
        {timeRanges.map((range) => (
          <button
            aria-pressed={activeRange === range}
            className={`min-h-10 whitespace-nowrap rounded-full px-3 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-accent-soft ${
              activeRange === range ? "bg-accent text-bg" : "text-ink-secondary hover:bg-bg hover:text-ink-primary"
            }`}
            key={range}
            type="button"
            onClick={() => setActiveRange(range)}
          >
            {range}
          </button>
        ))}
      </div>
    </header>
  );
}

function AnalyticsReadyState({ activeRange }: { activeRange: TimeRange }) {
  return (
    <>
      <section className="rounded-card border border-success/30 bg-success/10 p-4 shadow-card" aria-label="Top insight">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-success/40 bg-bg text-success">
            <Utensils aria-hidden="true" size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-semibold text-ink-primary">You revisit seafood places most</h2>
            <p className="mt-1 text-sm leading-6 text-ink-secondary">
              Seafood restaurants have the highest revisit rate at 68%.
            </p>
          </div>
          <ChevronRight aria-hidden="true" className="hidden shrink-0 text-ink-secondary sm:block" size={20} />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label={`${activeRange} highlights`}>
        {heroMetrics.map((metric) => (
          <HeroMetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)]">
        <div className="min-w-0 space-y-6">
          <ChartCard
            action="Last 12 months"
            description="Ratings climb around your repeat visits, especially from February through May."
            title="Rating trend"
          >
            <RatingTrendChart />
          </ChartCard>

          <section aria-labelledby="more-insights-title">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-xl font-semibold text-ink-primary" id="more-insights-title">
                More insights
              </h2>
              <button className="text-sm font-semibold text-ink-secondary transition hover:text-accent" type="button">
                View all
              </button>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {moreInsights.map((insight) => (
                <MiniInsightCard key={insight.detail} {...insight} />
              ))}
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-6">
          <ChartCard description="Most of your visits land in the strong 4-star range." title="Rating distribution">
            <div className="mt-5 space-y-4">
              {ratingDistribution.map((item) => (
                <ProgressRow key={item.label} label={item.label} value={item.value} />
              ))}
            </div>
          </ChartCard>

          <section aria-labelledby="best-dishes-title">
            <SectionHeader title="Best dishes" titleId="best-dishes-title" />
            <div className="mt-3 space-y-3">
              {bestDishes.map((dish, index) => (
                <DishRankRow index={index + 1} key={dish.dish} {...dish} />
              ))}
            </div>
          </section>
        </aside>
      </section>
    </>
  );
}

function HeroMetricCard({
  detail,
  icon: Icon,
  label,
  photo,
  value,
}: InsightMetric) {
  return (
    <article className="rounded-card border border-border bg-surface p-4 text-center shadow-card">
      {photo ? (
        <div className="relative mx-auto h-16 w-16">
          <img alt={value} className="h-16 w-16 rounded-full border border-accent/50 object-cover" src={photo} />
          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-bg">
            1
          </span>
        </div>
      ) : (
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-accent/50 bg-bg text-accent">
          <Icon aria-hidden="true" size={28} />
        </div>
      )}
      <p className="mt-4 text-xs font-bold uppercase text-ink-primary">{label}</p>
      <h2 className="mt-2 truncate font-display text-xl font-semibold text-ink-primary">{value}</h2>
      <p className="mt-1 text-sm font-semibold text-ink-secondary">{detail}</p>
    </article>
  );
}

function ChartCard({
  action,
  children,
  description,
  title,
}: {
  action?: string;
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="rounded-card border border-border bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink-primary">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-ink-secondary">{description}</p>
        </div>
        {action ? (
          <button
            className="shrink-0 rounded-full border border-border bg-bg px-3 py-1 text-xs font-bold text-ink-secondary transition hover:border-accent/40 hover:text-accent"
            type="button"
          >
            {action}
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function RatingTrendChart() {
  const chartWidth = 360;
  const chartHeight = 170;
  const minRating = 3;
  const maxRating = 5;
  const xGap = chartWidth / (trendPoints.length - 1);
  const points = trendPoints
    .map((point, index) => {
      const x = index * xGap;
      const y = chartHeight - ((point.value - minRating) / (maxRating - minRating)) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="mt-5 overflow-hidden rounded-card border border-border bg-bg p-4">
      <svg aria-label="Rating trend line chart" className="h-48 w-full overflow-hidden" role="img" viewBox={`0 0 ${chartWidth} ${chartHeight + 34}`}>
        {[3, 3.5, 4, 4.5, 5].map((rating) => {
          const y = chartHeight - ((rating - minRating) / (maxRating - minRating)) * chartHeight;
          return (
            <g key={rating}>
              <line stroke="rgba(246, 237, 222, 0.08)" strokeWidth="1" x1="0" x2={chartWidth} y1={y} y2={y} />
              <text fill="currentColor" className="text-[10px] text-ink-secondary" x="0" y={Math.max(10, y - 4)}>
                {rating.toFixed(1)}
              </text>
            </g>
          );
        })}
        <polyline fill="none" points={points} stroke="var(--accent)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
        {trendPoints.map((point, index) => {
          const x = index * xGap;
          const y = chartHeight - ((point.value - minRating) / (maxRating - minRating)) * chartHeight;
          return (
            <g key={point.label}>
              <circle cx={x} cy={y} fill="var(--accent-hover)" r="4" />
              <text className="text-[10px] text-ink-secondary" fill="currentColor" textAnchor="middle" x={x} y={chartHeight + 24}>
                {point.label}
              </text>
            </g>
          );
        })}
        <g>
          <rect fill="var(--accent)" height="28" rx="14" width="44" x={chartWidth - 48} y="2" />
          <text fill="var(--bg)" fontSize="13" fontWeight="700" textAnchor="middle" x={chartWidth - 26} y="21">
            4.6
          </text>
        </g>
      </svg>
    </div>
  );
}

function MiniInsightCard({ detail, icon: Icon, value }: { detail: string; icon: LucideIcon; value: string }) {
  return (
    <article className="rounded-card border border-border bg-surface p-4 shadow-card">
      <Icon aria-hidden="true" className="text-accent" size={22} />
      <p className="mt-3 font-display text-2xl font-semibold text-ink-primary">{value}</p>
      <p className="mt-1 text-xs font-bold text-ink-secondary">{detail}</p>
    </article>
  );
}

function ProgressRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm font-bold text-ink-primary">{label}</p>
        <p className="text-sm font-bold text-ink-secondary">{value}%</p>
      </div>
      <div className="mt-2 h-3 rounded-full bg-bg">
        <div className="h-3 rounded-full bg-accent" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function SectionHeader({ title, titleId }: { title: string; titleId: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-accent">Top rated</p>
      <h2 className="mt-1 font-display text-xl font-semibold text-ink-primary" id={titleId}>
        {title}
      </h2>
    </div>
  );
}

function DishRankRow({
  dish,
  index,
  rating,
  restaurant,
}: {
  dish: string;
  index: number;
  rating: number;
  restaurant: string;
}) {
  return (
    <article className="rounded-card border border-border bg-surface p-4 shadow-card">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent-soft text-sm font-bold text-accent">
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg font-semibold text-ink-primary">{dish}</h3>
          <p className="mt-1 truncate text-sm font-medium text-ink-secondary">{restaurant}</p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-bg px-3 py-1 text-sm font-bold text-rating-gold">
          <Star aria-hidden="true" fill="currentColor" size={15} />
          {rating.toFixed(1)}
        </div>
      </div>
    </article>
  );
}

function AnalyticsLoadingState() {
  return (
    <div className="grid gap-6">
      <section className="rounded-card border border-success/30 bg-success/10 p-4 shadow-card">
        <div className="flex gap-4">
          <div className="h-14 w-14 rounded-full bg-bg" />
          <div className="flex-1">
            <div className="h-5 w-2/3 rounded-full bg-bg" />
            <div className="mt-3 h-3 w-full rounded-full bg-bg" />
          </div>
        </div>
      </section>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading analytics highlights">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="rounded-card border border-border bg-surface p-4 shadow-card" key={index}>
            <div className="mx-auto h-16 w-16 rounded-full bg-bg" />
            <div className="mx-auto mt-4 h-3 w-28 rounded-full bg-bg" />
            <div className="mx-auto mt-3 h-7 w-24 rounded-control bg-bg" />
          </div>
        ))}
      </section>
      <section className="rounded-card border border-border bg-surface p-5 shadow-card">
        <div className="h-6 w-48 rounded-control bg-bg" />
        <div className="mt-6 h-48 rounded-card bg-bg" />
      </section>
    </div>
  );
}

function AnalyticsEmptyState() {
  return (
    <section className="flex min-h-[420px] items-center justify-center rounded-card border border-border bg-surface p-8 text-center shadow-card">
      <div className="max-w-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border bg-bg text-ink-tertiary">
          <CalendarDays aria-hidden="true" size={28} />
        </div>
        <h2 className="mt-5 font-display text-2xl font-semibold text-ink-primary">No analytics yet</h2>
        <p className="mt-3 text-sm leading-6 text-ink-secondary">
          Add a few restaurant visits and your best places, dishes, cities, and patterns will appear here.
        </p>
      </div>
    </section>
  );
}

function AnalyticsErrorState() {
  return (
    <section className="rounded-card border border-error/30 bg-error/10 p-5 shadow-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle aria-hidden="true" className="mt-1 shrink-0 text-error" size={22} />
          <div>
            <h2 className="font-display text-xl font-semibold text-ink-primary">Could not load analytics</h2>
            <p className="mt-2 text-sm leading-6 text-ink-secondary">
              Your diary entries are safe. Try loading the analytics page again.
            </p>
          </div>
        </div>
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-error/30 bg-surface px-5 text-sm font-bold text-error shadow-card transition hover:bg-bg focus:outline-none focus:ring-4 focus:ring-accent-soft"
          type="button"
        >
          <RefreshCw aria-hidden="true" size={18} />
          Retry
        </button>
      </div>
    </section>
  );
}

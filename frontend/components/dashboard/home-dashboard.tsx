import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Bookmark,
  CalendarDays,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Utensils,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";

type DashboardView = "ready" | "loading" | "empty" | "error";

type Stat = {
  icon: LucideIcon;
  label: string;
  value: string;
};

const dashboardView: DashboardView = "ready";

const bestRestaurant = {
  city: "Mumbai, India",
  cuisine: "Seafood",
  description: "Exceptional seafood, cozy ambience, and the strongest repeat notes in your diary.",
  name: "O Pedro",
  photo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
  rating: 4.8,
  reviews: 128,
};

const bestDish = {
  city: "Bangkok, Thailand",
  name: "Khao Soi",
  photo: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80",
  rating: 4.9,
  restaurant: "Limron",
  tag: "Must order",
};

const stats: Stat[] = [
  { icon: Utensils, label: "Restaurants", value: "128" },
  { icon: Star, label: "Dishes", value: "327" },
  { icon: RefreshCw, label: "Revisited", value: "42" },
  { icon: MapPin, label: "Cities", value: "18" },
];

const revisitTonight = [
  {
    city: "Bandra, Mumbai",
    name: "Sea Green",
    photo: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80",
    score: "92%",
  },
  {
    city: "Mumbai",
    name: "The Table",
    photo: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=600&q=80",
    score: "88%",
  },
  {
    city: "Delhi",
    name: "Olive Bar",
    photo: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=600&q=80",
    score: "86%",
  },
];

const revisitRestaurants = [
  {
    city: "Mumbai, India",
    favoriteDish: "Butter Garlic Prawns",
    name: "O Pedro",
    photo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    reason: "Consistent excellence, warm hospitality, and your highest seafood revisit score.",
    visits: "5 times",
  },
  {
    city: "Mumbai, India",
    favoriteDish: "Truffle Mushroom Risotto",
    name: "The Table",
    photo: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80",
    rating: 4.7,
    reason: "Great for special evenings. The tasting menu still stands out.",
    visits: "4 times",
  },
  {
    city: "Delhi, India",
    favoriteDish: "Harissa Chicken",
    name: "Olive Bar & Kitchen",
    photo: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=800&q=80",
    rating: 4.6,
    reason: "Reliable comfort food with a beautiful open-air setting.",
    visits: "3 times",
  },
];

const reorderDishes = [
  {
    city: "Mumbai",
    name: "Butter Garlic Prawns",
    photo: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=700&q=80",
    rating: 4.8,
    restaurant: "O Pedro",
  },
  {
    city: "Bangkok",
    name: "Khao Soi",
    photo: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=700&q=80",
    rating: 4.9,
    restaurant: "Limron",
  },
  {
    city: "Delhi",
    name: "Salmon Aburi Roll",
    photo: "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=700&q=80",
    rating: 4.6,
    restaurant: "Sushi Taiko",
  },
];

export default function HomeDashboard() {
  return (
    <AppShell activeItem="Home">
      <main className="mx-auto flex w-full max-w-[440px] flex-col gap-5 px-4 py-5 sm:px-6 lg:max-w-6xl lg:px-8 lg:py-8">
        <PageHeader />

        {dashboardView === "loading" ? <DashboardLoadingState /> : null}
        {dashboardView === "empty" ? <DashboardEmptyState /> : null}
        {dashboardView === "error" ? <DashboardErrorState /> : null}
        {dashboardView === "ready" ? <DashboardReadyState /> : null}
      </main>
    </AppShell>
  );
}

function PageHeader() {
  return (
    <header>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-bold leading-none tracking-[-0.02em] text-ink-primary">
            Good evening, Praj
          </h1>
          <p className="mt-2 text-xs font-semibold text-ink-secondary">
            Track. Remember. Revisit.
          </p>
        </div>
        <button
          aria-label="Notifications"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface/70 text-ink-secondary shadow-card transition hover:border-accent/50 hover:text-accent focus:outline-none focus:ring-4 focus:ring-accent-soft"
          type="button"
        >
          <Bell aria-hidden="true" size={17} />
        </button>
      </div>
    </header>
  );
}

function DashboardReadyState() {
  return (
    <>
      <HeroJourneyCard />
      <DashboardSearch />

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="recommended-title">
            <SectionHeader
              actionLabel="View all"
              title="Recommended for you"
              titleId="recommended-title"
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <BestRestaurantHighlight />
              <BestDishHighlight />
            </div>
          </section>

          <section aria-labelledby="revisit-tonight-title">
            <SectionHeader
              actionLabel="See all"
              title="Revisit tonight"
              titleId="revisit-tonight-title"
            />
            <div className="mt-3 grid grid-cols-3 gap-3">
              {revisitTonight.map((restaurant) => (
                <RevisitTonightCard key={restaurant.name} {...restaurant} />
              ))}
            </div>
          </section>

          <section aria-labelledby="revisit-title">
            <SectionHeader
              title="Places worth going back to"
              titleId="revisit-title"
            />
            <div className="mt-3 grid gap-3">
              {revisitRestaurants.map((restaurant) => (
                <RevisitRestaurantCard key={restaurant.name} {...restaurant} />
              ))}
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-6">
          <section aria-labelledby="reorder-title">
            <SectionHeader
              actionLabel="View all"
              title="Dishes worth reordering"
              titleId="reorder-title"
            />
            <div className="mt-3 grid gap-3">
              {reorderDishes.map((dish) => (
                <ReorderDishCard key={dish.name} {...dish} />
              ))}
            </div>
          </section>
        </aside>
      </section>
    </>
  );
}

function HeroJourneyCard() {
  return (
    <section className="relative min-h-[238px] overflow-hidden rounded-card border border-border bg-surface shadow-raised">
      <img
        alt="Warm restaurant interior"
        className="absolute inset-0 h-full w-full object-cover opacity-70"
        src={bestRestaurant.photo}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,15,13,0.92)_0%,rgba(16,15,13,0.76)_34%,rgba(16,15,13,0.28)_100%),linear-gradient(180deg,rgba(16,15,13,0.10)_0%,rgba(16,15,13,0.92)_100%)]" />
      <div className="relative flex min-h-[238px] max-w-[230px] flex-col justify-end p-5">
        <p className="text-xs font-bold text-accent">Your journey so far</p>
        <p className="mt-3 font-display text-[52px] font-bold leading-[0.9] tracking-[-0.03em] text-ink-primary">
          128
        </p>
        <p className="mt-1 text-sm font-semibold text-ink-primary">
          Restaurants
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-[11px] font-semibold text-ink-secondary">
          <span>327 Dishes</span>
          <span>42 Revisited</span>
        </div>
        <Link
          className="mt-5 inline-flex min-h-9 w-fit items-center justify-center gap-2 rounded-full bg-accent px-4 text-xs font-bold text-bg shadow-card transition hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent-soft"
          href="/analytics"
        >
          Explore analytics
          <ArrowRight aria-hidden="true" size={14} />
        </Link>
      </div>
    </section>
  );
}

function DashboardSearch() {
  return (
    <label
      className="flex min-h-12 items-center gap-3 rounded-full border border-border bg-surface/75 px-4 shadow-card transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft"
      htmlFor="dashboard-search"
    >
      <Search aria-hidden="true" className="shrink-0 text-ink-secondary" size={17} />
      <span className="sr-only">Search restaurants, cuisines, and dishes</span>
      <input
        className="min-w-0 flex-1 border-0 bg-transparent py-3 text-xs font-semibold text-ink-primary outline-none placeholder:text-ink-tertiary"
        id="dashboard-search"
        placeholder="Search restaurants, cuisines, dishes..."
        type="search"
      />
      <SlidersHorizontal aria-hidden="true" className="shrink-0 text-ink-secondary" size={17} />
    </label>
  );
}

function BestRestaurantHighlight() {
  return (
    <article className="relative min-h-[228px] overflow-hidden rounded-card border border-border bg-surface shadow-raised">
      <img alt={`${bestRestaurant.name} dining room`} className="absolute inset-0 h-full w-full object-cover" src={bestRestaurant.photo} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,15,13,0.08)_0%,rgba(16,15,13,0.34)_45%,rgba(16,15,13,0.94)_100%)]" />
      <button
        aria-label={`Save ${bestRestaurant.name}`}
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-bg/55 text-success backdrop-blur transition hover:border-success/50"
        type="button"
      >
        <Bookmark aria-hidden="true" size={17} />
      </button>
      <div className="relative flex min-h-[228px] flex-col justify-end p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-accent">Best restaurant</p>
        <h2 className="mt-2 font-display text-[26px] font-bold leading-none tracking-[-0.02em] text-ink-primary">{bestRestaurant.name}</h2>
        <p className="mt-1 text-xs font-semibold text-ink-secondary">
          Mumbai, India
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <RatingPill rating={bestRestaurant.rating} />
          <span className="rounded-full border border-border bg-bg/70 px-2.5 py-1 text-[11px] font-bold text-ink-primary">
            {bestRestaurant.reviews} reviews
          </span>
        </div>
      </div>
    </article>
  );
}

function BestDishHighlight() {
  return (
    <article className="relative min-h-[228px] overflow-hidden rounded-card border border-border bg-surface shadow-raised">
      <img alt={bestDish.name} className="absolute inset-0 h-full w-full object-cover" src={bestDish.photo} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,15,13,0.04)_0%,rgba(16,15,13,0.28)_42%,rgba(16,15,13,0.94)_100%)]" />
      <button
        aria-label={`Save ${bestDish.name}`}
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-bg/55 text-success backdrop-blur transition hover:border-success/50"
        type="button"
      >
        <Bookmark aria-hidden="true" size={17} />
      </button>
      <div className="relative flex min-h-[228px] flex-col justify-end p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-accent">Best dish</p>
        <h2 className="mt-2 font-display text-[26px] font-bold leading-none tracking-[-0.02em] text-ink-primary">{bestDish.name}</h2>
        <p className="mt-1 text-xs font-semibold text-ink-secondary">{bestDish.restaurant}, Bangkok</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <RatingPill rating={bestDish.rating} />
          <span className="rounded-full border border-accent/30 bg-accent-soft px-2.5 py-1 text-[11px] font-bold text-ink-primary">
            {bestDish.tag}
          </span>
        </div>
      </div>
    </article>
  );
}

function StatCard({ icon: Icon, label, value }: Stat) {
  return (
    <article className="rounded-card border border-border bg-surface p-4 text-center shadow-card">
      <Icon aria-hidden="true" className="mx-auto text-accent" size={20} />
      <p className="mt-3 font-display text-2xl font-semibold leading-none text-ink-primary">{value}</p>
      <p className="mt-1 text-xs font-semibold text-ink-secondary">{label}</p>
    </article>
  );
}

function SectionHeader({
  actionLabel,
  title,
  titleId,
}: {
  actionLabel?: string;
  title: string;
  titleId: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-accent" id={titleId}>
        {title}
      </h2>
      {actionLabel ? (
        <button className="text-xs font-semibold text-ink-secondary transition hover:text-accent" type="button">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function RevisitTonightCard({
  city,
  name,
  photo,
  score,
}: {
  city: string;
  name: string;
  photo: string;
  score: string;
}) {
  return (
    <article className="min-w-0 overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <div className="relative h-24 sm:h-32">
        <img alt={`${name} restaurant`} className="h-full w-full object-cover" src={photo} />
        <span className="absolute bottom-2 right-2 rounded-full border border-success/30 bg-success/80 px-2 py-1 text-[10px] font-bold text-ink-primary">
          {score}
        </span>
      </div>
      <div className="p-2.5">
        <h3 className="truncate font-display text-sm font-bold leading-tight text-ink-primary">{name}</h3>
        <p className="mt-1 truncate text-[10px] font-semibold text-ink-secondary">{city}</p>
      </div>
    </article>
  );
}

function RevisitRestaurantCard({
  city,
  favoriteDish,
  name,
  photo,
  rating,
  reason,
  visits,
}: {
  city: string;
  favoriteDish: string;
  name: string;
  photo: string;
  rating: number;
  reason: string;
  visits: string;
}) {
  return (
    <article className="grid grid-cols-[74px_minmax(0,1fr)_28px] items-center gap-3 rounded-card border border-border bg-surface/80 p-2.5 shadow-card">
      <img alt={`${name} interior`} className="h-14 w-full rounded-avatar object-cover" src={photo} />
      <div className="min-w-0">
        <h3 className="truncate font-display text-base font-bold leading-tight text-ink-primary">{name}</h3>
        <p className="mt-0.5 truncate text-[11px] font-semibold text-ink-secondary">{city}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-ink-secondary">
          <span>{visits}</span>
          <span className="text-accent">{rating.toFixed(1)} ★</span>
        </div>
      </div>
      <Bookmark aria-hidden="true" className="justify-self-end text-success" size={18} />
    </article>
  );
}

function ReorderDishCard({
  city,
  name,
  photo,
  rating,
  restaurant,
}: {
  city: string;
  name: string;
  photo: string;
  rating: number;
  restaurant: string;
}) {
  return (
    <article className="grid grid-cols-[54px_minmax(0,1fr)_42px] items-center gap-3 rounded-card border border-border bg-surface/80 p-2.5 shadow-card">
      <img alt={name} className="h-12 w-12 rounded-avatar object-cover" src={photo} />
      <div className="min-w-0">
        <h3 className="truncate font-display text-base font-bold leading-tight text-ink-primary">{name}</h3>
        <p className="mt-0.5 truncate text-[11px] font-semibold text-ink-secondary">
          {restaurant}
        </p>
      </div>
      <span className="text-right text-[11px] font-bold text-accent">
        {rating.toFixed(1)} ★
      </span>
    </article>
  );
}

function RatingPill({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-bg/80 px-3 py-1 text-sm font-bold text-ink-primary">
      <span>{rating.toFixed(1)}</span>
      <Star aria-hidden="true" className="text-rating-gold" fill="currentColor" size={15} />
    </div>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex shrink-0 items-center gap-1 text-rating-gold" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          aria-hidden="true"
          fill={index + 1 <= Math.round(rating) ? "currentColor" : "none"}
          key={index}
          size={14}
        />
      ))}
      <span className="ml-1 text-xs font-bold text-ink-primary">{rating.toFixed(1)}</span>
    </div>
  );
}

function DashboardLoadingState() {
  return (
    <div className="grid gap-4">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Loading quick stats">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="rounded-card border border-border bg-surface p-4 shadow-card" key={index}>
            <div className="mx-auto h-5 w-5 rounded-full bg-surface-sunken" />
            <div className="mx-auto mt-3 h-7 w-12 rounded-control bg-surface-sunken" />
            <div className="mx-auto mt-2 h-3 w-20 rounded-full bg-surface-sunken" />
          </div>
        ))}
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div className="min-h-[260px] rounded-card border border-border bg-surface p-5 shadow-card" key={index}>
            <div className="mt-28 h-3 w-24 rounded-full bg-surface-sunken" />
            <div className="mt-4 h-8 w-2/3 rounded-control bg-surface-sunken" />
            <div className="mt-3 h-3 w-full rounded-full bg-surface-sunken" />
            <div className="mt-2 h-3 w-3/4 rounded-full bg-surface-sunken" />
          </div>
        ))}
      </section>
    </div>
  );
}

function DashboardEmptyState() {
  return (
    <section className="flex min-h-[420px] items-center justify-center rounded-card border border-border bg-surface p-8 text-center shadow-card">
      <div className="max-w-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border bg-bg text-ink-tertiary">
          <CalendarDays aria-hidden="true" size={28} />
        </div>
        <h2 className="mt-5 font-display text-2xl font-semibold text-ink-primary">Your diary is empty</h2>
        <p className="mt-3 text-sm leading-6 text-ink-secondary">
          Add your first restaurant visit and BiteDiary will start building your food history.
        </p>
        <button
          className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-bg shadow-card transition hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent-soft"
          type="button"
        >
          <Plus aria-hidden="true" size={18} />
          Add first restaurant
        </button>
      </div>
    </section>
  );
}

function DashboardErrorState() {
  return (
    <section className="rounded-card border border-error/30 bg-error/10 p-5 shadow-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle aria-hidden="true" className="mt-1 shrink-0 text-error" size={22} />
          <div>
            <h2 className="font-display text-xl font-semibold text-ink-primary">Could not load your diary</h2>
            <p className="mt-2 text-sm leading-6 text-ink-secondary">
              Your saved restaurants are safe. Try loading the dashboard again.
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

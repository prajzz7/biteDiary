"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  Bookmark,
  CalendarDays,
  Filter,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app/app-shell";

type RestaurantsView = "ready" | "loading" | "empty" | "error";

type Restaurant = {
  bestDish: string;
  city: string;
  cuisine: string;
  lastVisited: string;
  name: string;
  photo: string;
  reason: string;
  rating: number;
  revisitScore: string;
  state: string;
  visitCount: number;
};

const restaurantsView: RestaurantsView = "ready";

const restaurants: Restaurant[] = [
  {
    bestDish: "Butter Garlic Prawns",
    city: "Mumbai",
    cuisine: "Seafood",
    lastVisited: "12 May 2024",
    name: "O Pedro",
    photo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
    reason: "Consistent excellence, amazing seafood, and warm hospitality.",
    rating: 4.8,
    revisitScore: "92%",
    state: "BKC",
    visitCount: 5,
  },
  {
    bestDish: "Truffle Mushroom Risotto",
    city: "Mumbai",
    cuisine: "Modern Indian",
    lastVisited: "04 Apr 2024",
    name: "The Table",
    photo: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80",
    reason: "Great for special evenings. The tasting menu is outstanding.",
    rating: 4.7,
    revisitScore: "88%",
    state: "Colaba",
    visitCount: 4,
  },
  {
    bestDish: "Harissa Chicken",
    city: "Delhi",
    cuisine: "Mediterranean",
    lastVisited: "18 Feb 2024",
    name: "Olive Bar & Kitchen",
    photo: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=900&q=80",
    reason: "Reliable comfort food and a beautiful, easygoing ambience.",
    rating: 4.6,
    revisitScore: "86%",
    state: "Mehrauli",
    visitCount: 3,
  },
  {
    bestDish: "Khao Soi",
    city: "Bangkok",
    cuisine: "Thai",
    lastVisited: "22 Jan 2024",
    name: "Limron",
    photo: "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80",
    reason: "The most comforting bowl in your travel notes.",
    rating: 4.9,
    revisitScore: "94%",
    state: "Ari",
    visitCount: 2,
  },
  {
    bestDish: "Salmon Aburi Roll",
    city: "Delhi",
    cuisine: "Japanese",
    lastVisited: "21 Jan 2024",
    name: "Sushi Taiko",
    photo: "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=900&q=80",
    reason: "Fresh, premium, and the dish note is still glowing.",
    rating: 4.6,
    revisitScore: "82%",
    state: "Saket",
    visitCount: 2,
  },
  {
    bestDish: "Cold Brew Tiramisu",
    city: "Pune",
    cuisine: "Cafe",
    lastVisited: "24 Apr 2024",
    name: "Roast Room",
    photo: "https://images.unsplash.com/photo-1508424757105-b6d5ad9329d0?auto=format&fit=crop&w=900&q=80",
    reason: "Quiet, reliable, and ideal for a slow coffee evening.",
    rating: 4.3,
    revisitScore: "78%",
    state: "Koregaon Park",
    visitCount: 3,
  },
];

const cityFilters = ["All", "Mumbai", "Delhi", "Bangkok", "Pune"];
const cuisineFilters = ["All", "Seafood", "Modern Indian", "Mediterranean", "Thai", "Japanese", "Cafe"];
const ratingFilters = [
  { label: "All", value: 0 },
  { label: "4.7+", value: 4.7 },
  { label: "4.5+", value: 4.5 },
];

export default function RestaurantsPage() {
  const [city, setCity] = useState("All");
  const [cuisine, setCuisine] = useState("All");
  const [minimumRating, setMinimumRating] = useState(0);
  const [query, setQuery] = useState("");

  const filteredRestaurants = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return restaurants.filter((restaurant) => {
      const matchesQuery =
        !normalizedQuery ||
        [restaurant.name, restaurant.city, restaurant.state, restaurant.cuisine, restaurant.bestDish]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesCity = city === "All" || restaurant.city === city;
      const matchesCuisine = cuisine === "All" || restaurant.cuisine === cuisine;
      const matchesRating = restaurant.rating >= minimumRating;

      return matchesQuery && matchesCity && matchesCuisine && matchesRating;
    });
  }, [city, cuisine, minimumRating, query]);

  const hasActiveFilters = city !== "All" || cuisine !== "All" || minimumRating > 0 || query.trim().length > 0;

  function clearFilters() {
    setCity("All");
    setCuisine("All");
    setMinimumRating(0);
    setQuery("");
  }

  return (
    <AppShell activeItem="Restaurants">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <PageHeader />

        {restaurantsView === "loading" ? <RestaurantsLoadingState /> : null}
        {restaurantsView === "empty" ? <RestaurantsEmptyState clearFilters={clearFilters} /> : null}
        {restaurantsView === "error" ? <RestaurantsErrorState /> : null}
        {restaurantsView === "ready" ? (
          <RestaurantsReadyState
            city={city}
            clearFilters={clearFilters}
            cuisine={cuisine}
            filteredRestaurants={filteredRestaurants}
            hasActiveFilters={hasActiveFilters}
            minimumRating={minimumRating}
            query={query}
            setCity={setCity}
            setCuisine={setCuisine}
            setMinimumRating={setMinimumRating}
            setQuery={setQuery}
          />
        ) : null}
      </main>
    </AppShell>
  );
}

function PageHeader() {
  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-sm font-bold uppercase text-accent">Revisit Restaurants</p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-ink-primary sm:text-4xl">
          Places worth going back to.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-secondary">
          Curated from ratings, visit count, notes, cuisine, and the dish that made each place memorable.
        </p>
      </div>

      <button
        className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-bg shadow-card transition hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent-soft"
        type="button"
      >
        <Plus aria-hidden="true" size={18} />
        Add restaurant
      </button>
    </header>
  );
}

function RestaurantsReadyState({
  city,
  clearFilters,
  cuisine,
  filteredRestaurants,
  hasActiveFilters,
  minimumRating,
  query,
  setCity,
  setCuisine,
  setMinimumRating,
  setQuery,
}: {
  city: string;
  clearFilters: () => void;
  cuisine: string;
  filteredRestaurants: Restaurant[];
  hasActiveFilters: boolean;
  minimumRating: number;
  query: string;
  setCity: (value: string) => void;
  setCuisine: (value: string) => void;
  setMinimumRating: (value: number) => void;
  setQuery: (value: string) => void;
}) {
  return (
    <>
      <section className="rounded-card border border-border bg-surface p-4 shadow-card" aria-labelledby="restaurant-filters-title">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase text-accent">
              <SlidersHorizontal aria-hidden="true" size={15} />
              Filters
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-ink-primary" id="restaurant-filters-title">
              Find by mood, city, or cuisine
            </h2>
          </div>

          {hasActiveFilters ? (
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-border bg-bg px-4 text-sm font-bold text-ink-primary transition hover:border-accent/50 hover:text-accent focus:outline-none focus:ring-4 focus:ring-accent-soft"
              type="button"
              onClick={clearFilters}
            >
              <X aria-hidden="true" size={16} />
              Clear
            </button>
          ) : null}
        </div>

        <div className="mt-4">
          <label className="text-sm font-bold text-ink-primary" htmlFor="restaurant-search">
            Search
          </label>
          <div className="mt-2 flex min-h-12 items-center gap-3 rounded-full border border-border bg-bg px-4 transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft">
            <Search aria-hidden="true" className="shrink-0 text-ink-secondary" size={18} />
            <input
              className="min-w-0 flex-1 border-0 bg-transparent py-3 text-base text-ink-primary outline-none placeholder:text-ink-tertiary"
              id="restaurant-search"
              placeholder="Search restaurants, dishes, cuisine"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-3">
          <FilterGroup label="City">
            {cityFilters.map((item) => (
              <FilterChip active={city === item} key={item} label={item} onClick={() => setCity(item)} />
            ))}
          </FilterGroup>

          <FilterGroup label="Cuisine">
            {cuisineFilters.map((item) => (
              <FilterChip active={cuisine === item} key={item} label={item} onClick={() => setCuisine(item)} />
            ))}
          </FilterGroup>

          <FilterGroup label="Rating">
            {ratingFilters.map((item) => (
              <FilterChip
                active={minimumRating === item.value}
                key={item.label}
                label={item.label}
                onClick={() => setMinimumRating(item.value)}
              />
            ))}
          </FilterGroup>
        </div>
      </section>

      <section aria-labelledby="restaurants-results-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-accent">Curated list</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-ink-primary" id="restaurants-results-title">
              {filteredRestaurants.length} restaurants to revisit
            </h2>
          </div>
          <p className="text-sm font-semibold text-ink-secondary">Sorted by revisit strength</p>
        </div>

        {filteredRestaurants.length > 0 ? (
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {filteredRestaurants
              .slice()
              .sort((a, b) => b.rating - a.rating)
              .map((restaurant) => (
                <RestaurantCard key={restaurant.name} restaurant={restaurant} />
              ))}
          </div>
        ) : (
          <FilteredEmptyState clearFilters={clearFilters} />
        )}
      </section>
    </>
  );
}

function FilterGroup({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase text-ink-secondary">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={`min-h-10 rounded-full border px-4 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-accent-soft ${
        active
          ? "border-accent/40 bg-accent-soft text-accent"
          : "border-border bg-bg text-ink-secondary hover:border-accent/40 hover:text-ink-primary"
      }`}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <article className="grid grid-cols-[112px_minmax(0,1fr)] overflow-hidden rounded-card border border-border bg-surface shadow-card sm:grid-cols-[190px_minmax(0,1fr)]">
      <img alt={`${restaurant.name} restaurant`} className="h-full min-h-60 w-full object-cover" src={restaurant.photo} />
      <div className="min-w-0 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-xl font-semibold text-ink-primary">{restaurant.name}</h3>
            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-ink-secondary">
              <MapPin aria-hidden="true" size={14} />
              {restaurant.state}, {restaurant.city}
            </p>
          </div>
          <Bookmark aria-hidden="true" className="shrink-0 text-success" size={20} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-success/25 bg-success/10 px-3 py-1 text-xs font-bold text-success">
            Why revisit?
          </span>
          <span className="rounded-full border border-border bg-bg px-3 py-1 text-xs font-bold text-ink-secondary">
            {restaurant.cuisine}
          </span>
        </div>

        <p className="mt-3 text-sm leading-6 text-ink-secondary">{restaurant.reason}</p>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
          <RestaurantMeta label="Visits" value={`${restaurant.visitCount} times`} />
          <div>
            <p className="text-xs font-semibold text-ink-tertiary">Rating</p>
            <RatingStars rating={restaurant.rating} />
          </div>
          <div className="col-span-2 flex items-center justify-between gap-3 rounded-control bg-bg p-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink-tertiary">Favorite dish</p>
              <p className="mt-1 truncate text-sm font-bold text-ink-primary">{restaurant.bestDish}</p>
            </div>
            <span className="shrink-0 rounded-full border border-success/25 bg-success/10 px-3 py-1 text-xs font-bold text-success">
              {restaurant.revisitScore}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function RestaurantMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-ink-tertiary">{label}</p>
      <p className="mt-1 text-sm font-bold text-ink-primary">{value}</p>
    </div>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="mt-1 flex shrink-0 items-center gap-1 text-rating-gold" aria-label={`${rating} out of 5 stars`}>
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

function FilteredEmptyState({ clearFilters }: { clearFilters: () => void }) {
  return (
    <section className="mt-4 flex min-h-[320px] items-center justify-center rounded-card border border-border bg-surface p-8 text-center shadow-card">
      <div className="max-w-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border bg-bg text-ink-tertiary">
          <Filter aria-hidden="true" size={28} />
        </div>
        <h3 className="mt-5 font-display text-2xl font-semibold text-ink-primary">No restaurants match</h3>
        <p className="mt-3 text-sm leading-6 text-ink-secondary">
          Try a different city, cuisine, rating, or search term.
        </p>
        <button
          className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-bg shadow-card transition hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent-soft"
          type="button"
          onClick={clearFilters}
        >
          Clear filters
        </button>
      </div>
    </section>
  );
}

function RestaurantsLoadingState() {
  return (
    <div className="grid gap-4">
      <section className="rounded-card border border-border bg-surface p-4 shadow-card">
        <div className="h-3 w-24 rounded-full bg-surface-sunken" />
        <div className="mt-4 h-12 rounded-full bg-bg" />
        <div className="mt-5 flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div className="h-10 w-20 rounded-full bg-bg" key={index} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="grid grid-cols-[112px_minmax(0,1fr)] overflow-hidden rounded-card border border-border bg-surface shadow-card"
            key={index}
          >
            <div className="min-h-60 bg-bg" />
            <div className="p-4">
              <div className="h-5 w-2/3 rounded-full bg-bg" />
              <div className="mt-3 h-3 w-1/2 rounded-full bg-bg" />
              <div className="mt-5 h-3 w-full rounded-full bg-bg" />
              <div className="mt-2 h-3 w-3/4 rounded-full bg-bg" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function RestaurantsEmptyState({ clearFilters }: { clearFilters: () => void }) {
  return (
    <section className="flex min-h-[420px] items-center justify-center rounded-card border border-border bg-surface p-8 text-center shadow-card">
      <div className="max-w-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border bg-bg text-ink-tertiary">
          <CalendarDays aria-hidden="true" size={28} />
        </div>
        <h2 className="mt-5 font-display text-2xl font-semibold text-ink-primary">No restaurants saved yet</h2>
        <p className="mt-3 text-sm leading-6 text-ink-secondary">
          Add the first place you visited and your restaurant history will start here.
        </p>
        <button
          className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-bg shadow-card transition hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent-soft"
          type="button"
          onClick={clearFilters}
        >
          <Plus aria-hidden="true" size={18} />
          Add restaurant
        </button>
      </div>
    </section>
  );
}

function RestaurantsErrorState() {
  return (
    <section className="rounded-card border border-error/30 bg-error/10 p-5 shadow-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle aria-hidden="true" className="mt-1 shrink-0 text-error" size={22} />
          <div>
            <h2 className="font-display text-xl font-semibold text-ink-primary">Could not load restaurants</h2>
            <p className="mt-2 text-sm leading-6 text-ink-secondary">
              Your saved places are safe. Try loading the restaurant list again.
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

"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  Bookmark,
  CalendarDays,
  ChevronDown,
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
import {
  restaurantsApi,
  type Restaurant as ApiRestaurant,
} from "@/lib/api/client";

type RestaurantsView = "ready" | "loading" | "empty" | "error";

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debouncedValue;
}

export default function RestaurantsPage() {
  const [filterOptions, setFilterOptions] = useState({
    city: ["All"],
    cuisine: ["All"],
    rating: [
      { label: "All", value: 0 },
      { label: "10", value: 10 },
      { label: "9.5+", value: 9.5 },
      { label: "9+", value: 9 },
      { label: "8.5+", value: 8.5 },
      { label: "8+", value: 8 },
      { label: "7+", value: 7 },
      { label: "5+", value: 5 },
    ],
  });
  const [city, setCity] = useState("All");
  const [cuisine, setCuisine] = useState("All");
  const [minimumRating, setMinimumRating] = useState(0);
  const [query, setQuery] = useState("");
  const [restaurants, setRestaurants] = useState<ApiRestaurant[]>([]);
  const [restaurantsView, setRestaurantsView] =
    useState<RestaurantsView>("loading");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const debouncedQuery = useDebouncedValue(query.trim(), 350);

  async function loadRestaurants() {
    setRestaurantsView("loading");

    try {
      const params = new URLSearchParams();
      if (debouncedQuery) {
        params.append("search", debouncedQuery);
      }
      if (city !== "All") {
        params.append("city", city);
      }
      if (cuisine !== "All") {
        params.append("cuisine", cuisine);
      }
      if (minimumRating !== 0) {
        params.append("rating", String(minimumRating));
      }
      const response = await restaurantsApi.list(params.toString());
      setRestaurants(response.data);
      setRestaurantsView(response.data.length > 0 ? "ready" : "empty");
    } catch (error) {
      setRestaurantsView("error");
    }
  }

  async function loadRestaurantFilters() {
    try {
      const response = await restaurantsApi.listFilters();
      setFilterOptions((prev) => ({
        ...prev,
        city: response.data.city,
        cuisine: response.data.cuisine,
      }));
    } catch (error) {
      console.error("Error fetching filters", error);
    }
  }

  useEffect(() => {
    void loadRestaurants();
  }, [debouncedQuery, city, cuisine, minimumRating]);

  useEffect(() => {
    void loadRestaurantFilters();
  }, []);

  const hasActiveFilters =
    city !== "All" ||
    cuisine !== "All" ||
    minimumRating > 0 ||
    query.trim().length > 0;
  const activeFilterLabels = [
    city !== "All" ? `City: ${city}` : null,
    cuisine !== "All" ? `Cuisine: ${cuisine}` : null,
    minimumRating > 0
      ? `Rating: ${
          filterOptions.rating.find((item) => item.value === minimumRating)
            ?.label ?? `${minimumRating}+`
        }`
      : null,
    query.trim() ? `Search: ${query.trim()}` : null,
  ].filter(Boolean) as string[];

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

        <section
          className="rounded-card border border-border bg-surface p-4 shadow-card"
          aria-labelledby="restaurant-filters-title"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <button
              aria-controls="restaurant-filters-content"
              aria-expanded={filtersOpen}
              className="group flex min-h-12 flex-1 items-start justify-between gap-4 rounded-control text-left focus:outline-none focus:ring-4 focus:ring-accent-soft"
              type="button"
              onClick={() => setFiltersOpen((current) => !current)}
            >
              <span>
                <span className="flex items-center gap-2 text-xs font-bold uppercase text-accent">
                  <SlidersHorizontal aria-hidden="true" size={15} />
                  Filters
                </span>
                <span
                  className="mt-1 block font-display text-xl font-semibold text-ink-primary"
                  id="restaurant-filters-title"
                >
                  Find by mood, city, or cuisine
                </span>
                <span className="mt-2 flex flex-wrap gap-2">
                  {activeFilterLabels.length > 0 ? (
                    activeFilterLabels.map((label) => (
                      <span
                        className="rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-xs font-bold text-accent"
                        key={label}
                      >
                        {label}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm font-semibold text-ink-secondary">
                      All restaurants
                    </span>
                  )}
                </span>
              </span>
              <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-bg text-ink-secondary transition group-hover:border-accent/40 group-hover:text-accent">
                <ChevronDown
                  aria-hidden="true"
                  className={`transition ${filtersOpen ? "rotate-180" : ""}`}
                  size={18}
                />
              </span>
            </button>

            <div className="flex items-center gap-2">
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
          </div>

          <div
            className={filtersOpen ? "mt-4" : "hidden"}
            id="restaurant-filters-content"
          >
            <div>
              <label
                className="text-sm font-bold text-ink-primary"
                htmlFor="restaurant-search"
              >
                Search
              </label>
              <div className="mt-2 flex min-h-12 items-center gap-3 rounded-full border border-border bg-bg px-4 transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft">
                <Search
                  aria-hidden="true"
                  className="shrink-0 text-ink-secondary"
                  size={18}
                />
                <input
                  className="min-w-0 flex-1 border-0 bg-transparent py-3 text-base text-ink-primary outline-none placeholder:text-ink-tertiary"
                  id="restaurant-search"
                  placeholder="Search restaurants by name, dishes, cuisine & city"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-3">
              <FilterGroup label="City">
                {filterOptions.city.map((item) => (
                  <FilterChip
                    active={city === item}
                    key={item}
                    label={item}
                    onClick={() => setCity(item)}
                  />
                ))}
              </FilterGroup>

              <FilterGroup label="Cuisine">
                {filterOptions.cuisine.map((item) => (
                  <FilterChip
                    active={cuisine === item}
                    key={item}
                    label={item}
                    onClick={() => setCuisine(item)}
                  />
                ))}
              </FilterGroup>

              <FilterGroup label="Rating">
                {filterOptions.rating.map((item) => (
                  <FilterChip
                    active={minimumRating === item.value}
                    key={item.value}
                    label={item.label}
                    onClick={() => setMinimumRating(item.value)}
                  />
                ))}
              </FilterGroup>
            </div>
          </div>
        </section>

        {restaurantsView === "loading" ? <RestaurantsLoadingState /> : null}
        {restaurantsView === "empty" ? (
          <RestaurantsEmptyState clearFilters={clearFilters} />
        ) : null}
        {restaurantsView === "error" ? (
          <RestaurantsErrorState onRetry={loadRestaurants} />
        ) : null}
        {restaurantsView === "ready" ? (
          <RestaurantsReadyState
            city={city}
            clearFilters={clearFilters}
            cuisine={cuisine}
            restaurants={restaurants}
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
        <p className="text-sm font-bold uppercase text-accent">
          Revisit Restaurants
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-ink-primary sm:text-4xl">
          Places worth going back to.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-secondary">
          Curated from ratings, visit count, notes, cuisine, and the dish that
          made each place memorable.
        </p>
      </div>

      <Link
        className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-bg shadow-card transition hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent-soft"
        href="/add"
      >
        <Plus aria-hidden="true" size={18} />
        Add restaurant
      </Link>
    </header>
  );
}

function RestaurantsReadyState({
  city,
  clearFilters,
  cuisine,
  hasActiveFilters,
  minimumRating,
  query,
  restaurants,
  setCity,
  setCuisine,
  setMinimumRating,
  setQuery,
}: {
  city: string;
  clearFilters: () => void;
  cuisine: string;
  hasActiveFilters: boolean;
  minimumRating: number;
  query: string;
  restaurants: ApiRestaurant[];
  setCity: (value: string) => void;
  setCuisine: (value: string) => void;
  setMinimumRating: (value: number) => void;
  setQuery: (value: string) => void;
}) {
  return (
    <>
      <section aria-labelledby="restaurants-results-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-accent">
              Curated list
            </p>
            <h2
              className="mt-1 font-display text-2xl font-semibold text-ink-primary"
              id="restaurants-results-title"
            >
              {restaurants.length} restaurants saved
            </h2>
          </div>
          <p className="text-sm font-semibold text-ink-secondary">
            Showing your latest saved places
          </p>
        </div>

        {restaurants.length > 0 ? (
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {restaurants
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              )
              .map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
          </div>
        ) : (
          <FilteredEmptyState clearFilters={clearFilters} />
        )}
      </section>
    </>
  );
}

function FilterGroup({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase text-ink-secondary">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
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

function RestaurantCard({ restaurant }: { restaurant: ApiRestaurant }) {
  const location =
    [restaurant.state, restaurant.city].filter(Boolean).join(", ") ||
    restaurant.country ||
    "Location not saved";
  const notes =
    restaurant.notes?.trim() ||
    "No notes added yet. Save what stood out on your next visit.";
  const cuisine = displayText(restaurant.cuisine, "Cuisine not set");
  const rating = restaurant.rating ?? 0;
  const visitedLabel = formatDate(restaurant.visitedAt ?? restaurant.createdAt);

  return (
    <Link
      className="grid grid-cols-[112px_minmax(0,1fr)] overflow-hidden rounded-card border border-border bg-surface shadow-card transition hover:border-accent/40 focus:outline-none focus:ring-4 focus:ring-accent-soft sm:grid-cols-[190px_minmax(0,1fr)]"
      href={`/restaurants/${restaurant.id}`}
    >
      <RestaurantImagePlaceholder
        restaurantName={restaurant.name}
        cuisine={cuisine}
        restaurantBannerUrl={restaurant.bannerImageUrl}
      />
      <div className="min-w-0 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-xl font-semibold text-ink-primary">
              {restaurant.name}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-ink-secondary">
              <MapPin aria-hidden="true" size={14} />
              {location}
            </p>
          </div>
          <Bookmark
            aria-hidden="true"
            className="shrink-0 text-success"
            size={20}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-success/25 bg-success/10 px-3 py-1 text-xs font-bold text-success">
            Why revisit?
          </span>
          <span className="rounded-full border border-border bg-bg px-3 py-1 text-xs font-bold text-ink-secondary">
            {cuisine}
          </span>
        </div>

        <p className="mt-3 text-sm leading-6 text-ink-secondary">{notes}</p>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
          <RestaurantMeta label="Visited" value={visitedLabel} />
          <div>
            <p className="text-xs font-semibold text-ink-tertiary">Rating</p>
            {rating > 0 ? (
              <RatingStars rating={rating} />
            ) : (
              <p className="mt-1 text-sm font-bold text-ink-primary">
                Not rated
              </p>
            )}
          </div>
          <div className="col-span-2 flex items-center justify-between gap-3 rounded-control bg-bg p-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink-tertiary">Address</p>
              <p className="mt-1 truncate text-sm font-bold text-ink-primary">
                {restaurant.address || "Not saved yet"}
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-success/25 bg-success/10 px-3 py-1 text-xs font-bold text-success">
              Saved
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function RestaurantImagePlaceholder({
  cuisine,
  restaurantName,
  restaurantBannerUrl,
}: {
  cuisine: string;
  restaurantName: string;
  restaurantBannerUrl?: string | null;
}) {
  const imageUrl =
    restaurantBannerUrl ||
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=700&q=80";

  return (
    <div
      style={{
        backgroundImage: `linear-gradient(180deg,rgba(15,15,15,0.22),rgba(15,15,15,0.82)),url(${imageUrl})`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
      className="relative flex h-full min-h-60 w-full flex-col justify-end overflow-hidden bg-[radial-gradient(circle_at_25%_20%,rgba(201,143,73,0.35),transparent_34%),linear-gradient(145deg,#211d18,#0f0f0f)] p-4"
    >
      <div className="relative">
        <p className="text-[11px] font-bold uppercase text-accent">BiteDiary</p>
        <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-ink-primary">
          {cuisine}
        </p>
      </div>
    </div>
  );
}

function displayText(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();

  if (!trimmed || trimmed.toLowerCase() === "undefined") {
    return fallback;
  }

  return trimmed;
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
  const filledStars = Math.round(rating / 2);

  return (
    <div
      className="mt-1 flex shrink-0 items-center gap-1 text-rating-gold"
      aria-label={`${rating} out of 10 rating`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          aria-hidden="true"
          fill={index + 1 <= filledStars ? "currentColor" : "none"}
          key={index}
          size={14}
        />
      ))}
      <span className="ml-1 text-xs font-bold text-ink-primary">
        {rating.toFixed(1)}/10
      </span>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Date not saved";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date not saved";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function FilteredEmptyState({ clearFilters }: { clearFilters: () => void }) {
  return (
    <section className="mt-4 flex min-h-[320px] items-center justify-center rounded-card border border-border bg-surface p-8 text-center shadow-card">
      <div className="max-w-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border bg-bg text-ink-tertiary">
          <Filter aria-hidden="true" size={28} />
        </div>
        <h3 className="mt-5 font-display text-2xl font-semibold text-ink-primary">
          No restaurants match
        </h3>
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
        <h2 className="mt-5 font-display text-2xl font-semibold text-ink-primary">
          No restaurants saved yet
        </h2>
        <p className="mt-3 text-sm leading-6 text-ink-secondary">
          Add the first place you visited and your restaurant history will start
          here.
        </p>
        <Link
          className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-bg shadow-card transition hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent-soft"
          href="/add"
        >
          <Plus aria-hidden="true" size={18} />
          Add restaurant
        </Link>
      </div>
    </section>
  );
}

function RestaurantsErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="rounded-card border border-error/30 bg-error/10 p-5 shadow-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle
            aria-hidden="true"
            className="mt-1 shrink-0 text-error"
            size={22}
          />
          <div>
            <h2 className="font-display text-xl font-semibold text-ink-primary">
              Could not load restaurants
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-secondary">
              Your saved places are safe. Try loading the restaurant list again.
            </p>
          </div>
        </div>
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-error/30 bg-surface px-5 text-sm font-bold text-error shadow-card transition hover:bg-bg focus:outline-none focus:ring-4 focus:ring-accent-soft"
          type="button"
          onClick={onRetry}
        >
          <RefreshCw aria-hidden="true" size={18} />
          Retry
        </button>
      </div>
    </section>
  );
}

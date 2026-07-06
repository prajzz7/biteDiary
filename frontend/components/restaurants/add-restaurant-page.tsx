"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { z } from "zod";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChefHat,
  ClipboardPenLine,
  LoaderCircle,
  MapPin,
  Navigation,
  Plus,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import {
  ApiError,
  restaurantsApi,
  type Restaurant,
} from "@/lib/api/client";

const restaurantSchema = z.object({
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  country: z.string().trim().optional(),
  cuisine: z.string().trim().optional(),
  name: z.string().trim().min(2, "Restaurant name is required"),
  notes: z.string().trim().optional(),
  rating: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => {
        if (!value) {
          return true;
        }

        const rating = Number(value);
        return (
          Number.isFinite(rating) &&
          rating >= 0 &&
          rating <= 10 &&
          Number.isInteger(rating * 2)
        );
      },
      "Rating must be between 0 and 10 in 0.5 steps",
    ),
  state: z.string().trim().optional(),
  visitedAt: z.string().optional(),
});

type AddRestaurantFormValues = z.infer<typeof restaurantSchema>;
type SubmitStatus = "idle" | "loading" | "success" | "error";

const quickCuisines = ["Seafood", "Japanese", "Italian", "Indian", "Cafe"];
const quickRatings = [10, 9.5, 9, 8.5, 8, 7.5];

export default function AddRestaurantPage() {
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [createdRestaurant, setCreatedRestaurant] = useState<Restaurant | null>(
    null,
  );

  const {
    clearErrors,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
    watch,
  } = useForm<AddRestaurantFormValues>({
    defaultValues: {
      address: "",
      city: "",
      country: "",
      cuisine: "",
      name: "",
      notes: "",
      rating: "",
      state: "",
      visitedAt: new Date().toISOString().slice(0, 10),
    },
  });

  const selectedCuisine = watch("cuisine");
  const selectedRating = Number(watch("rating") || 0);
  const isLoading = status === "loading";

  async function onSubmit(values: AddRestaurantFormValues) {
    clearErrors();
    setCreatedRestaurant(null);

    const parsed = restaurantSchema.safeParse(values);

    if (!parsed.success) {
      setStatus("error");
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];

        if (typeof field === "string") {
          setError(field as keyof AddRestaurantFormValues, {
            message: issue.message,
            type: "manual",
          });
        }
      });
      return;
    }

    setStatus("loading");

    try {
      const payload = toRestaurantPayload(parsed.data);
      const response = await restaurantsApi.create(payload);

      setCreatedRestaurant(response.data);
      setStatus("success");
      reset({
        address: "",
        city: "",
        country: "",
        cuisine: "",
        name: "",
        notes: "",
        rating: "",
        state: "",
        visitedAt: new Date().toISOString().slice(0, 10),
      });
    } catch (error) {
      setStatus("error");
      setError("name", {
        message:
          error instanceof ApiError
            ? error.message
            : "Unable to save restaurant. Please try again.",
        type: "manual",
      });
    }
  }

  return (
    <AppShell activeItem="Add">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <PageHeader />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-card border border-border bg-surface p-4 shadow-card sm:p-6">
            <StatusMessage restaurant={createdRestaurant} status={status} />

            <form
              className="space-y-6"
              noValidate
              onSubmit={handleSubmit(onSubmit)}
            >
              <section>
                <SectionTitle
                  icon={Utensils}
                  subtitle="Start with what you will search for later."
                  title="Restaurant"
                />

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <Field
                    error={errors.name?.message}
                    icon={Utensils}
                    id="name"
                    label="Restaurant name"
                    placeholder="O Pedro"
                    required
                    register={register("name")}
                  />

                  <div>
                    <Field
                      error={errors.cuisine?.message}
                      icon={ChefHat}
                      id="cuisine"
                      label="Cuisine"
                      placeholder="Seafood"
                      register={register("cuisine")}
                    />
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                      {quickCuisines.map((cuisine) => (
                        <button
                          className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-accent-soft ${
                            selectedCuisine === cuisine
                              ? "border-accent/40 bg-accent-soft text-accent"
                              : "border-border bg-bg text-ink-secondary hover:border-accent/40 hover:text-ink-primary"
                          }`}
                          key={cuisine}
                          type="button"
                          onClick={() =>
                            setValue("cuisine", cuisine, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                        >
                          {cuisine}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <SectionTitle
                  icon={CalendarDays}
                  subtitle="Rate the visit while it is still fresh."
                  title="Visit"
                />

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div>
                    <label
                      className="text-sm font-bold text-ink-primary"
                      htmlFor="rating"
                    >
                      Rating
                    </label>
                    <div className="mt-2 rounded-control border border-border bg-surface-sunken p-3 transition focus-within:border-accent focus-within:bg-surface focus-within:ring-4 focus-within:ring-accent-soft">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-display text-3xl font-semibold text-ink-primary">
                            {selectedRating > 0
                              ? selectedRating.toFixed(1)
                              : "0.0"}
                            <span className="ml-1 text-base font-bold text-ink-secondary">
                              /10
                            </span>
                          </p>
                          <p className="mt-1 text-xs font-semibold text-ink-tertiary">
                            Use half steps like 8.5 or 9.5
                          </p>
                        </div>
                        <input
                          className="h-11 w-20 rounded-control border border-border bg-bg px-3 text-center text-base font-bold text-ink-primary outline-none focus:border-accent"
                          id="rating"
                          inputMode="decimal"
                          placeholder="8.5"
                          type="number"
                          step="0.5"
                          min="0"
                          max="10"
                          aria-invalid={Boolean(errors.rating)}
                          aria-describedby={
                            errors.rating ? "rating-error" : undefined
                          }
                          {...register("rating")}
                        />
                      </div>
                      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                        {quickRatings.map((rating) => (
                          <button
                            className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-accent-soft ${
                              selectedRating === rating
                                ? "border-accent/40 bg-accent-soft text-accent"
                                : "border-border bg-bg text-ink-secondary hover:border-accent/40 hover:text-ink-primary"
                            }`}
                            key={rating}
                            type="button"
                            onClick={() =>
                              setValue("rating", String(rating), {
                                shouldDirty: true,
                                shouldValidate: true,
                              })
                            }
                          >
                            {rating.toFixed(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    {errors.rating ? (
                      <p
                        className="mt-2 text-sm font-semibold text-error"
                        id="rating-error"
                      >
                        {errors.rating.message}
                      </p>
                    ) : null}
                  </div>

                  <Field
                    error={errors.visitedAt?.message}
                    icon={CalendarDays}
                    id="visitedAt"
                    label="Visited date"
                    register={register("visitedAt")}
                    type="date"
                  />
                </div>
              </section>

              <section>
                <SectionTitle
                  icon={MapPin}
                  subtitle="Enough location detail to find it again."
                  title="Location"
                />

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <Field
                    error={errors.city?.message}
                    icon={MapPin}
                    id="city"
                    label="City"
                    placeholder="Mumbai"
                    register={register("city")}
                  />
                  <Field
                    error={errors.state?.message}
                    icon={Navigation}
                    id="state"
                    label="State"
                    placeholder="Maharashtra"
                    register={register("state")}
                  />
                  <Field
                    error={errors.country?.message}
                    icon={Navigation}
                    id="country"
                    label="Country"
                    placeholder="India"
                    register={register("country")}
                  />
                  <Field
                    error={errors.address?.message}
                    icon={MapPin}
                    id="address"
                    label="Address"
                    placeholder="Bandra Kurla Complex"
                    register={register("address")}
                  />
                </div>
              </section>

              <section>
                <SectionTitle
                  icon={ClipboardPenLine}
                  subtitle="Capture the dish, mood, or why this place matters."
                  title="Notes"
                />

                <div className="mt-4">
                  <label
                    className="text-sm font-bold text-ink-primary"
                    htmlFor="notes"
                  >
                    Notes
                  </label>
                  <div className="mt-2 rounded-control border border-border bg-surface-sunken px-4 transition focus-within:border-accent focus-within:bg-surface focus-within:ring-4 focus-within:ring-accent-soft">
                    <textarea
                      className="min-h-28 w-full resize-y border-0 bg-transparent py-3 text-base leading-6 text-ink-primary outline-none placeholder:text-ink-tertiary"
                      id="notes"
                      placeholder="Butter garlic prawns were excellent. Go again for dinner."
                      aria-invalid={Boolean(errors.notes)}
                      aria-describedby={
                        errors.notes ? "notes-error" : undefined
                      }
                      {...register("notes")}
                    />
                  </div>
                  {errors.notes ? (
                    <p
                      className="mt-2 text-sm font-semibold text-error"
                      id="notes-error"
                    >
                      {errors.notes.message}
                    </p>
                  ) : null}
                </div>
              </section>

              <div className="sticky bottom-[calc(102px+env(safe-area-inset-bottom))] z-10 rounded-card border border-border bg-surface/95 p-3 shadow-raised backdrop-blur lg:static lg:p-0 lg:shadow-none">
                <button
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-accent px-5 py-3 text-base font-bold text-bg shadow-card transition hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent-soft disabled:cursor-wait disabled:opacity-70"
                  disabled={isLoading}
                  type="submit"
                >
                  {isLoading ? (
                    <>
                      <LoaderCircle
                        aria-hidden="true"
                        className="animate-spin"
                        size={19}
                      />
                      Saving restaurant
                    </>
                  ) : (
                    <>
                      Save restaurant
                      <ArrowRight aria-hidden="true" size={19} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          <aside className="space-y-4">
            <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
              <div className="relative h-52 bg-[radial-gradient(circle_at_30%_20%,rgba(209,154,82,0.38),transparent_34%),linear-gradient(145deg,#2b2118,#100f0d)]">
                <img
                  alt="Warm restaurant table"
                  className="h-full w-full object-cover opacity-55 mix-blend-screen"
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/25 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-xs font-bold uppercase text-accent">
                    Quick log
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-semibold text-ink-primary">
                    Add it before the details fade.
                  </h2>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm leading-6 text-ink-secondary">
                  Name and rating are usually enough to begin. City, cuisine,
                  and notes make your future search and filters more useful.
                </p>
              </div>
            </div>

            <div className="rounded-card border border-success/25 bg-success/10 p-4 shadow-card">
              <div className="flex items-start gap-3">
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-success"
                  size={20}
                />
                <div>
                  <h2 className="font-display text-xl font-semibold text-ink-primary">
                    Saved privately
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-ink-secondary">
                    Restaurants are linked to your logged-in user on the
                    backend, so another user cannot create entries for you.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}

function toRestaurantPayload(values: AddRestaurantFormValues) {
  return {
    address: optionalString(values.address),
    city: optionalString(values.city),
    country: optionalString(values.country),
    cuisine: optionalString(values.cuisine),
    name: values.name.trim(),
    notes: optionalString(values.notes),
    rating: values.rating ? Number(values.rating) : undefined,
    state: optionalString(values.state),
    visitedAt: values.visitedAt || undefined,
  };
}

function optionalString(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function PageHeader() {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-sm font-bold uppercase text-accent">Add visit</p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-ink-primary sm:text-4xl">
          Save a restaurant worth remembering.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-secondary">
          Log the place, rating, location, and notes now. You can add richer
          dish history once dishes are modeled in the backend.
        </p>
      </div>

      <Link
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border bg-surface px-5 text-sm font-bold text-ink-primary shadow-card transition hover:border-accent/50 hover:text-accent focus:outline-none focus:ring-4 focus:ring-accent-soft"
        href="/restaurants"
      >
        View restaurants
        <ArrowRight aria-hidden="true" size={18} />
      </Link>
    </header>
  );
}

function SectionTitle({
  icon: Icon,
  subtitle,
  title,
}: {
  icon: LucideIcon;
  subtitle: string;
  title: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent-soft text-accent">
        <Icon aria-hidden="true" size={18} />
      </span>
      <div>
        <h2
          className="font-display text-xl font-semibold text-ink-primary"
          id={`${title.toLowerCase()}-details-title`}
        >
          {title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-ink-secondary">{subtitle}</p>
      </div>
    </div>
  );
}

function Field({
  error,
  icon: Icon,
  id,
  label,
  placeholder,
  register,
  required = false,
  type = "text",
}: {
  error?: string;
  icon: LucideIcon;
  id: keyof AddRestaurantFormValues;
  label: string;
  placeholder?: string;
  register: UseFormRegisterReturn;
  required?: boolean;
  type?: string;
}) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label className="text-sm font-bold text-ink-primary" htmlFor={id}>
        {label}
        {required ? <span className="text-accent"> *</span> : null}
      </label>
      <div className="mt-2 flex min-h-12 items-center gap-3 rounded-control border border-border bg-surface-sunken px-4 transition focus-within:border-accent focus-within:bg-surface focus-within:ring-4 focus-within:ring-accent-soft">
        <Icon
          aria-hidden="true"
          className="shrink-0 text-ink-secondary"
          size={19}
        />
        <input
          className="min-w-0 flex-1 border-0 bg-transparent py-3 text-base text-ink-primary outline-none placeholder:text-ink-tertiary"
          id={id}
          placeholder={placeholder}
          type={type}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          {...register}
        />
      </div>
      {error ? (
        <p className="mt-2 text-sm font-semibold text-error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function StatusMessage({
  restaurant,
  status,
}: {
  restaurant: Restaurant | null;
  status: SubmitStatus;
}) {
  if (status === "success" && restaurant) {
    return (
      <div
        className="mb-5 rounded-card border border-success/30 bg-success/10 p-4"
        role="status"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-success"
            size={21}
          />
          <div className="min-w-0">
            <p className="font-bold text-success">Restaurant saved</p>
            <h2 className="mt-1 truncate font-display text-2xl font-semibold text-ink-primary">
              {restaurant.name}
            </h2>
            <p className="mt-1 text-sm leading-6 text-ink-secondary">
              {restaurant.cuisine || "Cuisine not set"}{" "}
              {restaurant.city ? `in ${restaurant.city}` : ""}
            </p>
            <Link
              className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-bold text-bg transition hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent-soft"
              href="/restaurants"
            >
              See in restaurants
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        className="mb-5 flex items-start gap-3 rounded-control border border-error/30 bg-error/10 p-4 text-sm font-semibold text-error"
        role="alert"
      >
        <AlertCircle
          aria-hidden="true"
          className="mt-0.5 shrink-0"
          size={18}
        />
        <p className="m-0">Check the highlighted details and try again.</p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div
        className="mb-5 flex items-start gap-3 rounded-control border border-accent/30 bg-accent-soft p-4 text-sm font-semibold text-accent"
        role="status"
      >
        <LoaderCircle
          aria-hidden="true"
          className="mt-0.5 shrink-0 animate-spin"
          size={18}
        />
        <p className="m-0">Saving this restaurant to your diary...</p>
      </div>
    );
  }

  return null;
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { z } from "zod";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChefHat,
  ClipboardPenLine,
  LoaderCircle,
  MapPin,
  Navigation,
  Pencil,
  RefreshCw,
  Save,
  Star,
  Trash2,
  Utensils,
  X,
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
    .refine((value) => {
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
    }, "Rating must be between 0 and 10 in 0.5 steps"),
  state: z.string().trim().optional(),
  visitedAt: z.string().optional(),
});

type RestaurantFormValues = z.infer<typeof restaurantSchema>;
type DetailView = "loading" | "ready" | "error" | "not-found";
type MutationStatus = "idle" | "loading" | "success" | "error";

const quickRatings = [10, 9.5, 9, 8.5, 8, 7.5];

export default function RestaurantDetailPage({
  restaurantId,
}: {
  restaurantId: string;
}) {
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [view, setView] = useState<DetailView>("loading");
  const [isEditing, setIsEditing] = useState(false);
  const [mutationStatus, setMutationStatus] =
    useState<MutationStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    clearErrors,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
    watch,
  } = useForm<RestaurantFormValues>({
    defaultValues: emptyFormValues,
  });

  const selectedRating = Number(watch("rating") || 0);
  const isMutating = mutationStatus === "loading";

  async function loadRestaurant() {
    setView("loading");
    setStatusMessage("");

    try {
      const response = await restaurantsApi.get(restaurantId);
      setRestaurant(response.data);
      reset(toFormValues(response.data));
      setView("ready");
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setView("not-found");
        return;
      }

      setView("error");
    }
  }

  useEffect(() => {
    void loadRestaurant();
  }, [restaurantId]);

  async function onSubmit(values: RestaurantFormValues) {
    clearErrors();
    setStatusMessage("");

    const parsed = restaurantSchema.safeParse(values);

    if (!parsed.success) {
      setMutationStatus("error");
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];

        if (typeof field === "string") {
          setError(field as keyof RestaurantFormValues, {
            message: issue.message,
            type: "manual",
          });
        }
      });
      return;
    }

    setMutationStatus("loading");

    try {
      const response = await restaurantsApi.update(
        restaurantId,
        toUpdateRestaurantPayload(parsed.data),
      );

      setRestaurant(response.data);
      reset(toFormValues(response.data));
      setIsEditing(false);
      setMutationStatus("success");
      setStatusMessage("Restaurant updated.");
    } catch (error) {
      setMutationStatus("error");
      setStatusMessage(
        error instanceof ApiError
          ? error.message
          : "Unable to update restaurant.",
      );
    }
  }

  async function deleteRestaurant() {
    setMutationStatus("loading");
    setStatusMessage("");

    try {
      await restaurantsApi.delete(restaurantId);
      router.replace("/restaurants");
      router.refresh();
    } catch (error) {
      setMutationStatus("error");
      setStatusMessage(
        error instanceof ApiError
          ? error.message
          : "Unable to delete restaurant.",
      );
      setShowDeleteConfirm(false);
    }
  }

  function cancelEdit() {
    if (restaurant) {
      reset(toFormValues(restaurant));
    }

    clearErrors();
    setIsEditing(false);
    setMutationStatus("idle");
    setStatusMessage("");
  }

  return (
    <AppShell activeItem="Restaurants">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <Link
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-bold text-ink-primary shadow-card transition hover:border-accent/50 hover:text-accent focus:outline-none focus:ring-4 focus:ring-accent-soft"
          href="/restaurants"
        >
          <ArrowLeft aria-hidden="true" size={17} />
          Restaurants
        </Link>

        {view === "loading" ? <LoadingState /> : null}
        {view === "error" ? <ErrorState onRetry={loadRestaurant} /> : null}
        {view === "not-found" ? <NotFoundState /> : null}
        {view === "ready" && restaurant ? (
          <>
            <StatusMessage message={statusMessage} status={mutationStatus} />
            <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="space-y-5">
                <HeroCard restaurant={restaurant} />

                {isEditing ? (
                  <EditForm
                    errors={errors}
                    handleSubmit={handleSubmit}
                    isMutating={isMutating}
                    onCancel={cancelEdit}
                    onSubmit={onSubmit}
                    register={register}
                    selectedRating={selectedRating}
                    setValue={setValue}
                  />
                ) : (
                  <ReadDetails restaurant={restaurant} />
                )}
              </div>

              <aside className="space-y-4">
                <ActionPanel
                  isEditing={isEditing}
                  isMutating={isMutating}
                  onDelete={() => setShowDeleteConfirm(true)}
                  onEdit={() => setIsEditing(true)}
                />

                <MetaPanel restaurant={restaurant} />
              </aside>
            </section>
          </>
        ) : null}

        {showDeleteConfirm && restaurant ? (
          <DeleteDialog
            isDeleting={isMutating}
            restaurantName={restaurant.name}
            onCancel={() => setShowDeleteConfirm(false)}
            onConfirm={deleteRestaurant}
          />
        ) : null}
      </main>
    </AppShell>
  );
}

const emptyFormValues: RestaurantFormValues = {
  address: "",
  city: "",
  country: "",
  cuisine: "",
  name: "",
  notes: "",
  rating: "",
  state: "",
  visitedAt: "",
};

function toFormValues(restaurant: Restaurant): RestaurantFormValues {
  return {
    address: restaurant.address ?? "",
    city: restaurant.city ?? "",
    country: restaurant.country ?? "",
    cuisine: restaurant.cuisine ?? "",
    name: restaurant.name,
    notes: restaurant.notes ?? "",
    rating:
      restaurant.rating !== undefined && restaurant.rating !== null
        ? String(restaurant.rating)
        : "",
    state: restaurant.state ?? "",
    visitedAt: toDateInputValue(restaurant.visitedAt),
  };
}

function toUpdateRestaurantPayload(values: RestaurantFormValues) {
  return {
    address: nullableString(values.address),
    city: nullableString(values.city),
    country: nullableString(values.country),
    cuisine: nullableString(values.cuisine),
    name: values.name.trim(),
    notes: nullableString(values.notes),
    rating: values.rating ? Number(values.rating) : null,
    state: nullableString(values.state),
    visitedAt: values.visitedAt || null,
  };
}

function nullableString(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toDateInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function HeroCard({ restaurant }: { restaurant: Restaurant }) {
  const location = getLocation(restaurant);
  const cuisine = restaurant.cuisine || "Cuisine not set";

  return (
    <header className="overflow-hidden rounded-card border border-border bg-surface shadow-raised">
      <div className="relative min-h-[280px] bg-[radial-gradient(circle_at_25%_20%,rgba(209,154,82,0.36),transparent_34%),linear-gradient(145deg,#2b2118,#100f0d)]">
        <img
          alt="Warm restaurant table"
          className="absolute inset-0 h-full w-full object-cover opacity-45 mix-blend-screen"
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-transparent" />
        <div className="relative flex min-h-[280px] flex-col justify-end p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-normal text-accent">
            Restaurant detail
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-ink-primary sm:text-5xl">
            {restaurant.name}
          </h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <InfoPill icon={ChefHat} label={cuisine} />
            <InfoPill icon={MapPin} label={location} />
            <RatingPill rating={restaurant.rating} />
          </div>
        </div>
      </div>
    </header>
  );
}

function ReadDetails({ restaurant }: { restaurant: Restaurant }) {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <DetailCard
        icon={CalendarDays}
        label="Visited"
        value={formatDate(restaurant.visitedAt ?? restaurant.createdAt)}
      />
      <DetailCard
        icon={ChefHat}
        label="Cuisine"
        value={restaurant.cuisine || "Not saved"}
      />
      <DetailCard
        icon={MapPin}
        label="Address"
        value={restaurant.address || "Not saved"}
      />
      <DetailCard
        icon={Navigation}
        label="City"
        value={getLocation(restaurant)}
      />
      <article className="rounded-card border border-border bg-surface p-5 shadow-card md:col-span-2">
        <p className="flex items-center gap-2 text-xs font-bold uppercase text-accent">
          <ClipboardPenLine aria-hidden="true" size={16} />
          Notes
        </p>
        <p className="mt-3 text-sm leading-6 text-ink-secondary">
          {restaurant.notes ||
            "No notes yet. Edit this restaurant to add what stood out."}
        </p>
      </article>
    </section>
  );
}

function EditForm({
  errors,
  handleSubmit,
  isMutating,
  onCancel,
  onSubmit,
  register,
  selectedRating,
  setValue,
}: {
  errors: ReturnType<typeof useForm<RestaurantFormValues>>["formState"]["errors"];
  handleSubmit: ReturnType<typeof useForm<RestaurantFormValues>>["handleSubmit"];
  isMutating: boolean;
  onCancel: () => void;
  onSubmit: (values: RestaurantFormValues) => void;
  register: ReturnType<typeof useForm<RestaurantFormValues>>["register"];
  selectedRating: number;
  setValue: ReturnType<typeof useForm<RestaurantFormValues>>["setValue"];
}) {
  return (
    <form
      className="rounded-card border border-border bg-surface p-4 shadow-card sm:p-6"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-accent">Edit</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-ink-primary">
            Update restaurant
          </h2>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-bg px-4 text-sm font-bold text-ink-primary transition hover:border-accent/50 hover:text-accent focus:outline-none focus:ring-4 focus:ring-accent-soft"
          type="button"
          onClick={onCancel}
        >
          <X aria-hidden="true" size={17} />
          Cancel
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Field
          error={errors.name?.message}
          icon={Utensils}
          id="name"
          label="Restaurant name"
          register={register("name")}
          required
        />
        <Field
          error={errors.cuisine?.message}
          icon={ChefHat}
          id="cuisine"
          label="Cuisine"
          register={register("cuisine")}
        />
        <RatingField
          error={errors.rating?.message}
          register={register("rating")}
          selectedRating={selectedRating}
          setValue={setValue}
        />
        <Field
          error={errors.visitedAt?.message}
          icon={CalendarDays}
          id="visitedAt"
          label="Visited date"
          register={register("visitedAt")}
          type="date"
        />
        <Field
          error={errors.city?.message}
          icon={MapPin}
          id="city"
          label="City"
          register={register("city")}
        />
        <Field
          error={errors.state?.message}
          icon={Navigation}
          id="state"
          label="State"
          register={register("state")}
        />
        <Field
          error={errors.country?.message}
          icon={Navigation}
          id="country"
          label="Country"
          register={register("country")}
        />
        <Field
          error={errors.address?.message}
          icon={MapPin}
          id="address"
          label="Address"
          register={register("address")}
        />
      </div>

      <div className="mt-4">
        <label className="text-sm font-bold text-ink-primary" htmlFor="notes">
          Notes
        </label>
        <div className="mt-2 rounded-control border border-border bg-surface-sunken px-4 transition focus-within:border-accent focus-within:bg-surface focus-within:ring-4 focus-within:ring-accent-soft">
          <textarea
            className="min-h-28 w-full resize-y border-0 bg-transparent py-3 text-base leading-6 text-ink-primary outline-none placeholder:text-ink-tertiary"
            id="notes"
            placeholder="What should you remember?"
            {...register("notes")}
          />
        </div>
      </div>

      <button
        className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-accent px-5 py-3 text-base font-bold text-bg shadow-card transition hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent-soft disabled:cursor-wait disabled:opacity-70"
        disabled={isMutating}
        type="submit"
      >
        {isMutating ? (
          <>
            <LoaderCircle aria-hidden="true" className="animate-spin" size={18} />
            Saving changes
          </>
        ) : (
          <>
            <Save aria-hidden="true" size={18} />
            Save changes
          </>
        )}
      </button>
    </form>
  );
}

function ActionPanel({
  isEditing,
  isMutating,
  onDelete,
  onEdit,
}: {
  isEditing: boolean;
  isMutating: boolean;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <section className="rounded-card border border-border bg-surface p-4 shadow-card">
      <p className="text-xs font-bold uppercase text-accent">Actions</p>
      <div className="mt-4 grid gap-3">
        <button
          className="flex min-h-12 items-center justify-center gap-2 rounded-control bg-accent px-4 text-sm font-bold text-bg shadow-card transition hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent-soft disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isEditing || isMutating}
          type="button"
          onClick={onEdit}
        >
          <Pencil aria-hidden="true" size={18} />
          Edit restaurant
        </button>
        <button
          className="flex min-h-12 items-center justify-center gap-2 rounded-control border border-error/30 bg-error/10 px-4 text-sm font-bold text-error transition hover:bg-error/15 focus:outline-none focus:ring-4 focus:ring-accent-soft disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isMutating}
          type="button"
          onClick={onDelete}
        >
          <Trash2 aria-hidden="true" size={18} />
          Delete restaurant
        </button>
      </div>
    </section>
  );
}

function MetaPanel({ restaurant }: { restaurant: Restaurant }) {
  return (
    <section className="rounded-card border border-border bg-surface p-4 shadow-card">
      <p className="text-xs font-bold uppercase text-accent">Record</p>
      <div className="mt-4 space-y-3">
        <MetaRow label="Created" value={formatDate(restaurant.createdAt)} />
        <MetaRow label="Updated" value={formatDate(restaurant.updatedAt)} />
        <MetaRow label="Owner link" value="Private to your account" />
      </div>
    </section>
  );
}

function DeleteDialog({
  isDeleting,
  onCancel,
  onConfirm,
  restaurantName,
}: {
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  restaurantName: string;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-bg/75 p-4 backdrop-blur sm:items-center">
      <section
        aria-modal="true"
        className="w-full max-w-md rounded-card border border-error/30 bg-surface p-5 shadow-raised"
        role="dialog"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-error/30 bg-error/10 text-error">
          <Trash2 aria-hidden="true" size={22} />
        </div>
        <h2 className="mt-4 font-display text-2xl font-semibold text-ink-primary">
          Delete {restaurantName}?
        </h2>
        <p className="mt-3 text-sm leading-6 text-ink-secondary">
          This removes the restaurant from your diary. This action cannot be
          undone.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            className="min-h-12 rounded-control border border-border bg-bg px-4 text-sm font-bold text-ink-primary transition hover:border-accent/50 focus:outline-none focus:ring-4 focus:ring-accent-soft"
            disabled={isDeleting}
            type="button"
            onClick={onCancel}
          >
            Keep it
          </button>
          <button
            className="flex min-h-12 items-center justify-center gap-2 rounded-control bg-error px-4 text-sm font-bold text-bg transition focus:outline-none focus:ring-4 focus:ring-accent-soft disabled:cursor-wait disabled:opacity-70"
            disabled={isDeleting}
            type="button"
            onClick={onConfirm}
          >
            {isDeleting ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" size={18} />
            ) : (
              <Trash2 aria-hidden="true" size={18} />
            )}
            Delete
          </button>
        </div>
      </section>
    </div>
  );
}

function RatingField({
  error,
  register,
  selectedRating,
  setValue,
}: {
  error?: string;
  register: UseFormRegisterReturn;
  selectedRating: number;
  setValue: ReturnType<typeof useForm<RestaurantFormValues>>["setValue"];
}) {
  return (
    <div>
      <label className="text-sm font-bold text-ink-primary" htmlFor="rating">
        Rating
      </label>
      <div className="mt-2 rounded-control border border-border bg-surface-sunken p-3 transition focus-within:border-accent focus-within:bg-surface focus-within:ring-4 focus-within:ring-accent-soft">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-3xl font-semibold text-ink-primary">
            {selectedRating > 0 ? selectedRating.toFixed(1) : "0.0"}
            <span className="ml-1 text-base font-bold text-ink-secondary">
              /10
            </span>
          </p>
          <input
            className="h-11 w-20 rounded-control border border-border bg-bg px-3 text-center text-base font-bold text-ink-primary outline-none focus:border-accent"
            id="rating"
            inputMode="decimal"
            max="10"
            min="0"
            placeholder="8.5"
            step="0.5"
            type="number"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "rating-error" : undefined}
            {...register}
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
      {error ? (
        <p className="mt-2 text-sm font-semibold text-error" id="rating-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Field({
  error,
  icon: Icon,
  id,
  label,
  register,
  required = false,
  type = "text",
}: {
  error?: string;
  icon: LucideIcon;
  id: keyof RestaurantFormValues;
  label: string;
  register: UseFormRegisterReturn;
  required?: boolean;
  type?: string;
}) {
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
          type={type}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...register}
        />
      </div>
      {error ? (
        <p className="mt-2 text-sm font-semibold text-error" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function DetailCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-card border border-border bg-surface p-5 shadow-card">
      <p className="flex items-center gap-2 text-xs font-bold uppercase text-accent">
        <Icon aria-hidden="true" size={16} />
        {label}
      </p>
      <p className="mt-3 text-sm font-bold leading-6 text-ink-primary">
        {value}
      </p>
    </article>
  );
}

function InfoPill({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-bg/80 px-3 text-xs font-bold text-ink-primary">
      <Icon aria-hidden="true" size={15} />
      {label}
    </span>
  );
}

function RatingPill({ rating }: { rating?: number | null }) {
  if (rating === undefined || rating === null) {
    return <InfoPill icon={Star} label="Not rated" />;
  }

  return (
    <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-bg/80 px-3 text-xs font-bold text-ink-primary">
      <Star
        aria-hidden="true"
        className="text-rating-gold"
        fill="currentColor"
        size={15}
      />
      {rating.toFixed(1)}/10
    </span>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0">
      <p className="text-xs font-semibold text-ink-tertiary">{label}</p>
      <p className="text-right text-sm font-bold text-ink-primary">{value}</p>
    </div>
  );
}

function StatusMessage({
  message,
  status,
}: {
  message: string;
  status: MutationStatus;
}) {
  if (!message) {
    return null;
  }

  if (status === "success") {
    return (
      <div
        className="flex items-start gap-3 rounded-control border border-success/30 bg-success/10 p-4 text-sm font-semibold text-success"
        role="status"
      >
        <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0" size={18} />
        {message}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        className="flex items-start gap-3 rounded-control border border-error/30 bg-error/10 p-4 text-sm font-semibold text-error"
        role="alert"
      >
        <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0" size={18} />
        {message}
      </div>
    );
  }

  return null;
}

function LoadingState() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-h-[360px] rounded-card border border-border bg-surface shadow-card">
        <div className="h-full rounded-card bg-surface-sunken" />
      </div>
      <div className="space-y-4">
        <div className="h-40 rounded-card border border-border bg-surface shadow-card" />
        <div className="h-40 rounded-card border border-border bg-surface shadow-card" />
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
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
            <h1 className="font-display text-xl font-semibold text-ink-primary">
              Could not load restaurant
            </h1>
            <p className="mt-2 text-sm leading-6 text-ink-secondary">
              Try loading this restaurant again.
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

function NotFoundState() {
  return (
    <section className="flex min-h-[420px] items-center justify-center rounded-card border border-border bg-surface p-8 text-center shadow-card">
      <div className="max-w-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border bg-bg text-ink-tertiary">
          <Utensils aria-hidden="true" size={28} />
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold text-ink-primary">
          Restaurant not found
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-secondary">
          It may have been deleted, or it does not belong to your account.
        </p>
        <Link
          className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-bg shadow-card transition hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent-soft"
          href="/restaurants"
        >
          Back to restaurants
        </Link>
      </div>
    </section>
  );
}

function getLocation(restaurant: Restaurant) {
  return (
    [restaurant.city, restaurant.state, restaurant.country]
      .filter(Boolean)
      .join(", ") || "Location not saved"
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

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { z } from "zod";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChefHat,
  ClipboardPenLine,
  History,
  ImagePlus,
  LoaderCircle,
  MapPin,
  Navigation,
  Pencil,
  Plus,
  PlusCircle,
  RefreshCw,
  ReceiptText,
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
  type RestaurantVisit,
} from "@/lib/api/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const restaurantSchema = z.object({
  bannerImage: z
    .custom<File | undefined>(
      (file) => {
        if (file === undefined) {
          return true;
        }

        return typeof File !== "undefined" && file instanceof File;
      },
      { message: "Choose a valid image file" },
    )
    .refine(
      (file) => !file || file.size <= MAX_FILE_SIZE,
      "Max file size is 5MB",
    )
    .refine(
      (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .png and .webp formats are supported.",
    ),
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
const visitSchema = z.object({
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
  totalAmountPaid: z
    .string()
    .trim()
    .optional()
    .refine((value) => {
      if (!value) {
        return true;
      }

      const amount = Number(value);
      return Number.isFinite(amount) && amount >= 0;
    }, "Amount must be 0 or greater"),
  visitedAt: z.string().optional(),
  visitNotes: z.string().trim().optional(),
});

const dishDraftSchema = z.object({
  name: z.string().trim().min(2, "Dish name is required"),
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
  wouldEatAgain: z.boolean().default(false),
});

type VisitFormValues = z.infer<typeof visitSchema>;
type DishDraftFormValues = z.infer<typeof dishDraftSchema>;
type DetailView = "loading" | "ready" | "error" | "not-found";
type VisitsView = "loading" | "ready" | "empty" | "error";
type MutationStatus = "idle" | "loading" | "success" | "error";

const quickRatings = [10, 9.5, 9, 8.5, 8, 7.5];

export default function RestaurantDetailPage({
  restaurantId,
}: {
  restaurantId: string;
}) {
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [visits, setVisits] = useState<RestaurantVisit[]>([]);
  const [view, setView] = useState<DetailView>("loading");
  const [visitsView, setVisitsView] = useState<VisitsView>("loading");
  const [isEditing, setIsEditing] = useState(false);
  const [mutationStatus, setMutationStatus] = useState<MutationStatus>("idle");
  const [visitStatus, setVisitStatus] = useState<MutationStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showVisitDialog, setShowVisitDialog] = useState(false);
  const [bannerInputVersion, setBannerInputVersion] = useState(0);

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
  const selectedBannerImage = watch("bannerImage");
  const isMutating = mutationStatus === "loading";
  const bannerImagePreviewUrl = useMemo(() => {
    if (!selectedBannerImage) {
      return null;
    }

    return URL.createObjectURL(selectedBannerImage);
  }, [selectedBannerImage]);

  useEffect(() => {
    return () => {
      if (bannerImagePreviewUrl) {
        URL.revokeObjectURL(bannerImagePreviewUrl);
      }
    };
  }, [bannerImagePreviewUrl]);

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

  async function loadVisits() {
    setVisitsView("loading");

    try {
      const response = await restaurantsApi.listVisits(restaurantId);
      setVisits(response.visits);
      setVisitsView(response.visits.length > 0 ? "ready" : "empty");
    } catch (error) {
      setVisitsView("error");
    }
  }

  useEffect(() => {
    void loadRestaurant();
    void loadVisits();
  }, [restaurantId]);

  async function createVisit(
    values: VisitFormValues,
    dishDrafts: DishDraftFormValues[],
  ) {
    setVisitStatus("loading");
    setStatusMessage("");

    try {
      const response = await restaurantsApi.createVisit(
        restaurantId,
        toCreateVisitPayload(values, dishDrafts),
      );

      setVisits((current) => [response.data, ...current]);
      setVisitsView("ready");
      setVisitStatus("success");
      setShowVisitDialog(false);
      setStatusMessage("Visit logged.");
      void loadVisits();
    } catch (error) {
      setVisitStatus("error");
      throw error;
    }
  }

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
      setBannerInputVersion((version) => version + 1);
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
      setBannerInputVersion((version) => version + 1);
    }

    clearErrors();
    setIsEditing(false);
    setMutationStatus("idle");
    setStatusMessage("");
  }

  function clearSelectedBannerImage() {
    setValue("bannerImage", undefined, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setBannerInputVersion((version) => version + 1);
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
                    currentBannerImageUrl={restaurant.bannerImageUrl ?? null}
                    bannerInputVersion={bannerInputVersion}
                    bannerPreviewUrl={bannerImagePreviewUrl}
                    isMutating={isMutating}
                    onCancel={cancelEdit}
                    onClearBannerImage={clearSelectedBannerImage}
                    onSubmit={onSubmit}
                    register={register}
                    selectedRating={selectedRating}
                    setValue={setValue}
                  />
                ) : (
                  <>
                    <ReadDetails restaurant={restaurant} />
                    <VisitHistorySection
                      visits={visits}
                      visitsView={visitsView}
                      onLogVisit={() => setShowVisitDialog(true)}
                      onRetry={loadVisits}
                    />
                  </>
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

        {showVisitDialog && restaurant ? (
          <LogVisitDialog
            isSaving={visitStatus === "loading"}
            restaurantName={restaurant.name}
            onCancel={() => {
              setShowVisitDialog(false);
              setVisitStatus("idle");
            }}
            onSubmit={createVisit}
          />
        ) : null}
      </main>
    </AppShell>
  );
}

const emptyFormValues: RestaurantFormValues = {
  address: "",
  bannerImage: undefined,
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
    bannerImage: undefined,
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
    bannerImage: values.bannerImage,
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

function toCreateVisitPayload(
  values: VisitFormValues,
  dishDrafts: DishDraftFormValues[],
) {
  const firstDish = dishDrafts[0];

  return {
    dishName: optionalString(firstDish?.name),
    dishNotes: optionalString(firstDish?.notes),
    dishRating: firstDish?.rating ? Number(firstDish.rating) : undefined,
    rating: values.rating ? Number(values.rating) : undefined,
    totalAmountPaid: values.totalAmountPaid
      ? Number(values.totalAmountPaid)
      : undefined,
    visitedAt: values.visitedAt || undefined,
    visitNotes: optionalString(values.visitNotes),
    wouldEatAgain: firstDish?.wouldEatAgain,
  };
}

function optionalString(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
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
          src={
            restaurant?.bannerImageUrl
              ? restaurant?.bannerImageUrl
              : "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"
          }
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

function VisitHistorySection({
  onLogVisit,
  onRetry,
  visits,
  visitsView,
}: {
  onLogVisit: () => void;
  onRetry: () => void;
  visits: RestaurantVisit[];
  visitsView: VisitsView;
}) {
  const reorderDishes = visits
    .flatMap((visit) => visit.dishes)
    .filter((dish) => dish.wouldEatAgain)
    .slice(0, 4);

  return (
    <section
      className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]"
      aria-labelledby="visit-history-title"
    >
      <div className="rounded-card border border-border bg-surface p-4 shadow-card sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase text-accent">
              <History aria-hidden="true" size={16} />
              Visit history
            </p>
            <h2
              className="mt-2 font-display text-2xl font-semibold text-ink-primary"
              id="visit-history-title"
            >
              Every visit becomes its own memory.
            </h2>
          </div>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-success/30 bg-success/10 px-4 text-sm font-bold text-success transition hover:bg-success/15 focus:outline-none focus:ring-4 focus:ring-accent-soft"
            type="button"
            onClick={onLogVisit}
          >
            <PlusCircle aria-hidden="true" size={17} />
            Log revisit
          </button>
        </div>

        {visitsView === "loading" ? <VisitsLoadingState /> : null}
        {visitsView === "error" ? <VisitsErrorState onRetry={onRetry} /> : null}
        {visitsView === "empty" ? (
          <VisitsEmptyState onLogVisit={onLogVisit} />
        ) : null}
        {visitsView === "ready" ? (
          <div className="mt-5 space-y-4">
            {visits.map((visit, index) => (
              <VisitCard
                index={visits.length - index}
                key={visit.id}
                visit={visit}
              />
            ))}
          </div>
        ) : null}
      </div>

      <aside className="space-y-4">
        <section className="rounded-card border border-success/25 bg-success/10 p-4 shadow-card">
          <p className="flex items-center gap-2 text-xs font-bold uppercase text-success">
            <ReceiptText aria-hidden="true" size={16} />
            Reorder notes
          </p>
          <div className="mt-4 space-y-3">
            {reorderDishes.length > 0 ? (
              reorderDishes.map((dish) => (
                <div
                  className="rounded-control border border-success/20 bg-bg/70 p-3"
                  key={dish.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-display text-lg font-semibold text-ink-primary">
                        {dish.name}
                      </p>
                      <p className="mt-1 text-xs font-bold text-success">
                        Would eat again
                      </p>
                    </div>
                    <RatingPill rating={dish.rating} />
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-control border border-success/20 bg-bg/70 p-3 text-sm leading-6 text-ink-secondary">
                Mark dishes as worth eating again when you log visits.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-card border border-border bg-surface p-4 shadow-card">
          <p className="text-xs font-bold uppercase text-accent">
            Next best action
          </p>
          <h3 className="mt-2 font-display text-xl font-semibold text-ink-primary">
            Go back for the prawns.
          </h3>
          <p className="mt-3 text-sm leading-6 text-ink-secondary">
            Your highest notes point to seafood, slow dinner plans, and dishes
            that held up across multiple visits.
          </p>
        </section>
      </aside>
    </section>
  );
}

function VisitCard({
  index,
  visit,
}: {
  index: number;
  visit: RestaurantVisit;
}) {
  return (
    <article className="relative rounded-card border border-border bg-bg p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-xs font-bold text-accent">
              Visit {index}
            </span>
            <span className="text-sm font-bold text-ink-primary">
              {formatDate(visit.visitedAt ?? visit.createdAt)}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-ink-secondary">
            {visit.visitNotes || "No notes saved for this visit yet."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <RatingPill rating={visit.rating} />
          {visit.totalAmountPaid !== undefined &&
          visit.totalAmountPaid !== null ? (
            <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-bold text-ink-secondary">
              {formatCurrency(visit.totalAmountPaid)}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {visit.dishes.length > 0 ? (
          visit.dishes.map((dish) => (
            <span
              className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-bold text-ink-secondary"
              key={dish.id}
            >
              {dish.name}
            </span>
          ))
        ) : (
          <span className="rounded-full border border-dashed border-border bg-surface px-3 py-1 text-xs font-bold text-ink-tertiary">
            Add dishes later
          </span>
        )}
      </div>
    </article>
  );
}

function VisitsLoadingState() {
  return (
    <div className="mt-5 space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          className="rounded-card border border-border bg-bg p-4"
          key={index}
        >
          <div className="h-7 w-28 rounded-full bg-surface" />
          <div className="mt-4 h-3 w-full rounded-full bg-surface" />
          <div className="mt-2 h-3 w-2/3 rounded-full bg-surface" />
        </div>
      ))}
    </div>
  );
}

function VisitsEmptyState({ onLogVisit }: { onLogVisit: () => void }) {
  return (
    <div className="mt-5 rounded-card border border-dashed border-border bg-bg p-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface text-ink-tertiary">
        <History aria-hidden="true" size={24} />
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold text-ink-primary">
        No visits logged yet
      </h3>
      <p className="mt-2 text-sm leading-6 text-ink-secondary">
        Start the timeline with your latest visit, rating, spend, and dishes.
      </p>
      <button
        className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-bold text-bg transition hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent-soft"
        type="button"
        onClick={onLogVisit}
      >
        <PlusCircle aria-hidden="true" size={17} />
        Log first visit
      </button>
    </div>
  );
}

function VisitsErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mt-5 rounded-card border border-error/30 bg-error/10 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-error"
            size={18}
          />
          <p className="text-sm font-semibold text-error">
            Could not load visits.
          </p>
        </div>
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-error/30 bg-surface px-4 text-sm font-bold text-error"
          type="button"
          onClick={onRetry}
        >
          <RefreshCw aria-hidden="true" size={16} />
          Retry
        </button>
      </div>
    </div>
  );
}

function EditForm({
  bannerInputVersion,
  bannerPreviewUrl,
  currentBannerImageUrl,
  errors,
  handleSubmit,
  isMutating,
  onCancel,
  onClearBannerImage,
  onSubmit,
  register,
  selectedRating,
  setValue,
}: {
  bannerInputVersion: number;
  bannerPreviewUrl: string | null;
  currentBannerImageUrl: string | null;
  errors: ReturnType<
    typeof useForm<RestaurantFormValues>
  >["formState"]["errors"];
  handleSubmit: ReturnType<
    typeof useForm<RestaurantFormValues>
  >["handleSubmit"];
  isMutating: boolean;
  onCancel: () => void;
  onClearBannerImage: () => void;
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
        <BannerImageField
          currentImageUrl={currentBannerImageUrl}
          error={errors.bannerImage?.message}
          inputVersion={bannerInputVersion}
          previewUrl={bannerPreviewUrl}
          onChange={(event) => {
            const file = event.target.files?.[0];
            setValue("bannerImage", file, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
          onClear={onClearBannerImage}
        />
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
            <LoaderCircle
              aria-hidden="true"
              className="animate-spin"
              size={18}
            />
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

function BannerImageField({
  currentImageUrl,
  error,
  inputVersion,
  onChange,
  onClear,
  previewUrl,
}: {
  currentImageUrl: string | null;
  error?: string;
  inputVersion: number;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  previewUrl: string | null;
}) {
  const errorId = "bannerImage-error";
  const visibleImageUrl = previewUrl ?? currentImageUrl;
  const hasSelectedImage = Boolean(previewUrl);

  return (
    <section className="lg:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-bold text-ink-primary" htmlFor="bannerImage">
          Banner image
        </label>
        {hasSelectedImage ? (
          <button
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-error/30 bg-error/10 px-3 text-xs font-bold text-error transition hover:border-error focus:outline-none focus:ring-4 focus:ring-error/20"
            type="button"
            onClick={onClear}
          >
            <Trash2 aria-hidden="true" size={14} />
            Remove selected image
          </button>
        ) : null}
      </div>

      <label
        className="mt-2 flex min-h-52 cursor-pointer overflow-hidden rounded-card border border-dashed border-accent/35 bg-surface-sunken transition hover:border-accent/70 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft"
        htmlFor="bannerImage"
      >
        {visibleImageUrl ? (
          <span className="relative block h-52 w-full">
            <img
              alt={
                hasSelectedImage
                  ? "Selected restaurant banner preview"
                  : "Current restaurant banner"
              }
              className="h-full w-full object-cover"
              src={visibleImageUrl}
            />
            <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-bg via-bg/75 to-transparent p-4">
              <span>
                <span className="block text-xs font-bold uppercase text-accent">
                  {hasSelectedImage ? "New banner selected" : "Current banner"}
                </span>
                <span className="mt-1 block text-sm font-semibold text-ink-primary">
                  Click to choose another image
                </span>
              </span>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent-soft text-accent">
                <ImagePlus aria-hidden="true" size={18} />
              </span>
            </span>
          </span>
        ) : (
          <span className="flex w-full flex-col items-center justify-center gap-3 px-4 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-accent/30 bg-accent-soft text-accent">
              <ImagePlus aria-hidden="true" size={22} />
            </span>
            <span>
              <span className="block text-sm font-bold text-ink-primary">
                Add a restaurant banner
              </span>
              <span className="mt-1 block text-xs font-semibold text-ink-tertiary">
                JPG, PNG, or WEBP up to 5MB
              </span>
            </span>
          </span>
        )}
        <input
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          className="sr-only"
          id="bannerImage"
          key={inputVersion}
          onChange={onChange}
          type="file"
        />
      </label>
      {error ? (
        <p className="mt-2 text-sm font-semibold text-error" id={errorId}>
          {error}
        </p>
      ) : null}
    </section>
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
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin"
                size={18}
              />
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

function LogVisitDialog({
  isSaving,
  onCancel,
  onSubmit,
  restaurantName,
}: {
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (
    values: VisitFormValues,
    dishDrafts: DishDraftFormValues[],
  ) => Promise<void>;
  restaurantName: string;
}) {
  const [dishDrafts, setDishDrafts] = useState<DishDraftFormValues[]>([]);
  const [dialogError, setDialogError] = useState("");

  const {
    clearErrors,
    formState: { errors },
    handleSubmit,
    register,
    setError,
    setValue,
    watch,
  } = useForm<VisitFormValues>({
    defaultValues: {
      rating: "",
      totalAmountPaid: "",
      visitedAt: new Date().toISOString().slice(0, 10),
      visitNotes: "",
    },
  });

  const {
    formState: { errors: dishErrors },
    getValues: getDishValues,
    register: registerDish,
    reset: resetDish,
    setError: setDishError,
  } = useForm<DishDraftFormValues>({
    defaultValues: {
      name: "",
      notes: "",
      rating: "",
      wouldEatAgain: true,
    },
  });

  const selectedRating = Number(watch("rating") || 0);

  function addDishDraft() {
    const parsed = dishDraftSchema.safeParse(getDishValues());

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];

        if (typeof field === "string") {
          setDishError(field as keyof DishDraftFormValues, {
            message: issue.message,
            type: "manual",
          });
        }
      });
      return;
    }

    setDishDrafts((current) => [...current, parsed.data]);
    resetDish({
      name: "",
      notes: "",
      rating: "",
      wouldEatAgain: true,
    });
  }

  async function submitVisit(values: VisitFormValues) {
    clearErrors();
    setDialogError("");

    const parsed = visitSchema.safeParse(values);

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];

        if (typeof field === "string") {
          setError(field as keyof VisitFormValues, {
            message: issue.message,
            type: "manual",
          });
        }
      });
      return;
    }

    try {
      await onSubmit(parsed.data, dishDrafts);
    } catch (error) {
      setDialogError(
        error instanceof ApiError ? error.message : "Unable to log visit.",
      );
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-bg/75 p-4 backdrop-blur sm:items-center">
      <section
        aria-modal="true"
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-card border border-border bg-surface shadow-raised"
        role="dialog"
      >
        <div className="relative overflow-hidden border-b border-border p-5 sm:p-6">
          <img
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-20"
            src="https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&w=1200&q=80"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/90 to-bg/40" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase text-success">
                Log revisit
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold leading-tight text-ink-primary">
                {restaurantName}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-ink-secondary">
                Save the date, rating, spend, and dishes while the meal is
                fresh.
              </p>
            </div>
            <button
              aria-label="Close log visit dialog"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-bg/80 text-ink-primary transition hover:border-accent/50 hover:text-accent focus:outline-none focus:ring-4 focus:ring-accent-soft"
              type="button"
              onClick={onCancel}
            >
              <X aria-hidden="true" size={18} />
            </button>
          </div>
        </div>

        <form
          className="p-5 sm:p-6"
          noValidate
          onSubmit={handleSubmit(submitVisit)}
        >
          {dialogError ? (
            <div
              className="mb-5 flex items-start gap-3 rounded-control border border-error/30 bg-error/10 p-4 text-sm font-semibold text-error"
              role="alert"
            >
              <AlertCircle aria-hidden="true" className="mt-0.5" size={18} />
              {dialogError}
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <VisitRatingField
              error={errors.rating?.message}
              register={register("rating")}
              selectedRating={selectedRating}
              setValue={setValue}
            />
            <VisitField
              error={errors.visitedAt?.message}
              icon={CalendarDays}
              id="visitedAt"
              label="Visited date"
              register={register("visitedAt")}
              type="date"
            />
            <VisitField
              error={errors.totalAmountPaid?.message}
              icon={ReceiptText}
              id="totalAmountPaid"
              label="Total spend"
              placeholder="3200"
              register={register("totalAmountPaid")}
              type="number"
            />
            <div className="lg:row-span-2">
              <label
                className="text-sm font-bold text-ink-primary"
                htmlFor="visitNotes"
              >
                Visit notes
              </label>
              <div className="mt-2 rounded-control border border-border bg-surface-sunken px-4 transition focus-within:border-accent focus-within:bg-surface focus-within:ring-4 focus-within:ring-accent-soft">
                <textarea
                  className="min-h-[132px] w-full resize-y border-0 bg-transparent py-3 text-base leading-6 text-ink-primary outline-none placeholder:text-ink-tertiary"
                  id="visitNotes"
                  placeholder="What should future you remember?"
                  {...register("visitNotes")}
                />
              </div>
            </div>
          </div>

          <section className="mt-6 rounded-card border border-border bg-bg p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-xs font-bold uppercase text-accent">
                  <ReceiptText aria-hidden="true" size={16} />
                  Dishes
                </p>
                <h3 className="mt-1 font-display text-xl font-semibold text-ink-primary">
                  Add what you ate
                </h3>
              </div>
              {dishDrafts.length > 0 ? (
                <span className="w-fit rounded-full border border-success/25 bg-success/10 px-3 py-1 text-xs font-bold text-success">
                  {dishDrafts.length} staged
                </span>
              ) : null}
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_110px]">
              <VisitField
                error={dishErrors.name?.message}
                icon={Utensils}
                id="name"
                label="Dish name"
                placeholder="Butter Garlic Prawns"
                register={registerDish("name")}
              />
              <VisitField
                error={dishErrors.rating?.message}
                icon={Star}
                id="rating"
                label="Rating"
                placeholder="9.5"
                register={registerDish("rating")}
                type="number"
              />
              <div className="lg:col-span-2">
                <label
                  className="text-sm font-bold text-ink-primary"
                  htmlFor="dishNotes"
                >
                  Dish notes
                </label>
                <div className="mt-2 rounded-control border border-border bg-surface-sunken px-4 transition focus-within:border-accent focus-within:bg-surface focus-within:ring-4 focus-within:ring-accent-soft">
                  <input
                    className="min-w-0 flex-1 border-0 bg-transparent py-3 text-base text-ink-primary outline-none placeholder:text-ink-tertiary"
                    id="dishNotes"
                    placeholder="Would reorder, spicy, share next time..."
                    type="text"
                    {...registerDish("notes")}
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex min-h-11 items-center gap-3 rounded-full border border-success/25 bg-success/10 px-4 text-sm font-bold text-success">
                <input
                  className="h-4 w-4 accent-current"
                  type="checkbox"
                  {...registerDish("wouldEatAgain")}
                />
                Would eat again
              </label>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-accent/40 bg-accent-soft px-4 text-sm font-bold text-accent transition hover:border-accent focus:outline-none focus:ring-4 focus:ring-accent-soft"
                type="button"
                onClick={addDishDraft}
              >
                <Plus aria-hidden="true" size={17} />
                Add dish
              </button>
            </div>

            {dishDrafts.length > 0 ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {dishDrafts.map((dish, index) => (
                  <div
                    className="rounded-control border border-border bg-surface p-3"
                    key={`${dish.name}-${index}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-display text-lg font-semibold text-ink-primary">
                          {dish.name}
                        </p>
                        <p className="mt-1 truncate text-xs font-bold text-success">
                          {dish.wouldEatAgain
                            ? "Would eat again"
                            : "One-time order"}
                        </p>
                      </div>
                      <RatingPill
                        rating={dish.rating ? Number(dish.rating) : null}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_1.4fr]">
            <button
              className="min-h-12 rounded-control border border-border bg-bg px-4 text-sm font-bold text-ink-primary transition hover:border-accent/50 focus:outline-none focus:ring-4 focus:ring-accent-soft"
              disabled={isSaving}
              type="button"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              className="flex min-h-12 items-center justify-center gap-2 rounded-control bg-accent px-5 py-3 text-base font-bold text-bg shadow-card transition hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent-soft disabled:cursor-wait disabled:opacity-70"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? (
                <>
                  <LoaderCircle
                    aria-hidden="true"
                    className="animate-spin"
                    size={18}
                  />
                  Saving visit
                </>
              ) : (
                <>
                  <Save aria-hidden="true" size={18} />
                  Save visit
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function VisitRatingField({
  error,
  register,
  selectedRating,
  setValue,
}: {
  error?: string;
  register: UseFormRegisterReturn;
  selectedRating: number;
  setValue: ReturnType<typeof useForm<VisitFormValues>>["setValue"];
}) {
  return (
    <div>
      <label
        className="text-sm font-bold text-ink-primary"
        htmlFor="visitRating"
      >
        Visit rating
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
            id="visitRating"
            inputMode="decimal"
            max="10"
            min="0"
            placeholder="8.5"
            step="0.5"
            type="number"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "visit-rating-error" : undefined}
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
        <p
          className="mt-2 text-sm font-semibold text-error"
          id="visit-rating-error"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function VisitField({
  error,
  icon: Icon,
  id,
  label,
  placeholder,
  register,
  type = "text",
}: {
  error?: string;
  icon: LucideIcon;
  id: string;
  label: string;
  placeholder?: string;
  register: UseFormRegisterReturn;
  type?: string;
}) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label className="text-sm font-bold text-ink-primary" htmlFor={id}>
        {label}
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
        <CheckCircle2
          aria-hidden="true"
          className="mt-0.5 shrink-0"
          size={18}
        />
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

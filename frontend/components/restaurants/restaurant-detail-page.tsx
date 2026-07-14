"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { z } from "zod";
import {
  AlertCircle,
  ArrowLeft,
  Bookmark,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ChefHat,
  ClipboardPenLine,
  History,
  ImagePlus,
  LoaderCircle,
  MapPin,
  MoreVertical,
  Navigation,
  Pencil,
  Plus,
  PlusCircle,
  RefreshCw,
  ReceiptText,
  Save,
  Share2,
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
  id: z.string().trim().optional(),
  images: z
    .array(
      z.custom<File>(
        (file) => typeof File !== "undefined" && file instanceof File,
        { message: "Choose valid image files" },
      ),
    )
    .default([])
    .refine(
      (files) => files.every((file) => file.size <= MAX_FILE_SIZE),
      "Each image must be 5MB or smaller",
    )
    .refine(
      (files) =>
        files.every((file) => ACCEPTED_IMAGE_TYPES.includes(file.type)),
      "Only .jpg, .png and .webp formats are supported.",
    ),
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
const dishImageUrls = [
  "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1562967916-eb82221dfb36?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=900&q=80",
];

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
      <main className="mx-auto flex w-full max-w-full flex-col overflow-x-hidden px-0 py-0 sm:px-6 sm:py-6 lg:max-w-none lg:px-8 lg:py-8 xl:px-10">
        {view === "loading" ? <LoadingState /> : null}
        {view === "error" ? <ErrorState onRetry={loadRestaurant} /> : null}
        {view === "not-found" ? <NotFoundState /> : null}
        {view === "ready" && restaurant ? (
          <>
            {isEditing ? (
              <section className="mx-auto min-h-svh w-full max-w-[760px] overflow-hidden border-border bg-[radial-gradient(circle_at_10%_0%,rgba(209,154,82,0.08),transparent_24rem),linear-gradient(180deg,#12100e_0%,#0d0d0c_100%)] shadow-raised sm:min-h-0 sm:rounded-card sm:border">
                <HeroCard restaurant={restaurant} />
                <div className="-mx-1">
                  <div className="px-5 py-6 sm:px-8 sm:py-8">
                    <StatusMessage
                      message={statusMessage}
                      status={mutationStatus}
                    />
                  </div>
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
                </div>
              </section>
            ) : (
              <>
                <section className="mx-auto min-h-svh w-full max-w-[760px] overflow-hidden border-border bg-[radial-gradient(circle_at_10%_0%,rgba(209,154,82,0.08),transparent_24rem),linear-gradient(180deg,#12100e_0%,#0d0d0c_100%)] shadow-raised sm:min-h-0 sm:rounded-card sm:border lg:hidden">
                  <HeroCard restaurant={restaurant} />

                  <div className="min-w-0 space-y-8 px-5 py-6 sm:px-8 sm:py-8">
                    <StatusMessage
                      message={statusMessage}
                      status={mutationStatus}
                    />
                    <ReadDetails
                      restaurant={restaurant}
                      onLogVisit={() => setShowVisitDialog(true)}
                    />
                    <VisitHistorySection
                      visits={visits}
                      visitsView={visitsView}
                      onLogVisit={() => setShowVisitDialog(true)}
                      onRetry={loadVisits}
                    />
                    <ActionPanel
                      isEditing={isEditing}
                      isMutating={isMutating}
                      onDelete={() => setShowDeleteConfirm(true)}
                      onEdit={() => setIsEditing(true)}
                    />
                    <MetaPanel restaurant={restaurant} />
                  </div>
                </section>

                <DesktopRestaurantDetail
                  isEditing={isEditing}
                  isMutating={isMutating}
                  restaurant={restaurant}
                  statusMessage={statusMessage}
                  mutationStatus={mutationStatus}
                  visits={visits}
                  visitsView={visitsView}
                  onDelete={() => setShowDeleteConfirm(true)}
                  onEdit={() => setIsEditing(true)}
                  onLogVisit={() => setShowVisitDialog(true)}
                  onRetryVisits={loadVisits}
                />
              </>
            )}
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
  const visitFormData = new FormData();
  const appendValue = (
    key: string,
    value: boolean | number | string | undefined,
  ) => {
    if (value !== undefined && value !== "") {
      visitFormData.append(key, String(value));
    }
  };

  appendValue("dishName", optionalString(firstDish?.name));
  appendValue("dishNotes", optionalString(firstDish?.notes));
  appendValue(
    "dishRating",
    firstDish?.rating ? Number(firstDish.rating) : undefined,
  );
  appendValue("rating", values.rating ? Number(values.rating) : undefined);
  appendValue(
    "totalAmountPaid",
    values.totalAmountPaid ? Number(values.totalAmountPaid) : undefined,
  );
  appendValue("visitedAt", values.visitedAt || undefined);
  appendValue("visitNotes", optionalString(values.visitNotes));
  appendValue("wouldEatAgain", firstDish?.wouldEatAgain);
  visitFormData.append(
    "dishList",
    JSON.stringify(
      dishDrafts.map(({ images, ...dish }) => ({
        ...dish,
        imageCount: images.length,
      })),
    ),
  );

  dishDrafts.forEach((dish, dishIndex) => {
    for (const image of dish.images) {
      visitFormData.append(`dishImages^${dish?.id}`, image);
    }
  });

  return visitFormData;
}

function optionalString(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function nullableString(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function getBestDish(visits: RestaurantVisit[]) {
  const allDishes = visits.flatMap((visit) => visit.dishes);
  return allDishes.find((dish) => dish.wouldEatAgain) ?? allDishes[0];
}

function getFeaturedVisitDish(visit: RestaurantVisit) {
  return (
    visit.dishes.find((dish) => dish.wouldEatAgain) ??
    [...visit.dishes].sort((first, second) => {
      return (second.rating ?? 0) - (first.rating ?? 0);
    })[0]
  );
}

function getDishImageUrl(dishName: string, index = 0) {
  const charTotal = dishName
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), index);

  return dishImageUrls[charTotal % dishImageUrls.length];
}

function getDishRatingText(rating?: number | null) {
  return rating === undefined || rating === null ? "Not rated" : `${rating}/10`;
}

function getDishImages(dish: RestaurantVisit["dishes"][number], index = 0) {
  const savedImages =
    dish.dishImages
      ?.map((image) => image.dishImageUrl)
      .filter((url): url is string => Boolean(url)) ?? [];

  return savedImages.length > 0
    ? savedImages
    : [getDishImageUrl(dish.name, index)];
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
    <header className="relative min-h-[260px] overflow-hidden border-b border-border/80 bg-bg sm:min-h-[300px]">
      <img
        alt="Warm restaurant table"
        className="absolute inset-0 h-full w-full object-cover opacity-65"
        src={
          restaurant?.bannerImageUrl
            ? restaurant?.bannerImageUrl
            : "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"
        }
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,15,13,0.52)_0%,rgba(16,15,13,0.16)_38%,rgba(16,15,13,0.86)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(209,154,82,0.18),transparent_36%),linear-gradient(90deg,rgba(16,15,13,0.36),transparent_44%,rgba(16,15,13,0.18))]" />

      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-4 sm:px-6 sm:pt-5">
        <Link
          aria-label="Back to restaurants"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-bg/45 text-ink-primary shadow-card backdrop-blur transition hover:border-accent/45 hover:text-accent focus:outline-none focus:ring-4 focus:ring-accent-soft"
          href="/restaurants"
        >
          <ArrowLeft aria-hidden="true" size={20} />
        </Link>

        <div className="flex items-center gap-2">
          <button
            aria-label="Save restaurant"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-bg/45 text-ink-primary shadow-card backdrop-blur transition hover:border-accent/45 hover:text-accent focus:outline-none focus:ring-4 focus:ring-accent-soft"
            type="button"
          >
            <Bookmark aria-hidden="true" size={18} />
          </button>
          <button
            aria-label="Restaurant options"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-bg/45 text-ink-primary shadow-card backdrop-blur transition hover:border-accent/45 hover:text-accent focus:outline-none focus:ring-4 focus:ring-accent-soft"
            type="button"
          >
            <MoreVertical aria-hidden="true" size={19} />
          </button>
        </div>
      </div>

      <div className="relative z-10 flex min-h-[260px] flex-col justify-end px-5 pb-7 sm:min-h-[300px] sm:px-7 sm:pb-8">
        <h1 className="break-words font-display text-[34px] font-bold leading-[0.95] tracking-[-0.025em] text-ink-primary sm:text-[42px]">
          {restaurant.name}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] font-semibold text-ink-secondary">
          <InfoPill icon={ChefHat} label={cuisine} />
          <span className="h-1 w-1 rounded-full bg-accent/80" />
          <InfoPill icon={MapPin} label={location} />
          <span className="h-1 w-1 rounded-full bg-accent/80" />
          <HeroRatingMeta rating={restaurant.rating} />
        </div>
      </div>
    </header>
  );
}

function DesktopRestaurantDetail({
  isEditing,
  isMutating,
  mutationStatus,
  onDelete,
  onEdit,
  onLogVisit,
  onRetryVisits,
  restaurant,
  statusMessage,
  visits,
  visitsView,
}: {
  isEditing: boolean;
  isMutating: boolean;
  mutationStatus: MutationStatus;
  onDelete: () => void;
  onEdit: () => void;
  onLogVisit: () => void;
  onRetryVisits: () => void;
  restaurant: Restaurant;
  statusMessage: string;
  visits: RestaurantVisit[];
  visitsView: VisitsView;
}) {
  const bestDish = getBestDish(visits);

  return (
    <section className="mx-auto hidden w-full max-w-[1180px] lg:block">
      <DesktopTopBar />
      <StatusMessage message={statusMessage} status={mutationStatus} />
      <DesktopHero restaurant={restaurant} onLogVisit={onLogVisit} />
      <DesktopInfoStrip restaurant={restaurant} />

      <div className="mt-5 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.95fr)]">
        <DesktopVisitPanel
          visits={visits}
          visitsView={visitsView}
          onLogVisit={onLogVisit}
          onRetry={onRetryVisits}
        />

        <aside className="min-w-0 space-y-4">
          <DesktopNextBestAction dish={bestDish} />
          <ActionPanel
            desktop
            isEditing={isEditing}
            isMutating={isMutating}
            onDelete={onDelete}
            onEdit={onEdit}
          />
          <MetaPanel desktop restaurant={restaurant} />
        </aside>
      </div>
    </section>
  );
}

function DesktopTopBar() {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <Link
        className="inline-flex min-h-11 items-center gap-3 rounded-full px-2 text-sm font-semibold text-ink-secondary transition hover:text-ink-primary focus:outline-none focus:ring-4 focus:ring-accent-soft"
        href="/restaurants"
      >
        <ArrowLeft aria-hidden="true" size={18} />
        Back to restaurants
      </Link>

      <div className="flex items-center gap-2">
        <button
          className="inline-flex h-[52px] items-center justify-center gap-3 rounded-[16px] border border-border bg-bg/70 px-4 font-body text-[15px] font-medium leading-none text-ink-primary transition hover:border-accent/45 focus:outline-none focus:ring-4 focus:ring-accent-soft"
          type="button"
        >
          <Share2 aria-hidden="true" size={18} />
          Share
        </button>
        <button
          aria-label="More restaurant options"
          className="inline-flex h-11 w-11 items-center justify-center rounded-control border border-border bg-bg/70 text-ink-secondary transition hover:border-accent/45 hover:text-ink-primary focus:outline-none focus:ring-4 focus:ring-accent-soft"
          type="button"
        >
          <MoreVertical aria-hidden="true" size={18} />
        </button>
      </div>
    </div>
  );
}

function DesktopHero({
  onLogVisit,
  restaurant,
}: {
  onLogVisit: () => void;
  restaurant: Restaurant;
}) {
  const location = getLocation(restaurant);
  const cuisine = restaurant.cuisine || "Cuisine not set";

  return (
    <section className="grid min-h-[280px] overflow-hidden rounded-card border border-border bg-[linear-gradient(135deg,#1a1714,#100f0d)] shadow-card lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.96fr)]">
      <div className="relative min-h-[280px] overflow-hidden">
        <img
          alt="Warm restaurant table"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          src={
            restaurant.bannerImageUrl ??
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"
          }
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-bg/20 to-bg/85" />
        <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-bg to-transparent" />
      </div>

      <div className="flex min-w-0 flex-col justify-center px-8 py-8">
        <span className="w-fit rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-ink-primary">
          {cuisine}
        </span>
        <h1 className="mt-5 break-words font-display text-[44px] font-bold leading-[0.95] tracking-[-0.025em] text-ink-primary">
          {restaurant.name}
        </h1>
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-ink-secondary">
          <span className="inline-flex items-center gap-2">
            <MapPin aria-hidden="true" className="text-accent" size={16} />
            {location}
          </span>
          <span className="h-5 w-px bg-border" />
          <span>{restaurant.city || "City not saved"}</span>
        </div>
        <p className="mt-5 max-w-xl text-sm leading-6 text-ink-secondary">
          {restaurant.notes || "No notes yet."}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <RatingPill rating={restaurant.rating} />
          <button
            className="inline-flex h-[52px] items-center justify-center gap-3 rounded-[16px] border border-border bg-bg/80 px-5 font-body text-[15px] font-medium leading-none text-ink-primary transition hover:border-accent/45 focus:outline-none focus:ring-4 focus:ring-accent-soft"
            type="button"
          >
            <Star aria-hidden="true" size={18} />
            Add to wishlist
          </button>
          <button
            className="inline-flex h-[52px] items-center justify-center gap-3 rounded-[16px] bg-accent px-7 font-body text-[15px] font-semibold leading-none text-[#0F0D0A] shadow-card transition hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent-soft"
            type="button"
            onClick={onLogVisit}
          >
            <PlusCircle aria-hidden="true" size={18} />
            Log visit
          </button>
        </div>
      </div>
    </section>
  );
}

function DesktopInfoStrip({ restaurant }: { restaurant: Restaurant }) {
  return (
    <section className="mt-5 grid overflow-hidden rounded-card border border-border bg-surface/55 shadow-card md:grid-cols-2 xl:grid-cols-4">
      <DesktopInfoItem
        icon={CalendarDays}
        label="Visited"
        value={formatDate(restaurant.visitedAt ?? restaurant.createdAt)}
      />
      <DesktopInfoItem
        icon={ChefHat}
        label="Cuisine"
        value={restaurant.cuisine || "Not saved"}
      />
      <DesktopInfoItem
        icon={MapPin}
        label="Address"
        value={restaurant.address || getLocation(restaurant)}
      />
      <DesktopInfoItem
        icon={Navigation}
        label="City"
        value={restaurant.city || "Not saved"}
      />
    </section>
  );
}

function DesktopInfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-4 border-b border-border/70 px-8 py-5 last:border-b-0 md:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:last:border-r-0">
      <Icon aria-hidden="true" className="shrink-0 text-accent" size={20} />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-accent">{label}</p>
        <p className="mt-1 truncate text-sm font-bold text-ink-primary">
          {value}
        </p>
      </div>
    </div>
  );
}

function DesktopVisitPanel({
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
  return (
    <section
      className="min-w-0 rounded-card border border-border bg-surface/55 p-5 shadow-card"
      aria-labelledby="desktop-visit-history-title"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className="flex items-center gap-2 text-sm font-bold text-ink-primary"
            id="desktop-visit-history-title"
          >
            <History aria-hidden="true" className="text-accent" size={19} />
            Visit history
          </p>
          <p className="mt-2 text-sm text-ink-secondary">
            Every visit becomes its own memory.
          </p>
        </div>
        <button
          className="font-body text-[15px] font-medium leading-none text-accent transition hover:text-accent-hover"
          type="button"
          onClick={onLogVisit}
        >
          View all visits
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
            <DesktopVisitCard
              index={visits.length - index}
              key={visit.id}
              visit={visit}
            />
          ))}
        </div>
      ) : null}

      <DesktopReorderNotes visits={visits} />
    </section>
  );
}

function DesktopVisitCard({
  index,
  visit,
}: {
  index: number;
  visit: RestaurantVisit;
}) {
  const featuredDish = getFeaturedVisitDish(visit);
  const supportingDishes = visit.dishes
    .filter((dish) => dish.id !== featuredDish?.id)
    .slice(0, 2);
  const hiddenDishCount = Math.max(
    visit.dishes.length - 1 - supportingDishes.length,
    0,
  );

  return (
    <article className="rounded-card border border-border bg-bg/35 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent">
              Visit {index}
            </span>
            <p className="text-sm font-bold text-ink-primary">
              {formatDate(visit.visitedAt ?? visit.createdAt)}
            </p>
          </div>
          <p className="mt-3 text-sm leading-6 text-ink-secondary">
            {visit.visitNotes || "No notes saved for this visit yet."}
          </p>
        </div>
        <MoreVertical
          aria-hidden="true"
          className="shrink-0 text-ink-tertiary"
          size={17}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <RatingPill rating={visit.rating} />
        {visit.totalAmountPaid !== undefined &&
        visit.totalAmountPaid !== null ? (
          <span className="inline-flex min-h-8 items-center rounded-full border border-border/80 bg-surface px-3 text-xs font-bold text-ink-secondary">
            {formatCurrency(visit.totalAmountPaid)}
          </span>
        ) : null}
      </div>
      <VisitDishGallery
        allDishes={visit.dishes}
        featuredDish={featuredDish}
        hiddenDishCount={hiddenDishCount}
        supportingDishes={supportingDishes}
      />
    </article>
  );
}

function DesktopReorderNotes({ visits }: { visits: RestaurantVisit[] }) {
  const reorderDishes = visits
    .flatMap((visit) => visit.dishes)
    .filter((dish) => dish.wouldEatAgain);

  return (
    <section className="mt-8 rounded-card border border-success/25 bg-success/10 p-5">
      <p className="flex items-center gap-2 text-sm font-bold text-success">
        <ReceiptText aria-hidden="true" size={18} />
        Reorder notes
      </p>
      <p className="mt-5 text-sm leading-6 text-ink-secondary">
        {reorderDishes.length > 0
          ? reorderDishes.map((dish) => dish.name).join(", ")
          : "Mark dishes as worth eating again when you log visits."}
      </p>
    </section>
  );
}

function DesktopNextBestAction({
  dish,
}: {
  dish?: RestaurantVisit["dishes"][number];
}) {
  const title = dish ? `Go back for ${dish.name}.` : "Log one great dish next.";

  return (
    <section className="rounded-card border border-border bg-surface/55 p-5 shadow-card">
      <p className="flex items-center gap-2 text-sm font-bold text-ink-primary">
        <ChefHat aria-hidden="true" className="text-accent" size={18} />
        Next best action
      </p>
      <h2 className="mt-2 font-display text-[26px] font-bold leading-[1.02] tracking-[-0.025em] text-ink-primary">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-ink-secondary">
        Your highest notes point to saved dishes and visits that are worth
        repeating.
      </p>
    </section>
  );
}

function ReadDetails({
  onLogVisit,
  restaurant,
}: {
  onLogVisit: () => void;
  restaurant: Restaurant;
}) {
  return (
    <section className="border-b border-[rgba(64,55,45,0.65)] pb-8">
      <SectionEyebrow>Info</SectionEyebrow>
      <div className="mt-5 divide-y divide-[rgba(64,55,45,0.65)]">
        <DetailRow
          icon={CalendarDays}
          label="Visited"
          value={formatDate(restaurant.visitedAt ?? restaurant.createdAt)}
        />
        <DetailRow
          icon={Utensils}
          label="Cuisine"
          value={restaurant.cuisine || "Not saved"}
        />
        <DetailRow
          icon={MapPin}
          label="Address"
          value={restaurant.address || getLocation(restaurant)}
        />
        <DetailRow
          icon={Navigation}
          label="City"
          value={restaurant.city || "Not saved"}
        />
        <DetailRow
          icon={ClipboardPenLine}
          label="Notes"
          value={restaurant.notes || "No notes yet"}
        />
      </div>
      <button
        className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-[16px] border border-[rgba(103,163,107,0.45)] bg-[rgba(76,140,83,0.10)] px-4 font-body text-base font-semibold leading-none text-success transition hover:bg-[rgba(76,140,83,0.14)] focus:outline-none focus:ring-4 focus:ring-success/15"
        type="button"
        onClick={onLogVisit}
      >
        <PlusCircle aria-hidden="true" size={20} />
        Log revisit
      </button>
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
  const bestDish = getBestDish(visits);

  return (
    <section
      className="border-b border-[rgba(64,55,45,0.65)] pb-8"
      aria-labelledby="visit-history-title"
    >
      <div className="flex items-center justify-between gap-4">
        <SectionEyebrow id="visit-history-title">Visit history</SectionEyebrow>
      </div>

      {visitsView === "loading" ? <VisitsLoadingState /> : null}
      {visitsView === "error" ? <VisitsErrorState onRetry={onRetry} /> : null}
      {visitsView === "empty" ? (
        <VisitsEmptyState onLogVisit={onLogVisit} />
      ) : null}
      {visitsView === "ready" ? (
        <div className="mt-5 divide-y divide-[rgba(64,55,45,0.65)]">
          {visits.map((visit, index) => (
            <VisitCard
              isLast={index === visits.length - 1}
              key={visit.id}
              visit={visit}
            />
          ))}
        </div>
      ) : null}

      <NextBestAction dish={bestDish} />
    </section>
  );
}

function VisitCard({
  isLast,
  visit,
}: {
  isLast: boolean;
  visit: RestaurantVisit;
}) {
  const featuredDish = getFeaturedVisitDish(visit);
  const supportingDishes = visit.dishes
    .filter((dish) => dish.id !== featuredDish?.id)
    .slice(0, 2);
  const hiddenDishCount = Math.max(
    visit.dishes.length - 1 - supportingDishes.length,
    0,
  );

  return (
    <article className="relative grid min-w-0 grid-cols-[20px_minmax(0,1fr)] gap-3 py-5 sm:grid-cols-[28px_minmax(0,1fr)] sm:gap-4">
      <div className="relative flex justify-center">
        <span className="mt-1 h-3 w-3 rounded-full bg-accent shadow-[0_0_0_3px_rgba(209,154,82,0.14)] sm:h-4 sm:w-4" />
        {!isLast ? (
          <span className="absolute bottom-0 top-7 w-px bg-accent/35" />
        ) : null}
      </div>
      <div className="min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="break-words font-display text-[23px] font-bold leading-none tracking-[-0.015em] text-ink-primary">
              {formatDate(visit.visitedAt ?? visit.createdAt)}
            </p>
            <p className="mt-2 text-sm leading-6 text-ink-secondary">
              {visit.visitNotes || "No notes saved for this visit yet."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <RatingPill rating={visit.rating} />
            {visit.totalAmountPaid !== undefined &&
            visit.totalAmountPaid !== null ? (
              <span className="inline-flex min-h-8 items-center rounded-full border border-border/80 bg-surface px-3 text-xs font-bold text-ink-secondary">
                {formatCurrency(visit.totalAmountPaid)}
              </span>
            ) : null}
          </div>
        </div>

        <VisitDishGallery
          allDishes={visit.dishes}
          featuredDish={featuredDish}
          hiddenDishCount={hiddenDishCount}
          supportingDishes={supportingDishes}
        />
      </div>
    </article>
  );
}

function VisitDishGallery({
  allDishes,
  featuredDish,
  hiddenDishCount,
  supportingDishes,
}: {
  allDishes: RestaurantVisit["dishes"];
  featuredDish?: RestaurantVisit["dishes"][number];
  hiddenDishCount: number;
  supportingDishes: RestaurantVisit["dishes"];
}) {
  const [showAllDishes, setShowAllDishes] = useState(false);
  const [galleryDish, setGalleryDish] = useState<
    RestaurantVisit["dishes"][number] | null
  >(null);

  if (!featuredDish) {
    return (
      <div className="mt-4 rounded-[16px] border border-dashed border-border/80 bg-surface/55 p-4">
        <p className="text-sm font-semibold text-ink-primary">
          No dishes saved
        </p>
        <p className="mt-1 text-xs leading-5 text-ink-tertiary">
          Add dishes when you log visits so this memory has photos and reorder
          notes.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <FeaturedDishCard
        dish={featuredDish}
        onOpenGallery={() => setGalleryDish(featuredDish)}
      />
      {supportingDishes.length > 0 || hiddenDishCount > 0 ? (
        <div className="mt-3">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-ink-tertiary">
            Also had
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-[repeat(3,minmax(0,1fr))]">
            {supportingDishes.map((dish, index) => (
              <SupportingDishCard
                dish={dish}
                index={index}
                key={dish.id}
                onOpenGallery={() => setGalleryDish(dish)}
              />
            ))}
            {hiddenDishCount > 0 ? (
              <button
                className="flex min-h-[102px] flex-col items-center justify-center rounded-[14px] border border-border bg-surface/70 px-3 text-center font-body text-ink-primary transition hover:border-accent/40 focus:outline-none focus:ring-4 focus:ring-accent-soft"
                type="button"
                onClick={() => setShowAllDishes(true)}
              >
                <span className="text-xl font-semibold leading-none">
                  +{hiddenDishCount}
                </span>
                <span className="mt-2 text-xs leading-4 text-ink-tertiary">
                  more dish{hiddenDishCount > 1 ? "es" : ""}
                </span>
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      {showAllDishes ? (
        <AllDishesSheet
          dishes={allDishes}
          onClose={() => setShowAllDishes(false)}
        />
      ) : null}
      {galleryDish ? (
        <DishImageGalleryModal
          dish={galleryDish}
          onClose={() => setGalleryDish(null)}
        />
      ) : null}
    </div>
  );
}

function FeaturedDishCard({
  dish,
  onOpenGallery,
}: {
  dish: RestaurantVisit["dishes"][number];
  onOpenGallery: () => void;
}) {
  const dishImages = getDishImages(dish);

  return (
    <button
      aria-label={`Open ${dish.name} photo gallery`}
      className="group relative block min-h-[200px] w-full overflow-hidden rounded-[16px] border border-border bg-surface text-left shadow-card transition hover:border-accent/40 focus:outline-none focus:ring-4 focus:ring-accent-soft"
      type="button"
      onClick={onOpenGallery}
    >
      <img
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
        src={dishImages[0]}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,15,13,0.05)_0%,rgba(16,15,13,0.25)_48%,rgba(16,15,13,0.9)_100%)]" />
      <div className="relative flex min-h-[200px] flex-col justify-between p-4">
        <span className="w-fit rounded-[8px] bg-accent px-3 py-1 font-body text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#0F0D0A]">
          {dish.wouldEatAgain ? "Favorite" : "Best of visit"}
        </span>
        <div>
          <h4 className="break-words font-display text-[26px] font-bold leading-none tracking-[-0.02em] text-ink-primary">
            {dish.name}
          </h4>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-ink-secondary">
            <span className="inline-flex items-center gap-1.5 text-accent">
              <Star aria-hidden="true" className="fill-current" size={14} />
              {getDishRatingText(dish.rating)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ImagePlus aria-hidden="true" size={14} />
              {dishImages.length}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function SupportingDishCard({
  dish,
  index,
  onOpenGallery,
}: {
  dish: RestaurantVisit["dishes"][number];
  index: number;
  onOpenGallery: () => void;
}) {
  const dishImages = getDishImages(dish, index + 3);

  return (
    <button
      aria-label={`Open ${dish.name} photo gallery`}
      className="group relative min-h-[102px] overflow-hidden rounded-[14px] border border-border bg-surface text-left transition hover:border-accent/40 focus:outline-none focus:ring-4 focus:ring-accent-soft"
      type="button"
      onClick={onOpenGallery}
    >
      <img
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
        src={dishImages[0]}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,15,13,0.08)_0%,rgba(16,15,13,0.78)_100%)]" />
      <div className="relative flex min-h-[102px] flex-col justify-end p-3">
        <p className="truncate font-display text-[17px] font-semibold leading-none text-ink-primary">
          {dish.name}
        </p>
        <div className="mt-1.5 flex items-center gap-2 text-[11px] font-semibold text-ink-secondary">
          <span className="inline-flex items-center gap-1 text-accent">
            <Star aria-hidden="true" className="fill-current" size={12} />
            {getDishRatingText(dish.rating)}
          </span>
          <span className="inline-flex items-center gap-1">
            <ImagePlus aria-hidden="true" size={12} />
            {dishImages.length}
          </span>
        </div>
      </div>
    </button>
  );
}

function AllDishesSheet({
  dishes,
  onClose,
}: {
  dishes: RestaurantVisit["dishes"];
  onClose: () => void;
}) {
  const [galleryDish, setGalleryDish] = useState<
    RestaurantVisit["dishes"][number] | null
  >(null);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-bg/75 p-0 backdrop-blur sm:items-center sm:p-4">
      <section
        aria-modal="true"
        className="max-h-[calc(100svh-16px)] w-full overflow-hidden rounded-t-[28px] border border-b-0 border-border bg-surface shadow-raised sm:max-w-2xl sm:rounded-card sm:border"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
              Visit dishes
            </p>
            <h3 className="mt-1 font-display text-2xl font-semibold leading-none text-ink-primary">
              Everything you had
            </h3>
            <p className="mt-2 text-sm leading-6 text-ink-secondary">
              Full dish list for this visit. Photo galleries can open from each
              dish once multiple images are saved.
            </p>
          </div>
          <button
            aria-label="Close dishes"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-bg/80 text-ink-primary transition hover:border-accent/50 hover:text-accent focus:outline-none focus:ring-4 focus:ring-accent-soft"
            type="button"
            onClick={onClose}
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="max-h-[calc(100svh-180px)] space-y-3 overflow-y-auto p-4 pb-[calc(16px+env(safe-area-inset-bottom))] sm:max-h-[62vh] sm:p-5">
          {dishes.map((dish, index) => {
            const dishImages = getDishImages(dish, index);

            return (
              <article
                className="grid min-w-0 grid-cols-[88px_minmax(0,1fr)] gap-3 rounded-[16px] border border-border bg-bg/55 p-2.5"
                key={dish.id}
              >
                <button
                  aria-label={`Open ${dish.name} photo gallery`}
                  className="group relative h-24 overflow-hidden rounded-[12px] bg-surface text-left focus:outline-none focus:ring-4 focus:ring-accent-soft"
                  type="button"
                  onClick={() => setGalleryDish(dish)}
                >
                  <img
                    alt=""
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    src={dishImages[0]}
                  />
                  <span className="absolute inset-0 bg-bg/0 transition group-hover:bg-bg/15" />
                  {dishImages.length > 1 ? (
                    <span className="absolute bottom-2 right-2 rounded-full border border-border bg-bg/80 px-2 py-0.5 text-[10px] font-semibold text-ink-primary backdrop-blur">
                      {dishImages.length} photos
                    </span>
                  ) : null}
                </button>
                <div className="min-w-0 py-1">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="break-words font-display text-xl font-semibold leading-none text-ink-primary">
                        {dish.name}
                      </h4>
                      <p className="mt-2 text-xs font-semibold text-success">
                        {dish.wouldEatAgain
                          ? "Would eat again"
                          : "One-time order"}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-bold text-ink-primary">
                      <Star
                        aria-hidden="true"
                        className="fill-current text-rating-gold"
                        size={13}
                      />
                      {getDishRatingText(dish.rating)}
                    </span>
                  </div>
                  {dish.notes ? (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-secondary">
                      {dish.notes}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-ink-tertiary">
                      No dish notes saved yet.
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
      {galleryDish ? (
        <DishImageGalleryModal
          dish={galleryDish}
          onClose={() => setGalleryDish(null)}
        />
      ) : null}
    </div>
  );
}

function DishImageGalleryModal({
  dish,
  onClose,
}: {
  dish: RestaurantVisit["dishes"][number];
  onClose: () => void;
}) {
  const images = getDishImages(dish);
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultipleImages = images.length > 1;

  function showPreviousImage() {
    setActiveIndex((current) =>
      current === 0 ? images.length - 1 : current - 1,
    );
  }

  function showNextImage() {
    setActiveIndex((current) =>
      current === images.length - 1 ? 0 : current + 1,
    );
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-bg/90 p-4 backdrop-blur-md">
      <section
        aria-modal="true"
        className="w-full max-w-3xl overflow-hidden rounded-[24px] border border-border bg-surface shadow-raised"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-4 sm:p-5">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
              Dish gallery
            </p>
            <h3 className="mt-1 truncate font-display text-2xl font-semibold leading-none text-ink-primary">
              {dish.name}
            </h3>
            <p className="mt-2 text-sm text-ink-secondary">
              {activeIndex + 1} of {images.length}
            </p>
          </div>
          <button
            aria-label="Close dish gallery"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-bg/80 text-ink-primary transition hover:border-accent/50 hover:text-accent focus:outline-none focus:ring-4 focus:ring-accent-soft"
            type="button"
            onClick={onClose}
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="relative bg-bg">
          <img
            alt=""
            className="max-h-[68svh] min-h-[320px] w-full object-contain"
            src={images[activeIndex]}
          />

          {hasMultipleImages ? (
            <>
              <button
                aria-label="Previous dish image"
                className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-bg/80 text-ink-primary shadow-card backdrop-blur transition hover:border-accent/50 hover:text-accent focus:outline-none focus:ring-4 focus:ring-accent-soft"
                type="button"
                onClick={showPreviousImage}
              >
                <ChevronLeft aria-hidden="true" size={20} />
              </button>
              <button
                aria-label="Next dish image"
                className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-bg/80 text-ink-primary shadow-card backdrop-blur transition hover:border-accent/50 hover:text-accent focus:outline-none focus:ring-4 focus:ring-accent-soft"
                type="button"
                onClick={showNextImage}
              >
                <ChevronRight aria-hidden="true" size={20} />
              </button>
            </>
          ) : null}
        </div>

        {hasMultipleImages ? (
          <div className="flex gap-2 overflow-x-auto border-t border-border p-3">
            {images.map((imageUrl, index) => (
              <button
                aria-label={`Show image ${index + 1}`}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-[12px] border transition focus:outline-none focus:ring-4 focus:ring-accent-soft ${
                  activeIndex === index ? "border-accent" : "border-border"
                }`}
                key={`${imageUrl}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
              >
                <img
                  alt=""
                  className="h-full w-full object-cover"
                  src={imageUrl}
                />
              </button>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function NextBestAction({
  dish,
}: {
  dish?: RestaurantVisit["dishes"][number];
}) {
  const title = dish ? `Go back for ${dish.name}.` : "Log one great dish next.";

  return (
    <section className="mt-8 border-t border-[rgba(64,55,45,0.65)] pt-8">
      <SectionEyebrow>Next best action</SectionEyebrow>
      <div className="mt-5 grid grid-cols-[38px_minmax(0,1fr)] gap-4">
        <div className="flex h-10 w-10 items-start justify-center pt-1 text-accent">
          <ChefHat aria-hidden="true" size={28} />
        </div>
        <div className="min-w-0">
          <h3 className="break-words font-display text-[32px] font-bold leading-[1.02] tracking-[-0.025em] text-ink-primary">
            {title}
          </h3>
          <p className="mt-3 text-sm leading-[1.6] text-ink-secondary">
            Your visit notes and saved dishes make the next choice easy.
          </p>
        </div>
      </div>
    </section>
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
    <div className="mt-5 rounded-card border border-dashed border-border bg-bg p-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface text-ink-tertiary">
        <History aria-hidden="true" size={24} />
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold text-ink-primary">
        No visits logged yet
      </h3>
      <p className="mt-2 text-sm leading-6 text-ink-secondary">
        Start the timeline with your latest visit, rating, spend, and dishes.
      </p>
      <button
        className="mt-5 inline-flex h-[52px] items-center justify-center gap-3 rounded-[16px] bg-accent px-5 font-body text-[15px] font-semibold leading-none text-[#0F0D0A] transition hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent-soft"
        type="button"
        onClick={onLogVisit}
      >
        <PlusCircle aria-hidden="true" size={18} />
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
          className="inline-flex h-[52px] items-center justify-center gap-3 rounded-[16px] border border-[rgba(227,108,97,0.45)] bg-[rgba(227,108,97,0.10)] px-4 font-body text-[15px] font-medium leading-none text-error"
          type="button"
          onClick={onRetry}
        >
          <RefreshCw aria-hidden="true" size={18} />
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
      className="min-w-0 overflow-hidden rounded-card border border-border bg-surface p-4 shadow-card sm:p-6"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase text-accent">Edit</p>
          <h2 className="mt-1 break-words font-display text-2xl font-semibold text-ink-primary">
            Update restaurant
          </h2>
        </div>
        <button
          className="inline-flex h-[52px] w-full items-center justify-center gap-3 rounded-[16px] border border-border bg-bg px-4 font-body text-[15px] font-medium leading-none text-ink-primary transition hover:border-accent/50 hover:text-accent focus:outline-none focus:ring-4 focus:ring-accent-soft sm:w-auto"
          type="button"
          onClick={onCancel}
        >
          <X aria-hidden="true" size={18} />
          Cancel
        </button>
      </div>

      <div className="mt-5 grid min-w-0 gap-4 lg:grid-cols-2">
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
        className="mt-5 flex h-[54px] w-full items-center justify-center gap-3 rounded-[16px] bg-accent px-5 font-body text-base font-semibold leading-none text-[#0F0D0A] shadow-card transition hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent-soft disabled:cursor-wait disabled:opacity-70"
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label
          className="text-sm font-bold text-ink-primary"
          htmlFor="bannerImage"
        >
          Banner image
        </label>
        {hasSelectedImage ? (
          <button
            className="inline-flex h-[52px] w-fit items-center justify-center gap-3 rounded-[16px] border border-[rgba(227,108,97,0.45)] bg-[rgba(227,108,97,0.10)] px-4 font-body text-[15px] font-medium leading-none text-error transition hover:bg-[rgba(227,108,97,0.14)] focus:outline-none focus:ring-4 focus:ring-error/20"
            type="button"
            onClick={onClear}
          >
            <Trash2 aria-hidden="true" size={18} />
            Remove selected image
          </button>
        ) : null}
      </div>

      <label
        className="mt-2 flex min-h-44 cursor-pointer overflow-hidden rounded-card border border-dashed border-accent/35 bg-surface-sunken transition hover:border-accent/70 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft sm:min-h-52"
        htmlFor="bannerImage"
      >
        {visibleImageUrl ? (
          <span className="relative block h-44 w-full sm:h-52">
            <img
              alt={
                hasSelectedImage
                  ? "Selected restaurant banner preview"
                  : "Current restaurant banner"
              }
              className="h-full w-full object-cover"
              src={visibleImageUrl}
            />
            <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-bg via-bg/75 to-transparent p-3 sm:p-4">
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
  desktop = false,
  isEditing,
  isMutating,
  onDelete,
  onEdit,
}: {
  desktop?: boolean;
  isEditing: boolean;
  isMutating: boolean;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <section
      className={
        desktop
          ? "rounded-card border border-border bg-surface/55 p-5 shadow-card"
          : "border-b border-[rgba(64,55,45,0.65)] pb-8"
      }
    >
      {desktop ? (
        <p className="flex items-center gap-2 text-sm font-bold text-ink-primary">
          <Pencil aria-hidden="true" className="text-accent" size={18} />
          Actions
        </p>
      ) : (
        <SectionEyebrow>Actions</SectionEyebrow>
      )}
      <div
        className={
          desktop ? "mt-4 grid gap-2" : "mt-5 grid gap-3 sm:grid-cols-2"
        }
      >
        <button
          className="flex h-[54px] items-center justify-center gap-3 rounded-[16px] border border-accent bg-accent px-4 font-body text-[15px] font-semibold leading-none text-[#0F0D0A] shadow-card transition hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent-soft disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isEditing || isMutating}
          type="button"
          onClick={onEdit}
        >
          <Pencil aria-hidden="true" size={18} />
          Edit restaurant
        </button>
        <button
          className="flex h-[54px] items-center justify-center gap-3 rounded-[16px] border border-[rgba(227,108,97,0.45)] bg-[rgba(227,108,97,0.10)] px-4 font-body text-[15px] font-semibold leading-none text-error transition hover:bg-[rgba(227,108,97,0.14)] focus:outline-none focus:ring-4 focus:ring-error/20 disabled:cursor-not-allowed disabled:opacity-60"
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

function MetaPanel({
  desktop = false,
  restaurant,
}: {
  desktop?: boolean;
  restaurant: Restaurant;
}) {
  return (
    <section
      className={
        desktop
          ? "rounded-card border border-border bg-surface/55 p-5 shadow-card"
          : "pb-4"
      }
    >
      {desktop ? (
        <p className="flex items-center gap-2 text-sm font-bold text-ink-primary">
          <ReceiptText aria-hidden="true" className="text-accent" size={18} />
          Record
        </p>
      ) : (
        <SectionEyebrow>Record</SectionEyebrow>
      )}
      <div className="mt-5 divide-y divide-[rgba(64,55,45,0.65)]">
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
    <div className="fixed inset-0 z-[70] flex items-end justify-center overflow-x-hidden bg-bg/75 p-0 backdrop-blur sm:items-center sm:p-4">
      <section
        aria-modal="true"
        className="w-full max-w-md rounded-t-[28px] border border-b-0 border-error/30 bg-surface p-5 pb-[calc(20px+env(safe-area-inset-bottom))] shadow-raised sm:rounded-card sm:border"
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
            className="h-[54px] rounded-[16px] border border-border bg-bg px-4 font-body text-[15px] font-medium leading-none text-ink-primary transition hover:border-accent/50 focus:outline-none focus:ring-4 focus:ring-accent-soft"
            disabled={isDeleting}
            type="button"
            onClick={onCancel}
          >
            Keep it
          </button>
          <button
            className="flex h-[54px] items-center justify-center gap-3 rounded-[16px] border border-[rgba(227,108,97,0.45)] bg-[rgba(227,108,97,0.10)] px-4 font-body text-[15px] font-semibold leading-none text-error transition hover:bg-[rgba(227,108,97,0.14)] focus:outline-none focus:ring-4 focus:ring-error/20 disabled:cursor-wait disabled:opacity-70"
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
    setValue: setDishValue,
    watch: watchDish,
  } = useForm<DishDraftFormValues>({
    defaultValues: {
      images: [],
      name: "",
      notes: "",
      rating: "",
      wouldEatAgain: true,
    },
  });

  const selectedRating = Number(watch("rating") || 0);
  const selectedDishImages = watchDish("images") ?? [];

  function addDishImages(files: FileList | null) {
    if (!files?.length) {
      return;
    }
    console.log("files", files, getDishValues("images"), watchDish("images"));
    console.log("Array files", Array.from(files));

    setDishValue("images", [...selectedDishImages, ...Array.from(files)], {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  console.log("getDishValues>>>>>>>>>", getDishValues("images"));
  function removeDishImage(indexToRemove: number) {
    setDishValue(
      "images",
      selectedDishImages.filter((_, index) => index !== indexToRemove),
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  }

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

    parsed.data.id = crypto.randomUUID();

    setDishDrafts((current) => [...current, parsed.data]);
    resetDish({
      images: [],
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

    console.log("parsed", parsed);

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
    <div className="fixed inset-0 z-[70] flex items-end justify-center overflow-x-hidden bg-bg/75 p-0 backdrop-blur sm:items-center sm:p-4">
      <section
        aria-modal="true"
        className="max-h-[calc(100svh-12px)] w-full max-w-full overflow-x-hidden overflow-y-auto rounded-t-[28px] border border-b-0 border-border bg-surface shadow-raised sm:max-h-[92vh] sm:max-w-3xl sm:rounded-card sm:border"
        role="dialog"
      >
        <div className="relative overflow-hidden border-b border-border p-4 sm:p-6">
          <img
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-20"
            src="https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&w=1200&q=80"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/90 to-bg/40" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase text-success">
                Log revisit
              </p>
              <h2 className="mt-2 break-words font-display text-2xl font-semibold leading-tight text-ink-primary sm:text-3xl">
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
          className="p-4 sm:p-6"
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

          <div className="grid min-w-0 gap-4 lg:grid-cols-2">
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

            <div className="mt-4 grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_110px]">
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
              <div className="min-w-0 lg:col-span-2">
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
              <DishImagesField
                error={dishErrors.images?.message}
                images={selectedDishImages}
                onAddImages={addDishImages}
                onRemoveImage={removeDishImage}
              />
            </div>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex h-[52px] w-full items-center justify-center gap-3 rounded-[16px] border border-success/25 bg-success/10 px-4 font-body text-[15px] font-medium leading-none text-success sm:w-auto">
                <input
                  className="h-4 w-4 accent-current"
                  type="checkbox"
                  {...registerDish("wouldEatAgain")}
                />
                Would eat again
              </label>
              <button
                className="inline-flex h-[52px] w-full items-center justify-center gap-3 rounded-[16px] border border-accent/40 bg-accent-soft px-4 font-body text-[15px] font-semibold leading-none text-accent transition hover:border-accent focus:outline-none focus:ring-4 focus:ring-accent-soft sm:w-auto"
                type="button"
                onClick={addDishDraft}
              >
                <Plus aria-hidden="true" size={18} />
                Add dish
              </button>
            </div>

            {dishDrafts.length > 0 ? (
              <div className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2">
                {dishDrafts.map((dish, index) => (
                  <DishDraftPreviewCard
                    dish={dish}
                    key={`${dish.name}-${index}`}
                  />
                ))}
              </div>
            ) : null}
          </section>

          <div className="sticky bottom-0 mt-6 grid gap-3 border-t border-border bg-surface pt-4 pb-[calc(16px+env(safe-area-inset-bottom))] sm:static sm:grid-cols-[1fr_1.4fr] sm:border-t-0 sm:pb-0">
            <button
              className="h-[54px] rounded-[16px] border border-border bg-bg px-4 font-body text-[15px] font-medium leading-none text-ink-primary transition hover:border-accent/50 focus:outline-none focus:ring-4 focus:ring-accent-soft"
              disabled={isSaving}
              type="button"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              className="flex h-[54px] items-center justify-center gap-3 rounded-[16px] bg-accent px-5 font-body text-base font-semibold leading-none text-[#0F0D0A] shadow-card transition hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent-soft disabled:cursor-wait disabled:opacity-70"
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

function DishImagesField({
  error,
  images,
  onAddImages,
  onRemoveImage,
}: {
  error?: string;
  images: File[];
  onAddImages: (files: FileList | null) => void;
  onRemoveImage: (index: number) => void;
}) {
  const previewUrls = useMemo(
    () => images.map((image) => URL.createObjectURL(image)),
    [images],
  );

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  return (
    <div className="min-w-0 lg:col-span-2">
      <div className="flex items-end justify-between gap-3">
        <div>
          <label
            className="text-sm font-bold text-ink-primary"
            htmlFor="dishImages"
          >
            Dish photos
          </label>
          <p className="mt-1 text-xs leading-5 text-ink-tertiary">
            Add multiple angles, bill shots, or plating details.
          </p>
        </div>
        {images.length > 0 ? (
          <span className="shrink-0 rounded-full border border-accent/25 bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
            {images.length} selected
          </span>
        ) : null}
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)]">
        <label
          className="flex min-h-[118px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[16px] border border-dashed border-accent/35 bg-surface-sunken px-4 text-center transition hover:border-accent/70 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft"
          htmlFor="dishImages"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-accent/30 bg-accent-soft text-accent">
            <ImagePlus aria-hidden="true" size={20} />
          </span>
          <span className="font-body text-[15px] font-semibold leading-none text-ink-primary">
            Add photos
          </span>
          <span className="text-xs leading-4 text-ink-tertiary">
            JPG, PNG, WEBP
          </span>
          <input
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            className="sr-only"
            id="dishImages"
            multiple
            type="file"
            onChange={(event) => {
              onAddImages(event.target.files);
              event.currentTarget.value = "";
            }}
          />
        </label>

        {images.length > 0 ? (
          <div className="grid min-w-0 grid-cols-3 gap-2">
            {images.map((image, index) => (
              <div
                className="group relative aspect-square min-w-0 overflow-hidden rounded-[14px] border border-border bg-surface"
                key={`${image.name}-${image.lastModified}-${index}`}
              >
                <img
                  alt=""
                  className="h-full w-full object-cover"
                  src={previewUrls[index]}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg/70 via-transparent to-transparent opacity-80" />
                <button
                  aria-label={`Remove ${image.name}`}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-error/40 bg-bg/80 text-error backdrop-blur transition hover:bg-error/10 focus:outline-none focus:ring-4 focus:ring-error/20"
                  type="button"
                  onClick={() => onRemoveImage(index)}
                >
                  <X aria-hidden="true" size={16} />
                </button>
                <p className="absolute inset-x-2 bottom-2 truncate text-[10px] font-semibold text-ink-primary">
                  {image.name}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[118px] items-center rounded-[16px] border border-border bg-surface/45 px-4">
            <p className="text-sm leading-6 text-ink-secondary">
              Photos will appear here before you stage the dish. The first image
              becomes the visual preview.
            </p>
          </div>
        )}
      </div>

      {error ? (
        <p className="mt-2 text-sm font-semibold text-error">{error}</p>
      ) : null}
    </div>
  );
}

function DishDraftPreviewCard({ dish }: { dish: DishDraftFormValues }) {
  const previewUrl = useMemo(() => {
    const firstImage = dish.images[0];
    return firstImage ? URL.createObjectURL(firstImage) : null;
  }, [dish.images]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="min-w-0 overflow-hidden rounded-control border border-border bg-surface">
      {previewUrl ? (
        <div className="relative h-28">
          <img
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            src={previewUrl}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg/80 to-transparent" />
          <span className="absolute bottom-2 right-2 rounded-full border border-border bg-bg/80 px-2.5 py-1 text-[11px] font-semibold text-ink-primary backdrop-blur">
            {dish.images.length} photo{dish.images.length > 1 ? "s" : ""}
          </span>
        </div>
      ) : null}
      <div className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold text-ink-primary">
              {dish.name}
            </p>
            <p className="mt-1 truncate text-xs font-bold text-success">
              {dish.wouldEatAgain ? "Would eat again" : "One-time order"}
            </p>
          </div>
          <RatingPill rating={dish.rating ? Number(dish.rating) : null} />
        </div>
        {!previewUrl ? (
          <p className="mt-3 rounded-[12px] border border-dashed border-border px-3 py-2 text-xs leading-5 text-ink-tertiary">
            No photos staged for this dish.
          </p>
        ) : null}
      </div>
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
      <div className="mt-2 min-w-0 rounded-control border border-border bg-surface-sunken p-3 transition focus-within:border-accent focus-within:bg-surface focus-within:ring-4 focus-within:ring-accent-soft">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-3xl font-semibold text-ink-primary">
            {selectedRating > 0 ? selectedRating.toFixed(1) : "0.0"}
            <span className="ml-1 text-base font-bold text-ink-secondary">
              /10
            </span>
          </p>
          <input
            className="h-11 w-full min-w-0 rounded-control border border-border bg-bg px-3 text-center text-base font-bold text-ink-primary outline-none focus:border-accent sm:w-20"
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
        <div className="mt-3 flex max-w-full flex-wrap gap-2">
          {quickRatings.map((rating) => (
            <button
              className={`min-h-10 shrink-0 rounded-full border px-4 font-body text-[15px] font-semibold leading-none transition focus:outline-none focus:ring-4 focus:ring-accent-soft ${
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
      <div className="mt-2 flex min-h-12 min-w-0 items-center gap-3 rounded-control border border-border bg-surface-sunken px-4 transition focus-within:border-accent focus-within:bg-surface focus-within:ring-4 focus-within:ring-accent-soft">
        <Icon
          aria-hidden="true"
          className="shrink-0 text-ink-secondary"
          size={19}
        />
        <input
          className="w-full min-w-0 flex-1 border-0 bg-transparent py-3 text-base text-ink-primary outline-none placeholder:text-ink-tertiary"
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
      <div className="mt-2 min-w-0 rounded-control border border-border bg-surface-sunken p-3 transition focus-within:border-accent focus-within:bg-surface focus-within:ring-4 focus-within:ring-accent-soft">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-3xl font-semibold text-ink-primary">
            {selectedRating > 0 ? selectedRating.toFixed(1) : "0.0"}
            <span className="ml-1 text-base font-bold text-ink-secondary">
              /10
            </span>
          </p>
          <input
            className="h-11 w-full min-w-0 rounded-control border border-border bg-bg px-3 text-center text-base font-bold text-ink-primary outline-none focus:border-accent sm:w-20"
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
        <div className="mt-3 flex max-w-full flex-wrap gap-2">
          {quickRatings.map((rating) => (
            <button
              className={`min-h-10 shrink-0 rounded-full border px-4 font-body text-[15px] font-semibold leading-none transition focus:outline-none focus:ring-4 focus:ring-accent-soft ${
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
      <div className="mt-2 flex min-h-12 min-w-0 items-center gap-3 rounded-control border border-border bg-surface-sunken px-4 transition focus-within:border-accent focus-within:bg-surface focus-within:ring-4 focus-within:ring-accent-soft">
        <Icon
          aria-hidden="true"
          className="shrink-0 text-ink-secondary"
          size={19}
        />
        <input
          className="w-full min-w-0 flex-1 border-0 bg-transparent py-3 text-base text-ink-primary outline-none placeholder:text-ink-tertiary"
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

function SectionEyebrow({ children, id }: { children: string; id?: string }) {
  return (
    <p
      className="text-left text-xs font-[800] uppercase tracking-[0.12em] text-accent"
      id={id}
    >
      {children}
    </p>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="grid min-h-[58px] min-w-0 grid-cols-[28px_minmax(70px,0.8fr)_minmax(0,1.2fr)] items-center gap-x-4 py-3 sm:grid-cols-[28px_140px_minmax(0,1fr)]">
      <Icon
        aria-hidden="true"
        className="mt-0.5 shrink-0 text-ink-tertiary sm:mt-0"
        size={20}
      />
      <p className="text-sm font-semibold text-ink-secondary">{label}</p>
      <p className="min-w-0 break-words text-right text-sm font-bold leading-6 text-ink-primary">
        {value}
      </p>
    </div>
  );
}

function InfoPill({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="inline-flex min-h-8 min-w-0 items-center gap-2 text-sm font-semibold text-ink-secondary">
      <Icon aria-hidden="true" className="shrink-0 text-accent" size={18} />
      {label}
    </span>
  );
}

function RatingPill({ rating }: { rating?: number | null }) {
  if (rating === undefined || rating === null) {
    return <InfoPill icon={Star} label="Not rated" />;
  }

  return (
    <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-border/80 bg-bg/80 px-3 text-xs font-bold text-ink-primary">
      <Star
        aria-hidden="true"
        className="text-rating-gold"
        fill="currentColor"
        size={14}
      />
      {rating.toFixed(1)}/10
    </span>
  );
}

function HeroRatingMeta({ rating }: { rating?: number | null }) {
  return (
    <span className="inline-flex min-h-8 min-w-0 items-center gap-2 text-[13px] font-semibold text-ink-secondary">
      <Star
        aria-hidden="true"
        className="shrink-0 text-accent"
        fill={rating === undefined || rating === null ? "none" : "currentColor"}
        size={16}
      />
      {rating === undefined || rating === null
        ? "Not rated"
        : `${rating.toFixed(1)}/10`}
    </span>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid min-h-[50px] min-w-0 grid-cols-[minmax(90px,0.8fr)_minmax(0,1.2fr)] items-center gap-4 py-3 first:pt-0 last:pb-0">
      <p className="text-[13px] font-semibold text-ink-secondary">{label}</p>
      <p className="min-w-0 break-words text-right text-sm font-semibold text-ink-primary">
        {value}
      </p>
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
          className="inline-flex h-[54px] items-center justify-center gap-3 rounded-[16px] border border-[rgba(227,108,97,0.45)] bg-[rgba(227,108,97,0.10)] px-5 font-body text-[15px] font-medium leading-none text-error shadow-card transition hover:bg-[rgba(227,108,97,0.14)] focus:outline-none focus:ring-4 focus:ring-error/20"
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
          className="mt-5 inline-flex h-[54px] items-center justify-center gap-3 rounded-[16px] bg-accent px-5 font-body text-[15px] font-semibold leading-none text-[#0F0D0A] shadow-card transition hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent-soft"
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

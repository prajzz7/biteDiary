"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  Flame,
  ImageIcon,
  MapPin,
  MoreHorizontal,
  Pencil,
  Star,
  Users,
  Utensils,
} from "lucide-react";

const visit = {
  coverImage:
    "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1400&q=85",
  cuisine: "Modern European",
  date: "Sat, 25 May 2024",
  mealType: "Dinner",
  mood: "Business Meal",
  people: "2 People",
  place: "Bangalore, India",
  rating: 4.6,
  restaurantName: "Verve Bistro",
  time: "7:30 PM",
  visitType: "Weekend",
};

const dishes = [
  {
    description: "Silky truffle pasta, parmigiano, black truffle",
    image:
      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=900&q=85",
    imageCount: "1/3",
    name: "Truffle Tagliolini",
    rating: 4.8,
    reorder: true,
    tags: ["Italian", "Vegetarian"],
  },
  {
    description: "Smoky paprika, olive oil, lemon, chickpeas",
    image:
      "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=900&q=85",
    imageCount: "1/2",
    name: "Charred Octopus",
    rating: 4.5,
    reorder: false,
    tags: ["Seafood", "Spicy"],
  },
  {
    description: "300g grilled ribeye, pepper jus, roasted garlic",
    image:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=85",
    imageCount: "1/4",
    name: "Ribeye Steak",
    rating: 4.7,
    reorder: true,
    tags: ["Grill", "Non-Vegetarian"],
  },
  {
    description: "Classic mascarpone, espresso, cocoa",
    image:
      "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=900&q=85",
    imageCount: "1/2",
    name: "Tiramisu",
    rating: 4.6,
    reorder: true,
    tags: ["Dessert"],
  },
];

export default function VisitDetailPage({ visitId }: { visitId: string }) {
  return (
    <main className="min-h-svh overflow-x-hidden bg-[#070706] text-[#f4eee5] sm:px-5 sm:py-7">
      <section className="relative mx-auto min-h-svh w-full overflow-hidden bg-[#0d0d0c] shadow-[0_28px_90px_rgba(0,0,0,0.72)] sm:min-h-0 sm:max-w-[720px] sm:rounded-[34px] sm:border sm:border-[#302c27]">
        <Hero visitId={visitId} />

        <section className="px-4 pb-24 pt-5 min-[390px]:px-5 sm:px-6 sm:pb-28 sm:pt-6">
          <div className="flex items-end justify-between gap-3 border-b border-[#2b2824] pb-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <Utensils
                aria-hidden="true"
                className="shrink-0 text-[#d49a4e]"
                size={22}
                strokeWidth={1.7}
              />
              <h2 className="font-display text-[clamp(1.35rem,5.6vw,1.8rem)] font-medium leading-none tracking-[-0.025em] text-[#dfaa61]">
                Dishes from this visit
              </h2>
            </div>
            <p className="shrink-0 pb-0.5 font-body text-[13px] font-medium text-[#a9a095] min-[390px]:text-[14px] sm:text-[15px]">
              7 dishes
            </p>
          </div>

          <div className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
            {dishes.map((dish) => (
              <DishVisitCard dish={dish} key={dish.name} />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function Hero({ visitId }: { visitId: string }) {
  return (
    <header className="relative min-h-[470px] overflow-hidden bg-[#0d0d0c] min-[390px]:min-h-[500px] sm:min-h-[525px]">
      <img
        alt="Verve Bistro exterior"
        className="absolute inset-x-0 top-0 h-[255px] w-full object-cover opacity-90 min-[390px]:h-[285px] sm:h-[310px]"
        src={visit.coverImage}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,7,7,0.06)_0%,rgba(7,7,7,0.18)_32%,rgba(13,13,12,0.72)_54%,#0d0d0c_78%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(208,149,70,0.12),transparent_30%),linear-gradient(90deg,rgba(0,0,0,0.27),transparent_52%,rgba(0,0,0,0.2))]" />

      <div className="relative z-20 mt-6 flex items-center justify-between px-4 min-[390px]:px-5 sm:mt-7 sm:px-6">
        <Link
          aria-label="Back to restaurant"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#161616]/74 text-white shadow-[0_8px_24px_rgba(0,0,0,0.28)] backdrop-blur-md transition hover:border-[#d19a52]/45 hover:text-[#d19a52] focus:outline-none focus:ring-4 focus:ring-[#d19a52]/20 min-[390px]:h-12 min-[390px]:w-12"
          href="/restaurants"
        >
          <ArrowLeft aria-hidden="true" size={21} strokeWidth={1.8} />
        </Link>

        <div className="flex items-center gap-2">
          <Link
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#b9823f] bg-[#15110c]/78 px-3.5 font-body text-[13px] font-medium text-[#e9ad5e] shadow-[0_8px_24px_rgba(0,0,0,0.28)] backdrop-blur-md transition hover:bg-[#d19a52]/10 focus:outline-none focus:ring-4 focus:ring-[#d19a52]/20 min-[390px]:h-12 min-[390px]:px-4 min-[390px]:text-[14px] sm:text-[15px]"
            href={`/visits/${visitId}?mode=edit`}
          >
            <Pencil aria-hidden="true" size={17} strokeWidth={1.8} />
            Edit Visit
          </Link>
          <button
            aria-label="More visit options"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#161616]/74 text-white shadow-[0_8px_24px_rgba(0,0,0,0.28)] backdrop-blur-md transition hover:border-[#d19a52]/45 hover:text-[#d19a52] focus:outline-none focus:ring-4 focus:ring-[#d19a52]/20 min-[390px]:h-12 min-[390px]:w-12"
            type="button"
          >
            <MoreHorizontal aria-hidden="true" size={21} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-5 min-[390px]:px-5 min-[390px]:pb-6 sm:px-6">
        <div className="grid grid-cols-[minmax(0,1fr)_78px] items-end gap-3 min-[390px]:grid-cols-[minmax(0,1fr)_88px] sm:grid-cols-[minmax(0,1fr)_98px]">
          <div className="min-w-0">
            <h1 className="font-display text-[clamp(2.1rem,10vw,3.25rem)] font-medium leading-[0.94] tracking-[-0.035em] text-[#f4eee5]">
              {visit.restaurantName}
            </h1>
            <p className="mt-3 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 font-body text-[13px] font-normal leading-5 text-[#c8c0b6] min-[390px]:text-[14px] sm:text-[15px]">
              <MapPin
                aria-hidden="true"
                className="shrink-0 text-[#d49a4e]"
                size={16}
                strokeWidth={1.8}
              />
              <span>{visit.cuisine}</span>
              <span className="text-[#81786d]">·</span>
              <span>{visit.place}</span>
            </p>
          </div>

          <div className="pb-0.5 text-right">
            <p className="inline-flex items-center justify-end gap-1.5 font-display text-[clamp(1.9rem,8vw,2.6rem)] font-normal leading-none text-[#f4eee5]">
              <Star
                aria-hidden="true"
                className="fill-current text-[#efae50]"
                size={21}
                strokeWidth={1.6}
              />
              {visit.rating}
            </p>
            <p className="mt-1 text-[11px] font-normal text-[#a9a095] min-[390px]:text-[12px] sm:text-[13px]">
              Overall Visit
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 min-[390px]:gap-2.5 sm:grid-cols-[1.35fr_0.78fr_0.82fr]">
          <HeroInfo icon={CalendarDays} label={visit.date} />
          <HeroInfo icon={Clock3} label={visit.time} />
          <HeroInfo icon={Users} label={visit.people} />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <VisitChip color="#a45e48" label={visit.mealType} />
          <VisitChip color="#4f8665" label={visit.visitType} />
          <VisitChip icon={BriefcaseBusiness} label={visit.mood} />
        </div>
      </div>
    </header>
  );
}

function HeroInfo({
  icon: Icon,
  label,
}: {
  icon: typeof CalendarDays;
  label: string;
}) {
  return (
    <div className="inline-flex min-h-10 min-w-0 items-center gap-2 rounded-[9px] border border-white/[0.07] bg-white/[0.045] px-2.5 font-body text-[12px] font-normal text-[#c8c0b6] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] min-[390px]:min-h-11 min-[390px]:px-3 min-[390px]:text-[13px] sm:text-[14px]">
      <Icon
        aria-hidden="true"
        className="shrink-0 text-[#d49a4e]"
        size={16}
        strokeWidth={1.75}
      />
      <span className="truncate">{label}</span>
    </div>
  );
}

function VisitChip({
  color,
  icon: Icon,
  label,
}: {
  color?: string;
  icon?: typeof BriefcaseBusiness;
  label: string;
}) {
  return (
    <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.025] px-3 font-body text-[11px] font-medium text-[#cfc6ba] min-[390px]:text-[12px] sm:text-[13px]">
      {Icon ? (
        <Icon
          aria-hidden="true"
          className="text-[#d49a4e]"
          size={14}
          strokeWidth={1.7}
        />
      ) : (
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color ?? "#d19a52" }}
        />
      )}
      {label}
    </span>
  );
}

function DishVisitCard({ dish }: { dish: (typeof dishes)[number] }) {
  return (
    <article className="grid min-w-0 grid-cols-[42%_minmax(0,1fr)] overflow-hidden rounded-[15px] border border-[#2f2b27] bg-[linear-gradient(135deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_30px_rgba(0,0,0,0.24)] min-[480px]:grid-cols-[44%_minmax(0,1fr)] sm:grid-cols-[45%_minmax(0,1fr)] sm:rounded-[18px]">
      <div className="relative min-h-[154px] overflow-hidden min-[390px]:min-h-[166px] sm:min-h-[184px]">
        <img
          alt={dish.name}
          className="absolute inset-0 h-full w-full object-cover"
          src={dish.image}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_48%,rgba(0,0,0,0.58)_100%)]" />
        <span className="absolute bottom-2 left-2 inline-flex h-7 items-center gap-1.5 rounded-[7px] bg-black/55 px-2 font-body text-[11px] font-medium text-[#e5ddd2] backdrop-blur min-[390px]:h-8 min-[390px]:text-[12px]">
          <ImageIcon aria-hidden="true" size={14} strokeWidth={1.8} />
          {dish.imageCount}
        </span>
      </div>

      <div className="flex min-w-0 flex-col justify-center px-3 py-3 min-[390px]:px-4 min-[390px]:py-4 sm:px-5">
        <h3 className="font-display text-[clamp(1.05rem,4.7vw,1.5rem)] font-medium leading-[1.02] tracking-[-0.02em] text-[#f4eee5]">
          {dish.name}
        </h3>
        <p className="mt-2 line-clamp-2 text-[11px] font-normal leading-[1.45] text-[#aaa196] min-[390px]:text-[12px] sm:text-[13px]">
          {dish.description}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 min-[390px]:gap-2">
          <span className="inline-flex h-7 items-center gap-1.5 rounded-[8px] border border-[#40372d] bg-[#11100f] px-2 font-body text-[12px] font-medium text-[#f4eee5] min-[390px]:h-8 min-[390px]:text-[13px]">
            <Star
              aria-hidden="true"
              className="fill-current text-[#efae50]"
              size={14}
              strokeWidth={1.6}
            />
            {dish.rating}
          </span>
          {dish.reorder ? (
            <span className="inline-flex h-7 items-center rounded-[8px] border border-[#27563b] bg-[#142a1d]/85 px-2 text-[10px] font-medium text-[#76bd89] min-[390px]:h-8 min-[390px]:px-2.5 min-[390px]:text-[11px]">
              Must Reorder
            </span>
          ) : null}
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5 min-[390px]:mt-3">
          {dish.tags.map((tag) => (
            <DishTag label={tag} key={tag} />
          ))}
        </div>
      </div>
    </article>
  );
}

function DishTag({ label }: { label: string }) {
  const isSpicy = label === "Spicy";
  const isNonVeg = label === "Non-Vegetarian";

  return (
    <span
      className={`inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[9px] font-medium min-[390px]:h-7 min-[390px]:text-[10px] sm:text-[11px] ${
        isSpicy || isNonVeg
          ? "border-[#6e342f] bg-[#21110f] text-[#d8675e]"
          : "border-[#413b34] bg-[#141311] text-[#bbb1a5]"
      }`}
    >
      {isSpicy ? <Flame aria-hidden="true" size={11} /> : null}
      {label}
    </span>
  );
}

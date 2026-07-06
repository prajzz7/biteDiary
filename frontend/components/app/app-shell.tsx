import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { BarChart3, Home, Plus, RefreshCw, Utensils } from "lucide-react";
import type { ReactNode } from "react";

import { LogoutButton } from "@/components/auth/logout-button";

type AppShellProps = {
  activeItem?: "Home" | "Restaurants" | "Add" | "Analytics";
  children: ReactNode;
};

const navItems: Array<{
  href: string;
  icon: LucideIcon;
  label: NonNullable<AppShellProps["activeItem"]>;
}> = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/restaurants", icon: Utensils, label: "Restaurants" },
  { href: "/add", icon: Plus, label: "Add" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
];

export function AppShell({ activeItem = "Home", children }: AppShellProps) {
  return (
    <div className="min-h-svh overflow-x-hidden bg-bg text-ink-primary">
      <DesktopSidebar activeItem={activeItem} />
      <div className="min-h-svh overflow-x-hidden pb-[calc(112px+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-72">
        {children}
      </div>
      <BottomNav activeItem={activeItem} />
    </div>
  );
}

function DesktopSidebar({ activeItem }: { activeItem: NonNullable<AppShellProps["activeItem"]> }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-border bg-surface/95 px-5 py-6 shadow-raised backdrop-blur lg:flex lg:flex-col">
      <Link className="flex items-center gap-3" href="/dashboard" aria-label="BiteDiary home">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-accent/40 bg-accent text-bg shadow-card">
          <Utensils aria-hidden="true" size={21} />
        </span>
        <span className="font-display text-xl font-semibold text-ink-primary">BiteDiary</span>
      </Link>

      <nav className="mt-8 space-y-2" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink active={activeItem === item.label} desktop key={item.label} {...item} />
        ))}
      </nav>

      <div className="mt-auto overflow-hidden rounded-card border border-border bg-bg shadow-card">
        <img
          alt="Warm restaurant table"
          className="h-28 w-full object-cover"
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=720&q=80"
        />
        <div className="p-4">
          <p className="text-xs font-bold uppercase text-accent">This week</p>
          <p className="mt-2 font-display text-2xl font-semibold text-ink-primary">5 visits</p>
          <p className="mt-1 text-sm leading-6 text-ink-secondary">Mumbai cafes are leading your diary.</p>
        </div>
      </div>
      <LogoutButton />
    </aside>
  );
}

function BottomNav({ activeItem }: { activeItem: NonNullable<AppShellProps["activeItem"]> }) {
  return (
    <nav
      className="fixed inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))] z-50 rounded-[28px] border border-border bg-surface/95 px-3 py-2 shadow-raised backdrop-blur lg:hidden"
      aria-label="Main navigation"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 items-end gap-1">
        {navItems.map((item) => (
          <NavLink active={activeItem === item.label} key={item.label} {...item} />
        ))}
        <LogoutButton variant="mobile" />
      </div>
    </nav>
  );
}

function NavLink({
  active,
  desktop = false,
  href,
  icon: Icon,
  label,
}: {
  active: boolean;
  desktop?: boolean;
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  const isAdd = label === "Add";

  if (desktop) {
    return (
      <Link
        aria-current={active ? "page" : undefined}
        className={`flex min-h-12 items-center gap-3 rounded-control px-4 text-sm font-bold transition ${
          active
            ? "border border-accent/30 bg-accent-soft text-accent"
            : "border border-transparent text-ink-secondary hover:border-border hover:bg-bg hover:text-ink-primary"
        }`}
        href={href}
      >
        <Icon aria-hidden="true" size={19} />
        {label}
      </Link>
    );
  }

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={`flex min-h-14 flex-col items-center justify-end gap-1 rounded-control px-1 text-[11px] font-bold transition ${
        active ? "text-accent" : "text-ink-secondary"
      }`}
      href={href}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full ${
          isAdd
            ? "-mt-4 h-14 w-14 border border-accent/40 bg-accent text-bg shadow-raised"
            : active
              ? "bg-accent-soft"
              : "bg-transparent"
        }`}
      >
        {label === "Restaurants" ? (
          <RefreshCw aria-hidden="true" size={18} />
        ) : (
          <Icon aria-hidden="true" size={isAdd ? 22 : 18} />
        )}
      </span>
      {label}
    </Link>
  );
}

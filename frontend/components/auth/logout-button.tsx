"use client";

import { useState } from "react";
import { LoaderCircle, LogOut } from "lucide-react";

import { authApi } from "@/lib/api/client";

type LogoutButtonProps = {
  variant?: "desktop" | "mobile";
};

export function LogoutButton({ variant = "desktop" }: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await authApi.logout();
    } finally {
      window.location.replace("/login");
    }
  }

  const Icon = isLoggingOut ? LoaderCircle : LogOut;

  if (variant === "mobile") {
    return (
      <button
        aria-label="Log out"
        className="flex min-h-14 flex-col items-center justify-end gap-1 rounded-control px-1 text-[11px] font-bold text-ink-secondary transition hover:text-accent disabled:cursor-wait disabled:opacity-70"
        disabled={isLoggingOut}
        onClick={handleLogout}
        type="button"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-transparent">
          <Icon aria-hidden="true" className={isLoggingOut ? "animate-spin" : ""} size={18} />
        </span>
        Logout
      </button>
    );
  }

  return (
    <button
      className="mt-3 flex min-h-12 w-full items-center gap-3 rounded-control border border-border px-4 text-left text-sm font-bold text-ink-secondary transition hover:bg-bg hover:text-ink-primary disabled:cursor-wait disabled:opacity-70"
      disabled={isLoggingOut}
      onClick={handleLogout}
      type="button"
    >
      <Icon aria-hidden="true" className={isLoggingOut ? "animate-spin" : ""} size={19} />
      Logout
    </button>
  );
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { UserSession } from "@/lib/api/client";
import {
  getSetCookieHeaders,
  mergeSetCookiesIntoCookieHeader,
} from "@/lib/auth/cookies";

const API_BASE_URL =
  process.env.BACKEND_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL ??
  "http://localhost:5000/api";

function loginRedirectPath(pathname?: string) {
  if (!pathname || pathname === "/" || pathname.startsWith("/login")) {
    return "/login";
  }
  return `/login?next=${encodeURIComponent(pathname)}`;
}

async function buildCookieHeader() {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

async function fetchSessionUser(cookieHeader: string) {
  const response = await fetch(`${API_BASE_URL}/me`, {
    cache: "no-store",
    headers: {
      cookie: cookieHeader,
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { user: UserSession };
  return data.user;
}

async function refreshSession(cookieHeader: string) {
  const response = await fetch(`${API_BASE_URL}/refresh`, {
    cache: "no-store",
    headers: {
      cookie: cookieHeader,
    },
    method: "POST",
  });

  return response.ok ? response : null;
}

export async function getSessionUser(): Promise<UserSession | null> {
  const cookieHeader = await buildCookieHeader();

  if (!cookieHeader) {
    return null;
  }

  try {
    const user = await fetchSessionUser(cookieHeader);

    if (user) {
      return user;
    }

    const refreshResponse = await refreshSession(cookieHeader);

    if (!refreshResponse) {
      return null;
    }

    const refreshedCookieHeader = mergeSetCookiesIntoCookieHeader(
      cookieHeader,
      getSetCookieHeaders(refreshResponse.headers),
    );

    return await fetchSessionUser(refreshedCookieHeader);
  } catch (error) {
    console.error("Failed to verify session on server", error);
    return null;
  }
}

export async function requireUser(
  currentPathname?: string,
): Promise<UserSession> {
  const user = await getSessionUser();

  if (!user) {
    redirect(loginRedirectPath(currentPathname));
  }

  return user;
}

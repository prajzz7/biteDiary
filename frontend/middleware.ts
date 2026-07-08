import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.BACKEND_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL ??
  "http://localhost:5000/api";

const publicRoutes = new Set(["/login", "/signup"]);

function hasAccessCookie(request: NextRequest) {
  return request.cookies.has("accessToken");
}

function hasSessionCookie(request: NextRequest) {
  return hasAccessCookie(request) || request.cookies.has("refreshToken");
}

function isPublicRoute(pathname: string) {
  return publicRoutes.has(pathname);
}

function loginRedirect(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);

  console.log("loingURL:::", request.url);

  if (request.nextUrl.pathname !== "/") {
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
  }

  return loginUrl;
}

function dashboardUrl(request: NextRequest) {
  return new URL("/dashboard", request.url);
}

function buildCookieHeader(request: NextRequest) {
  return request.cookies
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

function splitSetCookieHeader(header: string) {
  return header
    .split(/,(?=\s*[^;,\s]+=)/)
    .map((cookie) => cookie.trim())
    .filter(Boolean);
}

function getSetCookieHeaders(headers: Headers) {
  const headersWithGetSetCookie = headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof headersWithGetSetCookie.getSetCookie === "function") {
    return headersWithGetSetCookie.getSetCookie();
  }

  const setCookieHeader = headers.get("set-cookie");
  return setCookieHeader ? splitSetCookieHeader(setCookieHeader) : [];
}

function appendAuthCookies(response: NextResponse, authResponse: Response) {
  getSetCookieHeaders(authResponse.headers).forEach((cookie) => {
    response.headers.append("set-cookie", cookie);
  });
  console.log("RESPONSE NEXT COOKIE SET>>>>>>>>>>", response);

  return response;
}

function clearAuthCookies(response: NextResponse) {
  response.cookies.delete("accessToken");
  response.cookies.delete("refreshToken");
  return response;
}

async function backendAuthRequest(
  request: NextRequest,
  path: "/me" | "/refresh",
) {
  const cookieHeader = buildCookieHeader(request);

  if (!cookieHeader) {
    return null;
  }

  try {
    const response = await fetch(`/api/${path}`, {
      cache: "no-store",
      headers: {
        cookie: cookieHeader,
      },
      // credentials: "include",
      method: path === "/refresh" ? "POST" : "GET",
    });

    return response.ok ? response : null;
  } catch {
    return null;
  }
}

async function hasValidAccessSession(request: NextRequest) {
  if (!hasAccessCookie(request)) {
    return false;
  }

  return Boolean(await backendAuthRequest(request, "/me"));
}

async function refreshSession(request: NextRequest) {
  if (!request.cookies.has("refreshToken")) {
    return null;
  }

  return backendAuthRequest(request, "/refresh");
}

async function redirectWithFreshSession(target: URL, authResponse: Response) {
  return appendAuthCookies(NextResponse.redirect(target), authResponse);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log("RAKUU", request.cookies);
  console.log("RAKUU getAll", request.cookies.getAll());
  console.log("RAKUU has", request.cookies.has("accessToken"));
  console.log("RAKUU get", request.cookies.get("accessToken"));

  const hasSession = hasSessionCookie(request);
  const isPublic = isPublicRoute(pathname);

  console.log("hasSession>>>>>>>>>>", hasSession);
  console.log("request>>>>>>>>>>", request);

  const response = NextResponse.next();

  response.headers.append("PrajwalTEST", "56");
  response.cookies.set("myCookie", "PRAJWALCOOKIETEST");

  if (!hasSession) {
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (isPublic) {
      return NextResponse.next();
    }

    return NextResponse.redirect(loginRedirect(request));
  }

  if (pathname === "/") {
    if (await hasValidAccessSession(request)) {
      return NextResponse.redirect(dashboardUrl(request));
    }

    const refreshResponse = await refreshSession(request);

    if (refreshResponse) {
      return redirectWithFreshSession(dashboardUrl(request), refreshResponse);
    }

    return clearAuthCookies(
      NextResponse.redirect(new URL("/login", request.url)),
    );
  }

  if (isPublic) {
    if (await hasValidAccessSession(request)) {
      return NextResponse.redirect(dashboardUrl(request));
    }

    const refreshResponse = await refreshSession(request);

    if (refreshResponse) {
      return redirectWithFreshSession(dashboardUrl(request), refreshResponse);
    }

    return clearAuthCookies(NextResponse.next());
  }

  if (await hasValidAccessSession(request)) {
    return NextResponse.next();
  }

  const refreshResponse = await refreshSession(request);

  if (refreshResponse) {
    return redirectWithFreshSession(new URL(request.url), refreshResponse);
  }

  return clearAuthCookies(NextResponse.redirect(loginRedirect(request)));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

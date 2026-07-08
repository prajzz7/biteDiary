import { NextRequest, NextResponse } from "next/server";

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

  if (request.nextUrl.pathname !== "/") {
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
  }

  return loginUrl;
}

function dashboardUrl(request: NextRequest) {
  return new URL("/dashboard", request.url);
}

function nextWithPathname(request: NextRequest, pathname: string) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("x-pathname", pathname);
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = hasSessionCookie(request);
  const isPublic = isPublicRoute(pathname);

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(hasSession ? "/dashboard" : "/login", request.url),
    );
  }

  if (!hasSession && !isPublic) {
    return NextResponse.redirect(loginRedirect(request));
  }

  if (hasSession && isPublic) {
    return NextResponse.redirect(dashboardUrl(request));
  }

  if (hasSession && !isPublic) {
    return nextWithPathname(request, pathname);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

import { NextRequest, NextResponse } from "next/server";

import {
  getSetCookieHeaders,
  rewriteCookieForFrontend,
} from "@/lib/auth/cookies";

const BACKEND_BASE_URL =
  process.env.BACKEND_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL ??
  "http://localhost:5000/api";

function buildBackendUrl(path: string, search = "") {
  const baseUrl = BACKEND_BASE_URL.replace(/\/$/, "");
  const backendPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${backendPath}${search}`;
}

function buildForwardHeaders(request: NextRequest) {
  const headers = new Headers(request.headers);

  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("origin");
  headers.delete("referer");
  headers.delete("sec-fetch-dest");
  headers.delete("sec-fetch-mode");
  headers.delete("sec-fetch-site");
  headers.delete("sec-fetch-user");
  headers.delete("x-forwarded-for");
  headers.delete("x-forwarded-host");
  headers.delete("x-forwarded-port");
  headers.delete("x-forwarded-proto");

  return headers;
}

export async function proxyBackendRequest(
  request: NextRequest,
  backendPath: string,
) {
  const method = request.method.toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);

  let backendResponse: Response;

  try {
    backendResponse = await fetch(
      buildBackendUrl(backendPath, request.nextUrl.search),
      {
        body: hasBody ? await request.arrayBuffer() : undefined,
        cache: "no-store",
        headers: buildForwardHeaders(request),
        method,
        redirect: "manual",
      },
    );
  } catch (error) {
    console.error("Backend proxy request failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      method,
      path: backendPath,
    });

    return NextResponse.json(
      {
        message: "Backend service is unavailable",
      },
      {
        status: 502,
      },
    );
  }

  const responseHeaders = new Headers(backendResponse.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.delete("set-cookie");

  const response = new NextResponse(backendResponse.body, {
    headers: responseHeaders,
    status: backendResponse.status,
    statusText: backendResponse.statusText,
  });

  getSetCookieHeaders(backendResponse.headers).forEach((cookie) => {
    response.headers.append("set-cookie", rewriteCookieForFrontend(cookie));
  });

  return response;
}

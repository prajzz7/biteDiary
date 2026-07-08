import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL =
  process.env.BACKEND_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL ??
  "http://localhost:5000/api";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

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

function buildBackendUrl(path: string[], search: string) {
  const baseUrl = BACKEND_BASE_URL.replace(/\/$/, "");
  const backendPath = path.map(encodeURIComponent).join("/");
  return `${baseUrl}/${backendPath}${search}`;
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

async function proxyRequest(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const backendUrl = buildBackendUrl(path, request.nextUrl.search);
  const method = request.method.toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);

  let backendResponse: Response;

  try {
    backendResponse = await fetch(backendUrl, {
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
      headers: buildForwardHeaders(request),
      method,
      redirect: "manual",
    });
  } catch (error) {
    console.error("Backend proxy request failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      method,
      path: `/${path.join("/")}`,
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
    response.headers.append("set-cookie", cookie);
  });

  return response;
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

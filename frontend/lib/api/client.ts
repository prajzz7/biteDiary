const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? "/api";
type ApiRequestOptions = Omit<RequestInit, "body" | "credentials"> & {
  body?: BodyInit | object | null;
  skipAuthRefresh?: boolean;
};

export type UserSession = {
  createdAt?: string;
  email: string;
  id: string;
  name?: string | null;
  updatedAt?: string;
};

export type Restaurant = {
  address?: string | null;
  city?: string | null;
  country?: string | null;
  createdAt: string;
  cuisine?: string | null;
  id: string;
  name: string;
  notes?: string | null;
  rating?: number | null;
  state?: string | null;
  updatedAt: string;
  userId: string;
  visitedAt?: string | null;
};

export type RestaurantFilterOptions = {
  city: string[];
  cuisine: string[];
};

export type CreateRestaurantPayload = {
  address?: string;
  city?: string;
  country?: string;
  cuisine?: string;
  name: string;
  notes?: string;
  rating?: number;
  state?: string;
  visitedAt?: string;
};

export type UpdateRestaurantPayload = {
  address?: string | null;
  city?: string | null;
  country?: string | null;
  cuisine?: string | null;
  name: string;
  notes?: string | null;
  rating?: number | null;
  state?: string | null;
  visitedAt?: string | null;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class AuthSessionExpiredError extends ApiError {
  constructor(message = "Session expired") {
    super(message, 401);
    this.name = "AuthSessionExpiredError";
  }
}

let refreshPromise: Promise<boolean> | null = null;

function endpoint(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function buildRequestInit(options: ApiRequestOptions): RequestInit {
  const headers = new Headers(options.headers);
  const body = options.body;

  if (body && !(body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return {
    ...options,
    body:
      body && !(body instanceof FormData) && typeof body !== "string"
        ? JSON.stringify(body)
        : body,
    credentials: "include",
    headers,
  };
}

async function readResponse(response: Response) {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text || undefined;
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(endpoint("/refresh"), {
      credentials: "include",
      method: "POST",
    })
      .then((response) => response.ok)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function redirectToLogin() {
  if (typeof window === "undefined") {
    return;
  }

  const next = `${window.location.pathname}${window.location.search}`;
  const loginUrl =
    next && next !== "/" ? `/login?next=${encodeURIComponent(next)}` : "/login";

  window.location.assign(loginUrl);
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await fetch(endpoint(path), buildRequestInit(options));

  if (response.status === 401 && !options.skipAuthRefresh) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      const retryResponse = await fetch(
        endpoint(path),
        buildRequestInit(options),
      );

      if (retryResponse.ok) {
        return readResponse(retryResponse) as Promise<T>;
      }

      const retryData = await readResponse(retryResponse);

      if (retryResponse.status === 401) {
        redirectToLogin();
        throw new AuthSessionExpiredError();
      }

      throw new ApiError(
        retryData?.message ?? "Request failed",
        retryResponse.status,
        retryData,
      );
    }

    redirectToLogin();
    throw new AuthSessionExpiredError();
  }

  if (!response.ok) {
    const data = await readResponse(response);
    throw new ApiError(
      data?.message ?? "Request failed",
      response.status,
      data,
    );
  }

  return readResponse(response) as Promise<T>;
}

export const authApi = {
  login(values: { email: string; password: string }) {
    return apiRequest<{ message: string; user: UserSession }>("/login", {
      body: values,
      method: "POST",
      skipAuthRefresh: true,
    });
  },

  logout() {
    return apiRequest<{ message: string }>("/logout", {
      method: "POST",
      skipAuthRefresh: true,
    });
  },

  me() {
    return apiRequest<{ user: UserSession }>("/me");
  },

  refresh() {
    return apiRequest<{ message: string; user: UserSession }>("/refresh", {
      method: "POST",
      skipAuthRefresh: true,
    });
  },

  register(values: { email: string; name: string; password: string }) {
    return apiRequest<{ message: string; user: UserSession }>("/register", {
      body: values,
      method: "POST",
      skipAuthRefresh: true,
    });
  },
};

export const restaurantsApi = {
  create(values: CreateRestaurantPayload) {
    return apiRequest<{ data: Restaurant; message: string }>("/restaurants", {
      body: values,
      method: "POST",
    });
  },

  delete(restaurantId: string) {
    return apiRequest<{ message: string }>(`/restaurants/${restaurantId}`, {
      method: "DELETE",
    });
  },

  get(restaurantId: string) {
    return apiRequest<{ data: Restaurant; message: string }>(
      `/restaurants/${restaurantId}`,
    );
  },

  list(queryParams = "") {
    const path = queryParams ? `/restaurants?${queryParams}` : "/restaurants";
    return apiRequest<{ data: Restaurant[]; message: string }>(path);
  },

  listFilters() {
    return apiRequest<{ data: RestaurantFilterOptions; message: string }>(
      "/restaurants/filter-options",
    );
  },

  update(restaurantId: string, values: UpdateRestaurantPayload) {
    return apiRequest<{ data: Restaurant; message: string }>(
      `/restaurants/${restaurantId}`,
      {
        body: values,
        method: "PATCH",
      },
    );
  },
};

import { NextRequest } from "next/server";

import { proxyBackendRequest } from "@/lib/auth/proxy";

export async function POST(request: NextRequest) {
  return proxyBackendRequest(request, "/register");
}

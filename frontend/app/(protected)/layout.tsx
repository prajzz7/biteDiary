import type { ReactNode } from "react";
import { headers } from "next/headers";

import { requireUser } from "@/lib/auth/server";

type ProtectedLayoutProps = {
  children: ReactNode;
};

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? undefined;

  await requireUser(pathname);

  return <>{children}</>;
}

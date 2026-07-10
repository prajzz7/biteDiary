"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  XCircle,
} from "lucide-react";
import { AuthShell } from "./auth-shell";
import { ApiError, authApi } from "@/lib/api/client";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SubmitStatus = "idle" | "loading" | "success" | "error";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<SubmitStatus>("idle");

  const {
    register,
    handleSubmit,
    clearErrors,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
      remember: true,
    },
  });

  async function onSubmit(values: LoginFormValues) {
    clearErrors();
    const parsed = loginSchema.safeParse(values);

    if (!parsed.success) {
      setStatus("error");
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];

        if (typeof field === "string") {
          setError(field as keyof LoginFormValues, {
            message: issue.message,
            type: "manual",
          });
        }
      });
      return;
    }

    setStatus("loading");
    try {
      await authApi.login({
        email: values.email,
        password: values.password,
      });

      clearErrors();
      setStatus("success");

      const nextPath = new URLSearchParams(window.location.search).get("next");
      router.replace(nextPath || "/dashboard");
      router.refresh();
    } catch (error) {
      setStatus("error");

      setError("password", {
        message:
          error instanceof ApiError
            ? error.message
            : "Unable to sign in. Please try again.",
        type: "manual",
      });
    }
  }

  const isLoading = status === "loading";

  return (
    <AuthShell
      badge="Welcome back"
      bottomActionHref="/signup"
      bottomActionLabel="Create your BiteDiary"
      bottomPrompt="New here?"
      desktopDescription="BiteDiary keeps your visits, dishes, ratings, notes, and cravings in one calm place."
      desktopEyebrow="Food memory, organized"
      desktopTitle="Remember every restaurant worth returning to."
      headerActionHref="/signup"
      headerActionLabel="Sign up"
      headerPrompt="New to BiteDiary?"
      mobileTitle="Log in and keep your food story fresh."
    >
      <section className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-6 mb-4">
        <div className="mb-7">
          <div className="mb-5 flex items-center justify-between">
            <span className="rounded-full bg-accent-soft px-3 py-1.5 text-xs font-bold uppercase text-accent">
              Welcome back
            </span>
            <Link
              className="hidden text-sm font-bold text-accent hover:text-accent-hover lg:inline"
              href="/signup"
            >
              Sign up
            </Link>
          </div>
          <h2 className="font-display text-3xl font-semibold leading-tight text-ink-primary">
            Sign in to keep logging great meals.
          </h2>
          <p className="mt-3 text-sm leading-6 text-ink-secondary">
            Pick up where you left off with restaurants, dishes, notes, and
            ratings.
          </p>
        </div>

        <StatusMessage status={status} />

        <form
          className="space-y-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div>
            <label
              className="text-sm font-bold text-ink-primary"
              htmlFor="email"
            >
              Email
            </label>
            <div className="mt-2 flex min-h-12 items-center gap-3 rounded-control border border-border bg-surface-sunken px-4 transition focus-within:border-accent focus-within:bg-surface focus-within:ring-4 focus-within:ring-accent-soft">
              <Mail
                aria-hidden="true"
                className="shrink-0 text-ink-secondary"
                size={19}
              />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="min-w-0 flex-1 border-0 bg-transparent py-3 text-base text-ink-primary outline-none placeholder:text-ink-tertiary"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
              />
            </div>
            {errors.email ? (
              <p
                className="mt-2 text-sm font-semibold text-error"
                id="email-error"
              >
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <div>
            <label
              className="text-sm font-bold text-ink-primary"
              htmlFor="password"
            >
              Password
            </label>
            <div className="mt-2 flex min-h-12 items-center gap-3 rounded-control border border-border bg-surface-sunken px-4 transition focus-within:border-accent focus-within:bg-surface focus-within:ring-4 focus-within:ring-accent-soft">
              <LockKeyhole
                aria-hidden="true"
                className="shrink-0 text-ink-secondary"
                size={19}
              />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter password"
                className="min-w-0 flex-1 border-0 bg-transparent py-3 text-base text-ink-primary outline-none placeholder:text-ink-tertiary"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
                {...register("password")}
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control text-ink-secondary transition hover:bg-surface hover:text-ink-primary focus:outline-none focus:ring-4 focus:ring-accent-soft"
                type="button"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? (
                  <EyeOff aria-hidden="true" size={19} />
                ) : (
                  <Eye aria-hidden="true" size={19} />
                )}
              </button>
            </div>
            {errors.password ? (
              <p
                className="mt-2 text-sm font-semibold text-error"
                id="password-error"
              >
                {errors.password.message}
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <label
              className="flex items-center gap-2 text-sm font-semibold text-ink-secondary"
              htmlFor="remember"
            >
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 rounded border-border accent-accent"
                {...register("remember")}
              />
              Remember me
            </label>
            <Link
              className="text-sm font-bold text-accent hover:text-accent-hover"
              href="#"
            >
              Forgot password?
            </Link>
          </div>

          <button
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-accent px-5 py-3 text-base font-bold text-bg shadow-card transition hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent-soft disabled:cursor-wait disabled:opacity-70"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoaderCircle
                  aria-hidden="true"
                  className="animate-spin"
                  size={19}
                />
                Signing in
              </>
            ) : (
              <>
                Sign in
                <ArrowRight aria-hidden="true" size={19} />
              </>
            )}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase text-ink-tertiary">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        <button
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-control border border-border bg-surface px-4 py-3 text-sm font-bold text-ink-primary transition hover:bg-surface-sunken focus:outline-none focus:ring-4 focus:ring-accent-soft"
          type="button"
        >
          <Mail aria-hidden="true" size={18} />
          Continue with email link
        </button>
      </section>
    </AuthShell>
  );
}

function StatusMessage({ status }: { status: SubmitStatus }) {
  if (status === "success") {
    return (
      <div
        className="mb-5 flex items-start gap-3 rounded-control border border-success/30 bg-success/10 p-4 text-sm text-success"
        role="status"
      >
        <CheckCircle2
          aria-hidden="true"
          className="mt-0.5 shrink-0"
          size={18}
        />
        <p className="m-0 font-semibold">Signed in. Opening your diary...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        className="mb-5 flex items-start gap-3 rounded-control border border-error/30 bg-error/10 p-4 text-sm font-semibold text-error"
        role="alert"
      >
        <XCircle aria-hidden="true" className="mt-0.5 shrink-0" size={18} />
        <p className="m-0">Check the highlighted details and try again.</p>
      </div>
    );
  }

  return null;
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { z } from "zod";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  UserRound,
  XCircle,
} from "lucide-react";
import { AuthShell } from "./auth-shell";
import { ApiError, authApi } from "@/lib/api/client";

const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name"),
    email: z.string().trim().email("Enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm your password"),
    terms: z.boolean().refine((value) => value, "Accept the terms to continue"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignUpFormValues = z.infer<typeof signupSchema>;
type SubmitStatus = "idle" | "loading" | "success" | "error";

export default function SignUpPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<SubmitStatus>("idle");

  const {
    clearErrors,
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm<SignUpFormValues>({
    defaultValues: {
      confirmPassword: "",
      email: "",
      name: "",
      password: "",
      terms: false,
    },
  });

  async function onSubmit(values: SignUpFormValues) {
    clearErrors();
    const parsed = signupSchema.safeParse(values);

    if (!parsed.success) {
      setStatus("error");
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];

        if (typeof field === "string") {
          setError(field as keyof SignUpFormValues, {
            message: issue.message,
            type: "manual",
          });
        }
      });
      return;
    }

    setStatus("loading");
    try {
      await authApi.register({
        email: values.email,
        name: values.name,
        password: values.password,
      });

      clearErrors();
      setStatus("success");
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setStatus("error");

      setError("email", {
        message:
          error instanceof ApiError
            ? error.message
            : "Unable to create account. Please try again.",
        type: "manual",
      });
    }
  }

  const isLoading = status === "loading";

  return (
    <AuthShell
      badge="Start your diary"
      bottomActionHref="/login"
      bottomActionLabel="Sign in"
      bottomPrompt="Already have an account?"
      desktopDescription="Create a private place for restaurants, dishes, notes, and ratings before the memory fades."
      desktopEyebrow="Your food history starts here"
      desktopTitle="Build a diary of meals you will want to find again."
      headerActionHref="/login"
      headerActionLabel="Sign in"
      headerPrompt="Already tracking?"
      mobileTitle="Create your BiteDiary in under a minute."
    >
      <section className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-6 mb-4">
        <div className="mb-6">
          <div className="mb-5 flex items-center justify-between">
            <span className="rounded-full bg-accent-soft px-3 py-1.5 text-xs font-bold uppercase text-accent">
              New account
            </span>
            <Link
              className="hidden text-sm font-bold text-accent hover:text-accent-hover lg:inline"
              href="/login"
            >
              Sign in
            </Link>
          </div>
          <h2 className="font-display text-3xl font-semibold leading-tight text-ink-primary">
            Save your next great meal.
          </h2>
          <p className="mt-3 text-sm leading-6 text-ink-secondary">
            Add your details now. You can start logging restaurants right after.
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
              htmlFor="name"
            >
              Name
            </label>
            <div className="mt-2 flex min-h-12 items-center gap-3 rounded-control border border-border bg-surface-sunken px-4 transition focus-within:border-accent focus-within:bg-surface focus-within:ring-4 focus-within:ring-accent-soft">
              <UserRound
                aria-hidden="true"
                className="shrink-0 text-ink-secondary"
                size={19}
              />
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                className="min-w-0 flex-1 border-0 bg-transparent py-3 text-base text-ink-primary outline-none placeholder:text-ink-tertiary"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "name-error" : undefined}
                {...register("name")}
              />
            </div>
            {errors.name ? (
              <p
                className="mt-2 text-sm font-semibold text-error"
                id="name-error"
              >
                {errors.name.message}
              </p>
            ) : null}
          </div>

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

          <PasswordField
            autoComplete="new-password"
            error={errors.password?.message}
            id="password"
            label="Password"
            placeholder="Create password"
            register={register("password")}
            showPassword={showPassword}
            togglePassword={() => setShowPassword((current) => !current)}
          />

          <PasswordField
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            id="confirmPassword"
            label="Confirm password"
            placeholder="Repeat password"
            register={register("confirmPassword")}
            showPassword={showConfirmPassword}
            togglePassword={() => setShowConfirmPassword((current) => !current)}
          />

          <label className="flex items-start gap-3 rounded-control border border-border bg-bg p-3 text-sm font-semibold text-ink-secondary">
            <input
              className="mt-1 h-4 w-4 rounded border-border accent-accent"
              type="checkbox"
              aria-describedby={errors.terms ? "terms-error" : undefined}
              {...register("terms")}
            />
            <span>
              Keep my BiteDiary private and create my account with these
              details.
              {errors.terms ? (
                <span
                  className="mt-1 block text-sm font-semibold text-error"
                  id="terms-error"
                >
                  {errors.terms.message}
                </span>
              ) : null}
            </span>
          </label>

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
                Creating account
              </>
            ) : (
              <>
                Create account
                <ArrowRight aria-hidden="true" size={19} />
              </>
            )}
          </button>
        </form>
      </section>
    </AuthShell>
  );
}

type PasswordFieldProps = {
  autoComplete: string;
  error?: string;
  id: "password" | "confirmPassword";
  label: string;
  placeholder: string;
  register: UseFormRegisterReturn;
  showPassword: boolean;
  togglePassword: () => void;
};

function PasswordField({
  autoComplete,
  error,
  id,
  label,
  placeholder,
  register,
  showPassword,
  togglePassword,
}: PasswordFieldProps) {
  return (
    <div>
      <label className="text-sm font-bold text-ink-primary" htmlFor={id}>
        {label}
      </label>
      <div className="mt-2 flex min-h-12 items-center gap-3 rounded-control border border-border bg-surface-sunken px-4 transition focus-within:border-accent focus-within:bg-surface focus-within:ring-4 focus-within:ring-accent-soft">
        <LockKeyhole
          aria-hidden="true"
          className="shrink-0 text-ink-secondary"
          size={19}
        />
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="min-w-0 flex-1 border-0 bg-transparent py-3 text-base text-ink-primary outline-none placeholder:text-ink-tertiary"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...register}
        />
        <button
          aria-label={
            showPassword
              ? `Hide ${label.toLowerCase()}`
              : `Show ${label.toLowerCase()}`
          }
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control text-ink-secondary transition hover:bg-surface hover:text-ink-primary focus:outline-none focus:ring-4 focus:ring-accent-soft"
          type="button"
          onClick={togglePassword}
        >
          {showPassword ? (
            <EyeOff aria-hidden="true" size={19} />
          ) : (
            <Eye aria-hidden="true" size={19} />
          )}
        </button>
      </div>
      {error ? (
        <p className="mt-2 text-sm font-semibold text-error" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
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
        <p className="m-0 font-semibold">
          Account ready. Opening your diary...
        </p>
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

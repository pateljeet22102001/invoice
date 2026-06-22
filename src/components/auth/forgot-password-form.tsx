"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction, type AuthFormState } from "@/actions/auth";
import {
  AuthError,
  AuthField,
  AuthSubmitButton,
  AuthSuccess,
} from "@/components/auth/auth-fields";

const initialState: AuthFormState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    initialState,
  );

  if (state.success) {
    return (
      <div className="space-y-4">
        <AuthSuccess message={state.success} />
        <Link
          href="/login"
          className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <AuthError message={state.error} />

      <p className="text-sm text-slate-600">
        Enter your registered email and choose a new password.
      </p>

      <AuthField
        label="Email"
        id="email"
        type="email"
        autoComplete="email"
        placeholder="you@company.in"
        required
      />

      <AuthField
        label="New password"
        id="password"
        type="password"
        autoComplete="new-password"
        placeholder="Minimum 8 characters"
        required
      />

      <AuthField
        label="Confirm new password"
        id="confirmPassword"
        type="password"
        autoComplete="new-password"
        placeholder="Repeat new password"
        required
      />

      <AuthSubmitButton pending={pending}>Reset Password</AuthSubmitButton>

      <p className="text-center text-sm text-slate-600">
        Remember your password?{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          Sign in
        </Link>
      </p>
    </form>
  );
}

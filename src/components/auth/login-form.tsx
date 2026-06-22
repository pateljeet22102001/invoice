"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type AuthFormState } from "@/actions/auth";
import {
  AuthError,
  AuthField,
  AuthSubmitButton,
} from "@/components/auth/auth-fields";

const initialState: AuthFormState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <AuthError message={state.error} />

      <AuthField
        label="Email"
        id="email"
        type="email"
        autoComplete="email"
        placeholder="you@company.in"
        required
      />

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            Password <span className="text-rose-500">*</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          required
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      <AuthSubmitButton pending={pending}>Sign In</AuthSubmitButton>

      <p className="text-center text-sm text-slate-600">
        New business?{" "}
        <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
          Create account
        </Link>
      </p>
    </form>
  );
}

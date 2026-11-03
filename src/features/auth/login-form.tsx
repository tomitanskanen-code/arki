"use client"

import { useActionState } from "react"

import { type LoginState, loginAction } from "./actions"

const inputClass =
  "h-12 w-full rounded-xl border border-input bg-surface px-4 text-base placeholder:text-muted-foreground"

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  )

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium">
          Sähköposti
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          inputMode="email"
          defaultValue={state.email}
          className={inputClass}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium">
          Salasana
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-xl bg-primary text-[15px] font-medium text-primary-foreground transition-opacity disabled:opacity-50"
      >
        {pending ? "Kirjaudutaan…" : "Kirjaudu"}
      </button>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  )
}

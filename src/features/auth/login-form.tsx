"use client"

import { useActionState } from "react"

import { type LoginState, loginAction } from "./actions"

const inputClass =
  "h-12 w-full rounded-xl border border-input bg-surface px-4 text-base placeholder:text-muted-foreground"
const buttonClass =
  "h-12 w-full rounded-xl bg-primary text-[15px] font-medium text-primary-foreground transition-opacity disabled:opacity-50"

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    { step: "email" },
  )

  return (
    <form action={formAction} className="space-y-4">
      {state.step === "email" ? (
        <>
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              Sähköposti
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              defaultValue={state.email}
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            name="intent"
            value="send"
            disabled={pending}
            className={buttonClass}
          >
            {pending ? "Lähetetään…" : "Lähetä kirjautumiskoodi"}
          </button>
        </>
      ) : (
        <>
          <p className="text-[15px] text-muted-foreground">
            Jos osoitteella{" "}
            <span className="text-foreground">{state.email}</span> on
            käyttöoikeus, sinne lähetettiin kirjautumiskoodi.
          </p>
          <div className="space-y-2">
            <label htmlFor="code" className="block text-sm font-medium">
              Koodi
            </label>
            <input
              id="code"
              name="code"
              required
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9 ]{6,12}"
              maxLength={12}
              autoFocus
              className={`${inputClass} tracking-[0.3em] tabular-nums`}
            />
          </div>
          <button
            type="submit"
            name="intent"
            value="verify"
            disabled={pending}
            className={buttonClass}
          >
            {pending ? "Kirjaudutaan…" : "Kirjaudu"}
          </button>
          <button
            type="submit"
            name="intent"
            value="back"
            formNoValidate
            className="min-h-11 w-full text-sm text-muted-foreground"
          >
            Vaihda sähköpostiosoite
          </button>
        </>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  )
}

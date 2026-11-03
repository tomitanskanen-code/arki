import { signOutAction } from "@/features/auth/actions"

/** Näytetään, jos kirjautunutta tunnusta ei ole vielä liitetty perheeseen. */
export function NoFamilyNotice({ email }: { email: string | null }) {
  return (
    <div className="pt-16">
      <h1 className="text-2xl font-light tracking-tight">
        Tunnusta ei ole liitetty perheeseen
      </h1>
      <p className="mt-3 leading-relaxed text-muted-foreground">
        Kirjautuminen onnistui{email ? ` (${email})` : ""}, mutta tunnusta ei
        ole vielä lisätty perheen jäseneksi. Ylläpitäjä tekee liitoksen
        Supabasessa (ks. docs/KAYTTOONOTTO.md).
      </p>
      <form action={signOutAction} className="mt-6">
        <button
          type="submit"
          className="h-11 rounded-xl border border-input px-5 text-sm font-medium"
        >
          Kirjaudu ulos
        </button>
      </form>
    </div>
  )
}

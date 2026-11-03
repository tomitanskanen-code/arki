import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

import {
  isSupabaseConfigured,
  supabasePublishableKey,
  supabaseUrl,
} from "@/lib/supabase/config"

/**
 * Proxy (ent. middleware) ajetaan ennen jokaista sivupyyntöä:
 * 1. päivittää Supabase-istunnon evästeet tarvittaessa,
 * 2. ohjaa kirjautumattoman käyttäjän kirjautumissivulle.
 *
 * Varsinainen pääsynhallinta tehdään silti tietokannassa (RLS): proxy on
 * käyttömukavuutta, ei ainoa suoja.
 */
const LOGIN_PATH = "/kirjaudu"

export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.next()

  let response = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        )
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
        // Estää istuntoevästeitä sisältävän vastauksen välimuistituksen.
        Object.entries(headers).forEach(([key, value]) =>
          response.headers.set(key, value),
        )
      },
    },
  })

  // getClaims tarkistaa tunnisteen allekirjoituksen (älä käytä getSession).
  const { data } = await supabase.auth.getClaims()
  const signedIn = Boolean(data?.claims)
  const onLoginPage = request.nextUrl.pathname === LOGIN_PATH

  if (!signedIn && !onLoginPage) return redirect(request, response, LOGIN_PATH)
  if (signedIn && onLoginPage) return redirect(request, response, "/")
  return response
}

/** Uudelleenohjaus, joka säilyttää päivitetyt istuntoevästeet. */
function redirect(request: NextRequest, from: NextResponse, path: string) {
  const to = NextResponse.redirect(new URL(path, request.url))
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie))
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = from.headers.get(header)
    if (value) to.headers.set(header, value)
  }
  return to
}

export const config = {
  // Ei staattisille tiedostoille, ikoneille, manifestille eikä service workerille:
  // iOS hakee kotinäytön ikonin ilman kirjautumista.
  matcher: [
    "/((?!_next/static|_next/image|sw\\.js|manifest\\.webmanifest|icon|apple-icon|pwa-icon).*)",
  ],
}

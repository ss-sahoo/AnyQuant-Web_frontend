import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This app defines no Server Actions ("use server") and no API routes — every
// backend call goes to the external API through the Fetch wrapper in
// app/usefetch.js. So any POST that Next would hand to its Server Action
// handler is bogus by definition; in practice it is vulnerability scanners
// probing with `Next-Action: x` or a `$ACTION_ID_*` form field.
//
// On Next < 15.3 those requests hit an unguarded lookup in createServerModuleMap
// (node_modules/next/dist/server/app-render/action-utils.js), which throws
// "Cannot read properties of undefined (reading 'workers')" and returns a 500.
// Even once that is patched upstream, Next still logs "Failed to find Server
// Action" for an unknown id, so we reject these before they reach routing.
//
// If Server Actions are ever added to this app, remove this middleware.
export function middleware(request: NextRequest) {
  if (request.method !== "POST") {
    return NextResponse.next()
  }

  const contentType = request.headers.get("content-type") ?? ""
  const looksLikeServerAction =
    request.headers.has("next-action") ||
    contentType.startsWith("multipart/form-data") ||
    contentType.startsWith("application/x-www-form-urlencoded")

  if (looksLikeServerAction) {
    return new NextResponse(null, { status: 400 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
}

import { renderAppIcon } from "@/lib/app-icon"

// Web app manifestin ikonit. Luodaan build-vaiheessa staattisiksi tiedostoiksi.
const SIZES = ["192", "512"]

export function generateStaticParams() {
  return SIZES.map((size) => ({ size }))
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/pwa-icon/[size]">,
) {
  const { size } = await params
  if (!SIZES.includes(size)) {
    return new Response("Not found", { status: 404 })
  }
  return renderAppIcon(Number(size))
}

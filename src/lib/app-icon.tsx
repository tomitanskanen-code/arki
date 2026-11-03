import { ImageResponse } from "next/og"

/**
 * Arkin sovellusikoni: aurinko horisontin yllä tummanvihreällä pohjalla.
 * Kuvio on keskellä ja pieni, jotta se mahtuu myös Androidin "maskable"-
 * ikonin turva-alueelle. Ikoni piirretään koodista, joten erillisiä
 * kuvatiedostoja ei tarvita.
 */
export function renderAppIcon(size: number) {
  const unit = size / 100
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#2f3b35",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 26 * unit,
            height: 26 * unit,
            borderRadius: "50%",
            background: "#c29a4a",
            marginBottom: 6 * unit,
          }}
        />
        <div
          style={{
            width: 46 * unit,
            height: 3.6 * unit,
            borderRadius: size,
            background: "#f7f4ee",
            marginBottom: 4 * unit,
          }}
        />
        <div
          style={{
            width: 28 * unit,
            height: 3.6 * unit,
            borderRadius: size,
            background: "rgba(247, 244, 238, 0.55)",
          }}
        />
      </div>
    </div>,
    { width: size, height: size },
  )
}

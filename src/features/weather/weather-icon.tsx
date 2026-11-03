import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  type LucideIcon,
  Moon,
  Snowflake,
  Sun,
} from "lucide-react"

import type { WeatherCondition } from "@/domain/types"

const DAY_ICONS: Record<WeatherCondition, LucideIcon> = {
  clear: Sun,
  "mostly-clear": CloudSun,
  "partly-cloudy": CloudSun,
  cloudy: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  "freezing-rain": CloudHail,
  snow: Snowflake,
  "rain-showers": CloudRain,
  "snow-showers": CloudSnow,
  thunderstorm: CloudLightning,
}

export function WeatherIcon({
  condition,
  isDay,
  className,
}: {
  condition: WeatherCondition
  isDay: boolean
  className?: string
}) {
  let Icon = DAY_ICONS[condition]
  if (!isDay && condition === "clear") Icon = Moon
  if (!isDay && (condition === "mostly-clear" || condition === "partly-cloudy"))
    Icon = CloudMoon
  return <Icon aria-hidden className={className} strokeWidth={1.4} />
}

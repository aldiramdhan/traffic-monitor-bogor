import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function getTrafficLevelColor(level: string): string {
  switch (level) {
    case 'Lancar':
      return 'text-emerald-600 bg-emerald-50'
    case 'Ramai':
      return 'text-yellow-600 bg-yellow-50'
    case 'Padat':
      return 'text-red-600 bg-red-50'
    default:
      return 'text-slate-600 bg-slate-50'
  }
}

export function getTrafficLevelIcon(level: string): string {
  switch (level) {
    case 'Lancar':
      return '🟢'
    case 'Ramai':
      return '🟡'
    case 'Padat':
      return '🔴'
    default:
      return '⚪'
  }
}

export function generateGoogleMapsUrl(location: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location + ', Bogor')}`
}

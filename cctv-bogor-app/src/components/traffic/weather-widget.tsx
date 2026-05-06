'use client'

import React, { useEffect, useState } from 'react'
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, Loader2 } from 'lucide-react'

export function WeatherWidget({ isSidebarOpen }: { isSidebarOpen: boolean }) {
  const [temp, setTemp] = useState<number | null>(null)
  const [code, setCode] = useState<number | null>(null)

  useEffect(() => {
    // Koordinat Bogor: -6.5944, 106.7892
    fetch('https://api.open-meteo.com/v1/forecast?latitude=-6.5944&longitude=106.7892&current_weather=true')
      .then(res => res.json())
      .then(data => {
        if (data && data.current_weather) {
          setTemp(Math.round(data.current_weather.temperature))
          setCode(data.current_weather.weathercode)
        }
      })
      .catch(err => console.error('Gagal mengambil cuaca:', err))
  }, [])

  const getWeatherIcon = (c: number | null) => {
    if (c === null) return <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
    if (c === 0) return <Sun className="h-5 w-5 text-yellow-400" />
    if ([1, 2, 3].includes(c)) return <Cloud className="h-5 w-5 text-slate-300" />
    if ([45, 48].includes(c)) return <CloudFog className="h-5 w-5 text-slate-400" />
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(c)) return <CloudRain className="h-5 w-5 text-blue-400" />
    if ([71, 73, 75, 77, 85, 86].includes(c)) return <CloudSnow className="h-5 w-5 text-white" />
    if ([95, 96, 99].includes(c)) return <CloudLightning className="h-5 w-5 text-yellow-500" />
    return <Sun className="h-5 w-5 text-yellow-400" />
  }

  const getWeatherStatus = (c: number | null) => {
    if (c === null) return 'Memuat...'
    if (c === 0) return 'Cerah'
    if ([1, 2, 3].includes(c)) return 'Berawan'
    if ([45, 48].includes(c)) return 'Berkabut'
    if ([51, 53, 55, 56, 57].includes(c)) return 'Gerimis'
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(c)) return 'Hujan'
    if ([71, 73, 75, 77, 85, 86].includes(c)) return 'Bersalju'
    if ([95, 96, 99].includes(c)) return 'Badai Petir'
    return 'Cerah'
  }

  return (
    <div
      className={`
        group
        absolute top-4 z-[800]
        flex items-center gap-3 h-14
        bg-[#1e1e1e] text-slate-200
        rounded-2xl px-4 shadow-[0_4px_16px_rgba(0,0,0,0.4)] cursor-pointer
        hover:shadow-[0_6px_20px_rgba(0,0,0,0.5)] hover:bg-[#252525]
        transition-all duration-300 cubic-bezier(0.2,0,0,1)
        ${isSidebarOpen ? 'left-[340px]' : 'left-[100px]'}
      `}
    >
      {getWeatherIcon(code)}
      {temp !== null ? (
        <span className="text-white font-bold text-sm">{temp}&deg;</span>
      ) : (
        <span className="text-slate-400 text-sm">--&deg;</span>
      )}

      {/* Custom Tooltip */}
      <div className="
        absolute top-full left-1/2 -translate-x-1/2 mt-2
        opacity-0 group-hover:opacity-100
        transition-opacity duration-200 pointer-events-none
        bg-slate-700 text-slate-100 text-xs font-medium
        px-3 py-1.5 rounded-md shadow-md
        whitespace-nowrap
      ">
        {getWeatherStatus(code)}
      </div>
    </div>
  )
}

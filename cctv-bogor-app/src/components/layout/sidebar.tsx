'use client'

import React, { useEffect } from 'react'
import {
  Video, Eye, AlertCircle, Zap, MapPin, Activity, Info,
  ChevronRight, ChevronLeft, Camera, Layers, Settings
} from 'lucide-react'
import { cctvLocations } from '@/data/cctv-locations'

// ─── Custom Icons ─────────────────────────────────────────────────────────────
const GeminiIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 0C11.5432 6.7027 6.7027 11.5432 0 12C6.7027 12.4568 11.5432 17.2973 12 24C12.4568 17.2973 17.2973 12.4568 24 12C17.2973 11.5432 12.4568 6.7027 12 0Z" fill="currentColor"/>
  </svg>
)

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  onLocationSelect?: (lat: number, lon: number, id: string) => void
}

export function Sidebar({ isOpen, onToggle, onLocationSelect }: SidebarProps) {
  const onlineCount = cctvLocations.filter(cctv => cctv.status === 'online').length
  const maintenanceCount = cctvLocations.filter(cctv => cctv.status === 'maintenance').length

  // ESC to collapse
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onToggle()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onToggle])

  const navIcons = [
    { icon: Camera,  label: 'Kamera CCTV' },
    { icon: Layers,  label: 'Layer Peta' },
    { icon: Activity, label: 'Statistik' },
    { icon: Settings, label: 'Pengaturan' },
  ]

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50
          flex flex-col
          bg-[#1e1e1e] text-slate-200
          shadow-[4px_0_16px_rgba(0,0,0,0.4)] rounded-r-3xl
          transition-all duration-300 cubic-bezier(0.2,0,0,1)
          ${isOpen ? 'w-[320px]' : 'w-[80px]'}
        `}
      >
        {/* Logo / Collapse Toggle */}
        <div className={`flex items-center h-[72px] flex-shrink-0 ${isOpen ? 'px-4 justify-between' : 'justify-center'}`}>
          {isOpen && (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
                <GeminiIcon className="h-6 w-6 text-white" />
              </div>
              <div className="leading-tight overflow-hidden">
                <p className="text-sm font-bold text-white truncate">Traffic Monitor</p>
                <p className="text-xs text-blue-400 truncate">Kota Bogor</p>
              </div>
            </div>
          )}
          <button
            onClick={onToggle}
            className="w-8 h-8 rounded-lg hover:bg-blue-900/40 flex items-center justify-center text-blue-400 hover:text-blue-200 transition-colors flex-shrink-0"
            title={isOpen ? 'Tutup panel' : 'Buka panel'}
          >
            {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        {/* Live badge */}
        <div className={`flex items-center gap-2 px-4 py-3 flex-shrink-0 ${!isOpen && 'justify-center'}`}>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            {isOpen && <span className="text-xs font-semibold text-blue-300">LIVE</span>}
          </div>
          {isOpen && (
            <span className="text-xs text-blue-400 ml-auto">
              <span className="font-bold text-white">{onlineCount}</span>/{cctvLocations.length} online
            </span>
          )}
        </div>

        {/* Nav icons (always visible) */}
        <div className={`flex flex-col gap-2 py-2 px-3 flex-shrink-0`}>
          {navIcons.map(({ icon: Icon, label }) => (
            <button
              key={label}
              title={label}
              className={`
                flex items-center gap-4 rounded-full px-4 py-3.5
                text-slate-300 hover:text-white hover:bg-slate-700/50
                transition-colors duration-200
                ${!isOpen && 'justify-center px-0 w-12 h-12 mx-auto'}
              `}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {isOpen && <span className="text-xs font-medium truncate">{label}</span>}
            </button>
          ))}
        </div>

        {/* Expanded content */}
        {isOpen && (
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-900 scrollbar-track-transparent">
            <div className="p-3 space-y-4">

              {/* Stats */}
              <div>
                <p className="text-sm font-medium text-slate-400 mb-3 ml-2 flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Statistik CCTV
                </p>
                <div className="grid grid-cols-2 gap-3 px-1">
                  {[
                    { label: 'Total', value: cctvLocations.length, icon: Video, color: 'text-blue-400', bg: 'bg-slate-800' },
                    { label: 'Online', value: onlineCount, icon: Eye, color: 'text-green-400', bg: 'bg-slate-800' },
                    { label: 'Maint.', value: maintenanceCount, icon: AlertCircle, color: 'text-amber-400', bg: 'bg-slate-800' },
                    { label: 'AI Ready', value: '✓', icon: Zap, color: 'text-purple-400', bg: 'bg-slate-800' },
                  ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className={`${bg} rounded-2xl p-4 shadow-sm`}>
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`h-4 w-4 ${color}`} />
                        <span className="text-xs font-medium text-slate-400">{label}</span>
                      </div>
                      <div className={`text-xl font-medium ${color}`}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CCTV List */}
              <div className="mt-6">
                <p className="text-sm font-medium text-slate-400 mb-3 ml-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> CCTV Online ({onlineCount})
                </p>
                <div className="space-y-2">
                  {cctvLocations
                    .filter(cctv => cctv.status === 'online')
                    .map((cctv) => (
                      <button
                        key={cctv.id}
                        className="w-full text-left bg-transparent hover:bg-slate-800 rounded-full px-4 py-3 transition-colors duration-200 group flex items-center gap-4"
                        onClick={() => onLocationSelect?.(cctv.lat, cctv.lon, cctv.id)}
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-slate-700 flex items-center justify-center flex-shrink-0 transition-colors">
                          <Video className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white">{cctv.nama}</p>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{cctv.description}</p>
                        </div>
                      </button>
                    ))}
                </div>
              </div>

              {/* Features */}
              <div className="mt-6 mb-4">
                <p className="text-sm font-medium text-slate-400 mb-3 ml-2 flex items-center gap-2">
                  <Info className="h-4 w-4" /> Fitur
                </p>
                <div className="space-y-3 px-1">
                  <div className="bg-slate-800 rounded-2xl p-4">
                    <p className="text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-purple-400" /> AI Analysis
                    </p>
                    {['Analisis lalu lintas real-time', 'Identifikasi kemacetan', 'Rekomendasi rute alternatif'].map(f => (
                      <div key={f} className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                        {f}
                      </div>
                    ))}
                  </div>
                  <div className="bg-slate-800 rounded-2xl p-4">
                    <p className="text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
                      <Video className="h-4 w-4 text-blue-400" /> Live Streaming
                    </p>
                    {['Video streaming HLS', 'Kontrol playback', 'Optimized untuk mobile'].map(f => (
                      <div key={f} className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Bottom icon strip when collapsed */}
        {!isOpen && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 pb-6">
            <div className="flex flex-col items-center gap-1.5" title={`${onlineCount} CCTV Online`}>
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shadow-sm">
                <Video className="h-4 w-4 text-blue-400" />
              </div>
              <span className="text-[10px] text-slate-400 font-medium">{onlineCount}</span>
            </div>
            <div className="flex flex-col items-center gap-1.5" title="Pantauan Aktif">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shadow-sm">
                <Eye className="h-4 w-4 text-green-400" />
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}

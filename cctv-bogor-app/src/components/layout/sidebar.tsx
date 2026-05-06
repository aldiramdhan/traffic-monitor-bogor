'use client'

import React, { useEffect } from 'react'
import {
  Video, Eye, AlertCircle, Zap, MapPin, Activity, Info,
  ChevronRight, ChevronLeft, Camera, Layers, Settings
} from 'lucide-react'
import { cctvLocations } from '@/data/cctv-locations'

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
          bg-[#0d1b2e]/95 backdrop-blur-md
          border-r border-blue-900/40
          shadow-2xl
          transition-all duration-300 ease-in-out
          ${isOpen ? 'w-72' : 'w-14'}
        `}
      >
        {/* Logo / Collapse Toggle */}
        <div className={`flex items-center h-14 border-b border-blue-900/40 flex-shrink-0 ${isOpen ? 'px-4 justify-between' : 'justify-center'}`}>
          {isOpen && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <div className="leading-tight overflow-hidden">
                <p className="text-xs font-bold text-white truncate">Traffic Monitor</p>
                <p className="text-[10px] text-blue-400 truncate">Kota Bogor</p>
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
        <div className={`flex items-center gap-2 px-3 py-2 border-b border-blue-900/40 flex-shrink-0 ${!isOpen && 'justify-center'}`}>
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
        <div className={`flex flex-col gap-1 py-2 px-2 border-b border-blue-900/40 flex-shrink-0`}>
          {navIcons.map(({ icon: Icon, label }) => (
            <button
              key={label}
              title={label}
              className={`
                flex items-center gap-3 rounded-lg px-2 py-2
                text-blue-400 hover:text-white hover:bg-blue-800/40
                transition-all duration-150
                ${!isOpen && 'justify-center'}
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
                <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Activity className="h-3 w-3" /> Statistik CCTV
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Total', value: cctvLocations.length, icon: Video, color: 'text-blue-400' },
                    { label: 'Online', value: onlineCount, icon: Eye, color: 'text-blue-300' },
                    { label: 'Maint.', value: maintenanceCount, icon: AlertCircle, color: 'text-amber-400' },
                    { label: 'AI Ready', value: '✓', icon: Zap, color: 'text-blue-400' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-blue-950/40 border border-blue-900/40 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <Icon className={`h-3.5 w-3.5 ${color}`} />
                        <span className="text-[10px] text-blue-500">{label}</span>
                      </div>
                      <div className={`text-lg font-bold ${color}`}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CCTV List */}
              <div>
                <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> CCTV Online ({onlineCount})
                </p>
                <div className="space-y-1.5">
                  {cctvLocations
                    .filter(cctv => cctv.status === 'online')
                    .map((cctv) => (
                      <button
                        key={cctv.id}
                        className="w-full text-left bg-blue-950/30 border border-blue-900/30 hover:border-blue-600/60 hover:bg-blue-900/30 rounded-xl p-3 transition-all duration-200 group"
                        onClick={() => onLocationSelect?.(cctv.lat, cctv.lon, cctv.id)}
                      >
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 w-5 h-5 rounded-full bg-blue-600/20 border border-blue-600/40 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600/40 transition-colors">
                            <Video className="h-2.5 w-2.5 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-100 truncate group-hover:text-white">{cctv.nama}</p>
                            <p className="text-[10px] text-blue-500 truncate mt-0.5">{cctv.description}</p>
                          </div>
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse mt-1.5 flex-shrink-0" />
                        </div>
                      </button>
                    ))}
                </div>
              </div>

              {/* Features */}
              <div>
                <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Info className="h-3 w-3" /> Fitur
                </p>
                <div className="space-y-2">
                  <div className="bg-blue-950/30 border border-blue-900/30 rounded-xl p-3">
                    <p className="text-xs font-semibold text-white mb-1.5 flex items-center gap-1.5">
                      <Zap className="h-3 w-3 text-blue-400" /> AI Analysis
                    </p>
                    {['Analisis lalu lintas real-time', 'Identifikasi kemacetan', 'Rekomendasi rute alternatif'].map(f => (
                      <div key={f} className="flex items-center gap-1.5 text-[10px] text-blue-400 mb-0.5">
                        <div className="w-1 h-1 rounded-full bg-blue-500" />
                        {f}
                      </div>
                    ))}
                  </div>
                  <div className="bg-blue-950/30 border border-blue-900/30 rounded-xl p-3">
                    <p className="text-xs font-semibold text-white mb-1.5 flex items-center gap-1.5">
                      <Video className="h-3 w-3 text-blue-400" /> Live Streaming
                    </p>
                    {['Video streaming HLS', 'Kontrol playback', 'Optimized untuk mobile'].map(f => (
                      <div key={f} className="flex items-center gap-1.5 text-[10px] text-blue-400 mb-0.5">
                        <div className="w-1 h-1 rounded-full bg-blue-500" />
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
          <div className="flex-1 flex flex-col items-center justify-center gap-4 pb-6">
            <div className="flex flex-col items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center">
                <Video className="h-3 w-3 text-blue-400" />
              </div>
              <span className="text-[9px] text-blue-600 font-bold">{onlineCount}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-blue-900/40 flex items-center justify-center">
                <Eye className="h-3 w-3 text-blue-500" />
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}

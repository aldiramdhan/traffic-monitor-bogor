'use client'

import React, { useEffect } from 'react'
import { X, Video, Eye, AlertCircle, Zap, MapPin, Activity, Info } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cctvLocations } from '@/data/cctv-locations'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  onLocationSelect?: (lat: number, lon: number, id: string) => void
}

export function Sidebar({ isOpen, onClose, onLocationSelect }: SidebarProps) {
  const onlineCount = cctvLocations.filter(cctv => cctv.status === 'online').length
  const maintenanceCount = cctvLocations.filter(cctv => cctv.status === 'maintenance').length

  // Handle ESC key to close sidebar
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when sidebar is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden cursor-pointer backdrop-blur-sm animate-in fade-in duration-300"
          onClick={onClose}
          aria-label="Tutup panel informasi"
          title="Klik untuk menutup"
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 right-0 h-full bg-slate-900 border-l border-slate-800 z-50 
          w-80 lg:w-96 overflow-y-auto shadow-xl
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 z-10">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-50">Panel Informasi</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              title="Tutup panel informasi"
              className="h-9 w-9 p-0 hover:bg-red-950/50 hover:text-red-400 text-slate-400 hover:border-red-900/50 border border-transparent transition-all duration-200 rounded-full bg-slate-800 hover:shadow-md"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">

          {/* Statistics Cards */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Statistik CCTV
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <Video className="h-4 w-4 text-slate-400" />
                  <span className="text-xs text-slate-400">Total</span>
                </div>
                <div className="text-xl font-bold mt-1 text-slate-50">{cctvLocations.length}</div>
              </Card>

              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <Eye className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs text-slate-400">Online</span>
                </div>
                <div className="text-xl font-bold text-emerald-500 mt-1">{onlineCount}</div>
              </Card>

              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span className="text-xs text-slate-400">Maintenance</span>
                </div>
                <div className="text-xl font-bold text-yellow-500 mt-1">{maintenanceCount}</div>
              </Card>

              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <span className="text-xs text-slate-400">AI Ready</span>
                </div>
                <div className="text-xl font-bold text-blue-500 mt-1">Ready</div>
              </Card>
            </div>
          </div>

          {/* CCTV Online List */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              CCTV Online ({onlineCount})
            </h3>
            
            <div className="space-y-2 max-h-64 overflow-y-auto sidebar-scroll">
              {cctvLocations
                .filter(cctv => cctv.status === 'online')
                .map((cctv) => (
                <Card 
                  key={cctv.id} 
                  className="p-3 cursor-pointer hover:bg-slate-800 hover:border-emerald-600/50 transition-all duration-200 hover:shadow-md active:scale-[0.98]"
                  onClick={() => {
                    onLocationSelect?.(cctv.lat, cctv.lon, cctv.id)
                    onClose()
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-slate-50 truncate">
                        {cctv.nama}
                      </h4>
                      <p className="text-xs text-slate-400 truncate mt-1">
                        {cctv.description}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex items-center gap-2">
                      <Badge variant="success" className="text-xs px-1">
                        ● Online
                      </Badge>
                      <MapPin className="h-3 w-3 text-emerald-500" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Features Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Fitur Aplikasi
            </h3>
            
            <Card className="p-3">
              <h4 className="font-medium text-sm text-slate-50 mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-500" />
                AI Analysis
              </h4>
              <div className="space-y-1 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                  <span>Analisis lalu lintas real-time</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                  <span>Identifikasi kemacetan</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                  <span>Rekomendasi rute alternatif</span>
                </div>
              </div>
            </Card>

            <Card className="p-3">
              <h4 className="font-medium text-sm text-slate-50 mb-2 flex items-center gap-2">
                <Video className="h-4 w-4 text-blue-500" />
                Live Streaming
              </h4>
              <div className="space-y-1 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                  <span>Video streaming HLS</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                  <span>Kontrol playback</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                  <span>Optimized untuk mobile</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </aside>
    </>
  )
}

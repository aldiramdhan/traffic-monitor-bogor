'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Sidebar } from '@/components/layout/sidebar'
import { SearchBar } from '@/components/traffic/search-bar'
import { CCTVDetailPanel } from '@/components/traffic/cctv-detail-panel'
import { WeatherWidget } from '@/components/traffic/weather-widget'
import { CompassWidget } from '@/components/traffic/compass-widget'
import { cctvLocations } from '@/data/cctv-locations'
import { CCTVLocation } from '@/types'
import { ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { InfoModal } from '@/components/traffic/info-modal'
// Dynamic import — no SSR for Leaflet
const TrafficMap = dynamic(
  () => import('@/components/traffic/traffic-map-clean-modern'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#111114] flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="relative flex items-center justify-center">
            {/* Background track */}
            <div className="absolute w-12 h-12 rounded-full border-4 border-white/5" />
            {/* Circular progress */}
            <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-slate-300 text-[15px] tracking-wide font-medium">Memuat peta...</p>
        </div>
      </div>
    ),
  }
)

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<CCTVLocation | null>(null)
  const [isInfoOpen, setIsInfoOpen] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const handleSelect = (loc: CCTVLocation | null) => {
    setSelectedLocation(loc)
    setIsSidebarOpen(false) // close sidebar so panel is unobstructed
  }

  const handleClose = () => setSelectedLocation(null)

  const handleNext = () => {
    if (!selectedLocation) return
    const currentIndex = cctvLocations.findIndex((l: CCTVLocation) => l.id === selectedLocation.id)
    if (currentIndex === -1) return
    const nextIndex = (currentIndex + 1) % cctvLocations.length
    setSelectedLocation(cctvLocations[nextIndex])
  }

  const handlePrev = () => {
    if (!selectedLocation) return
    const currentIndex = cctvLocations.findIndex((l: CCTVLocation) => l.id === selectedLocation.id)
    if (currentIndex === -1) return
    const prevIndex = (currentIndex - 1 + cctvLocations.length) % cctvLocations.length
    setSelectedLocation(cctvLocations[prevIndex])
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#111114] flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="relative flex items-center justify-center">
            {/* Background track */}
            <div className="absolute w-12 h-12 rounded-full border-4 border-white/5" />
            {/* Circular progress */}
            <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-slate-300 text-[15px] tracking-wide font-medium">Memuat aplikasi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#111114] overflow-hidden relative">

      {/* Full-screen Map */}
      <div className="absolute inset-0">
        <TrafficMap
          selectedLocation={selectedLocation}
          onLocationSelect={handleSelect}
          onPopupClose={handleClose}
          sidebarWidth={isSidebarOpen ? 288 : 56}
          panelWidth={selectedLocation ? 320 : 0}
        />
      </div>

      {/* Floating Left Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(prev => !prev)}
        onLocationSelect={(lat, lon, id) => {
          const loc = cctvLocations.find((c: CCTVLocation) => c.id === id)
          if (loc) handleSelect(loc)
        }}
      />

      {/* Floating Search Bar — dynamically centered based on active panels */}
      <div 
        className={`
          absolute top-4 z-[800] pointer-events-none flex justify-center
          transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]
          ${isSidebarOpen ? 'left-72' : 'left-14'}
          ${selectedLocation ? 'right-80 xl:right-[400px]' : 'right-0'}
        `}
      >
        <div className="pointer-events-auto w-full max-w-md px-4">
          <SearchBar onSelect={handleSelect} />
        </div>
      </div>

      {/* Floating Info Button — Top Right */}
      <div
        className={`
          absolute top-4 z-[800]
          transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]
          ${selectedLocation ? 'right-[344px] xl:right-[424px]' : 'right-6'}
        `}
      >
        <button
          onClick={() => setIsInfoOpen(true)}
          className="w-14 h-14 rounded-2xl bg-[#1e1e1e] hover:bg-[#2d2d2d] active:scale-95 text-slate-300 hover:text-white shadow-[0_4px_16px_rgba(0,0,0,0.4)] flex items-center justify-center transition-all duration-200"
          title="Informasi Sistem"
        >
          <Info className="w-6 h-6" />
        </button>
      </div>

      {/* Weather & Compass Overlays */}
      <WeatherWidget isSidebarOpen={isSidebarOpen} />
      <CompassWidget isSidebarOpen={isSidebarOpen} />

      {/* Right Detail Panel — slides in on marker click */}
      <CCTVDetailPanel location={selectedLocation} onClose={handleClose} />

      {/* Floating Next/Prev Navigation — Material Design 3 */}
      <div 
        className={`
          absolute bottom-8 z-[1000] flex gap-3
          transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]
          ${selectedLocation ? 'right-[336px] xl:right-[416px] opacity-100 translate-x-0' : 'right-0 opacity-0 translate-x-12 pointer-events-none'}
        `}
      >
        <button
          onClick={handlePrev}
          className="w-14 h-14 rounded-2xl bg-[#282a2f] hover:bg-[#333537] active:scale-95 text-slate-200 shadow-[0_4px_8px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.4)] flex items-center justify-center transition-all duration-300 opacity-60 hover:opacity-100"
          title="CCTV Sebelumnya"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={handleNext}
          className="w-14 h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-[0_4px_8px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_16px_rgba(37,99,235,0.4)] flex items-center justify-center transition-all duration-300 opacity-60 hover:opacity-100"
          title="CCTV Selanjutnya"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Info Modal */}
      <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />

    </div>
  )
}

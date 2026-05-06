'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Sidebar } from '@/components/layout/sidebar'
import { SearchBar } from '@/components/traffic/search-bar'
import { CCTVDetailPanel } from '@/components/traffic/cctv-detail-panel'
import { cctvLocations } from '@/data/cctv-locations'
import { CCTVLocation } from '@/types'

// Dynamic import — no SSR for Leaflet
const TrafficMap = dynamic(
  () => import('@/components/traffic/traffic-map-clean-modern'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#081525] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
          <p className="text-blue-400 text-sm font-medium">Memuat peta...</p>
        </div>
      </div>
    ),
  }
)

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<CCTVLocation | null>(null)

  useEffect(() => { setMounted(true) }, [])

  const handleSelect = (loc: CCTVLocation) => {
    setSelectedLocation(loc)
    setIsSidebarOpen(false) // close sidebar so panel is unobstructed
  }

  const handleClose = () => setSelectedLocation(null)

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#081525] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
          <p className="text-blue-400 text-sm font-medium">Memuat aplikasi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#081525] overflow-hidden relative">

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

      {/* Floating Search Bar — top center */}
      <SearchBar onSelect={handleSelect} />

      {/* Right Detail Panel — slides in on marker click */}
      <CCTVDetailPanel location={selectedLocation} onClose={handleClose} />

    </div>
  )
}

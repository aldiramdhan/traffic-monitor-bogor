'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { cctvLocations } from '@/data/cctv-locations'
import { CCTVLocation } from '@/types'

// Dynamic import to avoid SSR issues with Leaflet
const TrafficMap = dynamic(
  () => import('@/components/traffic/traffic-map-clean-modern'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#0f172a] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2"></div>
          <p className="text-slate-400">Memuat peta...</p>
        </div>
      </div>
    )
  }
)

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<CCTVLocation | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleLocationSelect = (lat: number, lon: number, id: string) => {
    // Find the full CCTV location object
    const cctvLocation = cctvLocations.find(location => location.id === id)
    if (cctvLocation) {
      // If selecting the same location, just focus without changing state
      if (selectedLocation?.id === id) {
        return
      }
      
      setSelectedLocation(cctvLocation)
      // Close sidebar after selection for better UX
      setIsSidebarOpen(false)
    }
  }

  const handlePopupClose = () => {
    setSelectedLocation(null)
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2"></div>
          <p className="text-slate-400">Memuat aplikasi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#0f172a] flex flex-col overflow-hidden">
      {/* Header */}
      <Header onSidebarToggle={toggleSidebar} isSidebarOpen={isSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Map Container */}
        <div className="flex-1 relative">
          <div className="absolute inset-0">
            <TrafficMap 
              selectedLocation={selectedLocation} 
              onPopupClose={handlePopupClose}
            />
          </div>
        </div>

        {/* Sidebar - Only visible when open */}
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          onLocationSelect={(lat, lon, id) => {
            handleLocationSelect(lat, lon, id)
          }}
        />
      </div>
    </div>
  )
}

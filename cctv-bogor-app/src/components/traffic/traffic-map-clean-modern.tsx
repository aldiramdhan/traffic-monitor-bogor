'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import L from 'leaflet'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CCTVLocation } from '@/types'
import { bogorMapConfig, cctvLocations } from '@/data/cctv-locations'

// Error Boundary
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Map Error:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="h-full w-full flex items-center justify-center bg-red-950/20 rounded-xl border border-red-900/50">
          <div className="text-center p-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-400 font-medium mb-2">Terjadi kesalahan saat memuat peta</p>
            <Button
              onClick={() => this.setState({ hasError: false })}
              variant="outline"
              size="sm"
              className="border-red-900 text-red-400 hover:bg-red-950/50"
            >
              Coba Lagi
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// Fix Leaflet default icons
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
})

// CCTV marker icon — blue theme
const createCCTVIcon = (status: CCTVLocation['status']) => {
  const configs = {
    online:      { color: '#3b82f6', shadow: '#1e3a8a' },
    offline:     { color: '#ef4444', shadow: '#991b1b' },
    maintenance: { color: '#f59e0b', shadow: '#92400e' },
  }
  const c = configs[status] || configs.maintenance
  return L.divIcon({
    html: `
      <div class="relative">
        <div class="w-8 h-8 rounded-full shadow-lg border-2 border-white flex items-center justify-center transform transition-transform hover:scale-110"
             style="background:linear-gradient(135deg,${c.color} 0%,${c.shadow} 100%);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
          </svg>
        </div>
        <div class="absolute top-8 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent"
             style="border-top-color:${c.color};"></div>
      </div>`,
    className: 'custom-cctv-marker',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  })
}

// Simple clickable marker — no Popup
interface SimpleMarkerProps {
  location: CCTVLocation
  onLocationClick: (location: CCTVLocation) => void
  isSelected: boolean
}

const SimpleMarker: React.FC<SimpleMarkerProps> = ({ location, onLocationClick, isSelected }) => {
  const handleClick = useCallback(() => {
    onLocationClick(location)
  }, [location, onLocationClick])

  // Slightly larger icon when selected
  const selectedIcon = L.divIcon({
    html: `
      <div class="relative">
        <div class="w-10 h-10 rounded-full shadow-xl border-2 border-white flex items-center justify-center ring-2 ring-blue-400 ring-offset-1 ring-offset-transparent"
             style="background:linear-gradient(135deg,#60a5fa 0%,#1e3a8a 100%);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
          </svg>
        </div>
        <div class="absolute top-10 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent"
             style="border-top-color:#60a5fa;"></div>
      </div>`,
    className: 'custom-cctv-marker',
    iconSize: [40, 48],
    iconAnchor: [20, 48],
  })

  return (
    <Marker
      position={[location.lat, location.lon]}
      icon={isSelected ? selectedIcon : createCCTVIcon(location.status)}
      eventHandlers={{ click: handleClick }}
    />
  )
}

// Map controller — single smooth fly to marker, offset to visual center
interface MapControllerProps {
  selectedLocation: CCTVLocation | null
  sidebarWidth: number
  panelWidth: number
}

const MapController: React.FC<MapControllerProps> = ({ selectedLocation, sidebarWidth, panelWidth }) => {
  const map = useMap()

  useEffect(() => {
    if (!selectedLocation || !map) return

    const TARGET_ZOOM = 17
    const markerLatLng = L.latLng(selectedLocation.lat, selectedLocation.lon)

    const vw = map.getContainer().clientWidth

    // Compute horizontal pixel offset so marker lands at the visual center
    // (the midpoint of the area between left sidebar and right panel),
    // not the geometric center of the full viewport.
    //
    //   visualCenterX = sidebarWidth + (vw - sidebarWidth - panelWidth) / 2
    //   offsetX       = vw/2 - visualCenterX   (positive → panel > sidebar)
    //
    // Adding offsetX to the marker's projected x shifts the fly-to target
    // rightward, so Leaflet centers on a point that is offsetX px to the
    // right of the marker — landing the marker at visualCenterX on screen.
    const availableWidth = vw - sidebarWidth - panelWidth
    const visualCenterX  = sidebarWidth + availableWidth / 2
    const offsetX        = vw / 2 - visualCenterX

    // Project marker → offset in pixel space → unproject to LatLng
    const markerPx     = map.project(markerLatLng, TARGET_ZOOM)
    const adjustedPx   = L.point(markerPx.x + offsetX, markerPx.y)
    const adjustedLatLng = map.unproject(adjustedPx, TARGET_ZOOM)

    // Single smooth animation — no secondary pan needed
    map.flyTo(adjustedLatLng, TARGET_ZOOM, {
      duration: 1.2,
      easeLinearity: 0.1,
    })
  }, [selectedLocation, map, sidebarWidth, panelWidth])

  return null
}


// Main component
interface TrafficMapProps {
  onLocationSelect?: (location: CCTVLocation | null) => void
  selectedLocation?: CCTVLocation | null
  onPopupClose?: () => void
  sidebarWidth?: number   // px width of left sidebar
  panelWidth?: number     // px width of right detail panel
}

export default function TrafficMap({
  onLocationSelect,
  selectedLocation,
  sidebarWidth = 56,
  panelWidth = 0,
}: TrafficMapProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const handleLocationClick = useCallback((location: CCTVLocation) => {
    onLocationSelect?.(location)
  }, [onLocationSelect])

  useEffect(() => {
    setIsMounted(true)
    const t = setTimeout(() => setIsLoaded(true), 100)
    return () => { clearTimeout(t); setIsMounted(false) }
  }, [])

  if (!isMounted || !isLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#081525]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Memuat peta...</p>
          <p className="text-xs text-slate-500 mt-1">Harap tunggu sebentar</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="h-full w-full relative overflow-hidden">
        <MapContainer
          center={bogorMapConfig.center}
          zoom={bogorMapConfig.zoom}
          minZoom={bogorMapConfig.minZoom}
          maxZoom={bogorMapConfig.maxZoom}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
          zoomControl={true}
          scrollWheelZoom={true}
          dragging={true}
          touchZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          <ErrorBoundary fallback={<div>Error loading markers</div>}>
            <MarkerClusterGroup
              chunkedLoading
              maxClusterRadius={50}
              spiderfyOnMaxZoom={true}
              showCoverageOnHover={false}
              zoomToBoundsOnClick={true}
              removeOutsideVisibleBounds={true}
              animate={true}
              animateAddingMarkers={true}
            >
              {cctvLocations.map((location: CCTVLocation) => (
                <SimpleMarker
                  key={location.id}
                  location={location}
                  onLocationClick={handleLocationClick}
                  isSelected={selectedLocation?.id === location.id}
                />
              ))}
            </MarkerClusterGroup>
          </ErrorBoundary>

          <MapController
            selectedLocation={selectedLocation || null}
            sidebarWidth={sidebarWidth}
            panelWidth={panelWidth}
          />
        </MapContainer>
      </div>
    </ErrorBoundary>
  )
}

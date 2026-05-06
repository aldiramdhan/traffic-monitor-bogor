'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import L from 'leaflet'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CCTVLocation } from '@/types'
import { bogorMapConfig, cctvLocations } from '@/data/cctv-locations'

// ─── SSA Route — real road coordinates from OSRM ─────────────────────────────
// Jl. Pajajaran (Jalak Harupat) → belok kanan ke Jl. Otto Iskandardinata →
// Jl. Ir. H. Juanda → Jl. Kapten Muslihat → kembali ke Pajajaran
// Format: [lat, lon]
const SSA_ROUTE: [number, number][] = [
  [-6.592992, 106.802316], [-6.593042, 106.80238], [-6.593144, 106.802505],
  [-6.593586, 106.802946], [-6.593817, 106.803148], [-6.594339, 106.803537],
  [-6.595061, 106.80395], [-6.595504, 106.804176], [-6.595737, 106.804272],
  [-6.595751, 106.80428], [-6.595805, 106.804258], [-6.595858, 106.804261],
  [-6.59818, 106.804628], [-6.600041, 106.804918], [-6.600473, 106.804985],
  [-6.600574, 106.805], [-6.600669, 106.805027], [-6.600768, 106.805045],
  [-6.601016, 106.805029], [-6.601099, 106.805006], [-6.601216, 106.804936],
  [-6.601331, 106.804823], [-6.601436, 106.8047], [-6.601514, 106.804559],
  [-6.601632, 106.804258], [-6.601657, 106.80415], [-6.601743, 106.803861],
  [-6.601793, 106.803669], [-6.601861, 106.803437], [-6.601976, 106.803075],
  [-6.601983, 106.803053], [-6.602006, 106.802989], [-6.602052, 106.802858],
  [-6.602159, 106.802557], [-6.602177, 106.802505], [-6.602197, 106.802443],
  [-6.602333, 106.802025], [-6.602336, 106.802008], [-6.602353, 106.801896],
  [-6.602366, 106.80181], [-6.602578, 106.800441], [-6.602637, 106.799846],
  [-6.60266, 106.79975], [-6.602706, 106.799632], [-6.602977, 106.799076],
  [-6.603047, 106.798928], [-6.603076, 106.798843], [-6.603074, 106.798774],
  [-6.603063, 106.798666], [-6.603049, 106.798607], [-6.603045, 106.79853],
  [-6.603048, 106.798485], [-6.603058, 106.798448], [-6.603076, 106.798382],
  [-6.603097, 106.798326], [-6.603173, 106.798191], [-6.603184, 106.798174],
  [-6.603373, 106.797905], [-6.603391, 106.797875], [-6.603399, 106.797865],
  [-6.603582, 106.797628], [-6.603768, 106.797387], [-6.603797, 106.797349],
  [-6.60398, 106.797171], [-6.604083, 106.797029], [-6.6040452, 106.7969666],
  [-6.6041463, 106.7968384], [-6.6041865, 106.7967213], [-6.6041895, 106.7966462],
  [-6.6041868, 106.7965913], [-6.6041824, 106.7965337], [-6.6041699, 106.7964774],
  [-6.6041494, 106.7964235], [-6.6041214, 106.7963732], [-6.6040864, 106.7963275],
  [-6.6040452, 106.7962873], [-6.6039987, 106.7962536], [-6.6038812, 106.79618],
  [-6.6038129, 106.7961424], [-6.6037692, 106.7961214], [-6.6032818, 106.795905],
  [-6.6032415, 106.7958873], [-6.6027343, 106.7956616], [-6.6026017, 106.7956045],
  [-6.6023044, 106.7954764], [-6.6021463, 106.7954083], [-6.602045, 106.7953647],
  [-6.6019762, 106.795332], [-6.6017149, 106.7952365], [-6.6016486, 106.7952123],
  [-6.6014421, 106.7951426], [-6.6012779, 106.7950955], [-6.6010004, 106.7950252],
  [-6.6008293, 106.7949816], [-6.6006322, 106.7949348], [-6.6005066, 106.7949022],
  [-6.6004656, 106.7948931], [-6.6003385, 106.7948602], [-6.6002071, 106.7948261],
  [-6.6001399, 106.7948076], [-6.6000748, 106.7947853], [-6.5999713, 106.7947537],
  [-6.5999253, 106.794741], [-6.5998207, 106.7947134], [-6.599563, 106.7946276],
  [-6.599465, 106.794595], [-6.59896, 106.794424], [-6.598485, 106.794247],
  [-6.598295, 106.794178], [-6.598211, 106.794148], [-6.598125, 106.794119],
  [-6.5981, 106.794111], [-6.598, 106.794076], [-6.597731, 106.793988],
  [-6.597643, 106.793962], [-6.597588, 106.793945], [-6.597521, 106.793924],
  [-6.597197, 106.793825], [-6.597181, 106.793821], [-6.596965, 106.793831],
  [-6.596641, 106.793875], [-6.596421, 106.79393], [-6.596238, 106.793996],
  [-6.595838, 106.794148], [-6.595675, 106.794206], [-6.595474, 106.794275],
  [-6.59516, 106.794382], [-6.594918, 106.794483], [-6.594638, 106.794628],
  [-6.594485, 106.79477], [-6.594264, 106.795126], [-6.593894, 106.795951],
  [-6.593804, 106.796139], [-6.593735, 106.796252], [-6.593671, 106.796344],
  [-6.593601, 106.796446], [-6.593494, 106.796588], [-6.593176, 106.79693],
  [-6.593119, 106.797053], [-6.593074, 106.797141], [-6.593066, 106.79725],
  [-6.593089, 106.797344], [-6.593103, 106.797378], [-6.593158, 106.797475],
  [-6.593264, 106.797621], [-6.593379, 106.797823], [-6.593438, 106.797964],
  [-6.593471, 106.798129], [-6.593477, 106.798355], [-6.593459, 106.79852],
  [-6.593439, 106.798614], [-6.593393, 106.798749], [-6.593295, 106.798945],
  [-6.593168, 106.799112], [-6.592841, 106.799503], [-6.592745, 106.799639],
  [-6.592679, 106.799751], [-6.592619, 106.799875], [-6.59257, 106.800001],
  [-6.592426, 106.800343], [-6.592366, 106.800473], [-6.592332, 106.800579],
  [-6.592296, 106.800744], [-6.592289, 106.80094], [-6.592318, 106.801123],
  [-6.592381, 106.801298], [-6.592472, 106.801504], [-6.592604, 106.801749],
  [-6.592694, 106.801888], [-6.592744, 106.80198], [-6.592945, 106.802255],
  [-6.592992, 106.802316],
]

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

// CCTV marker icon — MD3 theme
const createCCTVIcon = (status: CCTVLocation['status'], isDimmed: boolean = false) => {
  const configs = {
    online: { color: '#2563eb' }, // Blue 600
    offline: { color: '#dc2626' }, // Red 600
    maintenance: { color: '#d97706' }, // Amber 600
  }
  const c = configs[status] || configs.maintenance
  return L.divIcon({
    html: `
      <div class="relative flex flex-col items-center transition-all duration-300 ${isDimmed ? 'opacity-65' : 'opacity-100'}">
        <div class="w-8 h-8 rounded-full shadow-md flex items-center justify-center transform transition-transform hover:scale-110"
             style="background-color: ${c.color}; border: 2px solid #1e1e1e;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
          </svg>
        </div>
        <div class="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-transparent"
             style="border-top-color: ${c.color}; margin-top: -2px;"></div>
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
  isDimmed: boolean
}

const SimpleMarker: React.FC<SimpleMarkerProps> = ({ location, onLocationClick, isSelected, isDimmed }) => {
  const handleClick = useCallback(() => {
    onLocationClick(location)
  }, [location, onLocationClick])

  // Slightly larger icon when selected
  const selectedIcon = L.divIcon({
    html: `
      <div class="relative flex flex-col items-center">
        <div class="w-10 h-10 rounded-full shadow-lg flex items-center justify-center transform scale-110"
             style="background-color: #2563eb; border: 3px solid #1e1e1e;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
          </svg>
        </div>
        <div class="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[10px] border-transparent"
             style="border-top-color: #2563eb; margin-top: -2px;"></div>
      </div>`,
    className: 'custom-cctv-marker',
    iconSize: [40, 48],
    iconAnchor: [20, 48],
  })

  return (
    <Marker
      position={[location.lat, location.lon]}
      icon={isSelected ? selectedIcon : createCCTVIcon(location.status, isDimmed)}
      eventHandlers={{ click: handleClick }}
    />
  )
}

// ─── Route Animator ──────────────────────────────────────────────────────────
// Rotating SVG linearGradient injected into Leaflet's SVG layer.
// Line stays 100% solid — gradient sweeps around the route like a spotlight.

const GradientLine: React.FC = () => {
  const polyRef = useRef<L.Polyline | null>(null)
  const map = useMap()

  useEffect(() => {
    const setup = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const path = (polyRef.current as any)?._path as SVGPathElement | undefined
      if (!path) return

      const svg = path.closest('svg') as SVGSVGElement | null
      if (!svg) return

      const ns = 'http://www.w3.org/2000/svg'
      
      // Hitung pusat aktual rute SSA di dalam layer SVG (tidak terpengaruh ukuran SVG saat panning)
      const bounds = L.latLngBounds(SSA_ROUTE as L.LatLngExpression[])
      const centerLatLng = bounds.getCenter()
      const centerPoint = map.latLngToLayerPoint(centerLatLng)
      
      const cx = centerPoint.x
      const cy = centerPoint.y
      
      // Hitung radius yang cukup untuk menjangkau seluruh sudut bounds rute
      const nwPoint = map.latLngToLayerPoint(bounds.getNorthWest())
      const sePoint = map.latLngToLayerPoint(bounds.getSouthEast())
      const dx = nwPoint.x - sePoint.x
      const dy = nwPoint.y - sePoint.y
      const r = (Math.sqrt(dx * dx + dy * dy) / 2) * 1.1 // tambah margin 10%

      // Ensure <defs> exists
      let defs = svg.querySelector('defs') as SVGDefsElement | null
      if (!defs) {
        defs = document.createElementNS(ns, 'defs') as SVGDefsElement
        svg.insertBefore(defs, svg.firstChild)
      }

      // Remove old gradient if present (e.g. on map move re-setup)
      svg.querySelector('#ssa-sweep-grad')?.remove()

      // Build linearGradient
      const grad = document.createElementNS(ns, 'linearGradient') as SVGLinearGradientElement
      grad.setAttribute('id', 'ssa-sweep-grad')
      grad.setAttribute('gradientUnits', 'userSpaceOnUse')
      grad.setAttribute('x1', String(cx - r))
      grad.setAttribute('y1', String(cy))
      grad.setAttribute('x2', String(cx + r))
      grad.setAttribute('y2', String(cy))

      // Asymmetric comet gradient:
      // Diperkecil penyebarannya tapi dipastikan tetap menutupi rute SSA
      const stops: [string, string, string][] = [
        ['0%', '#1d4ed8', '0'],
        ['60%', '#1d4ed8', '0'],     // area transparan lebih panjang dari versi asli (30% -> 60%)
        ['75%', '#2563eb', '0.40'],
        ['85%', '#1e40af', '0.80'],
        ['92%', '#1e3a8a', '1'],     // Puncak cahaya
        ['98%', '#1d4ed8', '0.20'],
        ['100%', '#1d4ed8', '0'],
      ]
      stops.forEach(([offset, color, opacity]) => {
        const stop = document.createElementNS(ns, 'stop')
        stop.setAttribute('offset', offset)
        stop.setAttribute('stop-color', color)
        stop.setAttribute('stop-opacity', opacity)
        grad.appendChild(stop)
      })

      // SMIL animateTransform — rotate gradient 360° around SVG center
      const anim = document.createElementNS(ns, 'animateTransform')
      anim.setAttribute('attributeName', 'gradientTransform')
      anim.setAttribute('attributeType', 'XML')
      anim.setAttribute('type', 'rotate')
      anim.setAttribute('from', `0 ${cx} ${cy}`)
      anim.setAttribute('to', `360 ${cx} ${cy}`)
      anim.setAttribute('dur', '2s') // Dipercepat
      anim.setAttribute('repeatCount', 'indefinite')
      grad.appendChild(anim)

      defs.appendChild(grad)

      // Apply gradient as stroke — no dasharray, fully solid
      path.style.stroke = 'url(#ssa-sweep-grad)'
      path.style.strokeOpacity = '1'
      path.style.strokeWidth = '7'
      path.style.strokeLinecap = 'round'
      path.style.strokeLinejoin = 'round'
      path.style.fill = 'none'
    }

    const t = setTimeout(setup, 120)

    // Re-apply after map move/zoom (SVG may be reset by Leaflet)
    map.on('moveend zoomend', setup)

    return () => {
      clearTimeout(t)
      map.off('moveend zoomend', setup)
      document.querySelector('#ssa-sweep-grad')?.remove()
    }
  }, [map])

  return (
    <Polyline
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={polyRef as any}
      positions={SSA_ROUTE}
      pathOptions={{
        color: '#7dd3fc',   // faded base (overridden by gradient spotlight)
        weight: 7,
        opacity: 0.55,
        lineCap: 'round',
        lineJoin: 'round',
      }}
    />
  )
}

interface RouteAnimatorProps {
  active: boolean
}

const RouteAnimator: React.FC<RouteAnimatorProps> = ({ active }) => {
  if (!active) return null

  return (
    <>
      {/* Soft glow shadow beneath the animated line */}
      <Polyline
        positions={SSA_ROUTE}
        pathOptions={{
          color: '#7dd3fc',
          weight: 9,
          opacity: 0.18,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
      {/* Solid gradient-animated line */}
      <GradientLine />
    </>
  )
}

// ─── Map Controller ──────────────────────────────────────────────────────────
// Single smooth fly-to marker, offset to visual center
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
    const availableWidth = vw - sidebarWidth - panelWidth
    const visualCenterX = sidebarWidth + availableWidth / 2
    const offsetX = vw / 2 - visualCenterX

    // Project marker → offset in pixel space → unproject to LatLng
    const markerPx = map.project(markerLatLng, TARGET_ZOOM)
    const adjustedPx = L.point(markerPx.x + offsetX, markerPx.y)
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
                  isDimmed={!!selectedLocation && selectedLocation.id !== location.id}
                />
              ))}
            </MarkerClusterGroup>
          </ErrorBoundary>

          <RouteAnimator active={!!selectedLocation} />

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

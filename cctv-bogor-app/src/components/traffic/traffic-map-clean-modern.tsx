'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import L from 'leaflet'
import { Video, ExternalLink, Brain, CheckCircle, AlertCircle, Share2 } from 'lucide-react'
import { VideoStream } from './video-stream'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CCTVLocation } from '@/types'
import { bogorMapConfig, cctvLocations } from '@/data/cctv-locations'
import { generateGoogleMapsUrl } from '@/lib/utils'

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Map Error Boundary caught an error:', error, errorInfo)
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
              className="border-red-900 text-red-400 hover:bg-red-950/50 hover:text-red-300"
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

// Fix for default markers in react-leaflet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
})

// Custom CCTV marker icon dengan design modern
const createCCTVIcon = (status: CCTVLocation['status']) => {
  const configs = {
    online: { color: '#10b981', shadow: '#065f46' },
    offline: { color: '#ef4444', shadow: '#991b1b' },
    maintenance: { color: '#f59e0b', shadow: '#92400e' }
  }
  
  const config = configs[status] || configs.maintenance
  
  return L.divIcon({
    html: `
      <div class="relative">
        <div class="w-8 h-8 rounded-full shadow-lg border-2 border-white flex items-center justify-center transform transition-transform hover:scale-110" 
             style="background: linear-gradient(135deg, ${config.color} 0%, ${config.shadow} 100%);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
          </svg>
        </div>
        <div class="absolute top-8 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent" 
             style="border-top-color: ${config.color};"></div>
      </div>
    `,
    className: 'custom-cctv-marker',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  })
}

// AI Analysis Section Component
// Types — mirrors FastAPI AnalyzeResponse (vehicle_count intentionally excluded)
interface AnalysisData {
  traffic_label: 'Lancar' | 'Sedang' | 'Padat'
  recommendation: string
  alternative_routes: Array<{
    route_name: string
    description: string
    maps_url: string
    estimated_time: string
  }>
  peak_hours: string
  cached?: boolean
}

const AIAnalysisSection: React.FC<{ 
  location: CCTVLocation
  onAnalysisUpdate: (data: AnalysisData | null) => void
}> = ({ location, onAnalysisUpdate }) => {
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const analyzeTraffic = async () => {
    setIsLoading(true)
    setShowAnalysis(true)
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

    try {
      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cctvId: location.id,
          locationName: location.nama,
          lat: location.lat,
          lon: location.lon,
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success) {
        const data: AnalysisData = {
          traffic_label: result.traffic_label,
          recommendation: result.recommendation,
          alternative_routes: result.alternative_routes,
          peak_hours: result.peak_hours,
          cached: result.cached,
        }
        setAnalysisData(data)
        setTimeout(() => onAnalysisUpdate(data), 100)
      } else {
        throw new Error(result.detail || 'Failed to analyze traffic')
      }
    } catch (error) {
      console.error('Error analyzing traffic:', error)

      // Fallback data if API fails
      const mockData: AnalysisData = {
        traffic_label: 'Sedang',
        recommendation: 'Koneksi ke server analisis bermasalah. Gunakan transportasi umum atau tunda perjalanan jika memungkinkan.',
        alternative_routes: [
          {
            route_name: 'Jl. Pajajaran',
            description: 'Rute utama menuju Jakarta via Pajajaran',
            maps_url: `https://www.google.com/maps/dir/${location.lat},${location.lon}/-6.565638,106.799444`,
            estimated_time: '10-15 menit'
          },
          {
            route_name: 'Jl. Juanda',
            description: 'Alternatif menuju pusat kota via Juanda',
            maps_url: `https://www.google.com/maps/dir/${location.lat},${location.lon}/-6.595278,106.799167`,
            estimated_time: '8-12 menit'
          }
        ],
        peak_hours: '07:00-09:00, 17:00-19:00'
      }
      setAnalysisData(mockData)
      setTimeout(() => onAnalysisUpdate(mockData), 100)
    } finally {
      setIsLoading(false)
    }
  }

  const renderAnalysisCard = (data: AnalysisData) => {
    const label = data.traffic_label

    const statusConfig = label === 'Lancar'
      ? { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' }
      : label === 'Padat'
      ? { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' }
      : { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' }

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 shadow-sm">
        {/* Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-500"></div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Status Lalu Lintas
              </span>
            </div>
            {data.cached && (
              <span className="text-xs text-slate-500 italic">dari cache</span>
            )}
          </div>
          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
            <div className={`w-2 h-2 rounded-full ${statusConfig.dot} animate-pulse`}></div>
            <span className="text-sm font-semibold">{label}</span>
          </div>
        </div>

        {/* Recommendation */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Rekomendasi
            </span>
          </div>
          <p className="text-sm text-emerald-50 leading-relaxed pl-6 bg-emerald-950/30 p-3 rounded-lg border border-emerald-900/50">
            {data.recommendation}
          </p>
        </div>

        {/* Alternative Routes */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Jalur Alternatif
            </span>
          </div>
          <div className="space-y-2">
            {data.alternative_routes.map((route, index) => (
              <div key={index} className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-100 mb-1">
                      {route.route_name}
                    </h4>
                    <p className="text-xs text-slate-400 mb-2">{route.description}</p>
                    <p className="text-xs text-emerald-500 font-medium">⏱️ {route.estimated_time}</p>
                  </div>
                  <a
                    href={route.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 px-3 py-1.5 bg-blue-900/40 hover:bg-blue-900/60 text-blue-400 text-xs font-medium rounded-md transition-colors duration-200 border border-blue-900/50"
                  >
                    Buka Maps
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Peak Hours */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Jam Sibuk
            </span>
          </div>
          <p className="text-sm font-bold text-amber-500 pl-6 bg-amber-950/30 border border-amber-900/50 p-2 rounded-lg">
            🕐 {data.peak_hours}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Button
        size="sm"
        className="w-full h-11 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold rounded-lg shadow-sm border-0 transition-all duration-200 flex items-center justify-center gap-2"
        onClick={analyzeTraffic}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Menganalisis...</span>
          </>
        ) : (
          <>
            <Brain className="h-4 w-4" />
            <span>Analisis Cerdas</span>
          </>
        )}
      </Button>
      
      {showAnalysis && (
        <div className="animate-in slide-in-from-top-2 duration-300">
          {isLoading ? (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-slate-300 font-medium">Menganalisis kondisi lalu lintas...</p>
              <p className="text-xs text-slate-500 mt-1">Mohon tunggu sebentar</p>
            </div>
          ) : analysisData ? (
            renderAnalysisCard(analysisData)
          ) : null}
        </div>
      )}
    </div>
  )
}

// Simple marker component dengan UI modern dan responsive
interface SimpleMarkerProps {
  location: CCTVLocation
  onLocationClick: (location: CCTVLocation) => void
  onPopupClose?: () => void
}

const SimpleMarker: React.FC<SimpleMarkerProps> = ({ location, onLocationClick, onPopupClose }) => {
  const [copied, setCopied] = useState(false)
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const markerRef = React.useRef<L.Marker>(null)

  // Stable callback to prevent popup from closing on analysis update
  const handleAnalysisUpdate = useCallback((data: AnalysisData | null) => {
    // Use requestAnimationFrame to ensure DOM updates don't interfere with popup
    requestAnimationFrame(() => {
      setAnalysisData(data)
    })
  }, [])

  // Keep popup open when analysis data changes
  useEffect(() => {
    if (analysisData && markerRef.current) {
      // Small delay to ensure popup stays open after state update
      const timer = setTimeout(() => {
        if (markerRef.current && !markerRef.current.isPopupOpen()) {
          markerRef.current.openPopup()
        }
      }, 50)
      
      return () => clearTimeout(timer)
    }
  }, [analysisData])

  const handleClick = useCallback((e: L.LeafletMouseEvent) => {
    try {
      // Prevent event bubbling that might cause popup to close
      e.originalEvent?.stopPropagation()
      onLocationClick(location)
    } catch (error) {
      console.warn('Error in marker click handler:', error)
    }
  }, [location, onLocationClick])

  const handlePopupClose = useCallback((e?: L.PopupEvent) => {
    try {
      // Only close if it's a deliberate close action
      if (e?.type === 'popupclose') {
        onPopupClose?.()
      }
    } catch (error) {
      console.warn('Error in popup close handler:', error)
    }
  }, [onPopupClose])

  const handleCustomClose = useCallback((e: React.MouseEvent) => {
    try {
      e.preventDefault()
      e.stopPropagation()
      // Close popup using marker ref
      if (markerRef.current) {
        markerRef.current.closePopup()
      }
      onPopupClose?.()
    } catch (error) {
      console.warn('Error in custom close handler:', error)
    }
  }, [onPopupClose])

  const handleShare = async () => {
    try {
      let shareText = `🚦 Info Traffic Update - ${location.nama}\n\n`
      
      if (analysisData) {
        shareText += `📊 Status: ${analysisData.traffic_label}\n`
        shareText += `💡 Rekomendasi: ${analysisData.recommendation}\n\n`

        if (analysisData.alternative_routes.length > 0) {
          shareText += `🛣️ Jalur Alternatif:\n`
          analysisData.alternative_routes.forEach((route, index) => {
            shareText += `${index + 1}. ${route.route_name} (${route.estimated_time})\n`
            shareText += `   ${route.description}\n`
          })
          shareText += `\n`
        }

        shareText += `⏰ Jam Sibuk: ${analysisData.peak_hours}\n\n`
      } else {
        shareText += `📍 Lokasi: ${location.lat}, ${location.lon}\n`
        shareText += `📹 Status CCTV: ${location.status}\n\n`
      }
      
      shareText += `🌐 Pantau traffic real-time di: ${window.location.origin}`
      
      if (navigator.share) {
        // Use native share API if available (mobile)
        await navigator.share({
          title: `Traffic Update - ${location.nama}`,
          text: shareText,
          url: window.location.href
        })
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareText)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      }
    } catch (error) {
      console.warn('Error sharing:', error)
      // Fallback to simple coordinate copy
      try {
        await navigator.clipboard.writeText(`${location.lat}, ${location.lon}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (clipboardError) {
        console.warn('Error copying to clipboard:', clipboardError)
      }
    }
  }

  return (
    <Marker
      ref={markerRef}
      position={[location.lat, location.lon]}
      icon={createCCTVIcon(location.status)}
      eventHandlers={{
        click: handleClick,
        popupclose: handlePopupClose
      }}
    >
      <Popup 
        closeButton={false} 
        autoPan={false}
        keepInView={true}
        maxWidth={450}
        minWidth={300}
        className="custom-popup-modern"
        closeOnClick={false}
        closeOnEscapeKey={true}
        autoClose={false}
        interactive={true}
        eventHandlers={{
          click: (e) => {
            e.originalEvent.stopPropagation();
          },
          add: () => {
            // Prevent auto close when popup is added/updated
            console.log('Popup added/updated for:', location.nama);
          },
          remove: () => {
            console.log('Popup removed for:', location.nama);
          }
        }}
      >
        <div 
          className="relative p-3 sm:p-4 w-full max-w-sm mx-auto"
          onClick={(e) => {
            e.stopPropagation();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
          }}
        >
          {/* Custom Close Button integrated with status */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-slate-50 leading-tight bg-gradient-to-r from-slate-50 to-slate-300 bg-clip-text">
                {location.nama}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                className={`
                  text-xs font-medium px-3 py-1.5 rounded-full border-2 transition-all duration-200
                  ${location.status === 'online' 
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900 shadow-none' 
                    : location.status === 'offline'
                    ? 'bg-red-950/40 text-red-400 border-red-900 shadow-none'
                    : 'bg-amber-950/40 text-amber-400 border-amber-900 shadow-none'
                  }
                `}
              >
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  location.status === 'online' ? 'bg-emerald-500 animate-pulse' :
                  location.status === 'offline' ? 'bg-red-500' : 'bg-amber-500'
                }`}></div>
                {location.status === 'online' ? 'Online' : location.status === 'offline' ? 'Offline' : 'Maintenance'}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
                onClick={handleCustomClose}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </div>
          
          {/* Description */}
          {location.description && (
            <div className="mb-4">
              <p className="text-sm text-slate-400 leading-relaxed bg-slate-800 p-3 rounded-lg border border-slate-700">
                {location.description}
              </p>
            </div>
          )}

          {/* Content Section */}
          <div className="space-y-4">
            {/* Video Stream dengan responsive design */}
            {location.status === 'online' && location.stream_url && (
              <div>
                <ErrorBoundary fallback={
                  <div className="bg-slate-800 border-2 border-dashed border-slate-700 rounded-xl p-6 text-center">
                    <Video className="h-8 w-8 mx-auto mb-3 text-slate-500" />
                    <p className="text-sm text-slate-400 font-medium">Video tidak dapat dimuat</p>
                    <p className="text-xs text-slate-500 mt-1">Coba refresh halaman</p>
                  </div>
                }>
                  <div className="relative rounded-lg overflow-hidden bg-slate-950 shadow-md border border-slate-800">
                    {/* Mobile-optimized video container */}
                    <div className="relative w-full aspect-video">
                      <VideoStream 
                        streamUrl={location.stream_url} 
                        autoplay={true} 
                        muted={true} 
                        controls={true}
                        className="absolute inset-0 w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  </div>
                </ErrorBoundary>
              </div>
            )}

            {/* Offline State dengan design yang menarik */}
            {location.status !== 'online' && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-dashed border-slate-700 rounded-xl p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-slate-800 rounded-full flex items-center justify-center shadow-sm border border-slate-700">
                  <Video className="h-6 w-6 text-slate-500" />
                </div>
                <h4 className="text-sm font-semibold text-slate-300 mb-1">CCTV Tidak Tersedia</h4>
                <p className="text-xs text-slate-500">
                  {location.status === 'maintenance' 
                    ? 'CCTV sedang dalam pemeliharaan'
                    : 'CCTV sedang offline'
                  }
                </p>
              </div>
            )}
            
            {/* AI Analysis dengan spacing yang tepat */}
            {location.status === 'online' && (
              <div className="border-t border-slate-800 pt-4">
                <AIAnalysisSection 
                  location={location} 
                  onAnalysisUpdate={handleAnalysisUpdate}
                />
              </div>
            )}
          </div>

          {/* Footer Actions dengan design modern */}
          <div className="border-t border-slate-800 mt-5 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center justify-center gap-2 h-10 text-sm font-medium border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-slate-300 transition-all duration-200"
                onClick={() => {
                  try {
                    const url = generateGoogleMapsUrl(location.nama)
                    window.open(url, '_blank')
                  } catch (error) {
                    console.warn('Error opening Google Maps:', error)
                  }
                }}
              >
                <ExternalLink className="h-4 w-4" />
                Maps
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`flex items-center justify-center gap-2 h-10 text-sm font-medium transition-all duration-200 ${
                  copied 
                    ? 'border-emerald-900 bg-emerald-950/40 text-emerald-400' 
                    : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-slate-300'
                }`}
                onClick={handleShare}
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Tersalin!
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    Share Info
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

// Map controller untuk sidebar interactions
interface MapControllerProps {
  selectedLocation: CCTVLocation | null
}

const MapController: React.FC<MapControllerProps> = ({ selectedLocation }) => {
  const map = useMap()
  
  // Add event handling to prevent unwanted popup closing on mobile
  useEffect(() => {
    if (!map) return
    
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      // Check if click is inside popup content
      const popup = map.getContainer().querySelector('.leaflet-popup-content-wrapper')
      if (popup && e.originalEvent) {
        const target = e.originalEvent.target as HTMLElement
        if (popup.contains(target)) {
          e.originalEvent.stopPropagation()
          return
        }
      }
    }
    
    const handleTouchStart = (e: L.LeafletEvent) => {
      // For touch events, we'll rely on CSS pointer-events and touch-action
      const popup = map.getContainer().querySelector('.leaflet-popup-content-wrapper')
      if (popup) {
        // Prevent map interaction when touching popup area
        e.target.addEventListener('touchmove', (event: Event) => {
          event.preventDefault()
        }, { passive: false })
      }
    }
    
    // Add event listeners for better mobile interaction
    map.on('click', handleMapClick)
    map.on('touchstart', handleTouchStart)
    
    return () => {
      map.off('click', handleMapClick)
      map.off('touchstart', handleTouchStart)
    }
  }, [map])
  
  useEffect(() => {
    if (!selectedLocation || !map) return
    
    try {
      // Fly to location dengan zoom yang lebih dekat dan animasi smooth
      map.flyTo([selectedLocation.lat, selectedLocation.lon], 18, {
        duration: 1.5,
        easeLinearity: 0.1
      })
      
      // Buka popup dengan delay yang tepat
      const timer = setTimeout(() => {
        try {
          let found = false
          map.eachLayer((layer) => {
            if (found) return
            
            if (layer instanceof L.Marker) {
              const position = layer.getLatLng()
              if (
                Math.abs(position.lat - selectedLocation.lat) < 0.0001 &&
                Math.abs(position.lng - selectedLocation.lon) < 0.0001
              ) {
                if (layer.getElement() && layer.getPopup()) {
                  layer.openPopup()
                  found = true
                  console.log('Popup opened for:', selectedLocation.nama)
                }
              }
            }
          })
          if (!found) {
            console.warn('Marker not found for:', selectedLocation.nama)
          }
        } catch (error) {
          console.warn('Error opening popup from sidebar:', error)
        }
      }, 1800)
      
      return () => clearTimeout(timer)
    } catch (error) {
      console.warn('Error in MapController:', error)
    }
  }, [selectedLocation, map])
  
  return null
}

// Main component props
interface TrafficMapProps {
  onLocationSelect?: (location: CCTVLocation | null) => void
  selectedLocation?: CCTVLocation | null
  onPopupClose?: () => void
}

export default function TrafficMap({ onLocationSelect, selectedLocation, onPopupClose }: TrafficMapProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const handleLocationClick = useCallback((location: CCTVLocation) => {
    onLocationSelect?.(location)
  }, [onLocationSelect])

  const handlePopupClose = useCallback(() => {
    onPopupClose?.()
  }, [onPopupClose])

  useEffect(() => {
    setIsMounted(true)
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 100)
    
    return () => {
      clearTimeout(timer)
      setIsMounted(false)
    }
  }, [])

  if (!isMounted || !isLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-900 rounded-xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Memuat peta...</p>
          <p className="text-xs text-slate-500 mt-1">Harap tunggu sebentar</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="h-full w-full relative rounded-xl overflow-hidden">
        <MapContainer
          center={bogorMapConfig.center}
          zoom={bogorMapConfig.zoom}
          minZoom={bogorMapConfig.minZoom}
          maxZoom={bogorMapConfig.maxZoom}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
          attributionControl={true}
          zoomControl={true}
          doubleClickZoom={true}
          scrollWheelZoom={true}
          dragging={true}
          keyboard={true}
          touchZoom={true}
          whenReady={() => {
            console.log('Map ready')
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
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
                  onPopupClose={handlePopupClose}
                />
              ))}
            </MarkerClusterGroup>
          </ErrorBoundary>

          <MapController 
            selectedLocation={selectedLocation || null} 
          />
        </MapContainer>
      </div>
    </ErrorBoundary>
  )
}

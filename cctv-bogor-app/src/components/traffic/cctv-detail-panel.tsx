'use client'

import React, { useState, useCallback } from 'react'
import {
  X, Video, ExternalLink, CheckCircle,
  AlertCircle, Share2, MapPin, Activity
} from 'lucide-react'
import { CCTVLocation } from '@/types'
import { VideoStream } from './video-stream'
import { generateGoogleMapsUrl } from '@/lib/utils'

// ─── Custom Icons ─────────────────────────────────────────────────────────────
const GeminiIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 0C11.5432 6.7027 6.7027 11.5432 0 12C6.7027 12.4568 11.5432 17.2973 12 24C12.4568 17.2973 17.2973 12.4568 24 12C17.2973 11.5432 12.4568 6.7027 12 0Z" fill="currentColor"/>
  </svg>
)

// ─── AI Analysis Types ────────────────────────────────────────────────────────
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

// ─── AI Analysis Section ─────────────────────────────────────────────────────
const AIAnalysisSection: React.FC<{ location: CCTVLocation }> = ({ location }) => {
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const analyzeTraffic = async () => {
    setIsLoading(true)
    setShowAnalysis(true)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    try {
      const res = await fetch(`${apiUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cctvId: location.id,
          locationName: location.nama,
          lat: location.lat,
          lon: location.lon,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const result = await res.json()
      if (result.success) {
        setAnalysisData({
          traffic_label: result.traffic_label,
          recommendation: result.recommendation,
          alternative_routes: result.alternative_routes,
          peak_hours: result.peak_hours,
          cached: result.cached,
        })
      } else throw new Error(result.detail)
    } catch {
      // Fallback
      setAnalysisData({
        traffic_label: 'Sedang',
        recommendation: 'Koneksi ke server analisis bermasalah. Gunakan transportasi umum atau tunda perjalanan jika memungkinkan.',
        alternative_routes: [
          {
            route_name: 'Jl. Pajajaran',
            description: 'Rute utama menuju Jakarta via Pajajaran',
            maps_url: `https://www.google.com/maps/dir/${location.lat},${location.lon}/-6.565638,106.799444`,
            estimated_time: '10-15 menit',
          },
          {
            route_name: 'Jl. Juanda',
            description: 'Alternatif menuju pusat kota via Juanda',
            maps_url: `https://www.google.com/maps/dir/${location.lat},${location.lon}/-6.595278,106.799167`,
            estimated_time: '8-12 menit',
          },
        ],
        peak_hours: '07:00-09:00, 17:00-19:00',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const labelConfig =
    analysisData?.traffic_label === 'Lancar'
      ? { bg: 'bg-blue-950/50', text: 'text-blue-300', border: 'border-blue-700/60', dot: 'bg-blue-400' }
      : analysisData?.traffic_label === 'Padat'
      ? { bg: 'bg-red-950/50', text: 'text-red-400', border: 'border-red-700/60', dot: 'bg-red-500' }
      : { bg: 'bg-amber-950/50', text: 'text-amber-400', border: 'border-amber-700/60', dot: 'bg-amber-400' }

  return (
    <div className="space-y-3">
      <button
        className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-md transition-all duration-200 disabled:opacity-60"
        onClick={analyzeTraffic}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Menganalisis...
          </>
        ) : (
          <>
            <GeminiIcon className="h-4 w-4 text-white" />
            Analisis Cerdas AI
          </>
        )}
      </button>

      {showAnalysis && (
        <div className="animate-in slide-in-from-top-2 duration-300 space-y-3">
          {isLoading ? (
            <div className="bg-blue-950/30 border border-blue-900/40 rounded-xl p-5 text-center">
              <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2.5" />
              <p className="text-sm text-slate-300">Menganalisis kondisi lalu lintas...</p>
              <p className="text-xs text-blue-600 mt-1">Mohon tunggu sebentar</p>
            </div>
          ) : analysisData ? (
            <>
              {/* Traffic Status */}
              <div className="bg-slate-800 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-medium text-slate-300">Status Lalu Lintas</span>
                  {analysisData.cached && (
                    <span className="ml-auto text-[10px] text-slate-500 italic">dari cache</span>
                  )}
                </div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${labelConfig.bg} ${labelConfig.text} ${labelConfig.border}`}>
                  <div className={`w-2 h-2 rounded-full ${labelConfig.dot} animate-pulse`} />
                  <span className="text-sm font-bold">{analysisData.traffic_label}</span>
                </div>
              </div>

              {/* Recommendation */}
              <div className="bg-slate-800 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-medium text-slate-300">Rekomendasi</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{analysisData.recommendation}</p>
              </div>

              {/* Alternative Routes */}
              <div className="bg-slate-800 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-medium text-slate-300">Jalur Alternatif</span>
                </div>
                <div className="space-y-3">
                  {analysisData.alternative_routes.map((route, i) => (
                    <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-3 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200">{route.route_name}</p>
                        <p className="text-xs text-slate-400 mt-1">{route.description}</p>
                        <p className="text-xs text-blue-400 font-medium mt-1.5">⏱ {route.estimated_time}</p>
                      </div>
                      <a
                        href={route.maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-medium rounded-full transition-colors"
                      >
                        Maps
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Peak Hours */}
              <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-3 flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                <div>
                  <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-widest block">Jam Sibuk</span>
                  <span className="text-xs font-bold text-amber-400">{analysisData.peak_hours}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
interface CCTVDetailPanelProps {
  location: CCTVLocation | null
  onClose: () => void
}

export function CCTVDetailPanel({ location, onClose }: CCTVDetailPanelProps) {
  const [copied, setCopied] = useState(false)

  // Reset state when location changes
  const key = location?.id ?? 'none'

  const handleShare = useCallback(async () => {
    if (!location) return
    try {
      const text = `🚦 Traffic Monitor - ${location.nama}\n📍 ${location.lat}, ${location.lon}\n🌐 ${window.location.origin}`
      if (navigator.share) {
        await navigator.share({ title: `CCTV - ${location.nama}`, text, url: window.location.href })
      } else {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      }
    } catch { /* ignore */ }
  }, [location])

  const isVisible = !!location

  return (
    <div
      className={`
        fixed top-0 right-0 h-full z-[900]
        w-80 xl:w-[400px]
        bg-[#1e1e1e] text-slate-200
        rounded-l-3xl
        shadow-[-8px_0_32px_rgba(0,0,0,0.5)]
        flex flex-col
        transition-transform duration-300 cubic-bezier(0.2,0,0,1)
        ${isVisible ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      {location && (
        <div key={key} className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start gap-4 p-5 border-b border-white/10 flex-shrink-0">
            <div className="flex-1 min-w-0">
              {/* Status row */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium tracking-wide ${
                  location.status === 'online'
                    ? 'bg-blue-500/20 text-blue-300'
                    : location.status === 'offline'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    location.status === 'online' ? 'bg-blue-400 animate-pulse' :
                    location.status === 'offline' ? 'bg-red-500' : 'bg-amber-400'
                  }`} />
                  {location.status}
                </div>
              </div>
              {/* Title */}
              <h2 className="text-xl font-medium text-slate-100 leading-tight">{location.nama}</h2>
              {/* Description */}
              {location.description && (
                <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{location.description}</p>
              )}
            </div>
            {/* Close */}
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors duration-200 flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-900 scrollbar-track-transparent p-4 space-y-4">

            {/* Video Stream */}
            {location.status === 'online' && location.stream_url ? (
              <div className="bg-slate-800 rounded-3xl p-2 pb-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3 px-3 pt-2">
                  <Video className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-medium text-slate-300">Live Stream</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] text-red-400 font-bold">REC</span>
                  </div>
                </div>
                <div className="relative rounded-2xl overflow-hidden bg-black shadow-md">
                  <div className="relative w-full aspect-video">
                    <VideoStream
                      streamUrl={location.stream_url}
                      autoplay={true}
                      muted={true}
                      controls={true}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-8 bg-slate-800/30 border border-dashed border-slate-700/80 rounded-2xl">
                <div className="w-10 h-10 rounded-full bg-slate-800/60 border border-slate-700 flex items-center justify-center shadow-sm">
                  <Video className="h-5 w-5 text-slate-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-400">Stream Tidak Tersedia</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {location.status === 'maintenance' ? 'CCTV dalam pemeliharaan' : 'CCTV sedang offline'}
                  </p>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* AI Analysis */}
            {location.status === 'online' && <AIAnalysisSection location={location} />}

          </div>

          {/* Footer actions */}
          <div className="flex-shrink-0 p-5 border-t border-white/10 grid grid-cols-2 gap-3">
            <button
              className="flex items-center justify-center gap-2 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors duration-200"
              onClick={() => window.open(generateGoogleMapsUrl(location.nama), '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              Google Maps
            </button>
            <button
              className={`flex items-center justify-center gap-2 py-3 rounded-full text-sm font-medium transition-colors duration-200 ${
                copied
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              onClick={handleShare}
            >
              {copied ? (
                <><CheckCircle className="h-4 w-4" /> Tersalin!</>
              ) : (
                <><Share2 className="h-4 w-4" /> Bagikan</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

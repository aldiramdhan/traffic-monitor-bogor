'use client'

import React, { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { AlertTriangle, Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface VideoStreamProps {
  streamUrl: string
  className?: string
  autoplay?: boolean
  muted?: boolean
  controls?: boolean
  onError?: (error: string) => void
}

export function VideoStream({ 
  streamUrl, 
  className, 
  autoplay = true, 
  muted = true, 
  controls = true,
  onError 
}: VideoStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    setIsLoading(true)
    setError(null)

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    const handleError = (message: string) => {
      setError(message)
      setIsLoading(false)
      onError?.(message)
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: true
      })
      
      hlsRef.current = hls
      hls.loadSource(streamUrl)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false)
        if (autoplay) {
          // Add a small delay to ensure the video is ready
          setTimeout(() => {
            video.play().then(() => {
              setIsPlaying(true)
            }).catch((error) => {
              console.log('Auto-play prevented by browser:', error)
              setIsPlaying(false)
            })
          }, 100)
        }
      })

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              handleError('Gagal memuat stream video (Masalah Jaringan)')
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              handleError('Gagal memutar video (Format tidak didukung)')
              break
            default:
              handleError('Terjadi kesalahan saat memuat video')
              break
          }
        }
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari fallback
      video.src = streamUrl
      
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false)
        if (autoplay) {
          // Add a small delay for Safari
          setTimeout(() => {
            video.play().then(() => {
              setIsPlaying(true)
            }).catch((error) => {
              console.log('Auto-play prevented by browser:', error)
              setIsPlaying(false)
            })
          }, 100)
        }
      })

      video.addEventListener('error', () => {
        handleError('Gagal memuat stream video (Browser tidak didukung)')
      })
    } else {
      handleError('Browser tidak mendukung HLS streaming')
    }

    // Video event listeners
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [streamUrl, autoplay, onError])

  const togglePlayPause = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play().catch(() => {
        setError('Gagal memutar video')
      })
    }
  }

  if (error) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center bg-slate-100 rounded-lg p-6 text-center',
        className
      )}>
        <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
        <p className="text-sm text-red-600 mb-3">{error}</p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.location.reload()}
        >
          Coba Lagi
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('relative bg-black rounded-lg overflow-hidden', className)}>
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
        muted={muted}
        controls={controls}
        playsInline
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-lg">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mb-2"></div>
            <p className="text-xs text-slate-600">Memuat video...</p>
          </div>
        </div>
      )}

      {!controls && !isLoading && !error && (
        <button
          onClick={togglePlayPause}
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity rounded-lg"
        >
          {isPlaying ? (
            <Pause className="h-8 w-8 text-white" />
          ) : (
            <Play className="h-8 w-8 text-white" />
          )}
        </button>
      )}
    </div>
  )
}

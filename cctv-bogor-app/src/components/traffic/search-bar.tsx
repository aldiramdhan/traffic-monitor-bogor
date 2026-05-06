'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Search, X, Video, MapPin } from 'lucide-react'
import { cctvLocations } from '@/data/cctv-locations'
import { CCTVLocation } from '@/types'

interface SearchBarProps {
  onSelect: (location: CCTVLocation) => void
}

export function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const results = query.trim().length > 0
    ? cctvLocations.filter(c =>
        c.nama.toLowerCase().includes(query.toLowerCase()) ||
        (c.description ?? '').toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : []

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (loc: CCTVLocation) => {
    onSelect(loc)
    setQuery(loc.nama)
    setIsOpen(false)
    setFocused(false)
    inputRef.current?.blur()
  }

  const handleClear = () => {
    setQuery('')
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div
      ref={containerRef}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-[800] w-full max-w-md px-4"
    >
      {/* Input */}
      <div
        className={`
          flex items-center gap-2 px-3 py-2.5
          bg-[#0d1b2e]/95 backdrop-blur-md
          border rounded-xl shadow-2xl
          transition-all duration-200
          ${focused ? 'border-blue-500/80 shadow-blue-900/40' : 'border-blue-900/50'}
        `}
      >
        <Search className="h-4 w-4 text-blue-400 flex-shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setIsOpen(true) }}
          onFocus={() => { setFocused(true); setIsOpen(true) }}
          placeholder="Cari lokasi CCTV..."
          className="flex-1 bg-transparent text-sm text-slate-100 placeholder-blue-500/60 outline-none"
          autoComplete="off"
        />
        {query && (
          <button onClick={handleClear} className="text-blue-500 hover:text-blue-300 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {/* Live indicator */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-blue-900/50 flex-shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wide">Live</span>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="mt-1.5 bg-[#0d1b2e]/98 backdrop-blur-md border border-blue-900/50 rounded-xl shadow-2xl overflow-hidden">
          {results.map((loc, idx) => (
            <button
              key={loc.id}
              className={`
                w-full flex items-center gap-3 px-4 py-3 text-left
                hover:bg-blue-900/30 transition-colors duration-150
                ${idx !== 0 ? 'border-t border-blue-900/20' : ''}
              `}
              onMouseDown={() => handleSelect(loc)}
            >
              <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-600/40 flex items-center justify-center flex-shrink-0">
                <Video className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-100 truncate">{loc.nama}</p>
                <p className="text-[10px] text-blue-500 truncate">{loc.description}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  loc.status === 'online' ? 'bg-blue-400' :
                  loc.status === 'offline' ? 'bg-red-500' : 'bg-amber-400'
                }`} />
                <span className="text-[10px] text-blue-500 capitalize">{loc.status}</span>
              </div>
            </button>
          ))}
          <div className="px-4 py-2 border-t border-blue-900/20 flex items-center gap-1.5">
            <MapPin className="h-3 w-3 text-blue-600" />
            <span className="text-[10px] text-blue-600">{cctvLocations.length} titik CCTV tersedia</span>
          </div>
        </div>
      )}

      {/* No results */}
      {isOpen && query.trim().length > 0 && results.length === 0 && (
        <div className="mt-1.5 bg-[#0d1b2e]/98 backdrop-blur-md border border-blue-900/50 rounded-xl shadow-2xl px-4 py-4 text-center">
          <Search className="h-5 w-5 text-blue-700 mx-auto mb-1.5" />
          <p className="text-xs text-blue-500">Tidak ada CCTV ditemukan</p>
          <p className="text-[10px] text-blue-700 mt-0.5">Coba kata kunci lain</p>
        </div>
      )}
    </div>
  )
}

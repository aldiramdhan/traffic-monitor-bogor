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
      className="w-full relative"
    >
      {/* Input */}
      <div
        className={`
          flex items-center gap-3 px-4 h-14
          bg-[#1e1e1e] text-slate-200
          rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.4)]
          transition-all duration-300
          ${focused ? 'ring-2 ring-slate-500/50 bg-[#2d2d2d]' : 'hover:shadow-[0_6px_20px_rgba(0,0,0,0.5)]'}
        `}
      >
        <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setIsOpen(true) }}
          onFocus={() => { setFocused(true); setIsOpen(true) }}
          placeholder="Cari lokasi CCTV..."
          className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-400 outline-none"
          autoComplete="off"
        />
        {query && (
          <button onClick={handleClear} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {/* Live indicator */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700 flex-shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
          <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wide">Live</span>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="mt-2 bg-[#1e1e1e] rounded-3xl shadow-[0_8px_24px_rgba(0,0,0,0.5)] overflow-hidden">
          {results.map((loc, idx) => (
            <button
              key={loc.id}
              className={`
                w-full flex items-center gap-4 px-4 py-3.5 text-left
                hover:bg-slate-800 transition-colors duration-200
                ${idx !== 0 ? 'border-t border-slate-800' : ''}
              `}
              onMouseDown={() => handleSelect(loc)}
            >
              <div className="w-7 h-7 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center flex-shrink-0">
                <Video className="h-3.5 w-3.5 text-slate-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-100 truncate">{loc.nama}</p>
                <p className="text-[10px] text-slate-400 truncate">{loc.description}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  loc.status === 'online' ? 'bg-slate-300' :
                  loc.status === 'offline' ? 'bg-red-500' : 'bg-amber-400'
                }`} />
                <span className="text-[10px] text-slate-400 capitalize">{loc.status}</span>
              </div>
            </button>
          ))}
          <div className="px-5 py-3 bg-slate-800/50 border-t border-slate-800 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-300">{cctvLocations.length} titik CCTV tersedia</span>
          </div>
        </div>
      )}

      {/* No results */}
      {isOpen && query.trim().length > 0 && results.length === 0 && (
        <div className="mt-2 bg-[#1e1e1e] rounded-3xl shadow-[0_8px_24px_rgba(0,0,0,0.5)] px-6 py-8 text-center">
          <Search className="h-5 w-5 text-slate-600 mx-auto mb-1.5" />
          <p className="text-xs text-slate-400">Tidak ada CCTV ditemukan</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Coba kata kunci lain</p>
        </div>
      )}
    </div>
  )
}

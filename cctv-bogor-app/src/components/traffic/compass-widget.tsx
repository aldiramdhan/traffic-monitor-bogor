'use client'

import React from 'react'
import { Navigation } from 'lucide-react'

export function CompassWidget({ isSidebarOpen }: { isSidebarOpen: boolean }) {
  return (
    <div
      className={`
        group
        absolute bottom-6 z-[800]
        flex items-center justify-center
        w-14 h-14
        bg-[#1e1e1e] text-slate-200
        rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.4)] cursor-pointer
        hover:shadow-[0_6px_20px_rgba(0,0,0,0.5)] hover:bg-[#252525]
        transition-all duration-300 cubic-bezier(0.2,0,0,1)
        ${isSidebarOpen ? 'left-[340px]' : 'left-[100px]'}
      `}
    >
      <Navigation className="h-5 w-5 text-blue-400 -rotate-45" />
      <div className="absolute -top-1.5 bg-[#0d1b2e] px-1 rounded-sm text-[9px] font-bold text-blue-300 border border-blue-900/40">
        N
      </div>

      {/* Custom Tooltip */}
      <div className="
        absolute bottom-full left-1/2 -translate-x-1/2 mb-2
        opacity-0 group-hover:opacity-100
        transition-opacity duration-200 pointer-events-none
        bg-slate-700 text-slate-100 text-xs font-medium
        px-3 py-1.5 rounded-md shadow-md
        whitespace-nowrap
      ">
        Utara (North)
      </div>
    </div>
  )
}

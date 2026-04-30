'use client'

import React from 'react'
import { MapPin, Activity, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cctvLocations } from '@/data/cctv-locations'

interface HeaderProps {
  onSidebarToggle: () => void
  isSidebarOpen: boolean
}

export function Header({ onSidebarToggle, isSidebarOpen }: HeaderProps) {
  const onlineCount = cctvLocations.filter(cctv => cctv.status === 'online').length

  return (
    <header className="bg-slate-900 border-b border-slate-800 relative z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo & Title */}
          <div className="flex items-center">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-600 text-white mr-3">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-slate-50">Traffic Monitor Kota Bogor</h1>
                <p className="text-xs lg:text-sm text-slate-400 hidden sm:block">Sistem Pemantauan Lalu Lintas Cerdas</p>
              </div>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex items-center space-x-2">
            <Badge variant="success" className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              <span className="hidden sm:inline">Live</span>
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <span className="text-emerald-600 font-medium">{onlineCount}</span>
              <span className="hidden sm:inline">/ {cctvLocations.length}</span>
              <span className="text-emerald-600 hidden sm:inline">Online</span>
            </Badge>
            
            {/* Menu Buttons */}
            <div className="flex items-center space-x-2">
              <Button 
                variant={isSidebarOpen ? "default" : "outline"} 
                size="sm" 
                onClick={onSidebarToggle}
                className={`transition-colors ${
                  isSidebarOpen 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                    : 'border-emerald-500 text-emerald-500 hover:bg-emerald-950/30'
                }`}
              >
                <Info className="h-4 w-4 mr-2" />
                Informasi
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

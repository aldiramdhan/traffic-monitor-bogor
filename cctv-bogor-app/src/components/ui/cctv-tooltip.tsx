'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  content: string
  isVisible: boolean
  position: { x: number; y: number }
}

export function CCTVTooltip({ content, isVisible, position }: TooltipProps) {
  const [mounted, setMounted] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true)
    } else {
      // Delay unmounting to allow fade-out animation
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  if (!mounted || !shouldRender) return null

  return createPortal(
    <div
      className={`
        fixed z-[1000] pointer-events-none
        bg-white text-emerald-700 text-sm font-medium px-4 py-2.5 rounded-xl
        border border-emerald-200 shadow-lg backdrop-blur-sm
        transform -translate-x-1/2 -translate-y-full
        transition-all duration-300 ease-out
        ${isVisible 
          ? 'opacity-100 scale-100 translate-y-[-12px]' 
          : 'opacity-0 scale-90 translate-y-[-8px]'
        }
      `}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {content}
    </div>,
    document.body
  )
}

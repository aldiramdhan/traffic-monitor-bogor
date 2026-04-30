'use client'

import React from 'react'
import { BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FloatingActionButtonProps {
  onClick: () => void
  isVisible: boolean
}

export function FloatingActionButton({ onClick, isVisible }: FloatingActionButtonProps) {
  if (!isVisible) return null

  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg bg-emerald-600 hover:bg-emerald-700 lg:hidden"
      size="lg"
    >
      <BarChart3 className="h-6 w-6 text-white" />
    </Button>
  )
}

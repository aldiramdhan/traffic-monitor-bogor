import { NextRequest, NextResponse } from 'next/server'
import { GeminiService } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const { locationName, lat, lon } = await request.json()

    if (!locationName) {
      return NextResponse.json(
        { error: 'Location name is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      console.error('Gemini API key not found in environment variables')
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    const geminiService = new GeminiService(apiKey)
    const analysis = await geminiService.analyzeTraffic(locationName, lat, lon)

    return NextResponse.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('API Error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Traffic Analysis API',
    endpoints: {
      'POST /api/analyze': 'Analyze traffic for a location'
    },
    status: 'ready'
  })
}

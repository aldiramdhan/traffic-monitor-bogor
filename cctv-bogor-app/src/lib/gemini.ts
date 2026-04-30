import { z } from 'zod'

export const TrafficAnalysisSchema = z.object({
  traffic_level: z.enum(['Lancar', 'Ramai', 'Padat']),
  primary_cause: z.string(),
  alternative_routes: z.array(z.object({
    route_name: z.string(),
    description: z.string(),
    google_maps_url: z.string(),
    estimated_time: z.string()
  })),
  recommendations: z.string(),
  peak_hours: z.string()
})

export type TrafficAnalysisData = z.infer<typeof TrafficAnalysisSchema>

export class GeminiService {
  private apiKey: string
  private apiUrl: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
  }

  async analyzeTraffic(locationName: string, lat?: number, lon?: number): Promise<TrafficAnalysisData> {
    const now = new Date().toLocaleString('id-ID', { 
      weekday: 'long', 
      hour: '2-digit', 
      minute: '2-digit' 
    })

    // Generate coordinates for Google Maps URL if not provided
    const latitude = lat || -6.5971
    const longitude = lon || 106.8060

    const prompt = `Anda adalah AI analis lalu lintas profesional untuk Kota Bogor, Indonesia. 

Analisis lokasi: **${locationName}** 
Koordinat: ${latitude}, ${longitude}
Waktu: ${now}

Berdasarkan pengetahuan infrastruktur jalan Kota Bogor, berikan analisis lalu lintas yang REALISTIS dan BERGUNA dalam format JSON berikut:

{
  "traffic_level": "Lancar|Ramai|Padat",
  "primary_cause": "Penyebab utama kemacetan/kelancaran (max 50 kata)",
  "alternative_routes": [
    {
      "route_name": "Nama rute alternatif 1 (jalan utama Bogor)",
      "description": "Deskripsi singkat rute dan keunggulannya (max 40 kata)",
      "google_maps_url": "https://www.google.com/maps/dir/${latitude},${longitude}/[koordinat_tujuan_alternatif]",
      "estimated_time": "estimasi waktu tempuh dari lokasi ini"
    },
    {
      "route_name": "Nama rute alternatif 2 (jalan utama Bogor)",
      "description": "Deskripsi singkat rute dan keunggulannya (max 40 kata)",
      "google_maps_url": "https://www.google.com/maps/dir/${latitude},${longitude}/[koordinat_tujuan_alternatif]",
      "estimated_time": "estimasi waktu tempuh dari lokasi ini"
    }
  ],
  "recommendations": "Saran praktis untuk pengguna jalan berdasarkan kondisi saat ini (max 60 kata)",
  "peak_hours": "Jam sibuk di lokasi ini (format: HH:MM-HH:MM)"
}

PANDUAN KHUSUS BOGOR:
- Gunakan nama jalan yang BENAR-BENAR ADA di Bogor seperti: Jl. Pajajaran, Jl. Juanda, Jl. Raya Ciawi, Jl. Raya Dramaga, Jl. Surya Kencana, Jl. Otista, Jl. Lawang Gintung, dll
- Koordinat alternatif harus mengarah ke jalan penghubung utama Bogor
- Pertimbangkan arah ke/dari Jakarta, Ciawi, Dramaga, Sentul, dan area wisata
- Estimasi waktu berdasarkan jarak dan kondisi normal Bogor
- Rekomendasi praktis seperti waktu terbaik, transportasi alternatif, atau rute khusus

Jawab HANYA dalam format JSON yang diminta, tanpa teks tambahan.`

    const payload = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        topK: 1,
        topP: 1,
        maxOutputTokens: 800
      }
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response format from Gemini API')
      }

      const textContent = data.candidates[0].content.parts[0].text
      const cleanedText = textContent.replace(/```json\n?|\n?```/g, '').trim()
      
      const parsedData = JSON.parse(cleanedText)
      return TrafficAnalysisSchema.parse(parsedData)
    } catch (error) {
      console.error('Error analyzing traffic:', error)
      throw new Error('Gagal menganalisis lalu lintas. Silakan coba lagi.')
    }
  }
}

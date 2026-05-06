import React from 'react'
import { X, Info, Brain, Map, ShieldAlert, Cpu } from 'lucide-react'

interface InfoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function InfoModal({ isOpen, onClose }: InfoModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8 bg-black/70 transition-all duration-300">
      {/* M3 Dialog: Surface Container */}
      <div className="bg-[#1e1e1e] rounded-[28px] shadow-2xl w-full max-w-[560px] flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header - M3 Headline Small */}
        <div className="flex items-center justify-between pt-6 px-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="text-blue-400">
              <Info className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-normal text-slate-100">Informasi Sistem</h2>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors -mr-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body - M3 Body Medium */}
        <div className="px-6 pb-6 overflow-y-auto space-y-6 text-slate-300 text-[15px] leading-relaxed scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
          
          <section>
            <h3 className="flex items-center gap-2 text-base font-medium text-blue-300 mb-4">
              <Map className="w-5 h-5" />
              Sistem Satu Arah (SSA) & Kebun Raya
            </h3>
            
            {/* Image Illustration */}
            <div className="mb-4">
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#1e1e1e]">
                <img 
                  src="/ssa-illustration.png" 
                  alt="Ilustrasi Rute SSA Kebun Raya Bogor" 
                  className="w-full h-auto block"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 text-right italic">
                Foto Ilustrasi: Mindra Purnomo
              </p>
            </div>

            <p>
              <strong>Kebun Raya Bogor</strong> adalah taman botani bersejarah dan pusat observasi tumbuhan luas yang berada tepat di tengah-tengah Kota Bogor.
            </p>
            <p className="mt-2">
              <strong>Sistem Satu Arah (SSA)</strong> adalah kebijakan rekayasa lalu lintas yang membuat seluruh jalan yang mengelilingi Kebun Raya Bogor (Jl. Pajajaran, Jl. Otista, Jl. Ir. H. Juanda, hingga Jl. Jalak Harupat) beroperasi hanya dalam satu arah putaran searah jarum jam untuk mengurai kemacetan.
            </p>
          </section>

          <section>
            <h3 className="flex items-center gap-2 text-base font-medium text-blue-300 mb-2">
              <Cpu className="w-5 h-5" />
              Cara Kerja Sistem
            </h3>
            <p>
              Sistem memonitor arus lalu lintas secara langsung melalui kamera CCTV. Anda dapat:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Melihat status operasional CCTV pada peta.</li>
              <li>Mencari lokasi spesifik menggunakan kolom pencarian.</li>
              <li>Membuka tangkapan kamera secara real-time dan mendapatkan diagnosis pintar.</li>
            </ul>
          </section>

          <section>
            <h3 className="flex items-center gap-2 text-base font-medium text-blue-300 mb-2">
              <Brain className="w-5 h-5" />
              Kecerdasan Buatan (AI) & Computer Vision
            </h3>
            <p>
              Sistem ini dilengkapi <strong>Analisis Cerdas AI</strong>. Sistem menggunakan teknologi <em>Computer Vision</em> untuk mendeteksi volume kendaraan, yang kemudian dibantu oleh <strong>Gemini AI</strong> untuk merumuskan simpulan tingkat kemacetan serta merekomendasikan rute alternatif.
            </p>
          </section>

          <section className="bg-[#333537] rounded-2xl p-4 mt-2">
            <h3 className="flex items-center gap-2 text-sm font-medium text-amber-400 mb-2">
              <ShieldAlert className="w-4 h-4" />
              Disclaimer Diagnosis
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Sistem analisis AI ini dirancang hanya untuk <strong>diagnosis awal</strong> berdasarkan tangkapan kamera pada momen tertentu. Sistem tidak dapat 100% menjamin akurasi penyebab kemacetan (misal: kecelakaan atau faktor cuaca yang tidak masuk tangkapan lensa).
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}

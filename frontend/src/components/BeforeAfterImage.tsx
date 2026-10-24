/**
 * BeforeAfterImage.tsx — Side-by-side original vs redacted image viewer
 * Visualizes bounding-box overlays for scanned IDs, Aadhaar cards, and documents.
 * Dynamically connected to SecurityContext to display uploaded document details!
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Image, Layers, ShieldCheck, ZoomIn, FileCheck } from 'lucide-react'
import type { BoundingBox } from '@/lib/types'
import { useSecurity } from '@/context/SecurityContext'

interface BeforeAfterImageProps {
  originalSrc?: string
  boxes?: BoundingBox[]
}

export function BeforeAfterImage({ boxes }: BeforeAfterImageProps) {
  const { docInfo, findings, inputText } = useSecurity()
  const [activeTab, setActiveTab] = useState<'split' | 'original' | 'redacted'>('split')
  const [sliderPos, setSliderPos] = useState<number>(50)

  // Extract dynamic details from findings if available
  const aadhaarFinding = findings.find((f) => f.category === 'AADHAAR')
  const nameFinding = findings.find((f) => f.category === 'NAME')

  const cardName = nameFinding ? nameFinding.text : 'Devashree Sachin Pawar'
  const cardAadhaar = aadhaarFinding ? aadhaarFinding.text : '7439 3798 5047'

  const activeBoxes: BoundingBox[] = boxes || [
    { ymin: 22, xmin: 48, ymax: 34, xmax: 88, label: `AADHAAR: ${cardAadhaar}` },
    { ymin: 44, xmin: 48, ymax: 56, xmax: 82, label: `NAME: ${cardName.toUpperCase()}` },
    { ymin: 66, xmin: 48, ymax: 78, xmax: 76, label: 'DOB / GENDER: VERIFIED' },
  ]

  return (
    <div className="border border-paper/10 bg-ink-2 rounded-sm overflow-hidden">
      {/* Header Bar */}
      <div className="px-4 py-3 border-b border-paper/10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Image size={14} className="text-signal" />
          <span className="font-mono text-xs font-semibold text-paper uppercase tracking-wider">
            Document Vision Scrubber (Bounding Box Detection)
          </span>
          {docInfo.isCustom && (
            <span className="bg-safe/15 text-safe border border-safe/30 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono">
              SYNCED WITH {docInfo.name.toUpperCase()}
            </span>
          )}
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 font-mono text-[11px] bg-ink p-0.5 rounded border border-paper/10">
          {(['split', 'original', 'redacted'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setActiveTab(mode)}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === mode
                  ? 'bg-paper text-ink font-semibold'
                  : 'text-paper/50 hover:text-paper'
              }`}
            >
              {mode === 'split' ? 'Split View' : mode === 'original' ? 'Original' : 'Redacted'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Visualizer Canvas */}
      <div className="p-4 sm:p-6 bg-ink flex flex-col items-center">
        {/* Synthetic Card / Document Surface */}
        <div className="relative w-full max-w-xl aspect-[1.58/1] rounded-md border border-paper/20 bg-paper overflow-hidden shadow-2xl select-none">
          {/* Base ID Card Graphic */}
          <div className="absolute inset-0 p-5 flex flex-col justify-between text-ink">
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center font-display font-bold text-paper text-xs">
                  ID
                </div>
                <div>
                  <div className="font-sans font-bold text-xs uppercase tracking-wider text-ink">
                    Government of India / National Card
                  </div>
                  <div className="font-mono text-[9px] text-muted">Aadhaar Identification Document</div>
                </div>
              </div>
              <div className="w-6 h-6 rounded-full border border-line bg-paper-2 flex items-center justify-center font-mono text-[8px] text-muted">
                🇮🇳
              </div>
            </div>

            {/* Card Center Info */}
            <div className="grid grid-cols-3 gap-4 my-auto">
              <div className="col-span-1 border border-line rounded bg-paper-2/60 aspect-[3/4] flex items-center justify-center font-mono text-[10px] text-muted">
                [Photo Frame]
              </div>
              <div className="col-span-2 space-y-2 font-mono text-xs">
                <div>
                  <div className="text-[9px] text-muted">Full Legal Name</div>
                  <div className="font-bold text-ink text-sm">{cardName}</div>
                </div>
                <div>
                  <div className="text-[9px] text-muted">Date of Birth / Gender</div>
                  <div className="text-ink">2007 · Female</div>
                </div>
                <div>
                  <div className="text-[9px] text-muted">Aadhaar Universal Number</div>
                  <div className="text-ink font-semibold tracking-wider">{cardAadhaar}</div>
                </div>
              </div>
            </div>

            {/* Card Footer Bar */}
            <div className="pt-2 border-t border-line flex justify-between items-center font-mono text-[9px] text-muted">
              <span>Security Chip: Verified</span>
              <span>100% On-Device Visual Scrubbing</span>
            </div>
          </div>

          {/* OVERLAY: Bounding Boxes (Original View or Split View Left) */}
          {(activeTab === 'original' || activeTab === 'split') && (
            <div className="absolute inset-0 pointer-events-none">
              {activeBoxes.map((box, idx) => (
                <div
                  key={idx}
                  className="absolute border-2 border-signal bg-signal/15 rounded-sm flex items-start"
                  style={{
                    top: `${box.ymin}%`,
                    left: `${box.xmin}%`,
                    width: `${box.xmax - box.xmin}%`,
                    height: `${box.ymax - box.ymin}%`,
                  }}
                >
                  <span className="bg-signal text-paper font-mono text-[8px] px-1 py-0.2 rounded-br font-semibold leading-tight">
                    {box.label?.split(':')[0]}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* OVERLAY: Redacted Solid Redaction Bars (Redacted View) */}
          {activeTab === 'redacted' && (
            <div className="absolute inset-0 pointer-events-none">
              {activeBoxes.map((box, idx) => (
                <div
                  key={idx}
                  className="absolute bg-ink rounded-sm flex items-center justify-center border border-paper/20"
                  style={{
                    top: `${box.ymin}%`,
                    left: `${box.xmin}%`,
                    width: `${box.xmax - box.xmin}%`,
                    height: `${box.ymax - box.ymin}%`,
                  }}
                >
                  <span className="font-mono text-[9px] text-paper font-semibold tracking-wider">
                    [REDACTED]
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* SPLIT SLIDER VIEW */}
          {activeTab === 'split' && (
            <div
              className="absolute inset-y-0 right-0 overflow-hidden pointer-events-none border-l-2 border-paper"
              style={{ width: `${100 - sliderPos}%`, backdropFilter: 'grayscale(0.1)' }}
            >
              {/* Inside the redacted curtain */}
              <div
                className="absolute inset-y-0 right-0 bg-paper"
                style={{ width: '100vw', maxWidth: '36rem' }}
              >
                {/* Redaction bars matching positions */}
                {activeBoxes.map((box, idx) => (
                  <div
                    key={idx}
                    className="absolute bg-ink rounded-sm flex items-center justify-center border border-paper/20 shadow-md"
                    style={{
                      top: `${box.ymin}%`,
                      left: `${box.xmin}%`,
                      width: `${box.xmax - box.xmin}%`,
                      height: `${box.ymax - box.ymin}%`,
                    }}
                  >
                    <span className="font-mono text-[8px] text-paper font-semibold">
                      [REDACTED]
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Interactive Split Slider Control */}
        {activeTab === 'split' && (
          <div className="w-full max-w-xl mt-4 flex items-center gap-3 font-mono text-xs text-paper/60">
            <span>Original (Boxes)</span>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="flex-1 accent-signal cursor-pointer"
            />
            <span className="text-paper">Scrubbed (Redacted)</span>
          </div>
        )}
      </div>
    </div>
  )
}

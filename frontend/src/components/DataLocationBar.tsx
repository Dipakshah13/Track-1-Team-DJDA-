/**
 * DataLocationBar — shows data location status on every app page.
 * States: LOCAL_ONLY, CLOUD_SANITIZED (redacted text only), OFFLINE.
 * Also shows local model name, DETECTION_MODE, extension connection.
 */
import { Wifi, WifiOff, Shield, Cloud, Lock, LucideIcon } from 'lucide-react'
import type { DataLocation, StatusResponse } from '@/lib/api'

interface DataLocationBarProps {
  location: DataLocation
  status?: StatusResponse | null
  className?: string
}

const LOCATION_CONFIG: Record<DataLocation, {
  dot: string
  label: string
  icon: LucideIcon
  description: string
}> = {
  LOCAL_ONLY: {
    dot: 'bg-safe',
    label: 'On this device only',
    icon: Lock,
    description: 'No data leaves your device.',
  },
  CLOUD_SANITIZED: {
    dot: 'bg-caution',
    label: 'Cloud used: redacted text only',
    icon: Cloud,
    description: 'Raw values redacted on-device before any cloud call.',
  },
  OFFLINE: {
    dot: 'bg-signal',
    label: 'Model offline',
    icon: WifiOff,
    description: 'Ollama unreachable.',
  },
}

export function DataLocationBar({ location, status, className = '' }: DataLocationBarProps) {
  const config = LOCATION_CONFIG[location]
  const Icon = config.icon

  return (
    <div
      className={`data-location-bar ${className}`}
      role="status"
      aria-label={`Data location: ${config.label}`}
    >
      <span className={`data-location-dot ${config.dot}`} aria-hidden="true" />
      <Icon size={12} className="opacity-60" aria-hidden="true" />
      <span className="font-semibold tracking-wide">{config.label}</span>
      <span className="text-muted hidden sm:inline">·</span>
      <span className="text-muted hidden sm:inline">{config.description}</span>

      {status && (
        <>
          <span className="ml-auto flex items-center gap-3">
            {status.model && (
              <span className="text-muted">
                <span className="text-ink opacity-60">Model</span>{' '}
                {status.model}
              </span>
            )}
            {status.detection_mode && (
              <span className="text-muted">
                <span className="text-ink opacity-60">Mode</span>{' '}
                {status.detection_mode}
              </span>
            )}
            {status.ollama_reachable ? (
              <span className="flex items-center gap-1 text-safe">
                <Wifi size={11} />
                Local model online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-signal">
                <WifiOff size={11} />
                Local model offline —{' '}
                <a
                  href="https://ollama.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  How to fix
                </a>
              </span>
            )}
            <span className={`flex items-center gap-1 ${status.extension_seen ? 'text-safe' : 'text-muted'}`}>
              <Shield size={11} />
              Extension: {status.extension_seen ? 'connected' : 'not seen'}
            </span>
          </span>
        </>
      )}
    </div>
  )
}

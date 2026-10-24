import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { GrainOverlay } from './components/GrainOverlay'

// Landing page — all-in-one unified experience
const LandingPage = lazy(() => import('./pages/landing/LandingPage'))

function RedirectToAnchor({ anchor }: { anchor: string }) {
  const navigate = useNavigate()
  useEffect(() => {
    navigate(`/#${anchor}`, { replace: true })
    const el = document.getElementById(anchor)
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [anchor, navigate])

  return (
    <Suspense fallback={<PageLoader />}>
      <LandingPage />
    </Suspense>
  )
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <Suspense fallback={<PageLoader />}>
              <LandingPage />
            </Suspense>
          }
        />
        {/* All routes redirect to on-page anchors on the single link */}
        <Route path="/console" element={<RedirectToAnchor anchor="console" />} />
        <Route path="/guard" element={<RedirectToAnchor anchor="guard" />} />
        <Route path="/attack-demo" element={<RedirectToAnchor anchor="attack-demo" />} />
        <Route path="/demo" element={<RedirectToAnchor anchor="attack-demo" />} />
        <Route path="/ledger" element={<RedirectToAnchor anchor="ledger" />} />
        <Route path="/ctf" element={<RedirectToAnchor anchor="ctf" />} />
        <Route path="/tutorial" element={<RedirectToAnchor anchor="academy" />} />
        <Route path="*" element={<RedirectToAnchor anchor="hero" />} />
      </Routes>
    </AnimatePresence>
  )
}

function PageLoader() {
  return (
    <div
      className="min-h-screen bg-ink flex items-center justify-center"
      role="status"
      aria-label="Loading"
    >
      <div className="font-mono text-xs text-muted tracking-widest animate-pulse">
        GEMMA AEGIS FIREWALL
      </div>
    </div>
  )
}

import { SecurityProvider } from './context/SecurityContext'

export default function App() {
  return (
    <BrowserRouter>
      <SecurityProvider>
        <GrainOverlay />
        <AnimatedRoutes />
      </SecurityProvider>
    </BrowserRouter>
  )
}

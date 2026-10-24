/**
 * Card3D.tsx — Interactive 3D Perspective Card with Gyroscopic Spring Physics
 * Tilts smoothly in 3D space tracking mouse position with specular highlight.
 */
import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

interface Card3DProps {
  children: React.ReactNode
  className?: string
  glowColor?: string
}

export function Card3D({ children, className = '', glowColor = 'rgba(255, 75, 43, 0.15)' }: Card3DProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x, { stiffness: 240, damping: 25 })
  const mouseYSpring = useSpring(y, { stiffness: 240, damping: 25 })

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['12deg', '-12deg'])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-12deg', '12deg'])
  const brightness = useTransform(mouseYSpring, [-0.5, 0.5], [1.1, 0.95])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
      className={`relative transition-shadow duration-300 ${className}`}
    >
      {/* Specular Spotlight Glow */}
      <div
        className="absolute inset-0 pointer-events-none rounded-sm transition-opacity duration-300 opacity-60"
        style={{
          background: `radial-gradient(circle 350px at 50% 30%, ${glowColor} 0%, transparent 80%)`,
          transform: 'translateZ(-10px)',
        }}
      />
      <div style={{ transform: 'translateZ(25px)' }} className="relative z-10">
        {children}
      </div>
    </motion.div>
  )
}

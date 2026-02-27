import { useRef, useEffect, useState } from 'react'
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { staggerContainer, staggerItem, EASE } from '../utils/animations'

const stats = [
  { end: 65, suffix: ' Nutrients Tracked', format: (n: number) => `${Math.floor(n)}+` },
  { end: 500000, suffix: ' Foods', format: (n: number) => (n >= 1000 ? `${Math.floor(n / 1000)}k+` : `${Math.floor(n)}+`) },
  { end: 3, suffix: ' Trimesters Covered', format: (n: number) => `${Math.floor(n)}+` },
]

function AnimatedCounter({
  end,
  suffix,
  format,
  reducedMotion,
}: {
  end: number
  suffix: string
  format: (n: number) => string
  reducedMotion: boolean
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => format(v))
  const [display, setDisplay] = useState(format(reducedMotion ? end : 0).toString())

  useEffect(() => {
    if (!isInView || reducedMotion) {
      if (isInView && reducedMotion) setDisplay(format(end).toString())
      return
    }
    const controls = animate(count, end, {
      duration: 1.8,
      ease: EASE,
    })
    const unsub = rounded.on('change', setDisplay)
    return () => {
      controls.stop()
      unsub()
    }
  }, [isInView, end, count, rounded, format, reducedMotion])

  return (
    <span ref={ref}>
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  )
}

export function SocialProof() {
  const reducedMotion = useReducedMotion()
  const container = staggerContainer(reducedMotion)
  const item = staggerItem(reducedMotion)

  return (
    <section className="py-24 sm:py-32 px-6 bg-white border-b border-ovi-border/60">
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-12 sm:gap-16"
      >
        {stats.map((s) => (
          <motion.div
            key={s.suffix}
            variants={item}
            className="text-center"
          >
            <div className="font-display text-2xl sm:text-[1.75rem] font-semibold text-ovi-text-primary">
              <AnimatedCounter
                end={s.end}
                suffix={` ${s.suffix}`}
                format={s.format}
                reducedMotion={reducedMotion}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

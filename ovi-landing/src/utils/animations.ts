/**
 * Shared animation config for Ovi landing page.
 * All entrance animations use this easing and respect prefers-reduced-motion.
 */

export const EASE = [0.16, 1, 0.3, 1] as const
export const STAGGER_DELAY = 0.06

export const fadeUpVariants = {
  initial: { y: 24, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.6, ease: EASE },
}

export const staggerContainer = (reducedMotion: boolean) => ({
  hidden: reducedMotion ? { opacity: 1 } : { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: reducedMotion ? 0 : STAGGER_DELAY,
      delayChildren: reducedMotion ? 0 : 0,
    },
  },
})

export const staggerItem = (reducedMotion: boolean) => ({
  hidden: reducedMotion ? { y: 0, opacity: 1 } : { y: 12, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: reducedMotion ? 0 : 0.5, ease: EASE },
  },
})

/** For horizontal stagger (e.g. HowItWorks steps left-to-right) */
export const staggerItemHorizontal = (reducedMotion: boolean) => ({
  hidden: reducedMotion ? { x: 0, opacity: 1 } : { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: reducedMotion ? 0 : 0.5, ease: EASE },
  },
})

export const fadeUpTransition = (reducedMotion: boolean, delay = 0) => ({
  duration: reducedMotion ? 0 : 0.6,
  ease: EASE,
  delay: reducedMotion ? 0 : delay,
})

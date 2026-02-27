import { motion } from 'framer-motion'
import { posthog } from '../lib/posthog'
import { PhoneMockup } from './PhoneMockup'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { EASE, fadeUpTransition } from '../utils/animations'
import heroVideo from '../assets/Ovi_hero.mp4'

interface HeroProps {
  onCtaClick: () => void
}

export function Hero({ onCtaClick }: HeroProps) {
  const reducedMotion = useReducedMotion()

  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
  }

  const fadeUp = {
    initial: reducedMotion ? false : { y: 24, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: fadeUpTransition(reducedMotion),
  }

  return (
    <section className="relative overflow-hidden min-h-[85vh] flex items-center">
      {!reducedMotion && (
        <div className="absolute inset-0 overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-cover"
            style={{ minWidth: '100%', minHeight: '100%', width: 'auto', height: 'auto', transform: 'translate(-50%, -50%) scale(1.2)' }}
            aria-hidden
          >
            <source src={heroVideo} type="video/mp4" />
          </video>
        </div>
      )}
      <div
        className={`absolute inset-0 ${
          reducedMotion ? 'bg-ovi-cream' : 'bg-ovi-cream/[0.85]'
        }`}
      />

      <div className="relative w-full max-w-6xl mx-auto px-6 pt-12 sm:pt-16 pb-24 sm:pb-32">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-12">
          <div className="flex-1 text-center lg:text-left">
            <motion.img
              src="/logo.png"
              alt="Ovi"
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: reducedMotion ? 0 : 0.05 }}
              className="h-52 sm:h-[16.5rem] w-auto mt-4 mb-0 mx-auto lg:ml-[-3rem] lg:mr-auto"
            />
            <motion.h1
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: reducedMotion ? 0 : 0.15 }}
              className="font-display text-[3.5rem] font-semibold leading-[1.15] text-ovi-text-primary mb-6 -mt-2 tracking-[-0.02em] max-w-2xl mx-auto lg:mx-0"
            >
              Nutrition that grows with your pregnancy
            </motion.h1>
            <motion.p
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: reducedMotion ? 0 : 0.25 }}
              className="text-[1.0625rem] sm:text-lg text-ovi-text-secondary max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed"
            >
              Personalized, trimester-specific nutrition tracking. Micronutrient monitoring,
              food safety checks, and AI-powered meal suggestions built for expecting mothers.
            </motion.p>
            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: reducedMotion ? 0 : 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <motion.button
                whileHover={reducedMotion ? undefined : { scale: 1.02 }}
                whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                onClick={() => {
                  posthog?.capture('cta_clicked', { source: 'hero_download' })
                  onCtaClick()
                }}
                className="cta-shimmer-btn px-10 py-4 text-base font-medium text-white rounded-lg bg-ovi-primary hover:bg-ovi-primary-dark shadow-sm transition-colors duration-200"
              >
                Download Early Access
              </motion.button>
              <motion.button
                whileHover={reducedMotion ? undefined : { scale: 1.02 }}
                whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                onClick={() => {
                  posthog?.capture('cta_clicked', { source: 'hero_how_it_works' })
                  scrollToHowItWorks()
                }}
                className="px-10 py-4 text-base font-medium text-ovi-text-primary rounded-lg border-2 border-ovi-border hover:border-ovi-text-muted hover:bg-ovi-cream-dark/50 transition-colors duration-200"
              >
                See how it works
              </motion.button>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6, ease: EASE }}
              className="mt-6 text-sm text-ovi-text-muted"
            >
              Free during beta. iOS and Android.
            </motion.p>
          </div>
          <div className="flex-1 flex justify-center lg:justify-end">
            <PhoneMockup reducedMotion={reducedMotion} />
          </div>
        </div>
      </div>
      <SectionDivider reducedMotion={reducedMotion} />
    </section>
  )
}

function SectionDivider({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-px overflow-hidden">
      <motion.div
        initial={reducedMotion ? { width: '100%' } : { width: 0 }}
        whileInView={reducedMotion ? undefined : { width: '100%' }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: EASE }}
        className="h-full bg-ovi-border mx-auto"
      />
    </div>
  )
}

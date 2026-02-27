import { motion } from 'framer-motion'
import { FeatureIcon } from './FeatureIcon'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { EASE } from '../utils/animations'

const features = [
  {
    icon: 'chart' as const,
    title: 'Micronutrient Tracking',
    description: 'Track 65+ nutrients including folate, iron, calcium, and DHA with trimester-specific goals.',
    delay: 0,
  },
  {
    icon: 'shield' as const,
    title: 'Food Safety Checks',
    description: 'Instant pregnancy safety ratings. Know if a food is safe, limited, or best avoided.',
    delay: 0.1,
  },
  {
    icon: 'sparkle' as const,
    title: 'AI Meal Suggestions',
    description: "Smart recommendations based on your goals, preferences, and what you've already logged.",
    delay: 0.2,
  },
  {
    icon: 'scan' as const,
    title: 'Barcode & Photo Scan',
    description: 'Log food in seconds with barcode scanning or snap a photo for AI-powered identification.',
    delay: 0.3,
  },
]

export function Features() {
  const reducedMotion = useReducedMotion()

  return (
    <section id="features" className="py-24 sm:py-32 px-6 bg-ovi-cream">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={reducedMotion ? false : { y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: reducedMotion ? 0 : 0.5, ease: EASE }}
          className="font-display text-2xl sm:text-[1.75rem] font-semibold text-ovi-text-primary text-center mb-16"
        >
          Built for expecting mothers
        </motion.h2>
        <div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              initial={reducedMotion ? false : { y: 32, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{
                duration: reducedMotion ? 0 : 0.5,
                delay: reducedMotion ? 0 : feature.delay,
                ease: EASE,
              }}
              className="group p-8 rounded-2xl bg-white border border-ovi-border-light shadow-sm border-ovi-border/60 transition-shadow duration-300"
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-ovi-cream text-ovi-primary mb-6 group-hover:bg-ovi-primary-soft transition-colors duration-200">
                <FeatureIcon type={feature.icon} className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg text-ovi-text-primary mb-3">
                {feature.title}
              </h3>
              <p className="text-ovi-text-secondary text-[1.0625rem] leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

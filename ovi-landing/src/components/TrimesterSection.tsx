import { motion } from 'framer-motion'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { staggerContainer, staggerItem, EASE } from '../utils/animations'

const trimesters = [
  {
    title: 'First Trimester',
    subtitle: 'Folate, B6, ginger-safe foods',
    bg: 'bg-ovi-peach-light',
    border: 'border-ovi-peach/40',
  },
  {
    title: 'Second Trimester',
    subtitle: 'Iron, calcium, growing appetite',
    bg: 'bg-ovi-lavender-light',
    border: 'border-ovi-lavender/40',
  },
  {
    title: 'Third Trimester',
    subtitle: 'DHA, protein, energy support',
    bg: 'bg-ovi-accent-light',
    border: 'border-ovi-accent/40',
  },
]

export function TrimesterSection() {
  const reducedMotion = useReducedMotion()
  const container = staggerContainer(reducedMotion)
  const item = staggerItem(reducedMotion)

  return (
    <section id="trimesters" className="py-24 sm:py-32 px-6 bg-ovi-cream">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={reducedMotion ? false : { y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: reducedMotion ? 0 : 0.5, ease: EASE }}
          className="font-display text-2xl sm:text-[1.75rem] font-semibold text-ovi-text-primary text-center mb-16"
        >
          Recommendations that adapt
        </motion.h2>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0"
        >
          {trimesters.map((t) => (
            <motion.div
              key={t.title}
              variants={item}
              className={`min-w-[260px] sm:min-w-0 p-8 rounded-2xl border ${t.bg} ${t.border} shadow-sm`}
            >
              <h3 className="font-semibold text-lg text-ovi-text-primary mb-2">{t.title}</h3>
              <p className="text-ovi-text-secondary text-[1.0625rem] leading-relaxed">{t.subtitle}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

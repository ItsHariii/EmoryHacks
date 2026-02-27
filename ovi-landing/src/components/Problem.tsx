import { motion } from 'framer-motion'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { EASE } from '../utils/animations'

export function Problem() {
  const reducedMotion = useReducedMotion()

  return (
    <section id="problem" className="py-24 sm:py-32 px-6 bg-ovi-cream-dark">
      <div className="max-w-3xl mx-auto text-center">
        <motion.h2
          initial={reducedMotion ? false : { y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: reducedMotion ? 0 : 0.5, ease: EASE }}
          className="font-display text-2xl sm:text-[1.75rem] font-semibold text-ovi-text-primary mb-6 leading-tight"
        >
          Nutrition advice that adapts to you
        </motion.h2>
        <motion.p
          initial={reducedMotion ? false : { y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: reducedMotion ? 0 : 0.5, delay: reducedMotion ? 0 : 0.08, ease: EASE }}
          className="text-[1.0625rem] text-ovi-text-secondary leading-relaxed"
        >
          Generic pregnancy apps give the same advice to everyone. Ovi personalizes
          recommendations to <strong className="font-medium text-ovi-text-primary">your trimester</strong>, tracks the
          micronutrients that matter most (folate, iron, calcium, DHA), and tells you which foods
          are safe or best avoided before you eat.
        </motion.p>
      </div>
    </section>
  )
}

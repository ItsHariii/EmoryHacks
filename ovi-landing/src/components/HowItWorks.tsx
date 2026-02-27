import { motion } from 'framer-motion'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { staggerContainer, staggerItemHorizontal, EASE } from '../utils/animations'

const steps = [
  {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
      />
    ),
    title: 'Log your food',
    description: 'Snap a photo, scan a barcode, or search our database.',
  },
  {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    ),
    title: 'Get instant safety checks',
    description: 'See pregnancy ratings before you eat.',
  },
  {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    ),
    title: 'Track nutrients that matter',
    description: 'Folate, iron, calcium, DHA — tailored to your trimester.',
  },
]

export function HowItWorks() {
  const reducedMotion = useReducedMotion()
  const container = staggerContainer(reducedMotion)
  const item = staggerItemHorizontal(reducedMotion)

  return (
    <section id="how-it-works" className="py-24 sm:py-32 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={reducedMotion ? false : { y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: reducedMotion ? 0 : 0.5, ease: EASE }}
          className="font-display text-2xl sm:text-[1.75rem] font-semibold text-ovi-text-primary text-center mb-16"
        >
          How it works
        </motion.h2>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="flex flex-col lg:flex-row items-center lg:items-start gap-12 lg:gap-4"
        >
          {steps.map((step, i) => (
            <div key={step.title} className="relative flex-1 flex flex-col lg:flex-row items-center w-full lg:w-auto">
              <motion.div
                variants={item}
                className="flex flex-col items-center text-center lg:text-left lg:items-start flex-1"
              >
                <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-ovi-cream border border-ovi-border-light mb-4 shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="w-7 h-7 text-ovi-primary"
                  >
                    {step.icon}
                  </svg>
                </div>
                <h3 className="font-semibold text-lg text-ovi-text-primary mb-2">{step.title}</h3>
                <p className="text-ovi-text-secondary text-[1.0625rem] leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </motion.div>
              {/* Connecting line - horizontal on desktop, vertical on mobile */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-7 left-[calc(50%+4rem)] right-0 h-0.5 bg-ovi-border -mr-2" />
              )}
              {i < steps.length - 1 && (
                <div className="lg:hidden w-0.5 h-8 bg-ovi-border shrink-0 self-center" />
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

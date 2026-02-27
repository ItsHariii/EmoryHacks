import { useState, FormEvent } from 'react'
import { motion } from 'framer-motion'
import { posthog } from '../lib/posthog'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { EASE } from '../utils/animations'

interface CtaSectionProps {
  onSuccess: () => void
  formspreeEndpoint: string
}

export function CtaSection({ onSuccess, formspreeEndpoint }: CtaSectionProps) {
  const reducedMotion = useReducedMotion()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return

    setIsSubmitting(true)
    setError('')

    if (formspreeEndpoint) {
      try {
        const formData = new FormData()
        formData.append('email', trimmed)
        formData.append('_subject', 'Ovi Waitlist Signup')
        const res = await fetch(formspreeEndpoint, { method: 'POST', body: formData })
        if (res.ok) {
          posthog?.capture('waitlist_submitted', { source: 'cta_section' })
          onSuccess()
          setEmail('')
        } else setError('Something went wrong. Please try again.')
      } catch {
        setError('Something went wrong. Please try again.')
      }
    } else {
      console.log('Waitlist signup:', trimmed)
      posthog?.capture('waitlist_submitted', { source: 'cta_section' })
      onSuccess()
      setEmail('')
    }
    setIsSubmitting(false)
  }

  return (
    <section className="py-24 sm:py-32 px-6 bg-ovi-peach-light">
      <motion.div
        initial={reducedMotion ? false : { y: 24, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: reducedMotion ? 0 : 0.5, ease: EASE }}
        className="max-w-3xl mx-auto text-center"
      >
        <h2 className="font-display text-2xl sm:text-[1.75rem] font-semibold text-ovi-text-primary mb-4">
          Be the first to know when Ovi launches
        </h2>
        <p className="text-ovi-text-secondary mb-8 leading-relaxed text-[1.0625rem]">
          Join the waitlist for early access. We will notify you when the app is available.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="flex-1 px-4 py-3.5 text-[1.0625rem] rounded-lg border border-ovi-border bg-white focus:outline-none focus:ring-2 focus:ring-ovi-primary/30 focus:border-ovi-primary transition-all duration-200"
          />
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={reducedMotion ? undefined : { scale: 1.02 }}
            whileTap={reducedMotion ? undefined : { scale: 0.98 }}
            className="cta-shimmer-btn px-8 py-3.5 text-base font-medium text-white rounded-lg bg-ovi-primary hover:bg-ovi-primary-dark shadow-sm transition-colors duration-200 disabled:opacity-70 whitespace-nowrap"
          >
            {isSubmitting ? 'Joining...' : 'Join Waitlist'}
          </motion.button>
        </form>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease: EASE }}
            className="mt-3 text-sm text-ovi-primary"
          >
            {error}
          </motion.p>
        )}

        <p className="mt-4 text-sm text-ovi-text-muted">
          We will only email you about the launch. No spam.
        </p>

      </motion.div>
    </section>
  )
}

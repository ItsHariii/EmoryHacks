import { useState, FormEvent } from 'react'
import { motion } from 'framer-motion'

interface WaitlistModalProps {
  onClose: () => void
  onSuccess: () => void
  formspreeEndpoint: string
}

export function WaitlistModal({ onClose, onSuccess, formspreeEndpoint }: WaitlistModalProps) {
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
          onSuccess()
          setEmail('')
        } else setError('Something went wrong. Please try again.')
      } catch {
        setError('Something went wrong. Please try again.')
      }
    } else {
      console.log('Waitlist signup:', trimmed)
      onSuccess()
      setEmail('')
    }
    setIsSubmitting(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-ovi-text-primary/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative w-full max-w-md p-8 sm:p-10 bg-white rounded-2xl shadow-xl border border-ovi-border/60"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="modal-title"
        aria-modal
      >
        <motion.button
          whileHover={{ opacity: 0.7 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center text-ovi-text-muted hover:text-ovi-text-primary rounded-lg hover:bg-ovi-cream transition-colors duration-200"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.button>

        <h2 id="modal-title" className="font-display text-xl font-semibold text-ovi-text-primary mb-3 pr-8">
          Ovi is launching soon
        </h2>
        <p className="text-ovi-text-secondary text-[15px] mb-6 leading-relaxed">
          Enter your email to join the waitlist and be the first to get early access when we launch.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus
            className="w-full px-4 py-3 text-[15px] rounded-lg border border-ovi-border focus:outline-none focus:ring-2 focus:ring-ovi-primary/30 focus:border-ovi-primary transition-all duration-200"
          />
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-ovi-primary"
            >
              {error}
            </motion.p>
          )}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-3.5 text-base font-medium text-white rounded-lg bg-ovi-primary hover:bg-ovi-primary-dark disabled:opacity-70 transition-colors duration-200"
          >
            {isSubmitting ? 'Joining...' : 'Join Waitlist'}
          </motion.button>
        </form>
        <p className="mt-4 text-[13px] text-ovi-text-muted">
          We will only email you about the launch. No spam.
        </p>
      </motion.div>
    </motion.div>
  )
}

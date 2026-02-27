import { motion } from 'framer-motion'

interface ThankYouModalProps {
  onClose: () => void
}

export function ThankYouModal({ onClose }: ThankYouModalProps) {
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
        className="relative w-full max-w-md p-8 sm:p-10 bg-white rounded-2xl shadow-xl border border-ovi-border/60 text-center"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="thank-you-title"
        aria-modal
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 14, stiffness: 200, delay: 0.1 }}
          className="inline-flex items-center justify-center w-14 h-14 mb-6 rounded-full bg-ovi-accent"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
        <h2 id="thank-you-title" className="font-display text-xl font-semibold text-ovi-text-primary mb-3">
          You're on the list
        </h2>
        <p className="text-ovi-text-secondary text-[15px] mb-8 leading-relaxed">
          We will notify you as soon as Ovi is ready. Thank you for your interest.
        </p>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onClose}
          className="px-8 py-3.5 text-base font-medium text-white rounded-lg bg-ovi-primary hover:bg-ovi-primary-dark transition-colors duration-200"
        >
          Done
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

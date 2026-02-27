import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { EASE } from '../utils/animations'

interface HeaderProps {
  onWaitlistClick?: () => void
}

const navLinks = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#problem', label: 'Why Ovi' },
  { href: '#features', label: 'Features' },
  { href: '#trimesters', label: 'Trimesters' },
]

export function Header({ onWaitlistClick }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const reducedMotion = useReducedMotion()

  return (
    <motion.header
      initial={reducedMotion ? false : { y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.4, ease: EASE }}
      className="sticky top-0 z-50 px-6 py-3 bg-ovi-cream/95 backdrop-blur-md border-b border-ovi-border/50"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <a href="#" className="shrink-0">
          <span className="font-display text-xl font-semibold text-ovi-text-primary">Ovi</span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ovi-text-secondary hover:text-ovi-primary transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
          <button
            onClick={onWaitlistClick}
            className="px-5 py-2 text-sm font-medium text-white bg-ovi-primary hover:bg-ovi-primary-dark rounded-full shadow-sm transition-colors duration-200"
          >
            Join Waitlist
          </button>
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="sm:hidden w-10 h-10 flex items-center justify-center text-ovi-text-primary"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile nav dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden overflow-hidden border-t border-ovi-border/60 mt-2 pt-4"
          >
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-ovi-text-secondary hover:text-ovi-primary py-2"
                >
                  {link.label}
                </a>
              ))}
              <button
                onClick={() => {
                  onWaitlistClick?.()
                  setMobileMenuOpen(false)
                }}
                className="px-5 py-2 text-sm font-medium text-white bg-ovi-primary hover:bg-ovi-primary-dark rounded-full shadow-sm transition-colors duration-200 text-left w-fit mt-2"
              >
                Join Waitlist
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

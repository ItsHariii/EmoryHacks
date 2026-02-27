import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { posthog } from './lib/posthog'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { SocialProof } from './components/SocialProof'
import { Problem } from './components/Problem'
import { HowItWorks } from './components/HowItWorks'
import { Features } from './components/Features'
import { TrimesterSection } from './components/TrimesterSection'
import { CtaSection } from './components/CtaSection'
import { Footer } from './components/Footer'
import { WaitlistModal } from './components/WaitlistModal'
import { ThankYouModal } from './components/ThankYouModal'

const FORMSPREE_ENDPOINT = ''

export default function App() {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false)
  const [isThankYouOpen, setIsThankYouOpen] = useState(false)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isThankYouOpen) setIsThankYouOpen(false)
        else if (isWaitlistOpen) setIsWaitlistOpen(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isWaitlistOpen, isThankYouOpen])

  useEffect(() => {
    const isOpen = isWaitlistOpen || isThankYouOpen
    document.body.style.overflow = isOpen ? 'hidden' : ''
  }, [isWaitlistOpen, isThankYouOpen])

  const openWaitlist = () => {
    posthog?.capture('waitlist_opened')
    setIsWaitlistOpen(true)
  }
  const closeWaitlist = () => setIsWaitlistOpen(false)
  const showThankYou = () => {
    closeWaitlist()
    posthog?.capture('thank_you_shown')
    setIsThankYouOpen(true)
  }
  const closeThankYou = () => setIsThankYouOpen(false)

  return (
    <>
      <Header onWaitlistClick={openWaitlist} />
      <main>
        <Hero onCtaClick={openWaitlist} />
        <SocialProof />
        <Problem />
        <HowItWorks />
        <Features />
        <TrimesterSection />
        <CtaSection
          onSuccess={showThankYou}
          formspreeEndpoint={FORMSPREE_ENDPOINT}
        />
      </main>
      <Footer />

      <AnimatePresence>
        {isWaitlistOpen && (
          <WaitlistModal
            onClose={closeWaitlist}
            onSuccess={showThankYou}
            formspreeEndpoint={FORMSPREE_ENDPOINT}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isThankYouOpen && <ThankYouModal onClose={closeThankYou} />}
      </AnimatePresence>
    </>
  )
}

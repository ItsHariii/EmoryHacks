import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EASE } from '../utils/animations'

interface PhoneMockupProps {
  reducedMotion?: boolean
}

interface ScreenProps {
  stagger: number
  reducedMotion: boolean
  EASE: readonly [number, number, number, number]
}

const SCREEN_COUNT = 3

const bottomFadeMask: React.CSSProperties = {
  maskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
  WebkitMaskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
}

export function PhoneMockup({ reducedMotion = false }: PhoneMockupProps) {
  const stagger = reducedMotion ? 0 : 0.1
  const [currentScreen, setCurrentScreen] = useState<number>(0)

  useEffect(() => {
    if (reducedMotion) return
    const id = setInterval(() => {
      setCurrentScreen((s) => (s + 1) % SCREEN_COUNT)
    }, 4000)
    return () => clearInterval(id)
  }, [reducedMotion])

  const goToScreen = (index: number) => {
    if (reducedMotion) return
    setCurrentScreen(index)
  }

  return (
    <motion.div
      initial={reducedMotion ? undefined : { y: 20, opacity: 0 }}
      animate={
        reducedMotion
          ? undefined
          : { y: 0, opacity: 1, transition: { duration: 0.6, ease: EASE } }
      }
      whileHover={
        reducedMotion
          ? undefined
          : { scale: 1.02, transition: { duration: 0.2 } }
      }
      className="relative w-[260px] sm:w-[280px] lg:w-[300px] mx-auto lg:mx-0"
    >
      <div
        className={`relative ${reducedMotion ? 'shadow-ovi-phone' : 'animate-shadow-pulse'}`}
      >
        <div className="relative rounded-[2.5rem] bg-neutral-800 p-1.5 shadow-2xl border-2 border-neutral-700 overflow-hidden">
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-5 bg-neutral-950 rounded-full z-10" />
          <div
            className={`relative rounded-[2rem] overflow-hidden bg-ovi-cream aspect-[9/19] min-h-[420px] shadow-[inset_0_2px_8px_rgba(0,0,0,0.06)] ${!reducedMotion ? 'cursor-pointer' : ''}`}
            {...(!reducedMotion && {
              onClick: () => goToScreen((currentScreen + 1) % SCREEN_COUNT),
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ')
                  goToScreen((currentScreen + 1) % SCREEN_COUNT)
              },
              role: 'button',
              tabIndex: 0,
              'aria-label': 'View next app screen',
            })}
          >
            <div className="absolute inset-0 flex flex-col bg-ovi-cream">
              <div className="relative flex-1 overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                  {currentScreen === 0 && (
                    <DashboardScreen
                      key="dashboard"
                      stagger={stagger}
                      reducedMotion={reducedMotion}
                      EASE={EASE}
                    />
                  )}
                  {currentScreen === 1 && (
                    <FoodSafetyScreen
                      key="food-safety"
                      stagger={stagger}
                      reducedMotion={reducedMotion}
                      EASE={EASE}
                    />
                  )}
                  {currentScreen === 2 && (
                    <AIChatScreen
                      key="ai-chat"
                      stagger={stagger}
                      reducedMotion={reducedMotion}
                      EASE={EASE}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!reducedMotion && (
        <div className="flex justify-center gap-1.5 mt-4">
          {Array.from({ length: SCREEN_COUNT }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setCurrentScreen(i)
              }}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                i === currentScreen ? 'bg-ovi-primary' : 'bg-ovi-border'
              }`}
              aria-label={`View screen ${i + 1} of ${SCREEN_COUNT}`}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}

/* ─── Screen 1: Dashboard Preview ─── */

function DashboardScreen({ stagger, reducedMotion, EASE }: ScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0"
      style={bottomFadeMask}
    >
      <div className="p-3 pt-8 space-y-3 bg-ovi-cream">
        <motion.div
          initial={reducedMotion ? false : { y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: reducedMotion ? 0 : 0.4,
            delay: stagger,
            ease: EASE,
          }}
          className="rounded-2xl bg-white p-3 shadow-sm border border-ovi-border/40"
        >
          <p className="text-[11px] font-bold text-ovi-text-primary mb-2 tracking-wide">
            Today&apos;s Nutrition
          </p>
          <div className="flex gap-3">
            <div className="relative w-16 h-16 shrink-0">
              <svg
                className="w-full h-full -rotate-90"
                viewBox="0 0 36 36"
              >
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="#F0E6E0"
                  strokeWidth="4"
                />
                <motion.circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="#D65A5A"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={94}
                  initial={reducedMotion ? undefined : { strokeDashoffset: 94 }}
                  animate={{ strokeDashoffset: 94 - 94 * 0.68 }}
                  transition={{
                    duration: reducedMotion ? 0 : 1.2,
                    delay: stagger * 2,
                    ease: EASE,
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  initial={reducedMotion ? false : { scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: reducedMotion ? 0 : 0.4,
                    delay: stagger * 2.5,
                  }}
                  className="text-[10px] font-bold text-ovi-text-primary leading-tight"
                >
                  1,847
                </motion.span>
                <span className="text-[8px] text-ovi-text-muted/60">kcal</span>
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              {[
                { label: 'Protein', pct: 0.72, color: 'bg-ovi-peach' },
                { label: 'Carbs', pct: 0.85, color: 'bg-amber-200' },
                { label: 'Fat', pct: 0.58, color: 'bg-ovi-lavender' },
              ].map((m, i) => (
                <div key={m.label} className="space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-[8px] font-semibold text-ovi-text-muted/70">
                      {m.label}
                    </span>
                    <span className="text-[8px] text-ovi-text-muted/60">
                      {Math.round(m.pct * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-ovi-border/60 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${m.color}`}
                      initial={reducedMotion ? undefined : { width: 0 }}
                      animate={{ width: `${m.pct * 100}%` }}
                      transition={{
                        duration: reducedMotion ? 0 : 0.8,
                        delay: stagger * (3 + i * 0.3),
                        ease: EASE,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={reducedMotion ? false : { y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: reducedMotion ? 0 : 0.4,
            delay: stagger * 4,
            ease: EASE,
          }}
          className="rounded-2xl bg-ovi-peach p-3 border border-ovi-border/40 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">👶</span>
            <p className="text-[11px] font-bold text-ovi-text-primary/80">
              Week 24 – Your baby
            </p>
          </div>
          <p className="text-[9px] text-ovi-text-secondary/80 leading-tight">
            About the size of an ear of corn…
          </p>
        </motion.div>

        {[
          { emoji: '🥗', name: 'Greek Salad', time: '12:34 PM', kcal: '340' },
          { emoji: '🍎', name: 'Apple slices', time: '10:15 AM', kcal: '95' },
        ].map((entry, i) => (
          <motion.div
            key={entry.name}
            initial={reducedMotion ? false : { x: -8, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{
              duration: reducedMotion ? 0 : 0.35,
              delay: stagger * (5 + i),
              ease: EASE,
            }}
            className="rounded-xl bg-white/90 p-2.5 flex items-center gap-2 border border-ovi-border/40"
          >
            <span className="text-base">{entry.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-ovi-text-primary truncate">
                {entry.name}
              </p>
              <p className="text-[8px] text-ovi-text-muted/60">{entry.time}</p>
            </div>
            <span className="text-[9px] font-medium text-ovi-primary/70">
              {entry.kcal} kcal
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

/* ─── Screen 2: Food Safety Check ─── */

function FoodSafetyScreen({ stagger, reducedMotion, EASE }: ScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0"
      style={bottomFadeMask}
    >
      <div className="p-3 pt-8 space-y-3 bg-ovi-cream">
        <motion.div
          initial={reducedMotion ? false : { y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: reducedMotion ? 0 : 0.4,
            delay: stagger,
            ease: EASE,
          }}
          className="flex items-center gap-2"
        >
          <span className="text-sm">🛡️</span>
          <p className="text-[12px] font-bold text-ovi-text-primary tracking-wide">
            Food Safety
          </p>
        </motion.div>

        <motion.div
          initial={reducedMotion ? false : { y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: reducedMotion ? 0 : 0.4,
            delay: stagger * 2,
            ease: EASE,
          }}
          className="rounded-2xl bg-white p-3 shadow-sm border border-ovi-border/40"
        >
          <div className="flex items-start gap-2.5">
            <span className="text-2xl">🍣</span>
            <div className="flex-1">
              <p className="text-[11px] font-bold text-ovi-text-primary">
                Salmon Sushi
              </p>
              <p className="text-[9px] text-ovi-text-muted mt-0.5">
                Raw fish, rice, nori
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span className="text-[9px] font-semibold text-amber-700">
                  Caution
                </span>
                <span className="text-[8px] text-ovi-text-muted">
                  · Limit intake
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={reducedMotion ? false : { y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: reducedMotion ? 0 : 0.4,
            delay: stagger * 3,
            ease: EASE,
          }}
          className="rounded-xl bg-amber-50 p-2.5 border border-amber-200/60"
        >
          <p className="text-[9px] text-amber-800 leading-relaxed">
            Raw fish may contain parasites. Consider fully cooked salmon as a
            safer alternative during pregnancy.
          </p>
        </motion.div>

        <motion.div
          initial={reducedMotion ? false : { y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: reducedMotion ? 0 : 0.4,
            delay: stagger * 4,
            ease: EASE,
          }}
          className="space-y-2"
        >
          <p className="text-[10px] font-bold text-ovi-text-primary">
            Key Nutrients
          </p>
          <div className="flex gap-2">
            <div className="flex-1 rounded-xl bg-white p-2.5 border border-ovi-border/40">
              <p className="text-[8px] text-ovi-text-muted font-medium">
                Omega-3
              </p>
              <p className="text-[11px] font-bold text-ovi-accent-dark mt-0.5">
                1.2g
              </p>
              <div className="h-1 rounded-full bg-ovi-border/60 overflow-hidden mt-1">
                <motion.div
                  className="h-full rounded-full bg-ovi-accent"
                  initial={reducedMotion ? undefined : { width: 0 }}
                  animate={{ width: '78%' }}
                  transition={{
                    duration: reducedMotion ? 0 : 0.8,
                    delay: stagger * 5,
                    ease: EASE,
                  }}
                />
              </div>
            </div>
            <div className="flex-1 rounded-xl bg-white p-2.5 border border-ovi-border/40">
              <p className="text-[8px] text-ovi-text-muted font-medium">
                Mercury
              </p>
              <p className="text-[11px] font-bold text-amber-600 mt-0.5">
                Low
              </p>
              <div className="h-1 rounded-full bg-ovi-border/60 overflow-hidden mt-1">
                <motion.div
                  className="h-full rounded-full bg-amber-300"
                  initial={reducedMotion ? undefined : { width: 0 }}
                  animate={{ width: '25%' }}
                  transition={{
                    duration: reducedMotion ? 0 : 0.8,
                    delay: stagger * 5.5,
                    ease: EASE,
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={reducedMotion ? false : { y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: reducedMotion ? 0 : 0.4,
            delay: stagger * 6,
            ease: EASE,
          }}
          className="rounded-2xl bg-white p-3 shadow-sm border border-ovi-border/40"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🧀</span>
            <div className="flex-1">
              <p className="text-[11px] font-bold text-ovi-text-primary">
                Brie Cheese
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-ovi-primary shrink-0" />
                <span className="text-[9px] font-semibold text-ovi-primary">
                  Avoid
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

/* ─── Screen 3: AI Chat / Photo Scan ─── */

function AIChatScreen({ stagger, reducedMotion, EASE }: ScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0"
      style={bottomFadeMask}
    >
      <div className="p-3 pt-8 space-y-3 bg-ovi-cream">
        <motion.div
          initial={reducedMotion ? false : { y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: reducedMotion ? 0 : 0.4,
            delay: stagger,
            ease: EASE,
          }}
          className="flex items-center gap-2"
        >
          <div className="w-6 h-6 rounded-full bg-ovi-primary flex items-center justify-center">
            <span className="text-[10px] text-white font-bold">AI</span>
          </div>
          <p className="text-[12px] font-bold text-ovi-text-primary tracking-wide">
            Ask Ovi
          </p>
        </motion.div>

        <motion.div
          initial={reducedMotion ? false : { x: 12, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{
            duration: reducedMotion ? 0 : 0.35,
            delay: stagger * 2,
            ease: EASE,
          }}
          className="flex justify-end"
        >
          <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-ovi-primary px-3 py-2">
            <p className="text-[10px] text-white leading-relaxed">
              Is salmon sushi safe to eat? I&apos;m in my second trimester.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={reducedMotion ? false : { x: -12, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{
            duration: reducedMotion ? 0 : 0.35,
            delay: stagger * 3.5,
            ease: EASE,
          }}
          className="flex justify-start"
        >
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white px-3 py-2.5 shadow-sm border border-ovi-border/40">
            <p className="text-[10px] text-ovi-text-primary leading-relaxed">
              Raw salmon sushi is generally advised against during pregnancy due
              to potential parasites. Consider these alternatives:
            </p>
            <ul className="mt-1.5 space-y-1">
              <li className="text-[9px] text-ovi-text-secondary flex items-start gap-1">
                <span className="text-ovi-accent-dark mt-0.5">✓</span>
                Cooked salmon rolls
              </li>
              <li className="text-[9px] text-ovi-text-secondary flex items-start gap-1">
                <span className="text-ovi-accent-dark mt-0.5">✓</span>
                Veggie sushi
              </li>
            </ul>
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-ovi-border/40">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-[8px] font-semibold text-amber-700">
                Caution – Limit intake
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={reducedMotion ? false : { x: 12, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{
            duration: reducedMotion ? 0 : 0.35,
            delay: stagger * 5,
            ease: EASE,
          }}
          className="flex justify-end"
        >
          <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-ovi-primary px-3 py-2">
            <p className="text-[10px] text-white leading-relaxed">
              What about cooked shrimp?
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={reducedMotion ? false : { x: -12, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{
            duration: reducedMotion ? 0 : 0.35,
            delay: stagger * 6.5,
            ease: EASE,
          }}
          className="flex justify-start"
        >
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white px-3 py-2.5 shadow-sm border border-ovi-border/40">
            <p className="text-[10px] text-ovi-text-primary leading-relaxed">
              Cooked shrimp is safe and nutritious! Great source of protein and
              omega-3s.
            </p>
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-ovi-border/40">
              <span className="w-1.5 h-1.5 rounded-full bg-ovi-accent" />
              <span className="text-[8px] font-semibold text-ovi-accent-dark">
                Safe – Enjoy freely
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={reducedMotion ? false : { y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: reducedMotion ? 0 : 0.35,
            delay: stagger * 8,
            ease: EASE,
          }}
          className="rounded-xl bg-white px-3 py-2.5 border border-ovi-border/40 flex items-center gap-2"
        >
          <span className="text-[9px] text-ovi-text-muted/60">
            Ask about any food…
          </span>
          <div className="ml-auto w-5 h-5 rounded-full bg-ovi-primary/10 flex items-center justify-center">
            <span className="text-[10px] text-ovi-primary">↑</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, TrendingUp, ChevronUp } from 'lucide-react'

import { Sidebar } from '@/components/layout/Sidebar'
import { PageTransition } from '@/components/layout/PageTransition'
import { KeyboardShortcutHelp } from '@/components/ui/keyboard-shortcut'
import { useEffect } from 'react'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="relative flex flex-col md:flex-row md:h-screen overflow-hidden">
      {/* Mobile top bar */}
      <div className="flex md:hidden items-center justify-between h-14 px-4 sm:px-6 lg:px-8 bg-zinc-950/85 backdrop-blur-xl border-b border-zinc-700/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-lg shadow-violet-900/40">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-semibold text-sm leading-none">FinSight</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Quant Research OS</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="inline-flex items-center justify-center rounded-md p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main content */}
      <div
        className="flex-1 overflow-y-auto scroll-smooth"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(148,163,184,.09)_1px,transparent_1px)] [background-size:22px_22px]" />
        <PageTransition>{children}</PageTransition>
        <KeyboardShortcutHelp />
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              key="scroll-top"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed bottom-4 left-4 z-50 w-9 h-9 rounded-full bg-zinc-900/90 border border-zinc-600/80 backdrop-blur-sm flex items-center justify-center text-zinc-200 hover:bg-zinc-800/90 hover:border-zinc-500 transition-colors"
              aria-label="Scroll to top"
            >
              <ChevronUp className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>

        <footer className="mt-16 pt-6 border-t border-zinc-800/40 flex items-center justify-between text-[11px] text-zinc-500 px-4 sm:px-6 lg:px-8 pb-6">
          <span>FinSight © 2026 · Rajveer Singh Pall</span>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Rajveer-code/Finsight"
              className="hover:text-zinc-400 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a
              href="https://huggingface.co/spaces/Rajveer234/finsight"
              className="hover:text-zinc-400 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Demo
            </a>
          </div>
        </footer>
      </div>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -224 }}
              animate={{ x: 0 }}
              exit={{ x: -224 }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              className="relative h-full w-64 bg-zinc-950/95 backdrop-blur-2xl border-r border-zinc-700/50 shadow-2xl"
            >
              <Sidebar isOpen onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

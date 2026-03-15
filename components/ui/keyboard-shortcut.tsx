'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

const shortcuts = [
  { keys: 'G then O', description: 'Go to Overview', path: '/' },
  { keys: 'G then M', description: 'Go to Models', path: '/models' },
  { keys: 'G then F', description: 'Go to Features', path: '/features' },
  { keys: 'G then B', description: 'Go to Backtest', path: '/backtest' },
  { keys: 'G then S', description: 'Go to Sectors', path: '/sectors' },
  { keys: 'G then E', description: 'Go to Explorer', path: '/explorer' },
  { keys: '?', description: 'Show/hide shortcuts', path: null },
]

export function KeyboardShortcutHelp() {
  const [open, setOpen] = useState(false)
  const [pendingG, setPendingG] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let timeout: number | undefined

    const handler = (e: KeyboardEvent) => {
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault()
        setOpen((v) => !v)
        setPendingG(false)
        return
      }

      const key = e.key.toLowerCase()

      if (key === 'g') {
        setPendingG(true)
        if (timeout) window.clearTimeout(timeout)
        timeout = window.setTimeout(() => setPendingG(false), 1200)
        return
      }

      if (pendingG) {
        let path: string | null = null
        if (key === 'o') path = '/'
        else if (key === 'm') path = '/models'
        else if (key === 'f') path = '/features'
        else if (key === 'b') path = '/backtest'
        else if (key === 's') path = '/sectors'
        else if (key === 'e') path = '/explorer'

        if (path) {
          e.preventDefault()
          setPendingG(false)
          setOpen(false)
          router.push(path)
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
      if (timeout) window.clearTimeout(timeout)
    }
  }, [pendingG, router])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed bottom-4 right-4 z-50 bg-zinc-900 border border-zinc-700 rounded-xl p-4 shadow-2xl shadow-black/50 w-72"
        >
          <div className="text-xs font-semibold text-zinc-400 mb-2 flex items-center justify-between">
            <span>Keyboard Shortcuts</span>
            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400">?</span>
          </div>
          <div className="space-y-2">
            {shortcuts.map((s) => (
              <div key={s.keys} className="flex items-center justify-between text-[11px]">
                <div className="flex gap-1">
                  {s.keys.split(' ').map((k, i) =>
                    k === 'then' ? (
                      <span key={i} className="text-zinc-500 px-0.5">
                        then
                      </span>
                    ) : (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-200 font-mono"
                      >
                        {k}
                      </span>
                    )
                  )}
                </div>
                <span className="text-zinc-500">{s.description}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}


'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  TrendingUp, BarChart2, Zap, Activity,
  Globe2, Search, ExternalLink, Github, X
} from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/',          label: 'Overview',          icon: TrendingUp  },
  { href: '/models',    label: 'Model Performance',  icon: BarChart2   },
  { href: '/features',  label: 'Feature Importance', icon: Zap         },
  { href: '/backtest',  label: 'Backtest',           icon: Activity    },
  { href: '/sectors',   label: 'Sector Analysis',    icon: Globe2      },
  { href: '/explorer',  label: 'Explorer',           icon: Search      },
]

type SidebarProps = {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps = {}) {
  const path = usePathname()
  return (
    <aside className="w-64 shrink-0 border-r border-zinc-700/40 bg-zinc-950/90 backdrop-blur-2xl flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-zinc-700/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-lg shadow-violet-900/40">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-white leading-none">FinSight</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Quant Research OS</div>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="md:hidden inline-flex items-center justify-center rounded-md p-1.5 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/70 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 border border-transparent overflow-hidden',
                active
                  ? 'text-white font-semibold border-zinc-600/60 shadow-[inset_0_1px_0_rgba(255,255,255,.07)]'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-violet-500/10"
                  transition={{ type: 'spring', stiffness: 500, damping: 40, mass: 0.8 }}
                />
              )}
              <Icon className={cn(
                'w-4 h-4 shrink-0 transition-colors relative z-10',
                active ? 'text-blue-400' : 'text-zinc-600 group-hover:text-zinc-300'
              )} />
              <span className="relative z-10">{label}</span>
              {active && (
                <motion.div
                  layoutId="activeTab"
                  className="ml-auto h-2 w-2 rounded-full bg-blue-400 relative z-10 shadow-[0_0_16px_rgba(59,130,246,.75)]"
                  transition={{ type: 'spring', stiffness: 500, damping: 40, mass: 0.8 }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 border-t border-zinc-700/40" />

      {/* Footer links */}
      <div className="px-4 py-4 space-y-2.5">
        <a
          href="https://huggingface.co/spaces/Rajveer234/finsight"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Streamlit Demo
        </a>
        <a
          href="https://github.com/Rajveer-code/Finsight"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          <Github className="w-3 h-3" />
          Source Code
        </a>
        <div className="pt-1">
          <div className="text-[10px] text-zinc-500">Rajveer Singh Pall</div>
          <div className="text-[10px] text-zinc-600">March 2026</div>
        </div>
        <div className="flex justify-end pt-2">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700/60 text-[10px] text-zinc-400">
            <span className="px-1.5 py-0.5 rounded bg-zinc-800/90 text-zinc-200 font-mono text-[10px]">?</span>
            <span>Shortcuts</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

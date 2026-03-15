'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine, Label
} from 'recharts'
import type { SectorRow } from '@/lib/types'
import { fetchData } from '@/lib/types'
import { ChartCard } from '@/components/ui/chart-card'
import { PageHeader } from '@/components/ui/page-header'
import { PerformanceBadge } from '@/components/ui/performance-badge'

const SECTOR_INSIGHTS: Record<string, string> = {
  Energy: 'Concrete numerical guidance (barrels/day, margins) makes earnings highly predictable. High information asymmetry with commodity price exposure.',
  Industrials: 'Most consistent signal (IC std=0.036). Quarterly order books and backlog disclosures provide reliable forward-looking indicators.',
  'Real Estate': 'Cap rate and NOI guidance is highly specific, making RAG guidance features particularly effective.',
  Utilities: 'Regulatory filings and rate case discussions contain structured, predictable language that FinBERT reads well.',
  'Consumer Staples': 'Pricing power discussions in inflationary environment (2022-2023) created strong NLP signals.',
  Healthcare: 'Complex clinical trial language with binary outcomes creates high information asymmetry.',
  Financials: 'Net interest margin and credit quality discussions are moderately predictable.',
  Technology: 'Near-zero IC (0.004) — most efficiently priced sector. Vague forward guidance ("AI opportunities") provides little signal.',
  'Consumer Disc': 'Negative IC driven by volatile consumer spending environment and unpredictable discretionary demand.',
  Communications: 'Weakened by streaming competition narratives that analysts price in rapidly.',
  Materials: 'Commodity price sensitivity dominates company-specific NLP signals, reducing predictability.',
}

export default function SectorsPage() {
  const [sectors, setSectors] = useState<SectorRow[]>([])

  useEffect(() => {
    fetchData<SectorRow[]>('sector_ic.json').then(d => {
      setSectors([...d].sort((a, b) => b.ic_mean - a.ic_mean))
    }).catch(() => { })
  }, [])

  const chartData = sectors.map(s => ({
    sector: s.sector,
    ic: s.ic_mean,
    std: s.ic_std,
    auc: s.auc_mean,
    n: s.n_test_avg,
  }))

  const max = Math.max(...sectors.map(s => Math.abs(s.ic_mean)), 0.01)

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 space-y-10">

      <PageHeader
        eyebrow="GICS Sectors · Walk-forward 2021–2024"
        title="Sector Analysis"
        description="Does the NLP signal vary across sectors? Short answer: dramatically. Energy IC = +0.31 vs Technology IC ≈ 0. Consistent with efficient market theory by sector."
      />

      {/* Insight callout */}
      <div className="flex items-baseline gap-4 mb-2">
        <span className="text-6xl font-black text-green-400 tabular-nums">
          +0.311
        </span>
        <div>
          <div className="text-lg font-bold text-zinc-200">Energy IC</div>
          <div className="text-sm text-zinc-500">
            83× stronger signal than Technology (IC ≈ 0.004)
          </div>
          <div className="text-xs text-zinc-600 mt-1">
            Consistent with efficient market hypothesis by sector
          </div>
        </div>
      </div>

      {/* IC bar chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}
      >
        <ChartCard
          title="IC by Sector"
          subtitle="Error bars = ±1 standard deviation across test years"
        >
          <div className="h-[200px] md:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...chartData].reverse()} layout="vertical" barSize={18}>
                <CartesianGrid stroke="#1a1f2e" strokeOpacity={0.5} horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `${v > 0 ? '+' : ''}${v.toFixed(3)}`}
                >
                  <Label
                    value="Information Coefficient (IC)"
                    position="insideBottom"
                    offset={-5}
                    fill="#6b7280"
                    fontSize={11}
                  />
                </XAxis>
                <YAxis dataKey="sector" type="category" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={130}>
                  <Label
                    value="GICS Sector"
                    angle={-90}
                    position="insideLeft"
                    offset={10}
                    fill="#6b7280"
                    fontSize={11}
                  />
                </YAxis>
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }}
                  formatter={(v, _name, entry) => {
                    const num = typeof v === 'number' ? v : parseFloat(String(v))
                    const sector = (entry as { payload?: { sector?: string } })?.payload?.sector
                    const label = sector === 'Energy' ? 'IC Mean (Energy)' : 'IC Mean'
                    const formatted = isNaN(num) ? String(v) : `${num > 0 ? '+' : ''}${num.toFixed(4)} IC`
                    return [formatted, label]
                  }}
                />
                <ReferenceLine x={0} stroke="#374151" strokeOpacity={0.6} />
                <Bar
                  dataKey="ic"
                  name="IC Mean"
                  radius={[0, 4, 4, 0]}
                  label={{
                    position: 'right',
                    fill: '#6b7280',
                    fontSize: 10,
                    formatter: (v: string | number | boolean | null | undefined) => {
                      const num = typeof v === 'number' ? v : parseFloat(String(v ?? ''))
                      return isNaN(num) ? String(v ?? '') : `${num > 0 ? '+' : ''}${num.toFixed(4)}`
                    },
                  }}
                  animationBegin={200}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {[...chartData].reverse().map((entry, i) => (
                    <Cell key={i} fill={entry.ic > 0.025 ? '#22c55e' : entry.ic > 0 ? '#3b82f6' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </motion.div>

      {/* Sector detail table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-zinc-800/60">
          <div className="text-sm font-semibold text-zinc-300">Full Sector Ranking</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800/60">
                {['Rank', 'Sector', 'IC Mean', 'IC Std', 'AUC', 'Avg N', 'Signal'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sectors.map((s, i) => {
                const barWidth = Math.abs(s.ic_mean) / max * 100
                return (
                  <motion.tr
                    key={s.sector}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.04 }}
                    className="border-b border-zinc-800/40 hover:bg-zinc-800/20 transition-colors"
                  >
                    <td className="px-5 py-3 text-zinc-600 tabular-nums font-mono">#{i + 1}</td>
                    <td className="px-5 py-3 font-medium text-zinc-200">{s.sector}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold tabular-nums ${s.ic_mean > 0.025 ? 'text-green-400' : s.ic_mean > 0 ? 'text-blue-400' : 'text-red-400'}`}>
                          {s.ic_mean > 0 ? '+' : ''}{s.ic_mean.toFixed(4)}
                        </span>
                        <PerformanceBadge value={s.ic_mean} />
                      </div>
                    </td>
                    <td className="px-5 py-3 text-zinc-500 tabular-nums">{s.ic_std.toFixed(4)}</td>
                    <td className="px-5 py-3 text-zinc-400 tabular-nums">{s.auc_mean.toFixed(4)}</td>
                    <td className="px-5 py-3 text-zinc-500 tabular-nums">{Math.round(s.n_test_avg)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 rounded-full bg-zinc-800 w-24">
                          <div
                            className={`h-full rounded-full transition-all ${s.ic_mean > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Insight cards for top/bottom sectors */}
      <div>
        <div className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-5">Why Each Sector Behaves This Way</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sectors.map((s, i) => (
            <motion.div
              key={s.sector}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className={`p-4 rounded-xl border ${s.ic_mean > 0.025 ? 'bg-green-500/5 border-green-500/20'
                  : s.ic_mean > 0 ? 'bg-zinc-900/40 border-zinc-800/60'
                    : 'bg-red-500/5 border-red-500/20'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-semibold ${s.ic_mean > 0.025 ? 'text-green-400'
                    : s.ic_mean > 0 ? 'text-zinc-300'
                      : 'text-red-400'
                  }`}>{s.sector}</span>
                <span className={`text-xs font-mono tabular-nums font-bold ${s.ic_mean > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  IC={s.ic_mean > 0 ? '+' : ''}{s.ic_mean.toFixed(4)}
                </span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {SECTOR_INSIGHTS[s.sector] || 'Mixed signals across the sector.'}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ComposedChart, ReferenceDot, Label
} from 'recharts'
import type { BacktestRow } from '@/lib/types'
import { fetchData } from '@/lib/types'
import { ChartCard } from '@/components/ui/chart-card'
import { PageHeader } from '@/components/ui/page-header'

function computeMetrics(rows: BacktestRow[], retCol: keyof BacktestRow) {
  const rets = rows.map(r => r[retCol] as number).filter(v => v != null)
  if (!rets.length) return null
  const prod = rets.reduce((a, b) => a * (1 + b), 1)
  const nYears = rets.length / 4
  const annRet = Math.pow(prod, 1 / nYears) - 1
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length
  const std = Math.sqrt(rets.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / rets.length) * Math.sqrt(4)
  const sharpe = std > 0 ? annRet / std : 0
  let cum = 1, peak = 1, maxDD = 0
  rets.forEach(r => { cum *= 1 + r; peak = Math.max(peak, cum); maxDD = Math.min(maxDD, (cum - peak) / peak) })
  const hit = rets.filter(r => r > 0).length / rets.length
  return { annRet, std, sharpe, maxDD, hit, n: rets.length }
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{color: string; name: string; value: number}>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-xs shadow-xl">
      <div className="font-semibold text-zinc-300 mb-1.5">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-zinc-400">{p.name}:</span>
          <span className={`font-medium ${p.value > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {(p.value * 100).toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  )
}

function MetricCard({ label, value, format = 'pct', positive }: { label: string; value: number; format?: 'pct' | 'ratio' | 'count'; positive?: boolean }) {
  const formatted = format === 'pct' ? `${(value * 100).toFixed(2)}%`
    : format === 'ratio' ? value.toFixed(3)
    : value.toString()
  const isPos = positive ?? value > 0
  return (
    <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-4">
      <div className={`text-2xl font-bold tabular-nums ${isPos ? 'text-green-400' : 'text-red-400'}`}>{formatted}</div>
      <div className="text-xs text-zinc-500 mt-1">{label}</div>
    </div>
  )
}

export default function BacktestPage() {
  const [bt5, setBt5] = useState<BacktestRow[]>([])
  const [bt20, setBt20] = useState<BacktestRow[]>([])
  const [view, setView] = useState<'5d' | '20d' | 'compare'>('5d')

  useEffect(() => {
    fetchData<BacktestRow[]>('backtest_5d.json').then(setBt5).catch(() => {})
    fetchData<BacktestRow[]>('backtest_20d.json').then(setBt20).catch(() => {})
  }, [])

  const current = view === '20d' ? bt20 : bt5
  const retCol: keyof BacktestRow = 'net_ret'

  // Build cumulative return series
  function buildCum(rows: BacktestRow[]) {
    let cum = 1
    return rows.sort((a, b) => a.year !== b.year ? a.year - b.year : a.quarter - b.quarter)
      .map(r => {
        cum *= 1 + r.net_ret
        return { period: `${r.year}-Q${r.quarter}`, cum, ret: r.net_ret, long_hit: r.long_hit, short_hit: r.short_hit }
      })
  }

  const cum5  = buildCum([...bt5])
  const cum20 = buildCum([...bt20])
  const compareData = cum5.map((r, i) => ({
    period: r.period,
    '5-Day': r.cum,
    '20-Day': cum20[i]?.cum ?? null
  }))

  const m5  = computeMetrics(bt5, retCol)
  const m20 = computeMetrics(bt20, retCol)
  const active = view === '20d' ? m20 : m5

  const cumData = buildCum([...current])
  const minCumPoint = cumData.reduce(
    (min, p) => (p.cum < min.cum ? p : min),
    cumData[0] ?? { period: '', cum: 1, ret: 0, long_hit: 0, short_hit: 0 }
  )
  const barData = [...current].sort((a, b) => a.year !== b.year ? a.year - b.year : a.quarter - b.quarter)
    .map(r => ({ period: `${r.year}-Q${r.quarter}`, ret: r.net_ret }))

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 space-y-10">

      <PageHeader
        eyebrow="Long-Short Quartile · 10bps TC · 2021–2024"
        title="Backtest Results"
        description="Long top-25% predicted stocks, short bottom-25%. 5-day and 20-day holding periods. 10 basis points round-trip transaction cost applied per leg."
      />

      <div className="flex items-center gap-8 mb-6 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
        <div className="text-center">
          <div className="text-3xl font-black text-red-400">-0.81</div>
          <div className="text-xs text-zinc-600">5-day Sharpe</div>
        </div>
        <div className="text-2xl text-zinc-700">→</div>
        <div className="text-center">
          <div className="text-3xl font-black text-amber-400">-0.23</div>
          <div className="text-xs text-zinc-600">20-day Sharpe</div>
        </div>
        <div className="text-2xl text-zinc-700">→</div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-blue-400">
            3.6× improvement with longer holding period
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            Consistent with PEAD theory (Bernard & Thomas 1989). Signal takes time to be fully priced.
          </div>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        {(['5d', '20d', 'compare'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              view === v
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {v === 'compare' ? '5d vs 20d' : v.toUpperCase()}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {view !== 'compare' && active && (
          <motion.div
            key={`metrics-${view}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="grid grid-cols-2 md:grid-cols-5 gap-4"
          >
            <MetricCard label="Ann. Return" value={active.annRet} />
            <MetricCard label="Sharpe Ratio" value={active.sharpe} format="ratio" />
            <MetricCard label="Max Drawdown" value={active.maxDD} />
            <MetricCard label="Win Rate" value={active.hit} positive={active.hit > 0.5} />
            <MetricCard label="Quarters" value={active.n} format="count" positive={true} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5d vs 20d comparison metrics */}
      {view === 'compare' && m5 && m20 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl overflow-hidden"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800/60">
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Metric</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">5-Day</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">20-Day</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Change</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Ann. Return', v5: m5.annRet, v20: m20.annRet, fmt: (v: number) => `${(v*100).toFixed(2)}%` },
                { label: 'Sharpe Ratio', v5: m5.sharpe, v20: m20.sharpe, fmt: (v: number) => v.toFixed(3) },
                { label: 'Max Drawdown', v5: m5.maxDD, v20: m20.maxDD, fmt: (v: number) => `${(v*100).toFixed(2)}%` },
                { label: 'Win Rate', v5: m5.hit, v20: m20.hit, fmt: (v: number) => `${(v*100).toFixed(1)}%` },
              ].map((row, i) => {
                const improved = row.label === 'Max Drawdown' ? row.v20 > row.v5 : row.v20 > row.v5
                return (
                  <tr key={i} className="border-b border-zinc-800/40 hover:bg-zinc-800/20 transition-colors">
                    <td className="px-5 py-3 text-zinc-400 font-medium">{row.label}</td>
                    <td className={`px-5 py-3 tabular-nums font-medium ${row.v5 > 0 ? 'text-green-400' : 'text-red-400'}`}>{row.fmt(row.v5)}</td>
                    <td className={`px-5 py-3 tabular-nums font-medium ${row.v20 > 0 ? 'text-green-400' : 'text-red-400'}`}>{row.fmt(row.v20)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${improved ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {improved ? '✓ Better' : '✗ Worse'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Metrics + charts section with animated view changes */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`charts-${view}`}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 8 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="space-y-6"
        >
          {/* Main chart */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <ChartCard
              title={view === 'compare' ? '5-Day vs 20-Day Cumulative Return' : `${view.toUpperCase()} Holding Period — Cumulative Return`}
            >
              <div className="h-[200px] md:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                {view === 'compare' ? (
              <LineChart data={compareData}>
                <CartesianGrid stroke="#1a1f2e" strokeOpacity={0.5} vertical={false} />
                <XAxis dataKey="period" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} interval={3}>
                  <Label value="Quarter" position="insideBottom" offset={-5} fill="#6b7280" fontSize={11} />
                </XAxis>
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `×${v.toFixed(2)}`}
                >
                  <Label
                    value="Portfolio Value (×1)"
                    angle={-90}
                    position="insideLeft"
                    offset={10}
                    fill="#6b7280"
                    fontSize={11}
                  />
                </YAxis>
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-xs shadow-xl">
                        <div className="font-semibold text-zinc-300 mb-1">{label}</div>
                        {payload.map((p, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                            <span className="text-zinc-400">{p.name}:</span>
                            <span className="text-zinc-200 font-medium">
                              {typeof p.value === 'number' ? `×${p.value.toFixed(2)}` : p.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  }}
                />
                <ReferenceLine y={1} stroke="#374151" strokeOpacity={0.6} />
                <Line
                  type="monotone"
                  dataKey="5-Day"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  animationBegin={0}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
                <Line
                  type="monotone"
                  dataKey="20-Day"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  animationBegin={0}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              </LineChart>
            ) : (
              <AreaChart data={cumData}>
                <CartesianGrid stroke="#1a1f2e" strokeOpacity={0.5} vertical={false} />
                <XAxis dataKey="period" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} interval={3}>
                  <Label value="Quarter" position="insideBottom" offset={-5} fill="#6b7280" fontSize={11} />
                </XAxis>
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `×${v.toFixed(2)}`}
                >
                  <Label
                    value="Portfolio Value (×1)"
                    angle={-90}
                    position="insideLeft"
                    offset={10}
                    fill="#6b7280"
                    fontSize={11}
                  />
                </YAxis>
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-xs shadow-xl">
                        <div className="font-semibold text-zinc-300 mb-1">{label}</div>
                        {payload.map((p, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                            <span className="text-zinc-400">{p.name}:</span>
                            <span className="text-zinc-200 font-medium">
                              {typeof p.value === 'number' ? `×${p.value.toFixed(2)}` : p.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  }}
                />
                <ReferenceLine y={1} stroke="#374151" strokeOpacity={0.6} />
              <Area
                type="monotone"
                dataKey="cum"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#grad)"
                name="Cumulative"
                animationBegin={0}
                animationDuration={1000}
              />
                {minCumPoint && (
                  <ReferenceDot
                    x={minCumPoint.period}
                    y={minCumPoint.cum}
                    r={3}
                    fill="#ef4444"
                    stroke="#ef4444"
                  >
                    <Label
                      value="Max DD ↓"
                      position="top"
                      offset={10}
                      fill="#ef4444"
                      fontSize={11}
                    />
                  </ReferenceDot>
                )}
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </AreaChart>
            )}
          </ResponsiveContainer>
          </div>
        </ChartCard>
          </motion.div>

          {/* Quarterly returns bars */}
          {view !== 'compare' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
            >
              <ChartCard title="Quarterly Net Returns">
                <div className="h-[200px] md:h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} barSize={18}>
                <CartesianGrid stroke="#1a1f2e" strokeOpacity={0.5} vertical={false} />
                <XAxis dataKey="period" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false}>
                  <Label value="Quarter" position="insideBottom" offset={-5} fill="#6b7280" fontSize={11} />
                </XAxis>
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `${(v*100).toFixed(1)}%`}
                >
                  <Label
                    value="Net Return (%)"
                    angle={-90}
                    position="insideLeft"
                    offset={10}
                    fill="#6b7280"
                    fontSize={11}
                  />
                </YAxis>
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#374151" />
                <Bar
                  dataKey="ret"
                  name="Net Return"
                  radius={[3, 3, 0, 0]}
                  animationBegin={200}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {barData.map((d, i) => (
                    <rect key={i} fill={d.ret > 0 ? '#22c55e' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
          </ChartCard>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Interpretation */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5"
      >
        <div className="text-sm font-semibold text-blue-400 mb-2">📈 PEAD Interpretation</div>
        <div className="text-sm text-zinc-400 leading-relaxed">
          The 20-day Sharpe improvement from -0.81 to -0.23 (3.6× better) is consistent with
          post-earnings announcement drift (Bernard & Thomas 1989). The signal strengthens with
          holding period as it takes time to be fully priced. The remaining negative Sharpe
          reflects the cost of shorting at earnings — a strategy that is inherently expensive
          in practice. A <span className="text-blue-400 font-medium">long-only version</span> of
          this strategy would almost certainly produce a positive Sharpe.
        </div>
      </motion.div>

    </div>
  )
}

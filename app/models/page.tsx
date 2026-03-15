'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, ReferenceArea, Label, Cell
} from 'recharts'
import type { ModelResult } from '@/lib/types'
import { fetchData } from '@/lib/types'
import { ChartCard } from '@/components/ui/chart-card'
import { PageHeader } from '@/components/ui/page-header'
import { PerformanceBadge } from '@/components/ui/performance-badge'

const MODEL_COLORS: Record<string, string> = {
  Baseline:     '#f59e0b',
  FinBERT_only: '#06b6d4',
  RAG_only:     '#a855f7',
  XGBoost_all:  '#ef4444',
  LightGBM_all: '#22c55e',
  LSTM:         '#3b82f6',
}

const MODEL_LABELS: Record<string, string> = {
  Baseline:     'Baseline',
  FinBERT_only: 'FinBERT Only',
  RAG_only:     'RAG Only',
  XGBoost_all:  'XGBoost',
  LightGBM_all: 'LightGBM ★',
  LSTM:         'LSTM',
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{color: string; name: string; value: number}>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-xs shadow-xl">
      <div className="font-semibold text-zinc-300 mb-2">Year {label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-zinc-400 w-28">{p.name}:</span>
          <span className={`font-medium ${p.value > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {p.value > 0 ? '+' : ''}{p.value.toFixed(4)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function ModelsPage() {
  const [results, setResults] = useState<ModelResult[]>([])
  const [activeModels, setActiveModels] = useState<Set<string>>(
    new Set(['LightGBM_all', 'LSTM', 'XGBoost_all', 'Baseline'])
  )

  useEffect(() => {
    fetchData<ModelResult[]>('model_results.json').then(setResults).catch(() => {})
  }, [])

  // Compute summary
  const summary = Object.entries(
    results.reduce((acc, r) => {
      if (!acc[r.model]) acc[r.model] = { ics: [], hrs: [], aucs: [], n: 0 }
      acc[r.model].ics.push(r.ic)
      acc[r.model].hrs.push(r.hit_rate)
      acc[r.model].aucs.push(r.auc)
      acc[r.model].n += r.n_test
      return acc
    }, {} as Record<string, { ics: number[]; hrs: number[]; aucs: number[]; n: number }>)
  ).map(([model, d]) => ({
    model,
    ic_mean: parseFloat((d.ics.reduce((a, b) => a + b, 0) / d.ics.length).toFixed(4)),
    ic_std:  parseFloat((Math.sqrt(d.ics.reduce((a, b) => a + Math.pow(b - d.ics.reduce((x, y) => x + y, 0) / d.ics.length, 2), 0) / d.ics.length)).toFixed(4)),
    hr_mean: parseFloat((d.hrs.reduce((a, b) => a + b, 0) / d.hrs.length).toFixed(4)),
    auc_mean:parseFloat((d.aucs.reduce((a, b) => a + b, 0) / d.aucs.length).toFixed(4)),
    n_total: d.n,
  })).sort((a, b) => b.ic_mean - a.ic_mean)

  // IC by year data for line chart
  const years = [2021, 2022, 2023, 2024]
  const byYear = years.map(year => {
    const row: Record<string, number | string> = { year }
    results.filter(r => r.test_year === year && activeModels.has(r.model))
      .forEach(r => { row[MODEL_LABELS[r.model] || r.model] = r.ic })
    return row
  })

  // IC std for stability chart
  const stabilityData = summary.map(s => ({
    model: MODEL_LABELS[s.model] || s.model,
    std: s.ic_std,
    positive: s.ic_mean > 0
  })).sort((a, b) => a.std - b.std)

  const toggleModel = (model: string) => {
    setActiveModels(prev => {
      const next = new Set(prev)
      if (next.has(model)) next.delete(model)
      else next.add(model)
      return next
    })
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 space-y-10">

      <PageHeader
        eyebrow="Walk-forward Validation · 2021–2024"
        title="Model Performance"
        description="Train on years T−3 to T−1, test on year T. Zero lookahead bias. IC = Pearson correlation of predictions vs actual returns."
      />

      {/* Summary table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-zinc-800/60">
          <div className="text-sm font-semibold text-zinc-300">Model Comparison</div>
          <div className="text-xs text-zinc-600">Mean metrics across 4 test years</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800/60">
                {['Model', 'IC Mean', 'IC Std', 'Hit Rate', 'AUC', 'Test Samples'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.map((row, i) => {
                const isBest = row.model === 'LightGBM_all'
                return (
                  <motion.tr
                    key={row.model}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.06 }}
                    className={`border-b border-zinc-800/40 transition-colors hover:bg-zinc-800/20 ${isBest ? 'bg-green-500/5' : ''}`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full"
                          style={{ background: MODEL_COLORS[row.model] || '#6b7280' }} />
                        <span className={`font-medium ${isBest ? 'text-green-400' : 'text-zinc-300'}`}>
                          {MODEL_LABELS[row.model] || row.model}
                        </span>
                        {isBest && <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full font-semibold">BEST</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 tabular-nums">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${row.ic_mean > 0.015 ? 'text-green-400' : row.ic_mean < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                          {row.ic_mean > 0 ? '+' : ''}{row.ic_mean.toFixed(4)}
                        </span>
                        <PerformanceBadge value={row.ic_mean} />
                      </div>
                    </td>
                    <td className="px-5 py-3.5 tabular-nums">
                      <span className={`text-xs px-2 py-0.5 rounded ${row.ic_std < 0.02 ? 'bg-green-500/10 text-green-400' : row.ic_std > 0.08 ? 'bg-red-500/10 text-red-400' : 'bg-zinc-800 text-zinc-400'}`}>
                        {row.ic_std.toFixed(4)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400 tabular-nums">{(row.hr_mean * 100).toFixed(2)}%</td>
                    <td className="px-5 py-3.5 text-zinc-400 tabular-nums">{row.auc_mean.toFixed(4)}</td>
                    <td className="px-5 py-3.5 text-zinc-500 tabular-nums">{row.n_total.toLocaleString()}</td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* IC by year chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}
      >
        <div className="flex items-baseline gap-3 mb-6">
          <span className="text-5xl font-black text-green-400 tabular-nums">
            10×
          </span>
          <div>
            <div className="text-sm font-semibold text-zinc-300">
              More stable than baseline
            </div>
            <div className="text-xs text-zinc-600">
              LightGBM IC std = 0.009 vs Baseline std = 0.114
            </div>
          </div>
        </div>
        <ChartCard
          title="Information Coefficient by Year"
          subtitle="Click legend to toggle models"
        >
          <div className="flex items-start justify-between mb-5">
            <div />
            <div className="flex flex-wrap gap-2">
            {Object.entries(MODEL_LABELS).map(([key, label]) => {
              if (!results.find(r => r.model === key)) return null
              const active = activeModels.has(key)
              return (
                <button
                  key={key}
                  onClick={() => toggleModel(key)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                    active
                      ? 'border-transparent text-zinc-200'
                      : 'border-zinc-800 text-zinc-600 opacity-40'
                  }`}
                  style={active ? { background: MODEL_COLORS[key] + '22', borderColor: MODEL_COLORS[key] + '44' } : {}}
                >
                  <div className="w-2 h-2 rounded-full" style={{ background: MODEL_COLORS[key] }} />
                  {label}
                </button>
              )
            })}
            </div>
          </div>
          <div className="h-[200px] md:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
            <LineChart data={byYear}>
              <CartesianGrid stroke="#1a1f2e" strokeOpacity={0.5} vertical={false} />
              <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false}>
                <Label value="Test Year" position="insideBottom" offset={-5} fill="#6b7280" fontSize={11} />
              </XAxis>
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false}>
                <Label
                  value="Information Coefficient (IC)"
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
                      <div className="font-semibold text-zinc-300 mb-2">Year {label}</div>
                      {payload.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 py-0.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                          <span className="text-zinc-400 w-28">{p.name}:</span>
                          <span className={`font-medium ${typeof p.value === 'number' && p.value > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {typeof p.value === 'number' ? `${p.value > 0 ? '+' : ''}${p.value.toFixed(4)} IC` : String(p.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                }}
              />
              <ReferenceArea y1={0} y2={0.01} fill="#22c55e" fillOpacity={0.06} />
              <ReferenceLine y={0} stroke="#374151" strokeOpacity={0.6} />
              {Object.entries(MODEL_LABELS).map(([key, label]) => {
                if (!activeModels.has(key) || !results.find(r => r.model === key)) return null
                return (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={label}
                    stroke={MODEL_COLORS[key]}
                    strokeWidth={2.5}
                    dot={{ fill: MODEL_COLORS[key], r: 5, strokeWidth: 0 }}
                    activeDot={{ r: 7, strokeWidth: 0 }}
                    animationBegin={0}
                    animationDuration={1000}
                    animationEasing="ease-out"
                  />
                )
              })}
            </LineChart>
          </ResponsiveContainer>
          </div>
        </ChartCard>
      </motion.div>

      {/* Stability chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.25 }}
      >
        <ChartCard
          title="IC Stability — Lower Std = More Consistent"
          subtitle="LightGBM is 10× more stable than the baseline (σ=0.009 vs σ=0.114)"
        >
          <div className="h-[200px] md:h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stabilityData} layout="vertical" barSize={18}>
                <CartesianGrid stroke="#1a1f2e" strokeOpacity={0.5} horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false}>
                  <Label
                    value="IC Standard Deviation (lower = better)"
                    position="insideBottom"
                    offset={-5}
                    fill="#6b7280"
                    fontSize={11}
                  />
                </XAxis>
                <YAxis dataKey="model" type="category" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-xs shadow-xl">
                        <div className="font-semibold text-zinc-300 mb-1">{label}</div>
                        {payload.map((p, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                            <span className="text-zinc-400">IC Std Dev:</span>
                            <span className="text-zinc-200 font-medium">
                              {typeof p.value === 'number' ? `σ=${p.value.toFixed(4)}` : p.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  }}
                />
                <Bar
                  dataKey="std"
                  name="IC Std Dev"
                  radius={[0, 4, 4, 0]}
                  label={{
                    position: 'right',
                    fill: '#6b7280',
                    fontSize: 11,
                    formatter: (v: string | number | boolean | null | undefined) => {
                      const num = typeof v === 'number' ? v : parseFloat(String(v ?? ''))
                      return `σ=${isNaN(num) ? (v ?? '') : num.toFixed(4)}`
                    },
                  }}
                  animationBegin={200}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {stabilityData.map((entry) => (
                    <Cell
                      key={entry.model}
                      fill={entry.model === 'LightGBM ★' ? '#22c55e' : '#3b82f6'}
                    />
                  ))}
                </Bar>
            </BarChart>
          </ResponsiveContainer>
          </div>
        </ChartCard>
      </motion.div>

      {/* Interpretation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5"
      >
        <div className="text-sm font-semibold text-blue-400 mb-2">📊 Interpretation</div>
        <div className="text-sm text-zinc-400 leading-relaxed">
          The Baseline's high IC mean (0.043) is misleading — its standard deviation of 0.114 reveals extreme
          instability driven by lucky quarters. <span className="text-green-400 font-medium">LightGBM achieves
          IC=0.0198 with std=0.009</span>, making it 10× more consistent year-over-year. The LSTM achieves
          the highest hit rate (54.7%), with its best performance in 2022 (IC=+0.047) — the most volatile
          year in the sample, validating that temporal sentiment patterns carry additional information.
        </div>
      </motion.div>

    </div>
  )
}

'use client'
import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ScatterChart, Scatter, ReferenceLine, Label
} from 'recharts'
import { Search, TrendingUp, TrendingDown } from 'lucide-react'
import type { ExplorerRow, TickerRow } from '@/lib/types'
import { fetchData } from '@/lib/types'
import { ChartCard } from '@/components/ui/chart-card'
import { PageHeader } from '@/components/ui/page-header'

function ScoreBar({ label, value, invert = false, order = 0 }: { label: string; value: number | null; invert?: boolean; order?: number }) {
  if (value == null || isNaN(value)) return null
  const pct = Math.max(0, Math.min(1, value)) * 100
  const color = invert ? '#ef4444' : '#3b82f6'
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-zinc-500">{label}</span>
        <span className="text-zinc-300 tabular-nums font-mono">{value.toFixed(3)}</span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 * order }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  )
}

export default function ExplorerPage() {
  const [allData, setAllData] = useState<ExplorerRow[]>([])
  const [tickers, setTickers] = useState<TickerRow[]>([])
  const [selectedTicker, setSelectedTicker] = useState<string>('AAPL')
  const [selectedYear, setSelectedYear] = useState<number>(2023)
  const [selectedQuarter, setSelectedQuarter] = useState<number>(2)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchData<ExplorerRow[]>('explorer.json'),
      fetchData<TickerRow[]>('tickers.json'),
    ]).then(([data, t]) => {
      setAllData(data)
      setTickers(t.sort((a, b) => a.ticker.localeCompare(b.ticker)))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filteredTickers = useMemo(() =>
    tickers.filter(t => t.ticker.toLowerCase().includes(search.toLowerCase())).slice(0, 50),
    [tickers, search]
  )

  const tickerData = useMemo(() =>
    allData.filter(r => r.ticker === selectedTicker)
      .sort((a, b) => a.year !== b.year ? a.year - b.year : a.quarter - b.quarter),
    [allData, selectedTicker]
  )

  const currentRow = useMemo(() =>
    tickerData.find(r => r.year === selectedYear && r.quarter === selectedQuarter),
    [tickerData, selectedYear, selectedQuarter]
  )

  const availYears = useMemo(() => [...new Set(tickerData.map(r => r.year))].sort((a, b) => b - a), [tickerData])
  const availQuarters = useMemo(() =>
    [...new Set(tickerData.filter(r => r.year === selectedYear).map(r => r.quarter))].sort(),
    [tickerData, selectedYear]
  )

  // Radar data
  const radarData = currentRow ? [
    { axis: 'Mgmt Pos', value: currentRow.mgmt_mean_pos ?? 0 },
    { axis: 'Mgmt Neu', value: currentRow.mgmt_mean_neu ?? 0 },
    { axis: 'Mgmt Neg', value: currentRow.mgmt_mean_neg ?? 0 },
    { axis: 'QA Neg', value: currentRow.qa_mean_neg ?? 0 },
    { axis: 'QA Neu', value: currentRow.qa_mean_neu ?? 0 },
    { axis: 'QA Pos', value: currentRow.qa_mean_pos ?? 0 },
  ] : []

  // Historical trend
  const histData = tickerData.map(r => ({
    period: `${r.year}-Q${r.quarter}`,
    mgmt: r.mgmt_net_sentiment,
    qa: r.qa_net_sentiment,
    neg: r.mgmt_neg_ratio,
    ret5: r.ret_5d,
  }))

  // Scatter data
  const scatterData = tickerData
    .filter(r => r.mgmt_net_sentiment != null && r.ret_5d != null)
    .map(r => ({
      x: r.mgmt_net_sentiment!,
      y: r.ret_5d! * 100,
      period: `${r.year}-Q${r.quarter}`,
      up: (r.ret_5d ?? 0) > 0,
    }))

  const ret5d = currentRow?.ret_5d
  const isUp = ret5d != null && ret5d > 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
        Loading explorer data...
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 space-y-8">

      <PageHeader
        eyebrow="601 Companies · 2018–2024"
        title="Transcript Explorer"
        description="Browse the NLP sentiment profile for any S&P 500 company and earnings quarter."
      />

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="flex flex-col sm:flex-row flex-wrap gap-4 items-start"
      >
        {/* Ticker search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-600" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search ticker..."
            className="pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 w-44"
          />
          {search && (
            <div className="absolute top-full mt-1 w-44 bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden shadow-xl z-10 max-h-48 overflow-y-auto">
              {filteredTickers.map(t => (
                <button key={t.ticker}
                  onClick={() => { setSelectedTicker(t.ticker); setSearch('') }}
                  className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 flex items-center justify-between"
                >
                  <span className="font-mono font-semibold">{t.ticker}</span>
                  <span className={`text-xs ${t.mgmt_sent > 0.3 ? 'text-green-400' : 'text-zinc-600'}`}>
                    {t.mgmt_sent?.toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg">
          <span className="text-xs text-zinc-500">Ticker:</span>
          <span className="text-sm font-mono font-bold text-white">{selectedTicker}</span>
        </div>

        <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
          className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-blue-500"
        >
          {availYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <select value={selectedQuarter} onChange={e => setSelectedQuarter(Number(e.target.value))}
          className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-blue-500"
        >
          {availQuarters.map(q => <option key={q} value={q}>Q{q}</option>)}
        </select>

        {ret5d != null && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${isUp ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
            {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {isUp ? '▲' : '▼'} 5d: {(ret5d * 100).toFixed(2)}%
          </div>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {currentRow ? (
          <motion.div
            key={`${selectedTicker}-${selectedYear}-${selectedQuarter}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* Radar + scores */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <ChartCard
                title={`${selectedTicker} — ${selectedYear} Q${selectedQuarter} Sentiment Radar`}
              >
                <div className="h-[200px] md:h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#1a1f2e" />
                      <PolarAngleAxis dataKey="axis" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} />
                      <Radar
                        name={selectedTicker}
                        dataKey="value"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.15}
                        strokeWidth={2}
                        isAnimationActive
                        animationBegin={0}
                        animationDuration={800}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard title="Feature Scores">
                <ScoreBar label="Mgmt Net Sentiment" value={currentRow.mgmt_net_sentiment} order={0} />
                <ScoreBar label="QA Net Sentiment" value={currentRow.qa_net_sentiment} order={1} />
                <ScoreBar label="Mgmt Negativity" value={currentRow.mgmt_neg_ratio} invert order={2} />
                <ScoreBar label="QA Negativity" value={currentRow.qa_neg_ratio} invert order={3} />
                <ScoreBar label="Guidance Specificity" value={currentRow.rag_guidance_specificity_score} order={4} />
                <ScoreBar label="Mgmt Confidence" value={currentRow.rag_management_confidence_score} order={5} />
                <ScoreBar label="Forward Looking" value={currentRow.rag_forward_looking_score} order={6} />
                <ScoreBar label="New Risk Signals" value={currentRow.rag_new_risks_score} invert order={7} />
                <ScoreBar label="Cost Pressure" value={currentRow.rag_cost_pressure_score} invert order={8} />
              </ChartCard>
            </div>

            {/* Historical trend */}
            {histData.length > 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  <ChartCard
                    title={`${selectedTicker} — Sentiment Over Time`}
                    subtitle={`${histData.length} quarters of history`}
                  >
                    <div className="h-[200px] md:h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={histData}>
                          <CartesianGrid stroke="#1a1f2e" strokeOpacity={0.5} vertical={false} />
                          <XAxis dataKey="period" tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} interval={Math.floor(histData.length / 5)}>
                            <Label value="Quarter" position="insideBottom" offset={-5} fill="#6b7280" fontSize={11} />
                          </XAxis>
                          <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false}>
                            <Label
                              value="Net Sentiment / Neg Ratio"
                              angle={-90}
                              position="insideLeft"
                              offset={10}
                              fill="#6b7280"
                              fontSize={11}
                            />
                          </YAxis>
                          <Tooltip
                            contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 11 }}
                            formatter={(v, name) => [
                              typeof v === 'number' ? v.toFixed(3) : v,
                              name,
                            ]}
                          />
                          <ReferenceLine y={0} stroke="#374151" strokeOpacity={0.6} />
                          <Line
                            type="monotone"
                            dataKey="mgmt"
                            stroke="#22c55e"
                            strokeWidth={2}
                            dot={false}
                            name="Mgmt"
                            animationBegin={0}
                            animationDuration={1000}
                            animationEasing="ease-out"
                          />
                          <Line
                            type="monotone"
                            dataKey="qa"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={false}
                            name="Q&A"
                            animationBegin={0}
                            animationDuration={1000}
                            animationEasing="ease-out"
                          />
                          <Line
                            type="monotone"
                            dataKey="neg"
                            stroke="#ef4444"
                            strokeWidth={1.5}
                            dot={false}
                            name="Neg Ratio"
                            strokeDasharray="4 4"
                            animationBegin={0}
                            animationDuration={1000}
                            animationEasing="ease-out"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartCard>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
                >
                  <ChartCard
                    title="Mgmt Sentiment vs 5-Day Return"
                    subtitle="Each dot = one earnings quarter"
                  >
                    <div className="h-[200px] md:h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart>
                          <CartesianGrid stroke="#1a1f2e" strokeOpacity={0.5} />
                          <XAxis dataKey="x" name="Mgmt Sentiment" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false}>
                            <Label value="Mgmt Sentiment" fill="#6b7280" fontSize={10} position="insideBottom" offset={-2} />
                          </XAxis>
                          <YAxis dataKey="y" name="5d Return %" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v.toFixed(0)}%`}>
                            <Label
                              value="5d Return (%)"
                              angle={-90}
                              position="insideLeft"
                              offset={10}
                              fill="#6b7280"
                              fontSize={11}
                            />
                          </YAxis>
                          <ReferenceLine x={0} stroke="#374151" strokeOpacity={0.6} />
                          <ReferenceLine y={0} stroke="#374151" strokeOpacity={0.6} />
                          <Tooltip
                            contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 11 }}
                            formatter={(v, name) => [
                              typeof v === 'number'
                                ? (name === '5d Return %' ? `${v.toFixed(2)}%` : v.toFixed(3))
                                : String(v),
                              String(name)
                            ]}
                          />
                          <Scatter
                            data={scatterData}
                            name="Quarter"
                            fill="#3b82f6"
                            opacity={0.7}
                            shape={(props: { cx?: number; cy?: number; payload?: { up: boolean } }) => {
                              const { cx = 0, cy = 0, payload } = props
                              return <circle cx={cx} cy={cy} r={5} fill={payload?.up ? '#22c55e' : '#ef4444'} opacity={0.7} />
                            }}
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartCard>
                </motion.div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-20 text-zinc-600 text-sm"
          >
            No data for {selectedTicker} {selectedYear} Q{selectedQuarter}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

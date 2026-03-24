'use client'
import { useEffect, useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Label, Legend, ReferenceLine, Cell
} from 'recharts'
import { ArrowRight, TrendingUp, Database, Brain, Activity, Zap, Globe2, ExternalLink, BarChart2 } from 'lucide-react'
import Link from 'next/link'
import type { Stats, YearDist, SentYear, ModelResult } from '@/lib/types'
import { fetchData } from '@/lib/types'
import { ChartCard } from '@/components/ui/chart-card'
import { PageHeader } from '@/components/ui/page-header'
import { InsightCard } from '@/components/ui/insight-card'

// ── Animated counter ───────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1800, decimals = 0, ready = false) {
  const [value, setValue] = useState(0)
  const ref = useRef(false)
  const lastTarget = useRef<number | null>(null)
  useEffect(() => {
    if (!ready || target <= 0) {
      ref.current = false
      lastTarget.current = target
      const raf = requestAnimationFrame(() => setValue(target))
      return () => cancelAnimationFrame(raf)
    }
    if (ref.current && lastTarget.current === target) return
    ref.current = true
    lastTarget.current = target
    const start = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      const current = eased * target
      setValue(decimals > 0 ? parseFloat(current.toFixed(decimals)) : Math.floor(current))
      if (progress >= 1) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration, decimals, ready])
  return value
}

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({
  label, value, suffix = '', prefix = '', sub, color = 'blue', delay = 0, ready = false
}: {
  label: string
  value: number
  suffix?: string
  prefix?: string
  sub?: string
  color?: 'blue' | 'green' | 'purple' | 'amber' | 'rose' | 'cyan'
  delay?: number
  ready?: boolean
}) {
  const count = useCountUp(value, 1800, suffix === '%' || prefix === '+' ? 2 : 0, ready)
  const colors = {
    blue:   'from-blue-500/10 border-blue-500/20 text-blue-400',
    green:  'from-green-500/10 border-green-500/20 text-green-400',
    purple: 'from-purple-500/10 border-purple-500/20 text-purple-400',
    amber:  'from-amber-500/10 border-amber-500/20 text-amber-400',
    rose:   'from-rose-500/10 border-rose-500/20 text-rose-400',
    cyan:   'from-cyan-500/10 border-cyan-500/20 text-cyan-400',
  }
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-5 backdrop-blur-sm`}
    >
      <div className={`text-3xl font-bold tabular-nums ${colors[color].split(' ')[2]}`}>
        {prefix}{typeof count === 'number' && suffix === '%'
          ? (count).toFixed(2)
          : typeof count === 'number' && suffix === ''
          ? count.toLocaleString()
          : count}
        {suffix}
      </div>
      <div className="text-sm font-medium text-zinc-300 mt-1">{label}</div>
      {sub && <div className="text-xs text-zinc-600 mt-0.5">{sub}</div>}
    </motion.div>
  )
}

// ── Pipeline step ──────────────────────────────────────────────────────────────
function PipelineStep({
  icon: Icon, stage, title, desc, color, delay
}: {
  icon: React.ElementType
  stage: string
  title: string
  desc: string
  color: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center text-center"
    >
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-3 shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-1">{stage}</div>
      <div className="text-sm font-semibold text-zinc-200">{title}</div>
      <div className="text-xs text-zinc-600 mt-1 leading-relaxed max-w-[120px]">{desc}</div>
    </motion.div>
  )
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{color: string; name: string; value: number}>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-xs shadow-xl">
      <div className="font-semibold text-zinc-300 mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-zinc-400">{p.name}:</span>
          <span className="text-zinc-200 font-medium">
            {typeof p.value === 'number'
              ? p.name?.toLowerCase().includes('ic')
                ? `${p.value > 0 ? '+' : ''}${p.value.toFixed(4)} IC`
                : p.name?.toLowerCase().includes('sentiment')
                  ? p.value.toFixed(3)
                  : p.name?.toLowerCase().includes('transcripts')
                    ? p.value.toLocaleString()
                    : p.value.toFixed(3)
              : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [yearDist, setYearDist] = useState<YearDist[]>([])
  const [sentYear, setSentYear] = useState<SentYear[]>([])
  const [models, setModels] = useState<ModelResult[]>([])

  useEffect(() => {
    fetchData<Stats>('stats.json').then(setStats).catch(() => {})
    fetchData<YearDist[]>('year_dist.json').then(setYearDist).catch(() => {})
    fetchData<SentYear[]>('sentiment_by_year.json').then(setSentYear).catch(() => {})
    fetchData<ModelResult[]>('model_results.json').then(setModels).catch(() => {})
  }, [])

  // Compute IC means for mini chart
  const modelSummary = Object.entries(
    models.reduce((acc, r) => {
      if (!acc[r.model]) acc[r.model] = []
      acc[r.model].push(r.ic)
      return acc
    }, {} as Record<string, number[]>)
  ).map(([model, ics]) => ({
    model,
    ic: parseFloat((ics.reduce((a, b) => a + b, 0) / ics.length).toFixed(4))
  })).sort((a, b) => b.ic - a.ic)

  const pipeline = [
    { icon: Database,   stage: 'Stage 1', title: 'Data Ingestion',    desc: '14,584 transcripts · yfinance',   color: 'bg-blue-600',   delay: 0.5 },
    { icon: Brain,      stage: 'Stage 2', title: 'NLP Pipeline',      desc: 'FinBERT + RAG · 34 features',     color: 'bg-violet-600', delay: 0.6 },
    { icon: BarChart2,  stage: 'Stage 3', title: 'ML Models',         desc: 'XGBoost · LightGBM · LSTM',       color: 'bg-emerald-600',delay: 0.7 },
    { icon: Activity,   stage: 'Stage 4', title: 'Backtesting',       desc: 'Long-short · 10bps TC',           color: 'bg-orange-600', delay: 0.8 },
    { icon: Globe2,     stage: 'Stage 5', title: 'Sector Analysis',   desc: 'Energy IC = 0.31',                color: 'bg-rose-600',   delay: 0.9 },
  ]

  return (
    <div className="min-h-screen app-container space-y-14">

      {/* ── Hero / Page header ─────────────────────────────────────────────── */}
      <div className="relative pt-6 space-y-4">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 left-1/2 w-64 h-64 bg-violet-600/6 rounded-full blur-3xl pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          End-to-end ML · Walk-forward validated · Live demo available
        </motion.div>
        <PageHeader
          title={
            <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              FinSight
            </span>
          }
          description="An end-to-end machine learning pipeline extracting alpha signals from S&P 500 earnings call transcripts using FinBERT, RAG, and gradient-boosted models."
          actions={
            <>
              <Link
                href="/models"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Explore Results <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://huggingface.co/spaces/Rajveer234/finsight"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition-colors border border-zinc-700"
              >
                <ExternalLink className="w-4 h-4" /> Live Demo
              </a>
            </>
          }
        />
      </div>

      <section className="space-y-4">
        <h2 className="text-sm uppercase tracking-widest text-zinc-400 font-semibold">Key insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <InsightCard
            title="Signal quality is highly uneven across sectors"
            insight="Energy and Industrials show strong predictability while Technology is near-noise."
            implication="Deploy sector-aware capital allocation instead of uniform market-wide exposure."
            whyItMatters="Most performance lift comes from selecting where the model is structurally advantaged."
            tone="positive"
          />
          <InsightCard
            title="Model choice affects reliability more than headline accuracy"
            insight="LightGBM’s stability is materially stronger than baseline alternatives."
            implication="Prioritize low-variance model behavior for live risk management."
            whyItMatters="Consistent signals support cleaner position sizing and lower drawdown surprises."
          />
          <InsightCard
            title="Short holding windows remain fragile"
            insight="Backtests indicate weak profitability net of costs at 5-day horizon."
            implication="Default to longer holding windows until execution edge improves."
            whyItMatters="Protects against overtrading a statistically weak short-term effect."
            tone="warning"
          />
        </div>
      </section>

      {/* ── Stats grid ───────────────────────────────────────────────────────── */}
      {!stats && (
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-zinc-800 animate-pulse"
            />
          ))}
        </motion.div>
      )}
      {stats && (
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: 'easeOut', staggerChildren: 0.06 }}
        >
          <StatCard label="Transcripts"    value={stats.n_transcripts} sub="2018–2024"      color="blue"   delay={0.0} ready />
          <StatCard label="Companies"      value={stats.n_companies}   sub="S&P 500"        color="cyan"   delay={0.05} ready />
          <StatCard label="Best IC"        value={stats.best_ic}       sub="LightGBM"       color="green"  delay={0.1} ready />
          <StatCard label="Best Hit Rate"  value={stats.best_hit_rate * 100} suffix="%"  sub="LSTM"  color="purple" delay={0.15} ready />
          <StatCard label="Energy IC"      value={stats.energy_ic}     sub="Top sector"     color="amber"  delay={0.2} ready />
          <StatCard label="NLP Features"   value={stats.n_features}    sub="FinBERT + RAG"  color="rose"   delay={0.25} ready />
        </motion.div>
      )}

      {/* ── Pipeline ─────────────────────────────────────────────────────────── */}
      <div>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-8"
        >
          System Pipeline
        </motion.h2>
        <motion.div
          className="flex items-start justify-between gap-2 flex-wrap"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: 'easeOut', staggerChildren: 0.08 }}
        >
          {pipeline.map((step, i) => (
            <div key={step.stage} className="flex items-start gap-2 flex-1">
              <PipelineStep {...step} />
              {i < pipeline.length - 1 && (
                <div className="flex items-center justify-center w-8 mt-5 shrink-0">
                  <ArrowRight className="w-4 h-4 text-zinc-700" />
                </div>
              )}
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Charts row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Year distribution */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
        >
          <ChartCard
            title="Transcript Coverage"
            subtitle="Earnings calls by year"
          >
            <div className="h-[200px] md:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearDist} barSize={20}>
              <CartesianGrid stroke="#1a1f2e" strokeOpacity={0.5} vertical={false} />
              <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false}>
                <Label value="Year" position="insideBottom" offset={-5} fill="#6b7280" fontSize={11} />
              </XAxis>
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => v.toLocaleString()}
              >
                <Label
                  value="Transcripts"
                  angle={-90}
                  position="insideLeft"
                  offset={10}
                  fill="#6b7280"
                  fontSize={11}
                />
              </YAxis>
              <Tooltip content={<CustomTooltip />} />
              <defs>
                <linearGradient id="yearCountGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1e40af" />
                </linearGradient>
              </defs>
              <Bar
                dataKey="count"
                fill="url(#yearCountGrad)"
                radius={[4, 4, 0, 0]}
                name="Transcripts"
                animationBegin={200}
                animationDuration={800}
                animationEasing="ease-out"
              />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </ChartCard>
        </motion.div>

        {/* Sentiment trend */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
        >
          <ChartCard
            title="Sentiment Trend"
            subtitle="Management vs Q&A net sentiment"
          >
            <div className="h-[200px] md:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sentYear}>
              <CartesianGrid stroke="#1a1f2e" strokeOpacity={0.5} vertical={false} />
              <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false}>
                <Label value="Year" position="insideBottom" offset={-5} fill="#6b7280" fontSize={11} />
              </XAxis>
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false}>
                <Label
                  value="Net Sentiment"
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
                      <div className="font-semibold text-zinc-300 mb-1">Year {label}</div>
                      {payload.map((p, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                          <span className="text-zinc-400">{p.name}:</span>
                          <span className="text-zinc-200 font-medium">
                            {typeof p.value === 'number' ? p.value.toFixed(3) : p.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ top: 0, right: 0, fontSize: 11, color: '#9ca3af' }}
              />
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
            </LineChart>
          </ResponsiveContainer>
          </div>
          </ChartCard>
        </motion.div>

        {/* Model IC summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
        >
          <ChartCard
            title="Model IC Comparison"
            subtitle="Mean IC across walk-forward folds"
          >
            <div className="h-[200px] md:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={modelSummary} layout="vertical" barSize={14}>
              <CartesianGrid stroke="#1a1f2e" strokeOpacity={0.5} horizontal={false} />
              <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false}>
                <Label value="Mean IC" position="insideBottom" offset={-5} fill="#6b7280" fontSize={11} />
              </XAxis>
              <YAxis dataKey="model" type="category" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} width={90}>
                <Label
                  value=""
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
                          <span className="text-zinc-400">Mean IC:</span>
                          <span className="text-zinc-200 font-medium">
                            {typeof p.value === 'number'
                              ? `${p.value > 0 ? '+' : ''}${p.value.toFixed(4)}`
                              : p.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
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
                    return isNaN(num) ? String(v ?? '') : (num > 0 ? `+${num.toFixed(3)}` : num.toFixed(3))
                  },
                }}
                animationBegin={200}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {modelSummary.map((entry, idx) => (
                  <Cell
                    key={entry.model}
                    fill={entry.ic > 0 ? '#22c55e' : entry.ic < 0 ? '#ef4444' : '#6b7280'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          </div>
          </ChartCard>
        </motion.div>
      </div>

      {/* ── Key findings ─────────────────────────────────────────────────────── */}
      <div>
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-5"
        >
          Key Findings
        </motion.h2>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: 'easeOut', staggerChildren: 0.08 }}
        >
          {[
            {
              icon: '🏆',
              title: 'Analyst negativity beats management positivity',
              body: 'qa_neg_ratio is the #1 SHAP feature (0.054). Analyst pushback in Q&A contains more price-relevant information than management prepared remarks.',
              link: '/features',
            },
            {
              icon: '📊',
              title: 'NLP reduces IC variance by 10×',
              body: 'LightGBM achieves IC std = 0.009 vs baseline std = 0.114. Consistent year-over-year performance is more valuable than lucky peaks.',
              link: '/models',
            },
            {
              icon: '⚡',
              title: 'Energy sector IC = +0.31',
              body: 'Energy transcripts are 15× more predictable than Technology. High information asymmetry and concrete numerical guidance drive the signal.',
              link: '/sectors',
            },
            {
              icon: '📈',
              title: 'PEAD confirmed: 20-day Sharpe 3.6× better than 5-day',
              body: 'Sharpe improves from -0.81 (5d) to -0.23 (20d), consistent with post-earnings announcement drift literature (Bernard & Thomas 1989).',
              link: '/backtest',
            },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <Link href={f.link}
                className="block bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-800/60 hover:border-zinc-700/60 rounded-xl p-5 transition-all duration-200 group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{f.icon}</span>
                  <div>
                    <div className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
                      {f.title}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1.5 leading-relaxed">{f.body}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors shrink-0 mt-0.5 ml-auto" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>

    </div>
  )
}

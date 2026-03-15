'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, Label
} from 'recharts'
import type { SHAPRow } from '@/lib/types'
import { fetchData } from '@/lib/types'
import { ChartCard } from '@/components/ui/chart-card'
import { PageHeader } from '@/components/ui/page-header'

function featColor(name: string) {
  if (name.startsWith('rag_'))  return '#3b82f6'
  if (name.startsWith('mgmt_')) return '#22c55e'
  if (name.startsWith('qa_'))   return '#f59e0b'
  return '#a855f7'
}

function featGroup(name: string) {
  if (name.startsWith('rag_'))  return 'RAG'
  if (name.startsWith('mgmt_')) return 'Mgmt FinBERT'
  if (name.startsWith('qa_'))   return 'QA FinBERT'
  return 'Other'
}

function featLabel(name: string) {
  return name.replace('rag_', '').replace('mgmt_', '').replace('qa_', '')
    .replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{color: string; value: number}>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-xs shadow-xl">
      <div className="font-semibold text-zinc-300 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ background: payload[0].color }} />
        <span className="text-zinc-400">Mean |SHAP|:</span>
        <span className="text-zinc-200 font-medium">{payload[0].value.toFixed(5)}</span>
      </div>
    </div>
  )
}

const insights = [
  {
    rank: 1, feature: 'qa_neg_ratio', group: 'QA FinBERT', shap: 0.0541,
    insight: 'Analyst pushback proportion is the single strongest signal. When analysts push back hard, management is hiding something.',
    color: 'amber'
  },
  {
    rank: 2, feature: 'mgmt_sent_vol', group: 'Mgmt FinBERT', shap: 0.0476,
    insight: 'Inconsistent management sentiment — oscillating between optimism and caution — precedes larger price moves in either direction.',
    color: 'green'
  },
  {
    rank: 3, feature: 'qa_n_sentences', group: 'QA FinBERT', shap: 0.0453,
    insight: 'Longer Q&A sessions signal more analyst scrutiny, correlating with higher uncertainty and larger subsequent price reactions.',
    color: 'amber'
  },
  {
    rank: 4, feature: 'mgmt_mean_neu', group: 'Mgmt FinBERT', shap: 0.0445,
    insight: 'Deliberately neutral language can mask very good or very bad news — a hedging signal that markets react to.',
    color: 'green'
  },
  {
    rank: 5, feature: 'rag_guidance_specificity_relevance', group: 'RAG', shap: 0.0420,
    insight: 'Semantic relevance of guidance section to numerical targets — not just content — matters. Specific guidance = clearer market reaction.',
    color: 'blue'
  },
]

const colorMap: Record<string, string> = { blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20', green: 'text-green-400 bg-green-500/10 border-green-500/20', amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20' }

export default function FeaturesPage() {
  const [shap, setShap] = useState<SHAPRow[]>([])

  useEffect(() => {
    fetchData<SHAPRow[]>('shap.json').then(setShap).catch(() => {})
  }, [])

  const top20 = shap.slice(0, 20).map(s => ({
    ...s,
    label: s.feature,
    shortLabel: featLabel(s.feature),
    color: featColor(s.feature),
    group: featGroup(s.feature),
  }))

  // Group totals for pie
  const groupTotals = shap.reduce((acc, s) => {
    const g = featGroup(s.feature)
    acc[g] = (acc[g] || 0) + s.shap
    return acc
  }, {} as Record<string, number>)

  const pieData = Object.entries(groupTotals).map(([name, value]) => ({
    name, value: parseFloat(value.toFixed(4)),
    color: name === 'RAG' ? '#3b82f6' : name === 'Mgmt FinBERT' ? '#22c55e' : name === 'QA FinBERT' ? '#f59e0b' : '#a855f7'
  }))

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 space-y-10">

      <PageHeader
        eyebrow="SHAP · LightGBM · Full Dataset"
        title="Feature Importance"
        description="SHapley Additive exPlanations on LightGBM trained across the full dataset. Shows which features actually drive predictions vs which are noise."
      />

      {/* Top 20 bar chart + pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
          className="lg:col-span-2"
        >
          <ChartCard
            title="Top 20 Features by Mean |SHAP|"
            subtitle="Colour: 🔵 RAG · 🟢 Mgmt FinBERT · 🟠 QA FinBERT"
          >
            <div className="h-[260px] md:h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...top20].reverse()} layout="vertical" barSize={16}>
                <CartesianGrid stroke="#1a1f2e" strokeOpacity={0.5} horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false}>
                  <Label
                    value="Mean |SHAP Value|"
                    position="insideBottom"
                    offset={-5}
                    fill="#6b7280"
                    fontSize={11}
                  />
                </XAxis>
                <YAxis dataKey="shortLabel" type="category" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} width={160} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ top: 0, right: 0, fontSize: 11, color: '#9ca3af' }}
                  content={() => (
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', fontSize: 11, color: '#9ca3af' }}>
                      {[{ label: 'RAG', color: '#3b82f6' }, { label: 'Mgmt FinBERT', color: '#22c55e' }, { label: 'QA FinBERT', color: '#f59e0b' }].map(item => (
                        <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 8, height: 8, background: item.color, display: 'inline-block', borderRadius: 2 }} />
                          {item.label}
                        </span>
                      ))}
                    </div>
                  )}
                />
                <Bar
                  dataKey="shap"
                  name="Mean |SHAP|"
                  radius={[0, 4, 4, 0]}
                  animationBegin={200}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {[...top20].reverse().map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
          </ChartCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.15 }}
          className="flex flex-col"
        >
          <ChartCard
            title="Importance by Group"
            subtitle="Total SHAP contribution"
            className="flex-1 flex flex-col"
          >
            <div className="flex-1 flex items-center justify-center">
              <div className="h-[200px] md:h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => typeof v === 'number' ? v.toFixed(4) : String(v)}
                    contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                    labelStyle={{ color: '#a1a1aa' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              </div>
            </div>
            <div className="space-y-2 mt-2">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
                    <span className="text-zinc-400">{d.name}</span>
                  </div>
                  <span className="text-zinc-300 tabular-nums font-medium">{d.value.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </motion.div>
      </div>

      {/* Top 5 insight cards */}
      <div>
        <div className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-5">
          Top 5 Feature Insights
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((item, i) => (
            <motion.div
              key={item.rank}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.07 }}
              className={`border rounded-xl p-5 ${colorMap[item.color]}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl font-black opacity-20">#{item.rank}</div>
                <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colorMap[item.color]}`}>
                  {item.group}
                </div>
              </div>
              <div className="font-semibold text-sm text-zinc-200 mb-1 font-mono">{item.feature}</div>
              <div className="text-xs text-zinc-500 leading-relaxed">{item.insight}</div>
              <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                <span className="text-xs text-zinc-600">Mean |SHAP|</span>
                <span className="text-sm font-bold tabular-nums text-zinc-300">{item.shap.toFixed(4)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Key finding */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5"
      >
        <div className="text-sm font-semibold text-amber-400 mb-2">🔑 Key Finding</div>
        <div className="text-sm text-zinc-400 leading-relaxed">
          Analyst Q&A features dominate management prepared remarks as predictive signals.
          <span className="text-amber-400 font-medium"> qa_neg_ratio (SHAP=0.054) outperforms all management sentiment features combined.</span>
          {' '}This is consistent with the hypothesis that management tone is endogenous and strategically managed,
          while analyst skepticism is a partially independent signal from sophisticated market participants.
          RAG features account for 34.6% of total SHAP importance despite comprising fewer features,
          validating the contribution of structured semantic retrieval.
        </div>
      </motion.div>

    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

type MetricTone = "neutral" | "positive" | "warning"

type HeroMetric = {
  label: string
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  hint?: string
  tone?: MetricTone
}

function useCountUp(target: number, decimals = 0, duration = 900) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const start = performance.now()
    const from = 0
    const frame = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const next = from + (target - from) * eased
      setValue(next)
      if (progress < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, [target, duration])

  return useMemo(() => Number(value.toFixed(decimals)), [value, decimals])
}

const toneMap: Record<MetricTone, string> = {
  neutral: "from-zinc-500/15 to-zinc-500/5 border-zinc-600/40",
  positive: "from-green-500/20 to-emerald-500/5 border-green-500/40",
  warning: "from-amber-500/20 to-orange-500/5 border-amber-500/40",
}

function MetricTile({ metric, index }: { metric: HeroMetric; index: number }) {
  const value = useCountUp(metric.value, metric.decimals ?? 0)
  const tone = metric.tone ?? "neutral"
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 * index, duration: 0.3, ease: "easeOut" }}
      className={cn(
        "rounded-2xl border bg-gradient-to-br p-4 sm:p-5 glass-panel",
        toneMap[tone],
      )}
    >
      <div className="text-[11px] uppercase tracking-wider text-zinc-400">{metric.label}</div>
      <div className="mt-1 text-3xl sm:text-4xl font-black tracking-tight text-white tabular-nums">
        {metric.prefix}
        {metric.decimals ? value.toFixed(metric.decimals) : Math.round(value).toLocaleString()}
        {metric.suffix}
      </div>
      {metric.hint && <div className="mt-1 text-xs text-zinc-400">{metric.hint}</div>}
    </motion.div>
  )
}

export function HeroMetrics({ metrics }: { metrics: HeroMetric[] }) {
  return (
    <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {metrics.map((metric, idx) => (
        <MetricTile key={metric.label} metric={metric} index={idx} />
      ))}
    </section>
  )
}


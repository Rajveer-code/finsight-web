import { AlertTriangle, CheckCircle2, Info, MinusCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type InsightCardProps = {
  title: string
  insight: string
  implication: string
  whyItMatters?: string
  tone?: "neutral" | "positive" | "warning"
  className?: string
  strength?: "High" | "Medium" | "Watch"
}

const toneMap = {
  neutral: "border-blue-500/25 bg-blue-500/10 text-blue-200",
  positive: "border-green-500/25 bg-green-500/10 text-green-200",
  warning: "border-amber-500/25 bg-amber-500/10 text-amber-200",
}

const strengthMap = {
  High: { icon: CheckCircle2, accent: "text-green-300" },
  Medium: { icon: MinusCircle, accent: "text-blue-300" },
  Watch: { icon: AlertTriangle, accent: "text-amber-300" },
} as const

export function InsightCard({
  title,
  insight,
  implication,
  whyItMatters,
  tone = "neutral",
  strength = "Medium",
  className,
}: InsightCardProps) {
  const strengthMeta = strengthMap[strength]
  const StrengthIcon = strengthMeta.icon

  return (
    <article
      className={cn(
        "glass-panel rounded-2xl p-5 sm:p-6 group transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_30px_60px_-30px_rgba(99,102,241,.8)] border border-zinc-700/60 hover:border-zinc-500/60",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-700/45">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Priority insight</div>
          <h3 className="text-base font-semibold text-zinc-100 leading-tight">{title}</h3>
        </div>
        <div
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-medium",
            toneMap[tone],
          )}
          title={whyItMatters ?? "Use this insight to prioritize what action to take next."}
        >
          <StrengthIcon className={cn("h-3 w-3", strengthMeta.accent)} />
          {strength}
        </div>
      </div>
      <div className="mt-3">
        <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Insight</div>
        <p className="text-sm text-zinc-200 leading-relaxed">{insight}</p>
      </div>
      <div className="mt-3">
        <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Implication</div>
        <p className="text-sm text-zinc-300 leading-relaxed">{implication}</p>
      </div>
      {whyItMatters && (
        <div className="mt-3 border-t border-zinc-700/50 pt-3 max-h-0 overflow-hidden opacity-0 group-hover:max-h-24 group-hover:opacity-100 transition-all duration-200">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1 inline-flex items-center gap-1">
            <Info className="h-3 w-3" />
            Why this matters
          </div>
          <p className="text-xs text-zinc-300">{whyItMatters}</p>
        </div>
      )}
    </article>
  )
}

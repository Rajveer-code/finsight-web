import { Info } from "lucide-react"
import { cn } from "@/lib/utils"

type InsightCardProps = {
  title: string
  insight: string
  implication: string
  whyItMatters?: string
  tone?: "neutral" | "positive" | "warning"
  className?: string
}

const toneMap = {
  neutral: "border-blue-500/25 bg-blue-500/10 text-blue-200",
  positive: "border-green-500/25 bg-green-500/10 text-green-200",
  warning: "border-amber-500/25 bg-amber-500/10 text-amber-200",
}

export function InsightCard({
  title,
  insight,
  implication,
  whyItMatters,
  tone = "neutral",
  className,
}: InsightCardProps) {
  return (
    <article
      className={cn(
        "glass-panel rounded-2xl p-4 sm:p-5 group transition-transform hover:-translate-y-0.5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
        <div
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-medium",
            toneMap[tone],
          )}
          title={whyItMatters ?? "Use this insight to prioritize what action to take next."}
        >
          <Info className="h-3 w-3" />
          Why it matters
        </div>
      </div>
      <p className="mt-2 text-sm text-zinc-200">{insight}</p>
      <p className="mt-3 text-xs text-zinc-400 leading-relaxed">{implication}</p>
      {whyItMatters && (
        <p className="mt-3 hidden group-hover:block text-xs text-zinc-300 border-t border-zinc-700/50 pt-3">
          {whyItMatters}
        </p>
      )}
    </article>
  )
}

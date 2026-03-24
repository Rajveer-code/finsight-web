import * as React from "react"

import { cn } from "@/lib/utils"

type PageHeaderProps = {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  className?: string
  actions?: React.ReactNode
}

export function PageHeader({
  eyebrow,
  title,
  description,
  className,
  actions,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {eyebrow && (
        <div className="inline-flex text-[10px] font-semibold uppercase tracking-[0.17em] text-blue-300/80 bg-blue-500/10 border border-blue-500/20 rounded-full px-2.5 py-1">
          {eyebrow}
        </div>
      )}
      <h1 className="text-[30px] sm:text-[38px] font-black tracking-tight text-white leading-[1.05]">
        {title}
      </h1>
      {description && (
        <p className="text-[14px] text-zinc-300/90 leading-relaxed max-w-3xl">
          {description}
        </p>
      )}
      {actions && <div className="pt-2 flex flex-wrap gap-3">{actions}</div>}
    </div>
  )
}

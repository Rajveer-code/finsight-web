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
    <div className={cn("space-y-2", className)}>
      {eyebrow && (
        <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
          {eyebrow}
        </div>
      )}
      <h1 className="text-[28px] sm:text-[32px] font-black tracking-tight text-white">
        {title}
      </h1>
      {description && (
        <p className="text-[13px] text-zinc-400 leading-relaxed max-w-2xl">
          {description}
        </p>
      )}
      {actions && <div className="pt-3 flex flex-wrap gap-3">{actions}</div>}
    </div>
  )
}


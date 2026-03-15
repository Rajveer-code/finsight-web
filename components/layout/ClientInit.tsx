'use client'

import { useEffect } from 'react'

export function ClientInit() {
  useEffect(() => {
    console.log(
      '%c FinSight ',
      'background:#1d4ed8;color:white;padding:4px 12px;border-radius:4px;font-weight:bold;font-size:14px;'
    )
    console.log(
      '%c Built by Rajveer Singh Pall',
      'color:#6b7280;font-size:11px;'
    )
    console.log(
      '%c Stack: Next.js 14 · FinBERT · RAG · LightGBM · LSTM · SHAP',
      'color:#6b7280;font-size:11px;'
    )
    console.log(
      '%c ETH Zurich MSc Data Science applicant 2026',
      'color:#3b82f6;font-size:11px;'
    )
  }, [])

  return null
}


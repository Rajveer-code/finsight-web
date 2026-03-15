export type Stats = {
  n_transcripts: number
  n_companies: number
  n_rows: number
  n_tickers: number
  years: number[]
  best_ic: number
  best_auc: number
  best_hit_rate: number
  lstm_hit_rate: number
  energy_ic: number
  sharpe_5d: number
  sharpe_20d: number
  n_features: number
  top_feature: string
  top_shap: number
}

export type ModelResult = {
  model: string
  test_year: number
  ic: number
  hit_rate: number
  auc: number
  n_test: number
  n_train: number
  epochs?: number
}

export type BacktestRow = {
  year: number
  quarter: number
  net_ret: number
  long_ret: number
  short_ret: number
  long_hit: number
  short_hit: number
  n_stocks: number
  q_size: number
}

export type SHAPRow = {
  feature: string
  shap: number
}

export type SectorRow = {
  sector: string
  ic_mean: number
  ic_std: number
  auc_mean: number
  n_test_avg: number
  n_folds: number
}

export type YearDist = { year: number; count: number }
export type SentYear = { year: number; mgmt: number; qa: number; neg: number }

export type ExplorerRow = {
  ticker: string
  year: number
  quarter: number
  mgmt_mean_pos: number | null
  mgmt_mean_neg: number | null
  mgmt_mean_neu: number | null
  mgmt_net_sentiment: number | null
  mgmt_neg_ratio: number | null
  mgmt_sent_vol: number | null
  mgmt_n_sentences: number | null
  qa_mean_pos: number | null
  qa_mean_neg: number | null
  qa_mean_neu: number | null
  qa_net_sentiment: number | null
  qa_neg_ratio: number | null
  qa_n_sentences: number | null
  rag_guidance_specificity_score: number | null
  rag_guidance_specificity_relevance: number | null
  rag_management_confidence_score: number | null
  rag_management_confidence_relevance: number | null
  rag_forward_looking_score: number | null
  rag_forward_looking_relevance: number | null
  rag_new_risks_score: number | null
  rag_new_risks_relevance: number | null
  rag_cost_pressure_score: number | null
  rag_cost_pressure_relevance: number | null
  ret_5d: number | null
  ret_20d: number | null
  target_5d_up: number | null
}

export type TickerRow = {
  ticker: string
  n: number
  mgmt_sent: number
  qa_sent: number
  ret5: number
}

export async function fetchData<T>(filename: string): Promise<T> {
  const res = await fetch(`/data/${filename}`, { cache: 'force-cache' })
  if (!res.ok) throw new Error(`Failed to load ${filename}`)
  return res.json() as Promise<T>
}

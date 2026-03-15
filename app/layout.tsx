import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { AppShell } from '@/components/layout/AppShell'
import { ClientInit } from '@/components/layout/ClientInit'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'FinSight — Earnings Intelligence',
  description:
    'ML pipeline extracting alpha from 14,584 S&P 500 earnings transcripts. LightGBM IC=0.0198, Energy sector IC=0.311.',
  keywords: ['earnings', 'NLP', 'FinBERT', 'alpha', 'S&P 500', 'machine learning', 'finance'],
  openGraph: {
    title: 'FinSight — Earnings Intelligence',
    description: 'Walk-forward validated ML models on earnings call transcripts',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.variable} font-sans antialiased bg-[#08090d] text-zinc-100`}>
        <ClientInit />
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  )
}

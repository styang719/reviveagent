import { ArrowRight, Eye, FileText, Hammer, MessageCircleReply, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useNow } from '@/hooks/useNow'
import { ago } from '@/lib/format'
import { useDemo, type NewsItem } from '@/store/demo'

// What moved on the homes you work on since you last looked. Each update lives on its property
// page; this only points there.

const ICON: Record<NewsItem['kind'], typeof Eye> = { report: FileText, shared: Send, opened: Eye, project: Hammer, reply: MessageCircleReply }
const TAB: Record<NewsItem['kind'], string> = { report: 'report', shared: 'report', opened: 'report', project: 'project', reply: 'report' }

export function WhatChanged({ max = 4 }: { max?: number }) {
  const news = useDemo((s) => s.news)
  const now = useNow(30_000)
  if (!news.length) return null
  return (
    <section aria-labelledby="what-changed">
      <h2 id="what-changed" className="mb-4 text-xl font-semibold text-ink">
        What changed
      </h2>
      <ul className="flex flex-col gap-2">
        {news.slice(0, max).map((n) => {
          const Icon = ICON[n.kind]
          return (
            <li key={n.id}>
              <Link
                to={`/property/${n.propertyId}?tab=${TAB[n.kind]}`}
                className="group flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 shadow-card transition-shadow hover:shadow-md"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--brand-primary-subtle)] text-brand">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium text-ink">{n.text}</span>
                  <span className="block truncate text-[12.5px] text-muted">
                    {n.address} · {ago(n.at, now)}
                  </span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

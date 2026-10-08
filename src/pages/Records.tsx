import { Fragment, useState } from 'react'
import { loadRecords } from '../storage'
import type { TrainingRecord } from '../types'
import BottomNav from '../components/BottomNav'

function dateKey(iso: string): string {
  return iso.slice(0, 10)
}

function dateLabel(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const that = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round((today.getTime() - that.getTime()) / 86400000)
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (d.getFullYear() === now.getFullYear())
    return `${d.getMonth() + 1}月${d.getDate()}日`
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

interface RecordGroup {
  key: string
  label: string
  items: TrainingRecord[]
}

function groupRecords(records: TrainingRecord[]): RecordGroup[] {
  const groups: RecordGroup[] = []
  for (const r of records) {
    const key = dateKey(r.createdAt)
    const last = groups[groups.length - 1]
    if (last && last.key === key) {
      last.items.push(r)
    } else {
      groups.push({ key, label: dateLabel(r.createdAt), items: [r] })
    }
  }
  return groups
}

export default function Records() {
  const [groups] = useState(() => groupRecords(loadRecords()))

  return (
    <div className="page">
      <h1 className="page-title">训练记录</h1>

      {groups.length === 0 ? (
        <div className="empty-state">
          <p>暂无训练记录</p>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.key}>
            <div className="date-label">{g.label}</div>
            <div className="card record-card">
              {g.items.map((r, i) => (
                <Fragment key={r.id}>
                  {i > 0 && <div className="hairline" />}
                  <div className="record-row">
                    <span className="record-name">{r.planName}</span>
                    <span className="record-cycles">
                      {r.totalCycles !== null
                        ? `${r.completedCycles} / ${r.totalCycles} 组`
                        : `${r.completedCycles} 组`}
                    </span>
                  </div>
                </Fragment>
              ))}
            </div>
          </section>
        ))
      )}

      <BottomNav />
    </div>
  )
}

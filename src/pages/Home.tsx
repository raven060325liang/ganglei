import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadPlans } from '../storage'
import { unlockAudio } from '../audio'
import type { TrainingPlan } from '../types'
import BottomNav from '../components/BottomNav'

function PlanCard({
  plan,
  onStart,
  onOpen,
}: {
  plan: TrainingPlan
  onStart: () => void
  onOpen: () => void
}) {
  return (
    <div className="plan-card" onClick={onOpen}>
      <div className="plan-card-top">
        <span className="plan-name">{plan.name}</span>
        <span className={`plan-reminder${plan.reminderEnabled ? '' : ' off'}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          {plan.reminderTime}
        </span>
      </div>
      <div className="plan-params">
        收缩 {plan.contractSeconds} 秒 · 放松 {plan.relaxSeconds} 秒
      </div>
      <div className="plan-card-bottom">
        <span className="plan-cycles">{plan.cycles} 组</span>
        <button
          type="button"
          className="btn-start-sm"
          onClick={(e) => {
            e.stopPropagation()
            onStart()
          }}
        >
          开始训练
        </button>
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [plans] = useState<TrainingPlan[]>(() => loadPlans())

  const startPlan = (id: string) => {
    unlockAudio()
    navigate(`/train/plan/${id}`)
  }

  return (
    <div className="page">
      <header className="home-header">
        <h1>肛雷</h1>
        <p>今日训练</p>
      </header>

      {plans.length === 0 ? (
        <div className="empty-state">
          <p>还没有训练计划</p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate('/plan/new')}
          >
            新建计划
          </button>
        </div>
      ) : (
        <div className="plan-list">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onStart={() => startPlan(plan.id)}
              onOpen={() => navigate(`/plan/${plan.id}`)}
            />
          ))}
        </div>
      )}

      <div className="home-actions">
        <button
          type="button"
          className="action-tile"
          onClick={() => navigate('/plan/new')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>新建计划</span>
        </button>
        <button
          type="button"
          className="action-tile"
          onClick={() => {
            unlockAudio()
            navigate('/free')
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2.5 4.5 13.5H11L10 21.5l8.5-11H12l1-8z" />
          </svg>
          <span>自由训练</span>
        </button>
        <button
          type="button"
          className="action-tile"
          onClick={() => navigate('/records')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6.5h.01M4 12h.01M4 17.5h.01M8.5 6.5H20M8.5 12H20M8.5 17.5H20" />
          </svg>
          <span>训练记录</span>
        </button>
      </div>

      <BottomNav />
    </div>
  )
}

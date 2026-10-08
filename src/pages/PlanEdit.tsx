import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { loadPlans, savePlans, uid } from '../storage'
import type { TrainingPlan } from '../types'
import Stepper from '../components/Stepper'
import Switch from '../components/Switch'
import Confirm from '../components/Confirm'

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v))

export default function PlanEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editing = !!id

  const [existing] = useState<TrainingPlan | undefined>(() =>
    id ? loadPlans().find((p) => p.id === id) : undefined,
  )
  const [name, setName] = useState(existing?.name ?? '')
  const [contract, setContract] = useState(existing?.contractSeconds ?? 5)
  const [relax, setRelax] = useState(existing?.relaxSeconds ?? 10)
  const [cycles, setCycles] = useState(existing?.cycles ?? 20)
  const [reminderTime, setReminderTime] = useState(
    existing?.reminderTime ?? '07:00',
  )
  const [reminderOn, setReminderOn] = useState(
    existing?.reminderEnabled ?? true,
  )
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (editing && !existing) return <Navigate to="/" replace />

  const save = () => {
    const plans = loadPlans()
    const next: TrainingPlan = {
      id: existing?.id ?? uid(),
      name: name.trim() || '未命名',
      contractSeconds: contract,
      relaxSeconds: relax,
      cycles,
      reminderTime,
      reminderEnabled: reminderOn,
    }
    if (existing) {
      savePlans(plans.map((p) => (p.id === existing.id ? next : p)))
    } else {
      savePlans([...plans, next])
    }
    navigate('/', { replace: true })
  }

  const remove = () => {
    savePlans(loadPlans().filter((p) => p.id !== existing!.id))
    navigate('/', { replace: true })
  }

  return (
    <div className="subpage">
      <header className="subpage-header">
        <button
          type="button"
          className="back-btn"
          onClick={() => navigate('/', { replace: true })}
          aria-label="返回"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <span className="subpage-title">{editing ? '编辑计划' : '新建计划'}</span>
      </header>

      <div className="form">
        <div className="card field-card">
          <div className="field-label">计划名称</div>
          <input
            className="text-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：晨练"
            maxLength={12}
          />
        </div>

        <div className="card">
          <Stepper
            label="收缩时间"
            unit="秒"
            value={contract}
            min={1}
            max={99}
            onDelta={(d) => setContract((v) => clamp(v + d, 1, 99))}
          />
          <div className="hairline" />
          <Stepper
            label="放松时间"
            unit="秒"
            value={relax}
            min={1}
            max={99}
            onDelta={(d) => setRelax((v) => clamp(v + d, 1, 99))}
          />
          <div className="hairline" />
          <Stepper
            label="循环组数"
            unit="组"
            value={cycles}
            min={1}
            max={100}
            onDelta={(d) => setCycles((v) => clamp(v + d, 1, 100))}
          />
        </div>

        <div className="card">
          <div className="row">
            <span>提醒</span>
            <Switch checked={reminderOn} onChange={setReminderOn} />
          </div>
          <div className="hairline" />
          <div className="row">
            <span>提醒时间</span>
            <input
              type="time"
              value={reminderTime}
              disabled={!reminderOn}
              onChange={(e) => setReminderTime(e.target.value || '07:00')}
            />
          </div>
        </div>

        {editing && (
          <button
            type="button"
            className="danger-text-btn"
            onClick={() => setConfirmDelete(true)}
          >
            删除计划
          </button>
        )}
      </div>

      <div className="bottom-action">
        <button type="button" className="btn-primary" onClick={save}>
          保存
        </button>
      </div>

      {confirmDelete && (
        <Confirm
          title="删除该计划？"
          message={`「${existing!.name}」将被永久删除`}
          confirmText="删除"
          cancelText="取消"
          danger
          onConfirm={remove}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { loadPlans, addRecord, isSoundEnabled, saveSettings } from '../storage'
import { unlockAudio } from '../audio'
import { useTrainingEngine, type TrainingConfig } from '../hooks/useTrainingEngine'
import Confirm from '../components/Confirm'

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v))

function toInt(v: string | null, fallback: number, min: number, max: number) {
  const n = parseInt(v ?? '', 10)
  if (Number.isNaN(n)) return fallback
  return clamp(n, min, max)
}

interface TrainingProps {
  /** 自由训练模式 */
  free?: boolean
}

export default function Training({ free = false }: TrainingProps) {
  const { id } = useParams()
  const [searchParams] = useSearchParams()

  const [config] = useState<TrainingConfig | null>(() => {
    if (free) {
      return {
        name: '自由训练',
        contractSeconds: toInt(searchParams.get('c'), 5, 1, 99),
        relaxSeconds: toInt(searchParams.get('r'), 10, 1, 99),
        totalCycles: null,
      }
    }
    const plan = loadPlans().find((p) => p.id === id)
    if (!plan) return null
    return {
      name: plan.name,
      contractSeconds: plan.contractSeconds,
      relaxSeconds: plan.relaxSeconds,
      totalCycles: plan.cycles,
    }
  })

  if (!config) return <Navigate to="/" replace />
  return <TrainingRun config={config} />
}

function TrainingRun({ config }: { config: TrainingConfig }) {
  const navigate = useNavigate()
  const { snap, togglePause, finishNow } = useTrainingEngine(config)
  const [endedByUser, setEndedByUser] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled())
  const savedRef = useRef(false)

  // 训练页保持屏幕常亮
  useEffect(() => {
    let lock: { release?: () => void } | null = null
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<{ release?: () => void }> }
    }
    nav.wakeLock
      ?.request('screen')
      .then((l) => { lock = l })
      .catch(() => {})
    return () => {
      try { lock?.release?.() } catch {}
    }
  }, [])

  // 完成时保存记录
  useEffect(() => {
    if (snap.phase === 'done' && !savedRef.current) {
      savedRef.current = true
      if (snap.completedCycles > 0) {
        addRecord({
          planName: config.name,
          completedCycles: snap.completedCycles,
          totalCycles: config.totalCycles,
        })
      }
    }
  }, [snap.phase, snap.completedCycles, config])

  // 误触保护：训练中阻止浏览器返回手势 + 刷新/关闭页面
  useEffect(() => {
    if (snap.phase === 'done') return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    const onPopState = () => {
      window.history.pushState(null, '', window.location.href)
      setConfirmEnd(true)
    }
    window.history.pushState(null, '', window.location.href)
    window.addEventListener('beforeunload', onBeforeUnload)
    window.addEventListener('popstate', onPopState)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      window.removeEventListener('popstate', onPopState)
    }
  }, [snap.phase])

  const toggleSound = () => {
    const next = !soundOn
    setSoundOn(next)
    saveSettings({ soundEnabled: next })
  }

  const confirmFinish = () => {
    setConfirmEnd(false)
    setEndedByUser(true)
    finishNow()
  }

  // ---------- 完成页 ----------
  if (snap.phase === 'done') {
    return (
      <div className="training-page phase-done">
        <div className="done-screen">
          <div className="done-title">
            {endedByUser ? '训练已保存' : '训练完成'}
          </div>
          <div className="done-sub">
            完成：
            {config.totalCycles !== null
              ? `${snap.completedCycles} / ${config.totalCycles} 组`
              : `${snap.completedCycles} 组`}
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate('/', { replace: true })}
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  // ---------- 训练中 ----------
  const seconds = Math.max(1, Math.ceil(snap.remainingMs / 1000))
  const progress = snap.phaseDurationMs
    ? Math.min(1, Math.max(0, 1 - snap.remainingMs / snap.phaseDurationMs))
    : 0
  const R = 116
  const C = 2 * Math.PI * R
  const phaseLabel =
    snap.phase === 'prepare' ? '准备' : snap.phase === 'contract' ? '收缩' : '放松'

  return (
    <div className={`training-page phase-${snap.phase}`}>
      <header className="train-header">
        <button
          type="button"
          className="icon-btn"
          onClick={() => setConfirmEnd(true)}
          aria-label="关闭"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <span className="train-name">{config.name}</span>
        <button
          type="button"
          className="icon-btn"
          onClick={toggleSound}
          aria-label="声音提示开关"
        >
          {soundOn ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5 6 9H2v6h4l5 4V5z" />
              <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5 6 9H2v6h4l5 4V5z" />
              <path d="M22 9l-6 6M16 9l6 6" />
            </svg>
          )}
        </button>
      </header>

      <main className={`train-main${snap.paused ? ' paused' : ''}`}>
        <div className="phase-label">{phaseLabel}</div>
        <div className="ring-wrap">
          <svg className="ring" viewBox="0 0 260 260">
            <circle cx="130" cy="130" r={R} className="ring-bg" />
            <circle
              cx="130"
              cy="130"
              r={R}
              className="ring-fg"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - progress)}
            />
          </svg>
          <div className="count-number">{seconds}</div>
        </div>
        <div className="cycle-info">
          {config.totalCycles !== null
            ? `${snap.currentCycle} / ${config.totalCycles}`
            : `第 ${snap.currentCycle} 组`}
        </div>
        <span className="paused-chip">已暂停</span>
      </main>

      <footer className="train-footer">
        <button type="button" className="btn-pause" onClick={togglePause}>
          {snap.paused ? '继续' : '暂停'}
        </button>
        <button
          type="button"
          className="btn-end-text"
          onClick={() => setConfirmEnd(true)}
        >
          结束
        </button>
      </footer>

      {confirmEnd && (
        <Confirm
          title="结束本次训练？"
          message={`当前已完成 ${snap.completedCycles} 组`}
          confirmText="结束并保存"
          cancelText="继续训练"
          onConfirm={confirmFinish}
          onCancel={() => setConfirmEnd(false)}
        />
      )}
    </div>
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { isSoundEnabled } from '../storage'
import { playSound, type SoundType } from '../audio'
import { vibrateContract, vibrateRelax, vibrateDone } from '../vibrate'

export type TrainingPhase = 'prepare' | 'contract' | 'relax' | 'done'

export interface TrainingConfig {
  /** 训练名称（用于完成页展示） */
  name: string
  contractSeconds: number
  relaxSeconds: number
  /** 总组数；null 表示自由训练，不限组数 */
  totalCycles: number | null
}

export interface TrainingSnapshot {
  phase: TrainingPhase
  /** 当前阶段剩余毫秒 */
  remainingMs: number
  /** 当前阶段总时长毫秒 */
  phaseDurationMs: number
  /** 正在进行第几组（从 1 开始） */
  currentCycle: number
  /** 已完成组数 */
  completedCycles: number
  paused: boolean
}

const PREPARE_MS = 3000
const TICK_MS = 100

/**
 * 训练计时引擎：
 * 准备 3-2-1 → (收缩 → 放松) × N → 完成
 * 基于时间戳计算剩余时间，暂停冻结、后台切换回来也不会丢时间。
 */
export function useTrainingEngine(config: TrainingConfig) {
  const [snap, setSnap] = useState<TrainingSnapshot>(() => ({
    phase: 'prepare',
    remainingMs: PREPARE_MS,
    phaseDurationMs: PREPARE_MS,
    currentCycle: 1,
    completedCycles: 0,
    paused: false,
  }))

  const phaseRef = useRef<TrainingPhase>('prepare')
  const phaseDurationRef = useRef<number>(PREPARE_MS)
  const endAtRef = useRef<number>(Date.now() + PREPARE_MS)
  const pausedRef = useRef(false)
  const pausedRemainingRef = useRef(0)
  const currentCycleRef = useRef(1)
  const completedRef = useRef(0)
  const doneRef = useRef(false)
  const lastSecondRef = useRef(4)

  const emit = useCallback(() => {
    const remaining = pausedRef.current
      ? pausedRemainingRef.current
      : Math.max(0, endAtRef.current - Date.now())
    setSnap({
      phase: phaseRef.current,
      remainingMs: remaining,
      phaseDurationMs: phaseDurationRef.current,
      currentCycle: currentCycleRef.current,
      completedCycles: completedRef.current,
      paused: pausedRef.current,
    })
  }, [])

  /** 阶段推进：返回新阶段时长；返回 null 表示训练完成 */
  const transition = useCallback((): number | null => {
    const p = phaseRef.current
    if (p === 'prepare') {
      phaseRef.current = 'contract'
      phaseDurationRef.current = config.contractSeconds * 1000
      return phaseDurationRef.current
    }
    if (p === 'contract') {
      phaseRef.current = 'relax'
      phaseDurationRef.current = config.relaxSeconds * 1000
      return phaseDurationRef.current
    }
    if (p === 'relax') {
      // 放松结束 = 完整完成一组
      completedRef.current += 1
      if (
        config.totalCycles !== null &&
        completedRef.current >= config.totalCycles
      ) {
        phaseRef.current = 'done'
        return null
      }
      currentCycleRef.current += 1
      phaseRef.current = 'contract'
      phaseDurationRef.current = config.contractSeconds * 1000
      return phaseDurationRef.current
    }
    return null
  }, [config])

  useEffect(() => {
    const tick = () => {
      if (doneRef.current || pausedRef.current) return
      const now = Date.now()
      let remaining = endAtRef.current - now
      let changed = false
      let guard = 0
      // 若页面在后台被节流，一次性补齐所有错过的阶段切换
      while (remaining <= 0 && guard++ < 5000) {
        const dur = transition()
        if (dur === null) {
          doneRef.current = true
          endAtRef.current = now
          if (isSoundEnabled()) playSound('done')
        vibrateDone()
          emit()
          return
        }
        remaining += dur
        changed = true
      }
      if (changed) {
        endAtRef.current = now + remaining
        const sound: SoundType | null =
          phaseRef.current === 'contract'
            ? 'contract'
            : phaseRef.current === 'relax'
              ? 'relax'
              : null
        if (sound && isSoundEnabled()) playSound(sound)
        if (phaseRef.current === 'contract') vibrateContract()
        if (phaseRef.current === 'relax') vibrateRelax()
      }
      // 准备倒计时逐秒提示音
      if (phaseRef.current === 'prepare') {
        const second = Math.ceil(remaining / 1000)
        if (second < lastSecondRef.current && second >= 1) {
          lastSecondRef.current = second
          if (isSoundEnabled()) playSound('tick')
        }
      }
      emit()
    }
    const timer = window.setInterval(tick, TICK_MS)
    return () => window.clearInterval(timer)
  }, [transition, emit])

  /** 暂停 / 继续：冻结当前倒计时与阶段 */
  const togglePause = useCallback(() => {
    if (doneRef.current) return
    if (pausedRef.current) {
      endAtRef.current = Date.now() + pausedRemainingRef.current
      pausedRef.current = false
    } else {
      pausedRemainingRef.current = Math.max(0, endAtRef.current - Date.now())
      pausedRef.current = true
    }
    emit()
  }, [emit])

  /** 用户主动结束（自由训练 / 提前结束） */
  const finishNow = useCallback(() => {
    doneRef.current = true
    phaseRef.current = 'done'
    endAtRef.current = Date.now()
    emit()
  }, [emit])

  return { snap, togglePause, finishNow }
}

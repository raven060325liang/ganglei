import { useEffect, useRef } from 'react'

interface StepperProps {
  label: string
  unit?: string
  value: number
  min: number
  max: number
  /** 增减回调（父组件负责钳制范围） */
  onDelta: (delta: number) => void
}

/** 加减数字选择器，支持长按连加 */
export default function Stepper({
  label,
  unit,
  value,
  min,
  max,
  onDelta,
}: StepperProps) {
  const holdRef = useRef<{ timeout?: number; interval?: number }>({})

  const stop = () => {
    if (holdRef.current.timeout) window.clearTimeout(holdRef.current.timeout)
    if (holdRef.current.interval) window.clearInterval(holdRef.current.interval)
    holdRef.current = {}
  }

  useEffect(() => stop, [])

  const start = (dir: number) => {
    onDelta(dir)
    stop()
    holdRef.current.timeout = window.setTimeout(() => {
      holdRef.current.interval = window.setInterval(() => onDelta(dir), 70)
    }, 400)
  }

  return (
    <div className="stepper-row">
      <span className="stepper-label">{label}</span>
      <div className="stepper-control">
        <button
          type="button"
          className="stepper-btn"
          disabled={value <= min}
          onPointerDown={() => start(-1)}
          onPointerUp={stop}
          onPointerLeave={stop}
          onPointerCancel={stop}
          onContextMenu={(e) => e.preventDefault()}
          aria-label={`减少${label}`}
        >
          −
        </button>
        <span className="stepper-value">
          {value}
          {unit && <span className="stepper-unit">{unit}</span>}
        </span>
        <button
          type="button"
          className="stepper-btn"
          disabled={value >= max}
          onPointerDown={() => start(1)}
          onPointerUp={stop}
          onPointerLeave={stop}
          onPointerCancel={stop}
          onContextMenu={(e) => e.preventDefault()}
          aria-label={`增加${label}`}
        >
          +
        </button>
      </div>
    </div>
  )
}

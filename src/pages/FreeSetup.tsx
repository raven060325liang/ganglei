import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { unlockAudio } from '../audio'
import Stepper from '../components/Stepper'

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v))

export default function FreeSetup() {
  const navigate = useNavigate()
  const [contract, setContract] = useState(5)
  const [relax, setRelax] = useState(10)

  const start = () => {
    unlockAudio()
    navigate(`/train/free?c=${contract}&r=${relax}`)
  }

  return (
    <div className="subpage">
      <header className="subpage-header">
        <button
          type="button"
          className="back-btn"
          onClick={() => navigate('/')}
          aria-label="返回"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <span className="subpage-title">自由训练</span>
      </header>

      <div className="form">
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
        </div>

        <p className="hint-text">
          自由训练不限定组数，开始后自动循环收缩与放松，随时可以结束。结束后仅记录完成的组数。
        </p>
      </div>

      <div className="bottom-action">
        <button type="button" className="btn-primary" onClick={start}>
          开始训练
        </button>
      </div>
    </div>
  )
}

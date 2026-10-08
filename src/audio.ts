let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!AC) return null
      ctx = new AC()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

/**
 * 在用户点击「开始训练」等手势中调用，
 * 提前创建 AudioContext 以绕过浏览器自动播放限制。
 */
export function unlockAudio(): void {
  getCtx()
}

function tone(
  freq: number,
  durationMs: number,
  volume = 0.3,
  delayMs = 0,
): void {
  const ac = getCtx()
  if (!ac) return
  const start = ac.currentTime + delayMs / 1000
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(volume, start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + durationMs / 1000)
  osc.connect(gain)
  gain.connect(ac.destination)
  osc.start(start)
  osc.stop(start + durationMs / 1000 + 0.05)
}

export type SoundType = 'tick' | 'contract' | 'relax' | 'done'

/** 简短提示音：准备滴答 / 收缩开始 / 放松开始 / 训练完成 */
export function playSound(type: SoundType): void {
  switch (type) {
    case 'tick':
      tone(660, 90, 0.22)
      break
    case 'contract':
      tone(880, 200, 0.3)
      break
    case 'relax':
      tone(523, 200, 0.3)
      break
    case 'done':
      tone(660, 150, 0.3)
      tone(880, 260, 0.3, 170)
      break
  }
}

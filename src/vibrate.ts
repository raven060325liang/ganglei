import { Capacitor } from '@capacitor/core'
import { Haptics } from '@capacitor/haptics'

let canVibrate = false

try {
  canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator
} catch {
  canVibrate = false
}

export async function vibrate(pattern: number | number[]): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const total = Array.isArray(pattern) ? pattern.reduce((a, b) => a + b, 0) : pattern
    try {
      await Haptics.vibrate({ duration: Math.min(total, 500) })
    } catch {
      /* ignore */
    }
    return
  }
  if (!canVibrate) return
  try {
    navigator.vibrate(pattern)
  } catch {
    /* ignore */
  }
}

export function vibrateContract(): void {
  void vibrate([40, 30, 40])
}

export function vibrateRelax(): void {
  void vibrate([20])
}

export function vibrateDone(): void {
  void vibrate([60, 40, 60, 40, 60])
}

import type { AppSettings, TrainingPlan, TrainingRecord } from './types'

const PLANS_KEY = 'ganglei.plans'
const RECORDS_KEY = 'ganglei.records'
const SETTINGS_KEY = 'ganglei.settings'

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* localStorage 不可用时静默失败 */
  }
}

/** 首次打开时的默认演示计划 */
function makeDefaultPlans(): TrainingPlan[] {
  return [
    {
      id: uid(),
      name: '上课练',
      contractSeconds: 7,
      relaxSeconds: 5,
      cycles: 50,
      reminderTime: '14:00',
      reminderEnabled: false,
    },
    {
      id: uid(),
      name: '睡前',
      contractSeconds: 10,
      relaxSeconds: 10,
      cycles: 50,
      reminderTime: '22:30',
      reminderEnabled: true,
    },
  ]
}

export function loadPlans(): TrainingPlan[] {
  const plans = read<TrainingPlan[]>(PLANS_KEY)
  if (Array.isArray(plans)) return plans
  const defaults = makeDefaultPlans()
  write(PLANS_KEY, defaults)
  return defaults
}

export function savePlans(plans: TrainingPlan[]): void {
  write(PLANS_KEY, plans)
}

export function loadRecords(): TrainingRecord[] {
  const records = read<TrainingRecord[]>(RECORDS_KEY)
  return Array.isArray(records) ? records : []
}

export function addRecord(
  record: Omit<TrainingRecord, 'id' | 'createdAt'>,
): TrainingRecord {
  const full: TrainingRecord = {
    ...record,
    id: uid(),
    createdAt: new Date().toISOString(),
  }
  const records = loadRecords()
  records.unshift(full)
  write(RECORDS_KEY, records)
  return full
}

export function loadSettings(): AppSettings {
  const s = read<AppSettings>(SETTINGS_KEY)
  return { soundEnabled: s?.soundEnabled !== false } // 默认开启
}

export function saveSettings(settings: AppSettings): void {
  write(SETTINGS_KEY, settings)
}

export function isSoundEnabled(): boolean {
  return loadSettings().soundEnabled
}

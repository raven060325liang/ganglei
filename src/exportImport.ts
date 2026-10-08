import type { AppSettings, TrainingPlan, TrainingRecord } from './types'
import { loadPlans, loadRecords, loadSettings, savePlans, saveSettings } from './storage'

export interface BackupData {
  version: 1
  plans: TrainingPlan[]
  records: TrainingRecord[]
  settings: AppSettings
  exportedAt: string
}

export function exportData(): string {
  const data: BackupData = {
    version: 1,
    plans: loadPlans(),
    records: loadRecords(),
    settings: loadSettings(),
    exportedAt: new Date().toISOString(),
  }
  return JSON.stringify(data, null, 2)
}

export function downloadExport(): void {
  const blob = new Blob([exportData()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ganglei-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function importFromFile(file: File): Promise<{ plans: number; records: number }> {
  const text = await file.text()
  const data = JSON.parse(text) as BackupData
  if (!data || data.version !== 1) throw new Error('不支持的备份格式')
  if (Array.isArray(data.plans)) savePlans(data.plans)
  if (Array.isArray(data.records)) {
    const key = 'ganglei.records'
    try { localStorage.setItem(key, JSON.stringify(data.records)) } catch {}
  }
  if (data.settings) saveSettings(data.settings)
  return {
    plans: Array.isArray(data.plans) ? data.plans.length : 0,
    records: Array.isArray(data.records) ? data.records.length : 0,
  }
}

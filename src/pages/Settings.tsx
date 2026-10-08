import { useRef, useState } from 'react'
import { loadSettings, saveSettings } from '../storage'
import { downloadExport, importFromFile } from '../exportImport'
import Switch from '../components/Switch'
import BottomNav from '../components/BottomNav'
import Confirm from '../components/Confirm'

export default function Settings() {
  const [sound, setSound] = useState(() => loadSettings().soundEnabled)
  const [importResult, setImportResult] = useState<{
    plans: number
    records: number
  } | null>(null)
  const [confirmImport, setConfirmImport] = useState(false)
  const pendingFileRef = useRef<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const toggleSound = (v: boolean) => {
    setSound(v)
    saveSettings({ soundEnabled: v })
  }

  const handleFile = async (file: File) => {
    try {
      const result = await importFromFile(file)
      setImportResult(result)
    } catch (e) {
      alert('导入失败：文件格式不正确')
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    pendingFileRef.current = file
    setConfirmImport(true)
    e.target.value = ''
  }

  const doImport = () => {
    setConfirmImport(false)
    if (pendingFileRef.current) {
      handleFile(pendingFileRef.current)
      pendingFileRef.current = null
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">设置</h1>

      <div className="card">
        <div className="row">
          <span>声音提示</span>
          <Switch checked={sound} onChange={toggleSound} />
        </div>
      </div>

      <div className="card">
        <div className="row" onClick={downloadExport}>
          <span>导出数据备份</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18, color: 'var(--text-2)' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
        </div>
        <div className="hairline" />
        <div className="row" onClick={() => fileInputRef.current?.click()}>
          <span>导入数据备份</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18, color: 'var(--text-2)' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={onFileChange}
        />
      </div>

      <div className="card about-card">
        <div className="about-title">关于肛雷</div>
        <p className="about-text">
          肛雷是一款极简的盆底肌（PC 肌）训练辅助工具。
        </p>
        <p className="about-text">
          所有数据仅保存在本地浏览器，无账号、无联网、无云端同步。
        </p>
        <div className="hairline" />
        <div className="row">
          <span>版本</span>
          <span className="text-2">0.1.0</span>
        </div>
      </div>

      {importResult && (
        <div className="card" style={{ marginTop: 12, padding: '14px 20px', fontSize: 14, color: 'var(--text-2)' }}>
          导入成功：{importResult.plans} 个计划，{importResult.records} 条记录
        </div>
      )}

      <BottomNav />

      {confirmImport && (
        <Confirm
          title="导入将覆盖现有数据"
          message="确定要导入备份文件吗？当前数据将被替换。"
          confirmText="确定导入"
          cancelText="取消"
          danger
          onConfirm={doImport}
          onCancel={() => {
            setConfirmImport(false)
            pendingFileRef.current = null
          }}
        />
      )}
    </div>
  )
}

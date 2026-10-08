import type { ReactNode } from 'react'

interface ConfirmProps {
  title: string
  message?: ReactNode
  confirmText: string
  cancelText: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function Confirm({
  title,
  message,
  confirmText,
  cancelText,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmProps) {
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{title}</div>
        {message && <div className="modal-msg">{message}</div>}
        <div className="modal-btns">
          <button type="button" className="btn-modal-cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn-modal-confirm${danger ? ' danger' : ''}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

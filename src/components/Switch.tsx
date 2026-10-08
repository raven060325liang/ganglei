interface SwitchProps {
  checked: boolean
  onChange: (v: boolean) => void
}

export default function Switch({ checked, onChange }: SwitchProps) {
  return (
    <button
      type="button"
      className={`switch${checked ? ' on' : ''}`}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    />
  )
}

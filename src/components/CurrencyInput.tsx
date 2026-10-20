import React, { useState, useEffect } from 'react'

interface CurrencyInputProps {
  value: number
  onChange: (val: number) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}

/**
 * Input formatado com valor em BRL para o modo de simulação
 */
export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
  placeholder = '0,00',
}) => {
  const [localStr, setLocalStr] = useState<string>(() =>
    value !== undefined && value !== null
      ? value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
      : '',
  )
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (!isFocused) {
      setLocalStr(
        value !== undefined && value !== null
          ? value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
          : '',
      )
    }
  }, [value, isFocused])

  const handleBlur = () => {
    setIsFocused(false)
    // Parse da string local
    let clean = localStr.replace(/\./g, '').replace(',', '.')
    let num = parseFloat(clean)
    if (isNaN(num)) num = 0
    onChange(num)
    setLocalStr(num.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setLocalStr(raw)
    let clean = raw.replace(/\./g, '').replace(',', '.')
    let num = parseFloat(clean)
    if (!isNaN(num)) {
      onChange(num)
    } else if (raw === '' || raw === '-') {
      onChange(0)
    }
  }

  return (
    <div className="relative flex items-center">
      <span className="absolute left-2 text-[10px] text-muted-foreground select-none font-mono">
        R$
      </span>
      <input
        type="text"
        disabled={disabled}
        value={localStr}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full text-right pl-7 pr-2 py-1 text-xs font-mono font-medium rounded-md border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all ${className}`}
      />
    </div>
  )
}

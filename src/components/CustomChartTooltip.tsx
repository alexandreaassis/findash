import React from 'react'
import { formatBRL } from '@/lib/formatters'

export interface CustomTooltipItem {
  name: string
  value: number
  color?: string
}

export interface CustomChartTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  /**
   * Lista ordenada com as keys/nomes esperados.
   * Se fornecida, os itens serão exibidos exatamente nesta sequência.
   * Pode ser uma lista de strings (dataKey ou name) ou um array de objetos de configuração.
   */
  order?: string[]
  /**
   * Permite sobrescrever o rótulo exibido de cada key/name.
   * Ex: { receita: 'Receita Bruta', deducoes: 'Deduções' }
   */
  labelMap?: Record<string, string>
  /**
   * Permite sobrescrever a cor de cada key/name.
   */
  colorMap?: Record<string, string>
  /**
   * Função para formatar o valor (padrão: formatBRL).
   */
  formatter?: (val: number, name: string) => string
}

export const CustomChartTooltip: React.FC<CustomChartTooltipProps> = ({
  active,
  payload,
  label,
  order,
  labelMap,
  colorMap,
  formatter = (v) => formatBRL(v),
}) => {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  // Filtrar itens com valor válido
  const validItems = payload.filter(
    (item) => item && item.value !== undefined && item.value !== null && item.type !== 'none',
  )

  if (validItems.length === 0) {
    return null
  }

  // Ordenar conforme o array `order`, se definido
  let sortedItems = [...validItems]
  if (order && order.length > 0) {
    sortedItems.sort((a, b) => {
      const keyA = a.dataKey ?? a.name
      const keyB = b.dataKey ?? b.name

      let idxA = order.indexOf(keyA)
      if (idxA === -1 && a.name) {
        idxA = order.indexOf(a.name)
      }

      let idxB = order.indexOf(keyB)
      if (idxB === -1 && b.name) {
        idxB = order.indexOf(b.name)
      }

      const orderA = idxA === -1 ? 999 : idxA
      const orderB = idxB === -1 ? 999 : idxB
      return orderA - orderB
    })
  }

  // Se for pizza, pode vir name no payload
  const headerTitle = label || sortedItems[0]?.payload?.name || ''

  return (
    <div className="bg-slate-900/95 backdrop-blur-xs border border-slate-700/80 rounded-lg p-3 text-white shadow-xl min-w-[210px] max-w-xs z-50 text-xs">
      {headerTitle ? (
        <div className="font-bold text-slate-100 text-sm pb-2 mb-2 border-b border-slate-800">
          {headerTitle}
        </div>
      ) : null}

      <div className="space-y-1.5">
        {sortedItems.map((item, idx) => {
          const rawKey = item.dataKey ?? item.name
          const rawName = item.name ?? item.dataKey ?? ''
          const displayName = labelMap?.[rawKey] || labelMap?.[rawName] || rawName || rawKey

          // Determinar a cor: colorMap > item.color > item.fill > item.payload?.fill
          const dotColor =
            colorMap?.[rawKey] ||
            colorMap?.[rawName] ||
            item.color ||
            item.fill ||
            item.payload?.fill ||
            '#3b82f6'

          const numericVal = Number(item.value) || 0
          const formattedValue = formatter(numericVal, displayName)

          return (
            <div
              key={`${rawKey}-${idx}`}
              className="flex items-center justify-between gap-3 text-slate-200"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span
                  className="w-2.5 h-2.5 rounded-xs shrink-0 shadow-xs"
                  style={{ backgroundColor: dotColor }}
                />
                <span className="truncate font-medium text-slate-300" title={displayName}>
                  {displayName}
                </span>
              </div>
              <span className="font-mono font-bold text-white shrink-0 tabular-nums">
                {formattedValue}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

'use client'

import { TEMPLATES } from '@/lib/templates'

interface TemplateGridProps {
  selected: string
  onSelect: (id: string) => void
}

export function TemplateGrid({ selected, onSelect }: TemplateGridProps) {
  return (
    <div className="grid grid-cols-3 gap-3 mb-5">
      {TEMPLATES.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={`text-left rounded-lg overflow-hidden border-2 transition-all ${
            selected === t.id
              ? 'border-gray-900'
              : 'border-gray-200 hover:border-gray-400'
          }`}
        >
          <div className={`h-11 bg-gradient-to-br ${t.gradient}`} />
          <div className="p-2">
            <div
              className={`text-xs font-semibold ${
                selected === t.id ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              {t.label}
            </div>
            <div className="text-xs text-gray-400 mt-0.5 leading-tight">
              {t.description}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

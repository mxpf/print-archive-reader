import { Columns2, ScrollText } from 'lucide-react'

interface Props {
  mode: 'scroll' | 'page'
  onChange: (mode: 'scroll' | 'page') => void
}

export function ViewModeToggle({ mode, onChange }: Props) {
  return (
    <div className="inline-flex rounded-full border border-stone-300 bg-stone-100 p-1 dark:border-stone-700 dark:bg-stone-900">
      {[
        { value: 'scroll' as const, icon: ScrollText, label: 'Scroll mode' },
        { value: 'page' as const, icon: Columns2, label: 'Page mode' },
      ].map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={`inline-flex h-9 w-10 items-center justify-center rounded-full transition ${
              mode === item.value
                ? 'bg-white text-stone-950 shadow-sm dark:bg-stone-700 dark:text-white'
                : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white'
            }`}
            title={item.label}
            aria-label={item.label}
          >
            <Icon size={17} />
          </button>
        )
      })}
    </div>
  )
}

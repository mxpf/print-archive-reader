import { Moon, Sun } from 'lucide-react'

interface Props {
  theme: 'light' | 'dark'
  onToggle: () => void
}

export function ThemeToggle({ theme, onToggle }: Props) {
  const Icon = theme === 'dark' ? Sun : Moon
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-300/70 bg-white/65 text-stone-800 shadow-sm backdrop-blur transition hover:bg-white dark:border-stone-700 dark:bg-stone-900/65 dark:text-stone-100"
      aria-label={theme === 'dark' ? 'Use light mode' : 'Use dark mode'}
      title={theme === 'dark' ? 'Use light mode' : 'Use dark mode'}
    >
      <Icon size={19} />
    </button>
  )
}

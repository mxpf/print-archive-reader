import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'
import type { ReadingStatus } from '../types/book'
import type { LibraryFilters } from '../utils/bookFilters'

interface Props {
  filters: LibraryFilters
  options: {
    authors: string[]
    bookTypes: string[]
    tags: string[]
  }
  onChange: (filters: LibraryFilters) => void
}

const statuses: Array<ReadingStatus | 'All'> = ['All', 'Unread', 'Reading', 'Finished', 'Reference']

export function SearchSortFilterControls({ filters, options, onChange }: Props) {
  const [refineOpen, setRefineOpen] = useState(false)
  const update = (patch: Partial<LibraryFilters>) => onChange({ ...filters, ...patch })
  const activeFilterCount = [filters.author, filters.bookType, filters.tag, filters.readingStatus !== 'All' ? filters.readingStatus : ''].filter(Boolean).length

  return (
    <section className="rounded-xl bg-[#fff8ea]/75 p-3 shadow-[0_16px_45px_rgba(69,52,35,0.08)] ring-1 ring-stone-900/5 backdrop-blur dark:bg-[#17130f]/78 dark:shadow-none dark:ring-[#3a3028]">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" size={18} />
          <input
            value={filters.search}
            onChange={(event) => update({ search: event.target.value })}
            placeholder="Search the archive"
            className="h-12 w-full rounded-full border-0 bg-white/85 pl-11 pr-4 text-[15px] text-stone-950 shadow-inner outline-none ring-1 ring-stone-900/10 transition placeholder:text-stone-400 focus:ring-stone-700 dark:bg-[#0e0c0a] dark:text-stone-100 dark:ring-[#43392f] dark:placeholder:text-stone-500 dark:focus:ring-stone-400"
          />
        </label>

        <div className="flex items-center justify-between gap-3 lg:hidden">
          <button
            type="button"
            onClick={() => setRefineOpen((open) => !open)}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-stone-300/80 px-3 text-sm font-medium text-stone-700 dark:border-[#4a4036] dark:text-stone-200"
          >
            <SlidersHorizontal size={16} />
            Refine
            {activeFilterCount ? <span className="rounded-full bg-stone-900 px-1.5 py-0.5 text-[11px] text-white dark:bg-stone-100 dark:text-stone-950">{activeFilterCount}</span> : null}
          </button>
          {activeFilterCount || filters.search ? <ClearButton onClick={() => onChange({ ...filters, search: '', author: '', bookType: '', tag: '', readingStatus: 'All' })} /> : null}
        </div>

        <div className="hidden items-end gap-2 lg:flex">
          <RefineFields filters={filters} options={options} update={update} />
          {activeFilterCount || filters.search ? <ClearButton onClick={() => onChange({ ...filters, search: '', author: '', bookType: '', tag: '', readingStatus: 'All' })} /> : null}
        </div>
      </div>

      {refineOpen ? (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-stone-900/10 pt-3 dark:border-[#332a23]">
          <RefineFields filters={filters} options={options} update={update} />
        </div>
      ) : null}
    </section>
  )
}

function RefineFields({
  filters,
  options,
  update,
}: {
  filters: LibraryFilters
  options: {
    authors: string[]
    bookTypes: string[]
    tags: string[]
  }
  update: (patch: Partial<LibraryFilters>) => void
}) {
  return (
    <>
      <Select label="Sort" value={filters.sort} onChange={(sort) => update({ sort: sort as LibraryFilters['sort'] })}>
        <option value="recent">Recently added</option>
        <option value="title">Title</option>
        <option value="author">Author</option>
        <option value="publicationYear">Publication year</option>
        <option value="bookType">Book type</option>
      </Select>
      <Select label="Author" value={filters.author} onChange={(author) => update({ author })}>
        <option value="">All authors</option>
        {options.authors.map((author) => (
          <option key={author}>{author}</option>
        ))}
      </Select>
      <Select label="Type" value={filters.bookType} onChange={(bookType) => update({ bookType })}>
        <option value="">All types</option>
        {options.bookTypes.map((type) => (
          <option key={type}>{type}</option>
        ))}
      </Select>
      <Select label="Tag" value={filters.tag} onChange={(tag) => update({ tag })}>
        <option value="">All tags</option>
        {options.tags.map((tag) => (
          <option key={tag}>{tag}</option>
        ))}
      </Select>
      <Select
        label="Status"
        value={filters.readingStatus}
        onChange={(readingStatus) => update({ readingStatus: readingStatus as ReadingStatus | 'All' })}
      >
        {statuses.map((status) => (
          <option key={status}>{status}</option>
        ))}
      </Select>
    </>
  )
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}) {
  return (
    <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-stone-500">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 min-w-0 rounded-full border-0 bg-white/75 pl-3 pr-10 text-sm font-medium normal-case tracking-normal text-stone-900 outline-none ring-1 ring-stone-900/10 transition focus:ring-stone-600 dark:bg-[#0e0c0a] dark:text-stone-100 dark:ring-[#43392f] dark:focus:ring-stone-400"
      >
        {children}
      </select>
    </label>
  )
}

function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 items-center gap-1 rounded-full px-3 text-sm font-medium text-stone-500 transition hover:bg-stone-900/5 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-stone-100"
    >
      <X size={15} />
      Clear
    </button>
  )
}

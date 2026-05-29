import { ImagePlus, Plus, X } from 'lucide-react'
import { useState } from 'react'
import type { ImportDraft } from '../types/book'
import { imageSurfaceStyle } from '../utils/media'

interface Props {
  draft: ImportDraft
  metadataOptions: {
    authors: string[]
    bookTypes: string[]
    tags: string[]
  }
  onChange: (draft: ImportDraft) => void
}

const coverOptions = [
  'linear-gradient(145deg, #4a3328 0%, #a77d55 48%, #efe1bd 100%)',
  'linear-gradient(145deg, #1e2d3a 0%, #5e7687 52%, #e7eee6 100%)',
  'linear-gradient(145deg, #26372e 0%, #778a69 52%, #f1e5c7 100%)',
  'linear-gradient(145deg, #35253a 0%, #805c74 54%, #f4dfcc 100%)',
]

export function MetadataStep({ draft, metadataOptions, onChange }: Props) {
  const metadata = draft.metadata
  const update = (patch: Partial<ImportDraft['metadata']>) => onChange({ ...draft, metadata: { ...metadata, ...patch } })

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
      <section className="grid gap-3">
        <Field label="Title" required value={metadata.title} onChange={(title) => update({ title })} />
        <Field label="Subtitle" value={metadata.subtitle ?? ''} onChange={(subtitle) => update({ subtitle })} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Author" required value={metadata.author} suggestions={metadataOptions.authors} onChange={(author) => update({ author })} />
          <Field
            label="Publication year"
            type="number"
            value={metadata.publicationYear?.toString() ?? ''}
            onChange={(value) => update({ publicationYear: value ? Number(value) : undefined })}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Book type" required value={metadata.bookType} suggestions={metadataOptions.bookTypes} onChange={(bookType) => update({ bookType })} />
          <TagInput tags={metadata.tags} suggestions={metadataOptions.tags} onChange={(tags) => update({ tags })} />
        </div>
        <label className="grid gap-1 text-sm font-medium text-stone-700 dark:text-stone-300">
          <LabelText label="Description" />
          <textarea
            value={metadata.description}
            onChange={(event) => update({ description: event.target.value })}
            rows={5}
            className="rounded-lg border border-stone-200 bg-white/80 px-3 py-3 text-stone-950 outline-none focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-white"
          />
        </label>
      </section>
      <aside>
        <div
          className="mx-auto aspect-[2/3] w-44 rounded-md shadow-lg"
          style={imageSurfaceStyle(metadata.coverImage)}
          aria-hidden="true"
        />
        <div className="mt-4 grid grid-cols-4 gap-2">
          {coverOptions.map((cover) => (
            <button
              key={cover}
              type="button"
              onClick={() => update({ coverImage: cover })}
              className="aspect-square rounded-full border-2 border-white shadow-sm ring-1 ring-stone-300"
              style={{ background: cover }}
              aria-label="Choose cover color"
            />
          ))}
        </div>
        <label className="mt-3 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-stone-300 text-sm font-medium text-stone-700 dark:border-stone-700 dark:text-stone-200">
          <ImagePlus size={17} />
          Upload cover
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = () => update({ coverImage: String(reader.result) })
              reader.readAsDataURL(file)
            }}
          />
        </label>
        <p className="mt-2 text-center text-xs text-stone-500 dark:text-stone-400">Cover image is optional.</p>
      </aside>
    </div>
  )
}

function TagInput({ tags, suggestions, onChange }: { tags: string[]; suggestions: string[]; onChange: (tags: string[]) => void }) {
  const [draftTag, setDraftTag] = useState('')
  const normalizedDraft = draftTag.trim().toLowerCase()
  const suggestedTags = suggestions
    .filter((suggestion) => !tags.some((tag) => tag.toLowerCase() === suggestion.toLowerCase()))
    .filter((suggestion) => !normalizedDraft || suggestion.toLowerCase().includes(normalizedDraft))
    .slice(0, 8)

  const addTag = (rawTag = draftTag) => {
    const nextTag = rawTag.trim()
    if (!nextTag) return
    if (!tags.some((tag) => tag.toLowerCase() === nextTag.toLowerCase())) {
      onChange([...tags, nextTag])
    }
    setDraftTag('')
  }

  const removeTag = (tagToRemove: string) => onChange(tags.filter((tag) => tag !== tagToRemove))

  return (
    <label className="grid gap-1 text-sm font-medium text-stone-700 dark:text-stone-300">
      <LabelText label="Tags" />
      <div className="rounded-lg border border-stone-200 bg-white/80 px-2 py-2 focus-within:border-stone-500 dark:border-stone-700 dark:bg-stone-950">
        <div className="mb-2 flex min-h-8 flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800"
                aria-label={`Remove ${tag}`}
                title={`Remove ${tag}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={draftTag}
            onChange={(event) => setDraftTag(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ',') {
                event.preventDefault()
                addTag()
              }
              if (event.key === 'Backspace' && !draftTag && tags.length > 0) {
                removeTag(tags[tags.length - 1])
              }
            }}
            placeholder="Type a tag"
            className="h-9 min-w-0 flex-1 border-0 bg-transparent px-1 text-stone-950 outline-none dark:text-white"
          />
          <button
            type="button"
            onClick={() => addTag()}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-950 text-white disabled:opacity-35 dark:bg-stone-100 dark:text-stone-950"
            disabled={!draftTag.trim()}
            aria-label="Add tag"
            title="Add tag"
          >
            <Plus size={15} />
          </button>
        </div>
        {suggestedTags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5 border-t border-stone-200 pt-2 dark:border-stone-800">
            {suggestedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="rounded-full border border-stone-200 px-2.5 py-1 text-xs font-normal text-stone-600 transition hover:border-stone-400 hover:text-stone-950 dark:border-stone-700 dark:text-stone-300 dark:hover:border-stone-500 dark:hover:text-white"
              >
                {tag}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <span className="text-xs font-normal text-stone-500 dark:text-stone-400">Spaces stay in the tag. Press Enter, comma, or Add when done.</span>
    </label>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  suggestions = [],
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  suggestions?: string[]
  required?: boolean
}) {
  const listId = suggestions.length > 0 ? `${label.toLowerCase().replace(/\W+/g, '-')}-suggestions` : undefined

  return (
    <label className="grid gap-1 text-sm font-medium text-stone-700 dark:text-stone-300">
      <LabelText label={label} required={required} />
      <input
        type={type}
        list={listId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-lg border border-stone-200 bg-white/80 px-3 text-stone-950 outline-none focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-white"
      />
      {listId ? (
        <datalist id={listId}>
          {suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      ) : null}
    </label>
  )
}

function LabelText({ label, required = false }: { label: string; required?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      {label}
      <span className="text-xs font-normal text-stone-500 dark:text-stone-400">{required ? 'Required' : 'Optional'}</span>
    </span>
  )
}

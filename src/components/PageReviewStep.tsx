import { Check, Contrast, Crop, RotateCw, ScanLine, SlidersHorizontal } from 'lucide-react'
import type { ImportDraft, PageRole, SourcePage } from '../types/book'
import { imageSurfaceStyle } from '../utils/media'

interface Props {
  draft: ImportDraft
  onChange: (draft: ImportDraft) => void
}

export function PageReviewStep({ draft, onChange }: Props) {
  const updatePage = (id: string, patch: Partial<SourcePage>) =>
    onChange({ ...draft, sourcePages: draft.sourcePages.map((page) => (page.id === id ? { ...page, ...patch } : page)) })

  const updatePageRole = (id: string, pageRole: PageRole) =>
    updatePage(id, {
      pageRole,
      preserveImage: pageRole === 'text' ? false : true,
      skipped: pageRole === 'cover' ? true : undefined,
    })

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {draft.sourcePages.map((page) => (
        <article key={page.id} className="rounded-lg border border-stone-200 bg-white/75 p-3 shadow-sm dark:border-stone-800 dark:bg-stone-900/75">
          <div className="grid grid-cols-[104px_1fr] gap-3">
            <div className="aspect-[2/3] rounded-md border border-stone-200" style={imageSurfaceStyle(page.imageUrl, page.spreadSide)} />
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-stone-950 dark:text-white">Page {page.pageNumber}</h3>
                  {page.captureMode === 'spread' ? (
                    <p className="text-xs capitalize text-stone-500">{page.spreadSide} side of facing-page upload</p>
                  ) : null}
                </div>
                <span className="rounded-full border border-stone-200 px-2 py-1 text-xs text-stone-500 dark:border-stone-700">
                  {page.cleanupStatus}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Action icon={Crop} label="Crop" />
                <Action icon={RotateCw} label="Rotate" onClick={() => updatePage(page.id, { rotation: page.rotation + 90 })} />
                <Action icon={ScanLine} label="Deskew" />
                <Action icon={SlidersHorizontal} label="Bright" onClick={() => updatePage(page.id, { brightness: page.brightness + 5 })} />
                <Action icon={Contrast} label="Contrast" onClick={() => updatePage(page.id, { contrast: page.contrast + 5 })} />
                <Action icon={Check} label="Accept" onClick={() => updatePage(page.id, { cleanupStatus: 'accepted' })} />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                <label className="grid gap-1 text-xs font-medium uppercase tracking-[0.12em] text-stone-500">
                  Role
                  <select
                    value={page.pageRole ?? 'text'}
                    onChange={(event) => updatePageRole(page.id, event.target.value as PageRole)}
                    className="h-9 rounded-md border border-stone-200 bg-white px-2 text-sm normal-case tracking-normal text-stone-900 outline-none dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
                  >
                    <option value="text">Text page</option>
                    <option value="cover">Cover image</option>
                    <option value="illustration">Illustration</option>
                  </select>
                </label>
                <label className="flex items-end gap-2 pb-2 text-sm text-stone-600 dark:text-stone-300">
                  <input
                    type="checkbox"
                    checked={Boolean(page.preserveImage)}
                    onChange={(event) =>
                      updatePage(page.id, {
                        preserveImage: event.target.checked,
                        pageRole: event.target.checked && (page.pageRole ?? 'text') === 'text' ? 'illustration' : page.pageRole,
                      })
                    }
                  />
                  Keep image
                </label>
              </div>
              {page.note ? <p className="mt-3 text-sm text-stone-500">Note: {page.note}</p> : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

function Action({ icon: Icon, label, onClick }: { icon: typeof Crop; label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 flex-col items-center justify-center gap-0.5 rounded-md border border-stone-200 bg-stone-50 text-xs text-stone-700 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-300"
    >
      <Icon size={15} />
      {label}
    </button>
  )
}

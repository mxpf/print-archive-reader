import { Camera, GripVertical, ImagePlus, Images, RotateCcw, StickyNote, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { CaptureMode, ImportDraft, PageRole, SourcePage, SpreadSide } from '../types/book'
import { imageSurfaceStyle } from '../utils/media'

interface Props {
  draft: ImportDraft
  onChange: (draft: ImportDraft) => void
}

const mockPageImages = [
  'linear-gradient(155deg, #f8efd9 0%, #fffaf0 72%)',
  'linear-gradient(155deg, #efe5cf 0%, #fffdf6 72%)',
  'linear-gradient(155deg, #f3ead7 0%, #fbf4e6 72%)',
]

export function CaptureStep({ draft, onChange }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const [cameraAvailable, setCameraAvailable] = useState(false)
  const [streamError, setStreamError] = useState('')
  const [captureMode, setCaptureMode] = useState<CaptureMode>('single')

  useEffect(() => {
    let stream: MediaStream | null = null
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
        if (stream) {
          setMediaStream(stream)
          setCameraAvailable(true)
        }
      } catch {
        setStreamError('Camera preview is unavailable in this browser or permission was not granted.')
      }
    }
    startCamera()
    return () => stream?.getTracks().forEach((track) => track.stop())
  }, [])

  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream
    }
  }, [mediaStream])

  const savePages = (sourcePages: SourcePage[]) => onChange({ ...draft, sourcePages })

  const createPagesFromImage = (imageUrl: string, mode: CaptureMode, startingPageNumber: number): SourcePage[] => {
    const base = {
      imageUrl,
      captureMode: mode,
      pageRole: 'text' as const,
      preserveImage: false,
      cleanupStatus: 'pending' as const,
      rotation: 0,
      brightness: 100,
      contrast: 100,
    }

    if (mode === 'single') {
      return [
        {
          ...base,
          id: crypto.randomUUID(),
          pageNumber: startingPageNumber,
        },
      ]
    }

    const spreadId = crypto.randomUUID()
    return (['left', 'right'] as SpreadSide[]).map((spreadSide, index) => ({
      ...base,
      id: crypto.randomUUID(),
      pageNumber: startingPageNumber + index,
      spreadId,
      spreadSide,
    }))
  }

  const addMockPage = () => {
    const nextNumber = draft.sourcePages.length + 1
    const imageUrl = mockPageImages[nextNumber % mockPageImages.length]
    savePages([...draft.sourcePages, ...createPagesFromImage(imageUrl, captureMode, nextNumber)])
  }

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.readAsDataURL(file)
    })

  const addUploadedFiles = async (files: FileList | null) => {
    if (!files?.length) return
    const dataUrls = await Promise.all(Array.from(files).map(readFileAsDataUrl))
    const nextPages = dataUrls.flatMap((imageUrl, index) => {
      const pagesAlreadyAdded = dataUrls.slice(0, index).reduce((count) => count + (captureMode === 'spread' ? 2 : 1), 0)
      return createPagesFromImage(imageUrl, captureMode, draft.sourcePages.length + pagesAlreadyAdded + 1)
    })
    savePages([...draft.sourcePages, ...nextPages])
  }

  const updatePage = (id: string, patch: Partial<SourcePage>) =>
    savePages(draft.sourcePages.map((page) => (page.id === id ? { ...page, ...patch } : page)))

  const updatePageRole = (id: string, pageRole: PageRole) =>
    updatePage(id, {
      pageRole,
      preserveImage: pageRole === 'text' ? false : true,
      skipped: pageRole === 'cover' ? true : undefined,
    })

  const removePage = (id: string) =>
    savePages(
      draft.sourcePages
        .filter((page) => page.id !== id)
        .map((page, index) => ({
          ...page,
          pageNumber: index + 1,
        })),
    )

  const move = (id: string, direction: -1 | 1) => {
    const pages = [...draft.sourcePages]
    const index = pages.findIndex((page) => page.id === id)
    const target = index + direction
    if (target < 0 || target >= pages.length) return
    ;[pages[index], pages[target]] = [pages[target], pages[index]]
    savePages(pages.map((page, pageIndex) => ({ ...page, pageNumber: pageIndex + 1 })))
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <section className="overflow-hidden rounded-lg border border-stone-200 bg-stone-950 text-white shadow-sm dark:border-stone-800">
        <div className="border-b border-white/10 p-3">
          <div className="inline-flex rounded-full border border-white/20 bg-white/5 p-1">
            <CaptureModeButton icon={Camera} label="Single page" active={captureMode === 'single'} onClick={() => setCaptureMode('single')} />
            <CaptureModeButton icon={Images} label="Facing pages" active={captureMode === 'spread'} onClick={() => setCaptureMode('spread')} />
          </div>
        </div>
        <div className={`relative max-h-[64vh] ${captureMode === 'spread' ? 'aspect-[4/3]' : 'aspect-[3/4]'}`}>
          {cameraAvailable ? (
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_30%,#4b5563,#111827_70%)] p-8 text-center">
              <Camera size={42} />
              <p className="mt-4 max-w-xs text-sm text-stone-200">{streamError || 'Preparing camera preview...'}</p>
              <p className="mt-2 max-w-xs text-xs text-stone-400">
                The prototype keeps the camera API boundary here. Capture currently saves a realistic page placeholder if live capture is unavailable.
              </p>
            </div>
          )}
          <div className="pointer-events-none absolute inset-5 rounded-md border-2 border-white/70" />
          {captureMode === 'spread' ? (
            <>
              <div className="pointer-events-none absolute inset-y-5 left-1/2 w-px -translate-x-1/2 bg-white/70" />
              <div className="pointer-events-none absolute bottom-7 left-7 rounded-full bg-black/45 px-2 py-1 text-xs">Left page</div>
              <div className="pointer-events-none absolute bottom-7 right-7 rounded-full bg-black/45 px-2 py-1 text-xs">Right page</div>
            </>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-3 p-4">
          <button
            type="button"
            onClick={addMockPage}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-stone-950"
          >
            <Camera size={20} />
            {captureMode === 'spread' ? `Capture Pages ${draft.sourcePages.length + 1}-${draft.sourcePages.length + 2}` : `Capture Page ${draft.sourcePages.length + 1}`}
          </button>
          <label className="inline-flex h-14 cursor-pointer items-center justify-center gap-2 rounded-full border border-white/25 text-sm font-semibold">
            <ImagePlus size={20} />
            Upload
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(event) => addUploadedFiles(event.target.files)}
            />
          </label>
        </div>
      </section>

      <aside className="rounded-lg border border-stone-200 bg-white/70 p-3 shadow-sm dark:border-stone-800 dark:bg-stone-900/70">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">Captured pages</h3>
        <div className="mt-3 grid max-h-[62vh] gap-2 overflow-auto pr-1">
          {draft.sourcePages.map((page, index) => (
            <div key={page.id} className="grid grid-cols-[54px_1fr] gap-3 rounded-md border border-stone-200 bg-white p-2 dark:border-stone-800 dark:bg-stone-950">
              <div className="aspect-[2/3] rounded border border-stone-200" style={imageSurfaceStyle(page.imageUrl, page.spreadSide)} />
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <strong className="block text-sm">Page {page.pageNumber}</strong>
                    {page.captureMode === 'spread' ? (
                      <span className="text-xs capitalize text-stone-500">{page.spreadSide} side of spread</span>
                    ) : null}
                  </div>
                  <div className="flex">
                    <Mini icon={GripVertical} label="Move earlier" onClick={() => move(page.id, -1)} disabled={index === 0} />
                    <Mini icon={RotateCcw} label="Retake page" onClick={() => updatePage(page.id, { cleanupStatus: 'retake' })} />
                    <Mini icon={Trash2} label="Delete page" onClick={() => removePage(page.id)} />
                  </div>
                </div>
                <label className="mt-2 grid gap-1 text-xs text-stone-500">
                  Page role
                  <select
                    value={page.pageRole ?? 'text'}
                    onChange={(event) => updatePageRole(page.id, event.target.value as PageRole)}
                    className="h-8 rounded-md border border-stone-200 bg-white px-2 text-xs text-stone-800 outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                  >
                    <option value="text">Text page</option>
                    <option value="cover">Cover image</option>
                    <option value="illustration">Illustration</option>
                  </select>
                </label>
                <label className="mt-2 flex items-center gap-2 text-xs text-stone-500">
                  <input
                    type="checkbox"
                    checked={Boolean(page.skipped)}
                    onChange={(event) => updatePage(page.id, { skipped: event.target.checked })}
                  />
                  Mark skipped
                </label>
                <label className="mt-2 flex items-center gap-2 text-xs text-stone-500">
                  <input
                    type="checkbox"
                    checked={page.preserveImage}
                    onChange={(event) =>
                      updatePage(page.id, {
                        preserveImage: event.target.checked,
                        pageRole: event.target.checked && (page.pageRole ?? 'text') === 'text' ? 'illustration' : page.pageRole,
                      })
                    }
                  />
                  Preserve image in reader
                </label>
                <label className="mt-2 flex items-center gap-1 text-xs text-stone-500">
                  <StickyNote size={13} />
                  <input
                    value={page.note ?? ''}
                    onChange={(event) => updatePage(page.id, { note: event.target.value })}
                    placeholder="Page note"
                    className="min-w-0 flex-1 border-0 bg-transparent outline-none"
                  />
                </label>
              </div>
            </div>
          ))}
          {draft.sourcePages.length === 0 ? <p className="p-4 text-sm text-stone-500">No pages captured yet.</p> : null}
        </div>
      </aside>
    </div>
  )
}

function CaptureModeButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Camera
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium transition ${
        active ? 'bg-white text-stone-950' : 'text-stone-300 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  )
}

function Mini({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: typeof Trash2
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 disabled:opacity-30 dark:hover:bg-stone-800"
      title={label}
      aria-label={label}
    >
      <Icon size={15} />
    </button>
  )
}

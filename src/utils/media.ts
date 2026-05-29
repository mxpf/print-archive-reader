import type { BookImageAsset, SourcePage, SpreadSide } from '../types/book'
import type { CSSProperties } from 'react'

export function isImageSource(source: string) {
  return /^(data:image|blob:|https?:\/\/|\/)/.test(source)
}

export function imageSurfaceStyle(source: string, spreadSide?: SpreadSide): CSSProperties {
  if (isImageSource(source)) {
    return {
      backgroundImage: `url("${source}")`,
      backgroundSize: spreadSide ? '200% 100%' : 'cover',
      backgroundPosition: spreadSide === 'left' ? 'left center' : spreadSide === 'right' ? 'right center' : 'center',
      backgroundColor: '#f8f2e5',
    }
  }

  return { background: source }
}

export function pageCaption(page: SourcePage) {
  if (page.note?.trim()) return page.note.trim()
  const spreadLabel = page.spreadSide ? ` (${page.spreadSide} side of spread)` : ''
  return page.pageRole === 'cover' ? `Cover${spreadLabel}` : `Illustration, page ${page.pageNumber}${spreadLabel}`
}

export function sourcePageToImageAsset(page: SourcePage): BookImageAsset | null {
  if (page.pageRole === 'text' || !page.preserveImage) return null
  return {
    id: crypto.randomUUID(),
    sourcePageId: page.id,
    pageNumber: page.pageNumber,
    role: page.pageRole,
    imageUrl: page.imageUrl,
    spreadSide: page.spreadSide,
    caption: pageCaption(page),
    includeInReader: true,
  }
}

export function imageAssetToHtml(asset: BookImageAsset) {
  const roleClass = asset.role === 'cover' ? 'preserved-figure preserved-cover' : 'preserved-figure preserved-illustration'
  const cropClass = asset.spreadSide ? ` preserved-crop preserved-crop-${asset.spreadSide}` : ''
  const media = isImageSource(asset.imageUrl)
    ? `<div class="preserved-image-frame${cropClass}"><img src="${asset.imageUrl}" alt="${escapeHtml(asset.caption ?? asset.role)}" /></div>`
    : `<div class="preserved-image-placeholder${cropClass}" style="background: ${asset.imageUrl}"></div>`

  return `<figure class="${roleClass}" data-page="${asset.pageNumber}" data-image-role="${asset.role}"${
    asset.spreadSide ? ` data-spread-side="${asset.spreadSide}"` : ''
  }>${media}${
    asset.caption ? `<figcaption>${escapeHtml(asset.caption)}</figcaption>` : ''
  }</figure>`
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

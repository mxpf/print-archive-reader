import type { Book } from '../types/book'

const now = new Date().toISOString()

const covers = {
  desert: 'linear-gradient(145deg, #412f28 0%, #8f6846 48%, #e4d2a8 100%)',
  blue: 'linear-gradient(145deg, #13253c 0%, #47627c 52%, #d8e2dc 100%)',
  green: 'linear-gradient(145deg, #1f3027 0%, #63795d 50%, #eadfbd 100%)',
  plum: 'linear-gradient(145deg, #2f2436 0%, #76546b 54%, #f0dac8 100%)',
}

const baseBooks: Omit<Book, 'richTextContent'>[] = [
  {
    id: 'sample-way-of-attention',
    title: 'The Way of Attention',
    subtitle: 'Fragments from a Private Notebook',
    author: 'Miriam Vale',
    publicationYear: 1948,
    bookType: 'Spiritual',
    tags: ['contemplation', 'notebooks', 'prayer'],
    description:
      'A quiet collection of meditations on attention, silence, and the discipline of seeing ordinary life without haste.',
    coverImage: covers.desert,
    dateAdded: now,
    readingStatus: 'Reading',
    lastReadPosition: {
      chapterId: 'attention-1',
      scrollRatio: 0.25,
      pageIndex: 0,
      updatedAt: now,
    },
    sourcePages: [],
    ocrStatus: 'complete',
    chapters: [
      {
        id: 'attention-1',
        title: 'Chapter I: The Lamp Is Trimmed',
        startPage: 1,
        contentHtml:
          '<h2>Chapter I: The Lamp Is Trimmed</h2><p>The first labor of the inward life is not speech but <em>attention</em>. We learn to stand before the world without immediately asking what it can become for us.</p><p><strong>To attend is to consent to reality.</strong> The old teachers knew this and placed silence before doctrine, because the heart that cannot be quiet will turn even wisdom into noise.</p><blockquote>Keep watch at the threshold of perception. Many errors enter not as arguments, but as haste.</blockquote><p>In the margin of my mother\'s prayer book I found this sentence: <em>God is not found by velocity.</em><sup id="fnref-1"><a href="#fn-1">1</a></sup></p><hr data-page="2" /><p>So I began again, not with a vow but with a chair by the window, a page, and the morning light.</p><ol class="footnotes"><li id="fn-1">A penciled note, dated April 1931, on the flyleaf of an otherwise anonymous volume.</li></ol>',
      },
      {
        id: 'attention-2',
        title: 'Chapter II: Practice in the Ordinary Room',
        startPage: 9,
        contentHtml:
          '<h2>Chapter II: Practice in the Ordinary Room</h2><p>The room is never merely a room. It is a school of relation: chair to table, hand to cup, breath to sentence.</p><p>When I say <em>practice</em>, I do not mean a performance. I mean returning to the same small fidelity after one has wandered.</p>',
      },
    ],
  },
  {
    id: 'sample-small-history',
    title: 'A Small History of the North Road',
    subtitle: 'Taverns, Chapels, and Milestones',
    author: 'Edwin Harrow',
    publicationYear: 1912,
    bookType: 'History',
    tags: ['local history', 'roads', 'architecture'],
    description:
      'An illustrated local history tracing the social life of an old road through meeting houses, inns, markets, and private letters.',
    coverImage: covers.blue,
    dateAdded: '2026-04-18T10:00:00.000Z',
    readingStatus: 'Reference',
    sourcePages: [],
    ocrStatus: 'complete',
    chapters: [
      {
        id: 'north-1',
        title: 'I. The Road Before the Coaches',
        startPage: 3,
        contentHtml:
          '<h2>I. The Road Before the Coaches</h2><p>Before the coaches there was the footpath, and before the footpath, the habit of going north when the river ran high.</p><p>The parish accounts name the road only twice before 1704, though the stones themselves suggest an older traffic.</p><blockquote>The lane by Alford Cross was already “worne bare by many feet,” according to the deposition of Thomas Bell, wheelwright.</blockquote>',
      },
      {
        id: 'north-2',
        title: 'II. Inns and Weather',
        startPage: 21,
        contentHtml:
          '<h2>II. Inns and Weather</h2><p>The inn registers preserve a second history: one of wet boots, borrowed lamps, parcels left in haste, and arguments over horses.</p><p><strong>The Blue Hart</strong> appears in every account of the storm of 1788.</p>',
      },
    ],
  },
  {
    id: 'sample-garden-letters',
    title: 'Letters from a Narrow Garden',
    author: 'Clara Ainsworth',
    publicationYear: 1936,
    bookType: 'Letters',
    tags: ['letters', 'botany', 'domestic life'],
    description:
      'A sequence of warm, observant letters about weather, grief, bulbs, friendship, and the slow education of a small city garden.',
    coverImage: covers.green,
    dateAdded: '2026-02-02T15:30:00.000Z',
    readingStatus: 'Unread',
    sourcePages: [],
    ocrStatus: 'complete',
    chapters: [
      {
        id: 'garden-1',
        title: 'March: On the First Shoots',
        startPage: 1,
        contentHtml:
          '<h2>March: On the First Shoots</h2><p>Dear Helen, the crocus has made its reckless argument against winter, and I find myself persuaded.</p><p>I had forgotten how much courage can be held in a thing so slight. The green point arrives first, then the color, then the bees, which seem to remember everything.</p>',
      },
      {
        id: 'garden-2',
        title: 'May: A Letter Never Posted',
        startPage: 18,
        contentHtml:
          '<h2>May: A Letter Never Posted</h2><p>I wrote your name on the envelope and left it under the seed catalogues. Forgive the delay. The garden has made me honest, but not punctual.</p><p><em>The lilacs are extravagant this year.</em></p>',
      },
    ],
  },
  {
    id: 'sample-civic-reader',
    title: 'The Civic Reader',
    subtitle: 'Selections for Evening Study',
    author: 'Jonas Pike, editor',
    publicationYear: 1899,
    bookType: 'Philosophy',
    tags: ['ethics', 'civic life', 'education'],
    description:
      'A compact reader of essays and excerpts intended for household study circles and small-town debating societies.',
    coverImage: covers.plum,
    dateAdded: '2026-01-12T09:15:00.000Z',
    readingStatus: 'Finished',
    sourcePages: [],
    ocrStatus: 'complete',
    chapters: [
      {
        id: 'civic-1',
        title: 'On Common Duties',
        startPage: 7,
        contentHtml:
          '<h2>On Common Duties</h2><p>Liberty becomes visible in the small offices by which neighbors agree to remain answerable to one another.</p><p><strong>A public thing decays first in private habits.</strong> No constitution can long preserve what a household has ceased to practice.</p>',
      },
      {
        id: 'civic-2',
        title: 'The Habit of Deliberation',
        startPage: 31,
        contentHtml:
          '<h2>The Habit of Deliberation</h2><p>To deliberate is not merely to delay. It is to make room for reasons that are not yet fashionable.</p><blockquote>There is a courage of slowness, and a cowardice that calls itself efficiency.</blockquote>',
      },
    ],
  },
]

export const sampleBooks: Book[] = baseBooks.map((book) => ({
  ...book,
  richTextContent: book.chapters.map((chapter) => chapter.contentHtml).join('\n'),
}))

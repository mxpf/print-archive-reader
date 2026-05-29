import {
  Bold,
  Heading2,
  Italic,
  Link2,
  ListOrdered,
  Pilcrow,
  Quote,
  Save,
  Superscript,
  Undo2,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

interface Props {
  html: string
  onChange: (html: string) => void
  onSave?: () => void
}

type BlockFormat = 'p' | 'h2' | 'blockquote'

interface ToolbarState {
  bold: boolean
  italic: boolean
  block: BlockFormat
  pageFootnotes: boolean
  endnotes: boolean
  canUndo: boolean
}

export function RichTextEditor({ html, onChange, onSave }: Props) {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const selectionRef = useRef<Range | null>(null)
  const historyRef = useRef<string[]>([])
  const lastHtmlRef = useRef(html)
  const [toolbarState, setToolbarState] = useState<ToolbarState>({
    bold: false,
    italic: false,
    block: 'p',
    pageFootnotes: false,
    endnotes: false,
    canUndo: false,
  })

  const nodeIsInsideEditor = useCallback((node: Node | null) => {
    const editor = editorRef.current
    if (!editor || !node) return false
    return editor.contains(node.nodeType === Node.ELEMENT_NODE ? node : node.parentNode)
  }, [])

  const updateToolbarState = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    const selection = window.getSelection()
    const selectedNode = selection?.rangeCount ? selection.anchorNode : null
    const block = selectedNode && nodeIsInsideEditor(selectedNode) ? getCurrentBlock(selectedNode, editor) : 'p'
    const selectedElement =
      selectedNode && nodeIsInsideEditor(selectedNode)
        ? selectedNode.nodeType === Node.ELEMENT_NODE
          ? (selectedNode as Element)
          : selectedNode.parentNode instanceof Element
            ? selectedNode.parentNode
            : null
        : null

    setToolbarState({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      block,
      pageFootnotes: Boolean(selectedElement?.closest('.page-footnotes')),
      endnotes: Boolean(selectedElement?.closest('.endnotes')),
      canUndo: historyRef.current.length > 0,
    })
  }, [nodeIsInsideEditor])

  useEffect(() => {
    if (!editorRef.current || editorRef.current.innerHTML === html) return
    editorRef.current.innerHTML = html
    historyRef.current = []
    lastHtmlRef.current = html
    updateToolbarState()
  }, [html, updateToolbarState])

  const saveSelection = () => {
    const selection = window.getSelection()
    if (!selection?.rangeCount || !nodeIsInsideEditor(selection.anchorNode)) return
    selectionRef.current = selection.getRangeAt(0).cloneRange()
  }

  const restoreSelection = () => {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    const selection = window.getSelection()
    selection?.removeAllRanges()
    if (selectionRef.current) {
      selection?.addRange(selectionRef.current)
    }
  }

  const pushHistory = (snapshot = editorRef.current?.innerHTML ?? '') => {
    if (!snapshot) return
    const history = historyRef.current
    if (history[history.length - 1] !== snapshot) {
      history.push(snapshot)
    }
    if (history.length > 80) history.shift()
  }

  const commit = () => {
    if (!editorRef.current) return
    const nextHtml = editorRef.current.innerHTML
    lastHtmlRef.current = nextHtml
    onChange(nextHtml)
    saveSelection()
    updateToolbarState()
  }

  const handleInput = () => {
    if (!editorRef.current) return
    const nextHtml = editorRef.current.innerHTML
    if (nextHtml !== lastHtmlRef.current) {
      pushHistory(lastHtmlRef.current)
      lastHtmlRef.current = nextHtml
      onChange(nextHtml)
    }
    saveSelection()
    updateToolbarState()
  }

  const undo = () => {
    const editor = editorRef.current
    const previousHtml = historyRef.current.pop()
    if (!editor || previousHtml === undefined) return
    editor.innerHTML = previousHtml
    lastHtmlRef.current = previousHtml
    onChange(previousHtml)
    restoreSelection()
    updateToolbarState()
  }

  const applyInline = (command: 'bold' | 'italic') => {
    restoreSelection()
    pushHistory()
    document.execCommand(command, false)
    commit()
  }

  const applyBlock = (block: BlockFormat) => {
    restoreSelection()
    pushHistory()
    const nextBlock = block !== 'p' && toolbarState.block === block ? 'p' : block
    document.execCommand('formatBlock', false, `<${nextBlock}>`)
    commit()
  }

  const insertHtml = (htmlToInsert: string) => {
    restoreSelection()
    pushHistory()
    document.execCommand('insertHTML', false, htmlToInsert)
    commit()
  }

  const insertFootnoteReference = () => {
    restoreSelection()
    const selection = window.getSelection()
    if (selection?.rangeCount) {
      const range = selection.getRangeAt(0)
      if (!range.collapsed) {
        range.collapse(false)
        selection.removeAllRanges()
        selection.addRange(range)
        selectionRef.current = range.cloneRange()
      }
    }
    const number = getNextReferenceNumber(editorRef.current?.innerHTML ?? '')
    insertHtml(`<sup class="footnote-ref" id="fnref-${number}"><a href="#fn-${number}">${number}</a></sup>`)
  }

  const togglePageFootnotes = () => {
    const activeFootnoteSection = getActiveElement('.page-footnotes')
    if (activeFootnoteSection) {
      pushHistory()
      unwrapElement(activeFootnoteSection)
      commit()
      return
    }

    const number = getNextTargetNumber(editorRef.current?.innerHTML ?? '')
    const selectedHtml = getSelectedHtml()
    insertHtml(
      `<aside class="page-footnotes" role="doc-footnotes"><ol><li id="fn-${number}">${
        selectedHtml || 'Footnote text'
      } <a class="footnote-backref" href="#fnref-${number}">Back</a></li></ol></aside>`,
    )
  }

  const toggleEndnoteTarget = () => {
    const activeEndnotes = getActiveElement('.endnotes')
    if (activeEndnotes) {
      pushHistory()
      unwrapElement(activeEndnotes)
      commit()
      return
    }

    const number = getNextTargetNumber(editorRef.current?.innerHTML ?? '')
    const selectedHtml = getSelectedHtml()
    insertHtml(
      `<ol class="endnotes"><li id="fn-${number}">${selectedHtml || 'Endnote text'} <a class="footnote-backref" href="#fnref-${number}">Back</a></li></ol>`,
    )
  }

  const getSelectedHtml = () => {
    restoreSelection()
    const selection = window.getSelection()
    if (!selection?.rangeCount || selection.isCollapsed) return ''
    const wrapper = document.createElement('div')
    wrapper.appendChild(selection.getRangeAt(0).cloneContents())
    return wrapper.innerHTML
  }

  const getActiveElement = (selector: string) => {
    restoreSelection()
    const selection = window.getSelection()
    const node = selection?.rangeCount ? selection.anchorNode : null
    const element = node?.nodeType === Node.ELEMENT_NODE ? (node as Element) : node?.parentNode instanceof Element ? node.parentNode : null
    return element?.closest(selector) as HTMLElement | null
  }

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <div className="flex flex-wrap items-center gap-1 border-b border-stone-200 p-2 dark:border-stone-800">
        <Tool icon={Undo2} label="Undo" onClick={undo} disabled={!toolbarState.canUndo} />
        <div className="mx-1 h-8 w-px bg-stone-200 dark:bg-stone-800" />
        <Tool icon={Bold} label="Bold" active={toolbarState.bold} onClick={() => applyInline('bold')} />
        <Tool icon={Italic} label="Italic" active={toolbarState.italic} onClick={() => applyInline('italic')} />
        <Tool icon={Heading2} label="Chapter heading" active={toolbarState.block === 'h2'} onClick={() => applyBlock('h2')} />
        <Tool icon={Pilcrow} label="Paragraph" active={toolbarState.block === 'p'} onClick={() => applyBlock('p')} />
        <Tool icon={Quote} label="Block quote" active={toolbarState.block === 'blockquote'} onClick={() => applyBlock('blockquote')} />
        <div className="mx-1 h-8 w-px bg-stone-200 dark:bg-stone-800" />
        <Tool icon={Superscript} label="Footnote reference" onClick={insertFootnoteReference} />
        <Tool icon={ListOrdered} label="Page footnotes" active={toolbarState.pageFootnotes} onClick={togglePageFootnotes} />
        <Tool icon={Link2} label="Endnote target" active={toolbarState.endnotes} onClick={toggleEndnoteTarget} />
        {onSave ? (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={onSave}
            className="ml-auto inline-flex h-10 items-center gap-2 rounded-full bg-stone-950 px-4 text-sm font-medium text-white dark:bg-stone-100 dark:text-stone-950"
          >
            <Save size={16} />
            Save
          </button>
        ) : null}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="editable-rich-text min-h-[300px] px-4 py-4 font-serif text-lg leading-8 text-stone-950 outline-none dark:text-stone-100"
        onInput={handleInput}
        onKeyUp={updateToolbarState}
        onMouseUp={() => {
          saveSelection()
          updateToolbarState()
        }}
        onFocus={() => {
          saveSelection()
          updateToolbarState()
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}

function getCurrentBlock(node: Node, editor: HTMLElement): BlockFormat {
  let current: Node | null = node.nodeType === Node.ELEMENT_NODE ? node : node.parentNode

  while (current && current !== editor) {
    if (current instanceof HTMLElement) {
      const tag = current.tagName.toLowerCase()
      if (tag === 'h2') return 'h2'
      if (tag === 'blockquote') return 'blockquote'
      if (tag === 'p') return 'p'
    }
    current = current.parentNode
  }

  return 'p'
}

function getNextReferenceNumber(html: string) {
  const { refs, targets } = getFootnoteNumbers(html)
  return Math.max(0, ...refs, ...targets) + 1
}

function getNextTargetNumber(html: string) {
  const { refs, targets } = getFootnoteNumbers(html)
  const unmatchedRef = refs.find((ref) => !targets.includes(ref))
  return unmatchedRef ?? Math.max(0, ...refs, ...targets) + 1
}

function getFootnoteNumbers(html: string) {
  const refs = Array.from(html.matchAll(/id=["']fnref-(\d+)["']/g), (match) => Number(match[1])).filter(Number.isFinite)
  const targets = Array.from(html.matchAll(/id=["']fn-(\d+)["']/g), (match) => Number(match[1])).filter(Number.isFinite)
  return {
    refs: Array.from(new Set(refs)).sort((a, b) => a - b),
    targets: Array.from(new Set(targets)).sort((a, b) => a - b),
  }
}

function unwrapElement(element: HTMLElement) {
  const parent = element.parentNode
  if (!parent) return
  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element)
  }
  parent.removeChild(element)
}

function Tool({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: LucideIcon
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-35 ${
        active
          ? 'bg-stone-950 text-white dark:bg-stone-100 dark:text-stone-950'
          : 'text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800'
      }`}
      aria-pressed={active}
      aria-label={label}
      title={label}
    >
      <Icon size={17} />
    </button>
  )
}

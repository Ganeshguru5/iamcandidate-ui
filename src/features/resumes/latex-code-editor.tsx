"use client"

import { useEffect, useImperativeHandle, useRef, type Ref } from "react"
import { StreamLanguage } from "@codemirror/language"
import { stex } from "@codemirror/legacy-modes/mode/stex"
import { EditorSelection, EditorState, Prec } from "@codemirror/state"
import { keymap } from "@codemirror/view"
import { basicSetup, EditorView } from "codemirror"

export interface LatexCodeEditorHandle {
  /** Moves the cursor to a 1-based line, scrolls it into view and focuses. */
  goToLine(line: number): void
}

/** Uses the app's design tokens so the editor follows light/dark mode. */
const appTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "13px",
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: "var(--font-mono, ui-monospace), monospace", lineHeight: "1.55" },
  ".cm-gutters": {
    backgroundColor: "var(--muted)",
    color: "var(--muted-foreground)",
    borderRight: "1px solid var(--border)",
  },
  ".cm-activeLine": { backgroundColor: "color-mix(in oklab, var(--muted) 60%, transparent)" },
  ".cm-activeLineGutter": { backgroundColor: "var(--accent)" },
  ".cm-cursor": { borderLeftColor: "var(--foreground)" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
    backgroundColor: "color-mix(in oklab, var(--brand) 25%, transparent) !important",
  },
})

/** CodeMirror 6 with LaTeX highlighting. Uncontrolled after mount: `value` seeds the document. */
export function LatexCodeEditor({
  value,
  onChange,
  onSave,
  ref,
}: {
  value: string
  onChange: (value: string) => void
  /** Ctrl/⌘ + S. */
  onSave: () => void
  ref?: Ref<LatexCodeEditorHandle>
}) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)
  const callbacks = useRef({ onChange, onSave })
  const initialValue = useRef(value)

  useEffect(() => {
    callbacks.current = { onChange, onSave }
  }, [onChange, onSave])

  useEffect(() => {
    if (!host.current) return
    const editor = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: initialValue.current,
        extensions: [
          basicSetup,
          StreamLanguage.define(stex),
          EditorView.lineWrapping,
          appTheme,
          Prec.highest(
            keymap.of([
              {
                key: "Mod-s",
                preventDefault: true,
                run: () => {
                  callbacks.current.onSave()
                  return true
                },
              },
            ]),
          ),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) callbacks.current.onChange(update.state.doc.toString())
          }),
        ],
      }),
    })
    view.current = editor
    return () => {
      editor.destroy()
      view.current = null
    }
  }, [])

  useImperativeHandle(ref, () => ({
    goToLine(line: number) {
      const editor = view.current
      if (!editor) return
      const target = editor.state.doc.line(Math.min(Math.max(line, 1), editor.state.doc.lines))
      editor.dispatch({
        selection: EditorSelection.range(target.from, target.to),
        effects: EditorView.scrollIntoView(target.from, { y: "center" }),
      })
      editor.focus()
    },
  }))

  return <div ref={host} className="h-full min-h-0 overflow-hidden" />
}

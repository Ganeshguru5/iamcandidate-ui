"use client"

import { useEffect, useRef, useState } from "react"
import {
  CheckIcon,
  CircleDotIcon,
  CloudOffIcon,
  CopyIcon,
  Loader2Icon,
  RefreshCwIcon,
  SaveIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { ErrorState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { isApiMode } from "@/lib/api/config"
import { boardService } from "@/lib/services"
import { QK, useBoard } from "@/lib/store/queries"
import { useLocalValue } from "@/lib/store/local-store"
import { setQueryData } from "@/lib/store/query"
import type { Board } from "@/lib/types"
import { timeAgo } from "@/lib/utils/dates"

/** Pause after the last keystroke before saving. */
const SAVE_DELAY_MS = 700
/** How often an idle pad checks for edits made on other systems. */
const POLL_MS = 15_000

type SaveState = "idle" | "saving" | "error"

export function BoardView() {
  const { data, isLoading, error, refetch } = useBoard()
  /** What you've typed and not yet saved; `null` follows the server copy. */
  const [draft, setDraft] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<SaveState>("idle")
  /** Off by default: changes wait for Save (or Ctrl/⌘ + S). Remembered per device. */
  const [autoSave, setAutoSave] = useLocalValue<boolean>("pos:board-autosave", false)
  const draftRef = useRef<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const text = draft ?? data?.content ?? ""
  const dirty = draft !== null

  const save = async () => {
    clearTimeout(timer.current)
    const content = draftRef.current
    if (content === null) return
    setSaveState("saving")
    try {
      const saved = await boardService.save(content)
      setQueryData<Board>(QK.board, () => saved)
      // Keep typing that happened while the request was in flight.
      if (draftRef.current === content) {
        draftRef.current = null
        setDraft(null)
      }
      setSaveState("idle")
    } catch {
      setSaveState("error")
    }
  }

  const change = (value: string) => {
    draftRef.current = value
    setDraft(value)
    clearTimeout(timer.current)
    if (autoSave) timer.current = setTimeout(() => void save(), SAVE_DELAY_MS)
  }

  const toggleAutoSave = (on: boolean) => {
    setAutoSave(on)
    if (on) void save()
    else clearTimeout(timer.current)
  }

  // Pull in edits from other systems while you aren't typing here.
  useEffect(() => {
    const pull = () => {
      if (document.visibilityState === "visible" && draftRef.current === null) void refetch()
    }
    const interval = setInterval(pull, POLL_MS)
    document.addEventListener("visibilitychange", pull)
    pull()
    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", pull)
    }
  }, [refetch])

  // Warn before leaving with unsaved text.
  useEffect(() => {
    if (!dirty) return
    const onLeave = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", onLeave)
    return () => window.removeEventListener("beforeunload", onLeave)
  }, [dirty])

  useEffect(() => () => clearTimeout(timer.current), [])

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Copied")
    } catch {
      toast.error("Couldn't copy to the clipboard")
    }
  }

  return (
    <div className="flex h-[calc(100dvh-8rem)] min-h-96 flex-col">
      <PageHeader
        title="Board"
        description="Type or paste anything. Once saved, it shows up on every system you sign in to."
        actions={
          <>
            <SaveStatus
              state={saveState}
              dirty={dirty}
              autoSave={autoSave}
              updatedAt={data?.updatedAt ?? null}
              onRetry={() => void save()}
            />
            <label className="flex items-center gap-2 px-1 text-sm">
              <Switch size="sm" checked={autoSave} onCheckedChange={toggleAutoSave} /> Auto-save
            </label>
            <Button variant="outline" size="sm" onClick={() => void copyAll()} disabled={!text}>
              <CopyIcon /> Copy all
            </Button>
            {!autoSave && (
              <Button size="sm" onClick={() => void save()} disabled={!dirty || saveState === "saving"}>
                {saveState === "saving" ? <Loader2Icon className="animate-spin" /> : <SaveIcon />} Save
              </Button>
            )}
          </>
        }
      />

      {!isApiMode && (
        <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <CloudOffIcon className="size-3.5 shrink-0" />
          Demo mode: the board stays in this browser. Connect knot to the API to sync it across systems.
        </p>
      )}

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : isLoading && !data ? (
        <Skeleton className="flex-1 rounded-xl" />
      ) : (
        <textarea
          value={text}
          onChange={(e) => change(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
              e.preventDefault()
              void save()
            }
          }}
          placeholder="Start typing…"
          aria-label="Board"
          spellCheck={false}
          autoComplete="off"
          autoFocus
          className="flex-1 resize-none rounded-xl border bg-card p-4 font-mono text-[13.5px] leading-6 outline-none placeholder:text-muted-foreground/60 focus-visible:border-foreground/20 sm:p-6"
        />
      )}
    </div>
  )
}

function SaveStatus({
  state,
  dirty,
  autoSave,
  updatedAt,
  onRetry,
}: {
  state: SaveState
  dirty: boolean
  autoSave: boolean
  updatedAt: string | null
  onRetry: () => void
}) {
  if (state === "error") {
    return (
      <Button variant="ghost" size="sm" onClick={onRetry} className="text-destructive">
        <TriangleAlertIcon /> Not saved · Retry
      </Button>
    )
  }
  if (dirty && !autoSave && state !== "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 px-1 text-xs text-amber-600 dark:text-amber-400">
        <CircleDotIcon className="size-3.5" /> Unsaved changes
      </span>
    )
  }
  const saving = state === "saving" || dirty
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-1 text-xs text-muted-foreground", saving && "animate-pulse")}>
      {saving ? (
        state === "saving" ? <Loader2Icon className="size-3.5 animate-spin" /> : <RefreshCwIcon className="size-3.5" />
      ) : (
        <CheckIcon className="size-3.5" />
      )}
      {saving ? "Saving…" : updatedAt ? `Saved ${timeAgo(updatedAt)}` : "Nothing saved yet"}
    </span>
  )
}

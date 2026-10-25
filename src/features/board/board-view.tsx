"use client"

import { useEffect, useState } from "react"
import {
  ClipboardPasteIcon,
  CloudIcon,
  CloudOffIcon,
  CodeIcon,
  CopyIcon,
  EllipsisIcon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  HashIcon,
  KeyRoundIcon,
  LinkIcon,
  LockIcon,
  LockOpenIcon,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  PlusIcon,
  RefreshCwIcon,
  Trash2Icon,
  TypeIcon,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { EmptyState, ErrorState } from "@/components/shared/empty-state"
import { ConfirmDialog, FilterChips, SearchInput } from "@/components/shared/misc"
import { PageHeader } from "@/components/shared/page-header"
import { ListSkeleton } from "@/components/shared/skeletons"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { isApiMode } from "@/lib/api/config"
import { lockVault, seal, unseal, useVault } from "@/lib/crypto/vault"
import { useBoard } from "@/lib/store/queries"
import type { BoardItem, BoardItemKind } from "@/lib/types"
import { timeAgo } from "@/lib/utils/dates"
import { matchesQuery } from "@/lib/utils/format"

import { BOARD_COLORS, BoardItemDialog, UnlockDialog } from "./board-dialogs"
import { useCreateBoardItem, useDeleteBoardItem, useToggleBoardPin } from "./hooks"

const KIND_ICONS: Record<BoardItemKind, LucideIcon> = {
  text: TypeIcon,
  code: CodeIcon,
  link: LinkIcon,
  secret: KeyRoundIcon,
}

type Filter = BoardItemKind | "all" | "pinned"

/** How long a revealed secret stays on screen. */
const REVEAL_MS = 30_000

async function copyText(text: string, what = "Copied") {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(what)
  } catch {
    toast.error("Couldn't copy to the clipboard")
  }
}

/** Picks a type and title for pasted text. */
function detect(text: string): { kind: BoardItemKind; title: string } {
  const value = text.trim()
  if (/^https?:\/\/\S+$/i.test(value)) {
    try {
      return { kind: "link", title: new URL(value).hostname.replace(/^www\./, "") }
    } catch {
      // Fall through to text.
    }
  }
  const firstLine = value.split("\n")[0]?.trim() ?? ""
  const title = firstLine.length > 60 ? `${firstLine.slice(0, 57)}…` : firstLine
  const looksLikeCode = value.includes("\n") && /[{};=<>$]|^\s{2,}\S/m.test(value)
  return { kind: looksLikeCode ? "code" : "text", title: title || "Untitled" }
}

export function BoardView() {
  const { data, isLoading, error, refetch } = useBoard()
  const { unlocked } = useVault()
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [editing, setEditing] = useState<BoardItem | null>(null)
  const [creating, setCreating] = useState(false)
  const [unlocking, setUnlocking] = useState(false)
  const [syncedAt, setSyncedAt] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const all = data ?? []
  const sample = all.find((item) => item.kind === "secret")?.content

  // Fetch fresh on open and whenever you come back to this tab, so changes
  // made on other systems show up without a reload.
  useEffect(() => {
    const sync = async () => {
      await refetch()
      setSyncedAt(new Date().toISOString())
    }
    const onVisible = () => {
      if (document.visibilityState === "visible") void sync()
    }
    void sync()
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [refetch])

  const refresh = async () => {
    setRefreshing(true)
    await refetch()
    setSyncedAt(new Date().toISOString())
    setRefreshing(false)
  }

  const counts = (kind: BoardItemKind) => all.filter((i) => i.kind === kind).length
  const list = all
    .filter((i) => filter === "all" || (filter === "pinned" ? i.pinned : i.kind === filter))
    .filter((i) => matchesQuery(query, i.title, i.kind === "secret" ? "" : i.content, ...i.tags))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt))

  return (
    <div>
      <PageHeader
        title="Board"
        description="Save anything once — snippets, links, keys — and pick it up on every system you sign in to."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => (unlocked ? lockVault() : setUnlocking(true))}
              aria-label={unlocked ? "Lock vault" : "Unlock vault"}
            >
              {unlocked ? <LockOpenIcon className="text-teal-600 dark:text-teal-400" /> : <LockIcon />}
              {unlocked ? "Unlocked" : "Locked"}
            </Button>
            <Button onClick={() => setCreating(true)}>
              <PlusIcon /> New item
            </Button>
          </>
        }
      />

      {!isApiMode && (
        <p className="mb-4 flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
          <CloudOffIcon className="size-3.5 shrink-0" />
          Demo mode: items stay in this browser. Connect knot to the API to sync them across systems.
        </p>
      )}

      <QuickAdd onNeedUnlock={() => setUnlocking(true)} />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : isLoading ? (
        <ListSkeleton rows={4} />
      ) : (
        <>
          <div className="mt-6 mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <FilterChips
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "All", count: all.length },
                { value: "pinned", label: "Pinned", count: all.filter((i) => i.pinned).length },
                { value: "text", label: "Text", count: counts("text") },
                { value: "code", label: "Code", count: counts("code") },
                { value: "link", label: "Links", count: counts("link") },
                { value: "secret", label: "Secrets", count: counts("secret") },
              ]}
            />
            <div className="flex items-center gap-2 sm:ml-auto">
              <SearchInput value={query} onChange={setQuery} placeholder="Search board…" />
              <Button variant="ghost" size="sm" onClick={refresh} disabled={refreshing} className="shrink-0 text-muted-foreground">
                {isApiMode ? <CloudIcon /> : <RefreshCwIcon />}
                <span className="hidden md:inline">{syncedAt ? `Synced ${timeAgo(syncedAt)}` : "Sync"}</span>
                <RefreshCwIcon className={cn("size-3", refreshing && "animate-spin")} />
              </Button>
            </div>
          </div>

          {all.length === 0 ? (
            <EmptyState
              icon={ClipboardPasteIcon}
              title="Your board is empty"
              description="Paste something above. It'll be waiting on your other systems."
            />
          ) : list.length === 0 ? (
            <p className="rounded-lg border border-dashed px-3 py-10 text-center text-sm text-muted-foreground">Nothing matches.</p>
          ) : (
            <div className="columns-1 gap-3 sm:columns-2 xl:columns-3">
              {list.map((item) => (
                <BoardCard key={item.id} item={item} onEdit={() => setEditing(item)} onNeedUnlock={() => setUnlocking(true)} />
              ))}
            </div>
          )}
        </>
      )}

      <BoardItemDialog
        key={editing?.id ?? "new"}
        open={creating || editing !== null}
        onOpenChange={(open) => {
          if (open) return
          setCreating(false)
          setEditing(null)
        }}
        item={editing ?? undefined}
        onNeedUnlock={() => setUnlocking(true)}
      />
      <UnlockDialog open={unlocking} onOpenChange={setUnlocking} sample={sample} />
    </div>
  )
}

/* ------------------------------------------------------------------ */

function QuickAdd({ onNeedUnlock }: { onNeedUnlock: () => void }) {
  const { unlocked } = useVault()
  const create = useCreateBoardItem()
  const [content, setContent] = useState("")
  const [title, setTitle] = useState("")
  const [secret, setSecret] = useState(false)

  const save = async () => {
    const value = content.trim()
    if (!value || create.isPending) return
    if (secret && !unlocked) return onNeedUnlock()
    const guess = detect(value)
    let stored = guess.kind === "link" ? value : content
    if (secret) {
      try {
        stored = await seal(content)
      } catch {
        return onNeedUnlock()
      }
    }
    const saved = await create.mutate({
      title: title.trim() || (secret ? "Secret" : guess.title),
      kind: secret ? "secret" : guess.kind,
      content: stored,
      tags: [],
      pinned: false,
      color: "default",
    })
    if (saved) {
      setContent("")
      setTitle("")
      setSecret(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card p-3 shadow-xs focus-within:border-foreground/20">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            void save()
          }
        }}
        rows={3}
        autoComplete="off"
        spellCheck={!secret}
        placeholder={secret ? "Paste the key, token or password…" : "Paste or type anything — text, a command, a link…"}
        aria-label="New board item"
        className={cn(
          "min-h-16 resize-none border-0 px-1 shadow-none focus-visible:ring-0 dark:bg-transparent",
          secret && "font-mono text-[13px] [-webkit-text-security:disc]",
        )}
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          aria-label="Title"
          className="h-7 w-full text-xs sm:w-56"
        />
        <Button
          type="button"
          variant={secret ? "secondary" : "ghost"}
          size="sm"
          aria-pressed={secret}
          onClick={() => setSecret(!secret)}
          className={cn(secret && "text-teal-700 dark:text-teal-300")}
        >
          <KeyRoundIcon /> Secret
        </Button>
        <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">Ctrl/⌘ + Enter</span>
        <Button size="sm" disabled={!content.trim() || create.isPending} onClick={() => void save()}>
          {secret && !unlocked ? <LockIcon /> : <PlusIcon />} Save
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function BoardCard({ item, onEdit, onNeedUnlock }: { item: BoardItem; onEdit: () => void; onNeedUnlock: () => void }) {
  const pin = useToggleBoardPin()
  const remove = useDeleteBoardItem()
  const [deleting, setDeleting] = useState(false)
  const Icon = KIND_ICONS[item.kind]

  const copy = async () => {
    if (item.kind !== "secret") return copyText(item.content)
    try {
      await copyText(await unseal(item.content), "Secret copied")
    } catch {
      onNeedUnlock()
    }
  }

  return (
    <article
      className={cn(
        "group mb-3 break-inside-avoid rounded-xl border bg-card p-3.5 transition-colors hover:border-foreground/15",
        item.color !== "default" && "border-l-[3px]",
        BOARD_COLORS[item.color].accent,
      )}
    >
      <header className="flex items-start gap-2">
        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium">{item.title}</h3>
          <p className="text-[11px] text-muted-foreground">Updated {timeAgo(item.updatedAt)}</p>
        </div>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={item.pinned ? "Unpin" : "Pin"}
            aria-pressed={item.pinned}
            onClick={() => void pin.mutate(item)}
            className={cn(!item.pinned && "opacity-0 group-hover:opacity-100 focus-visible:opacity-100")}
          >
            <PinIcon className={cn(item.pinned && "fill-current text-teal-600 dark:text-teal-400")} />
          </Button>
          <Button variant="ghost" size="icon-xs" aria-label="Copy" onClick={() => void copy()}>
            <CopyIcon />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label="Item actions" />}>
              <EllipsisIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={onEdit}>
                <PencilIcon /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void pin.mutate(item)}>
                {item.pinned ? <PinOffIcon /> : <PinIcon />} {item.pinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setDeleting(true)}>
                <Trash2Icon /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="mt-2.5">
        {item.kind === "secret" ? (
          <SecretValue envelope={item.content} onNeedUnlock={onNeedUnlock} />
        ) : item.kind === "link" ? (
          /^https?:\/\//i.test(item.content) ? (
            <a
              href={item.content}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex max-w-full items-center gap-1.5 text-sm text-teal-700 hover:underline dark:text-teal-300"
            >
              <span className="truncate">{item.content}</span>
              <ExternalLinkIcon className="size-3.5 shrink-0" />
            </a>
          ) : (
            <p className="truncate text-sm">{item.content}</p>
          )
        ) : item.kind === "code" ? (
          <pre className="max-h-64 overflow-auto rounded-lg bg-muted/60 p-2.5 font-mono text-xs leading-5">{item.content}</pre>
        ) : (
          <p className="line-clamp-[10] text-sm leading-6 whitespace-pre-wrap">{item.content}</p>
        )}
      </div>

      {item.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {item.tags.map((t) => (
            <span key={t} className="inline-flex h-5 items-center gap-0.5 rounded-md border px-1.5 text-[11px] text-muted-foreground">
              <HashIcon className="size-2.5" />
              {t}
            </span>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`Delete "${item.title}"?`}
        description="It will be removed from every synced system."
        onConfirm={async () => {
          await remove.mutate(item.id)
        }}
      />
    </article>
  )
}

function SecretValue({ envelope, onNeedUnlock }: { envelope: string; onNeedUnlock: () => void }) {
  const { unlocked } = useVault()
  const [revealed, setRevealed] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  // Locking the vault hides it straight away.
  const plain = unlocked ? revealed : null

  // Hide again after a while.
  useEffect(() => {
    if (revealed === null) return
    const timer = setTimeout(() => setRevealed(null), REVEAL_MS)
    return () => clearTimeout(timer)
  }, [revealed])

  const reveal = async () => {
    if (plain !== null) return setRevealed(null)
    if (!unlocked) return onNeedUnlock()
    try {
      setRevealed(await unseal(envelope))
      setFailed(false)
    } catch {
      setFailed(true)
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted/60 py-1.5 pr-1.5 pl-2.5">
      <code className={cn("min-w-0 flex-1 font-mono text-xs", plain === null ? "tracking-widest text-muted-foreground" : "break-all")}>
        {failed ? "Encrypted with a different passphrase" : plain ?? "••••••••••••••••"}
      </code>
      <Button variant="ghost" size="icon-xs" aria-label={plain === null ? "Reveal secret" : "Hide secret"} onClick={() => void reveal()}>
        {!unlocked ? <LockIcon /> : plain === null ? <EyeIcon /> : <EyeOffIcon />}
      </Button>
    </div>
  )
}

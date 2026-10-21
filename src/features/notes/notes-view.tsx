"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeftIcon,
  HashIcon,
  Loader2Icon,
  PlusIcon,
  SaveIcon,
  StarIcon,
  StickyNoteIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { cn } from "cn"

import { useAppDialogs } from "@/components/layout/app-dialogs"
import { EmptyState, ErrorState } from "@/components/shared/empty-state"
import { SimpleSelect } from "@/components/shared/form"
import { ConfirmDialog, SearchInput } from "@/components/shared/misc"
import { PageHeader } from "@/components/shared/page-header"
import { ListSkeleton } from "@/components/shared/skeletons"
import { OptionBadge } from "@/components/shared/tone-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { NOTE_CATEGORIES, noteCategory } from "@/lib/constants"
import { useNotes } from "@/lib/store/queries"
import type { Note, NoteCategory } from "@/lib/types"
import { timeAgo } from "@/lib/utils/dates"
import { matchesQuery } from "@/lib/utils/format"

import { useDeleteNote, useToggleNoteFavorite, useUpdateNote } from "./hooks"

export function NotesView() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const selectedId = params.get("note")
  const { openDialog } = useAppDialogs()
  const { data: notes, isLoading, error, refetch } = useNotes()
  const favorite = useToggleNoteFavorite()

  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<NoteCategory | "all">("all")
  const [tag, setTag] = useState<string | null>(null)
  const [favoritesOnly, setFavoritesOnly] = useState(false)

  const select = (id: string | null) =>
    router.replace(id ? `${pathname}?note=${id}` : pathname, { scroll: false })

  const all = notes ?? []
  const tags = [...new Set(all.flatMap((n) => n.tags))].sort()
  const list = all
    .filter((n) => category === "all" || n.category === category)
    .filter((n) => !tag || n.tags.includes(tag))
    .filter((n) => !favoritesOnly || n.favorite)
    .filter((n) => matchesQuery(query, n.title, n.content, ...n.tags))
    .sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt.localeCompare(a.updatedAt))
  const selected = all.find((n) => n.id === selectedId)

  return (
    <div>
      <PageHeader
        title="Notes"
        description="Your personal knowledge base — DSA, system design, career and everything in between."
        actions={
          <Button onClick={() => openDialog({ kind: "note" })}>
            <PlusIcon /> New note
          </Button>
        }
      />
      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : isLoading ? (
        <ListSkeleton rows={6} />
      ) : all.length === 0 ? (
        <EmptyState icon={StickyNoteIcon} title="No notes yet" action={<Button onClick={() => openDialog({ kind: "note" })}><PlusIcon /> New note</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[19rem_1fr]">
          <div className={cn("space-y-3", selected && "hidden lg:block")}>
            <SearchInput value={query} onChange={setQuery} placeholder="Search notes…" className="sm:w-full" />
            <div className="flex gap-2">
              <SimpleSelect
                value={category}
                onValueChange={(v) => setCategory(v as NoteCategory | "all")}
                options={[{ value: "all", label: "All categories" }, ...NOTE_CATEGORIES]}
                className="flex-1"
              />
              <Button
                variant={favoritesOnly ? "secondary" : "outline"}
                size="icon"
                aria-pressed={favoritesOnly}
                aria-label="Favorites only"
                onClick={() => setFavoritesOnly(!favoritesOnly)}
              >
                <StarIcon className={cn(favoritesOnly && "fill-amber-400 text-amber-400")} />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTag(tag === t ? null : t)}
                    className={cn(
                      "inline-flex h-6 items-center gap-0.5 rounded-md border px-1.5 text-xs transition-colors",
                      tag === t ? "border-foreground/20 bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <HashIcon className="size-3" />
                    {t}
                  </button>
                ))}
              </div>
            )}
            {list.length === 0 ? (
              <p className="rounded-lg border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">No notes match.</p>
            ) : (
              <ul className="space-y-1.5">
                {list.map((note) => (
                  <li key={note.id}>
                    <div
                      className={cn(
                        "group relative rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50",
                        selected?.id === note.id && "border-foreground/20 bg-muted/60",
                      )}
                    >
                      <button type="button" onClick={() => select(note.id)} className="block w-full pr-6 text-left">
                        <span className="block truncate text-sm font-medium">{note.title}</span>
                        <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{note.content}</span>
                        <span className="mt-2 flex items-center gap-2">
                          <OptionBadge option={noteCategory(note.category)} dot={false} />
                          <span className="text-[11px] text-muted-foreground">{timeAgo(note.updatedAt)}</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void favorite.mutate(note)}
                        aria-label={note.favorite ? "Remove from favorites" : "Add to favorites"}
                        aria-pressed={note.favorite}
                        className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-amber-500"
                      >
                        <StarIcon className={cn("size-4", note.favorite && "fill-amber-400 text-amber-400")} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={cn(!selected && "hidden lg:block")}>
            {selected ? (
              <NoteEditor key={selected.id} note={selected} onClose={() => select(null)} />
            ) : (
              <EmptyState className="h-full" icon={StickyNoteIcon} title="Select a note" description="Pick a note on the left or create a new one." />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NoteEditor({ note, onClose }: { note: Note; onClose: () => void }) {
  const update = useUpdateNote()
  const remove = useDeleteNote()
  const favorite = useToggleNoteFavorite()
  const [title, setTitle] = useState(note.title)
  const [category, setCategory] = useState<NoteCategory>(note.category)
  const [content, setContent] = useState(note.content)
  const [tags, setTags] = useState(note.tags)
  const [tagInput, setTagInput] = useState("")
  const [deleting, setDeleting] = useState(false)

  const dirty = title !== note.title || category !== note.category || content !== note.content || tags.join() !== note.tags.join()

  const save = () => {
    if (!dirty || update.isPending || !title.trim()) return
    void update.mutate(note.id, { title: title.trim(), category, content, tags })
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault()
        save()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  const words = content.trim() ? content.trim().split(/\s+/).length : 0

  return (
    <article className="flex min-h-[60dvh] flex-col rounded-xl border bg-card">
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2.5">
        <Button variant="ghost" size="sm" className="lg:hidden" onClick={onClose}>
          <ArrowLeftIcon /> Notes
        </Button>
        <SimpleSelect value={category} onValueChange={(v) => setCategory(v as NoteCategory)} options={NOTE_CATEGORIES} size="sm" className="w-40" />
        <span className="text-xs text-muted-foreground">
          {dirty ? "Unsaved changes" : `Saved ${timeAgo(note.updatedAt)}`} · {words} words
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label={note.favorite ? "Unfavorite" : "Favorite"} onClick={() => void favorite.mutate(note)}>
            <StarIcon className={cn(note.favorite && "fill-amber-400 text-amber-400")} />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Delete note" onClick={() => setDeleting(true)}>
            <Trash2Icon />
          </Button>
          <Button size="sm" disabled={!dirty || update.isPending || !title.trim()} onClick={save}>
            {update.isPending ? <Loader2Icon className="animate-spin" /> : <SaveIcon />} Save
          </Button>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-6">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          aria-label="Note title"
          className="h-auto border-0 px-0 text-xl font-semibold tracking-tight shadow-none focus-visible:ring-0 md:text-2xl dark:bg-transparent"
        />
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((t) => (
            <span key={t} className="inline-flex h-6 items-center gap-1 rounded-md border bg-muted/50 pr-1 pl-1.5 text-xs">
              <HashIcon className="size-3 text-muted-foreground" />
              {t}
              <button type="button" aria-label={`Remove tag ${t}`} onClick={() => setTags(tags.filter((x) => x !== t))} className="rounded p-0.5 text-muted-foreground hover:text-foreground">
                <XIcon className="size-3" />
              </button>
            </span>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const value = tagInput.trim().toLowerCase().replace(/\s+/g, "-")
              if (value && !tags.includes(value)) setTags([...tags, value])
              setTagInput("")
            }}
          >
            <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="+ tag" aria-label="Add tag" className="h-6 w-24 text-xs" />
          </form>
        </div>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing…"
          aria-label="Note content"
          className="min-h-[40dvh] flex-1 resize-none border-0 px-0 text-[15px] leading-7 shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        <p className="text-xs text-muted-foreground">Tip: press Ctrl/⌘ + S to save.</p>
      </div>
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`Delete "${note.title}"?`}
        onConfirm={async () => {
          await remove.mutate(note.id)
          onClose()
        }}
      />
    </article>
  )
}

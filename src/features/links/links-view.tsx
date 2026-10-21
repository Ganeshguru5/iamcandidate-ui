"use client"

import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import {
  BookmarkIcon,
  ExternalLinkIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react"
import { z } from "zod"
import { cn } from "cn"

import { EmptyState, ErrorState } from "@/components/shared/empty-state"
import { Field, parseTags, SimpleSelect } from "@/components/shared/form"
import { FormDialog } from "@/components/shared/form-dialog"
import { ConfirmDialog, FilterChips, SearchInput } from "@/components/shared/misc"
import { PageHeader } from "@/components/shared/page-header"
import { CardGridSkeleton } from "@/components/shared/skeletons"
import { OptionBadge, Tag } from "@/components/shared/tone-badge"
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
import { LINK_CATEGORIES, linkCategory } from "@/lib/constants"
import { bookmarkService } from "@/lib/services"
import { createCrudHooks } from "@/lib/store/crud-hooks"
import { QK, useBookmarks } from "@/lib/store/queries"
import { setQueryData } from "@/lib/store/query"
import type { Bookmark, LinkCategory } from "@/lib/types"
import { hostname, matchesQuery } from "@/lib/utils/format"
import { zodResolver } from "@/lib/utils/zod-resolver"

const bookmarkHooks = createCrudHooks(bookmarkService, QK.bookmarks, "Link")

export function LinksView() {
  const { data: bookmarks, isLoading, error, refetch } = useBookmarks()
  const update = bookmarkHooks.useUpdate({ silent: true })
  const remove = bookmarkHooks.useDelete()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<LinkCategory | "all" | "favorites">("all")
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Bookmark | null>(null)
  const [deleting, setDeleting] = useState<Bookmark | null>(null)

  const all = bookmarks ?? []
  const list = all
    .filter((b) => (category === "all" ? true : category === "favorites" ? b.favorite : b.category === category))
    .filter((b) => matchesQuery(query, b.title, b.url, b.description, ...b.tags))
    .sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.createdAt.localeCompare(a.createdAt))

  const toggleFavorite = (bookmark: Bookmark) => {
    setQueryData<Bookmark[]>(QK.bookmarks, (prev) => prev.map((b) => (b.id === bookmark.id ? { ...b, favorite: !b.favorite } : b)))
    void update.mutate(bookmark.id, { favorite: !bookmark.favorite })
  }

  return (
    <div>
      <PageHeader
        title="Links"
        description="Bookmarks for job boards, docs, tools and learning resources."
        actions={
          <Button onClick={() => setCreating(true)}>
            <PlusIcon /> Add link
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Search title, URL, tags…" />
          <FilterChips
            value={category}
            onChange={setCategory}
            options={[
              { value: "all", label: "All", count: all.length },
              { value: "favorites", label: "★ Favorites", count: all.filter((b) => b.favorite).length },
              ...LINK_CATEGORIES.map((c) => ({ value: c.value, label: c.label, count: all.filter((b) => b.category === c.value).length })),
            ]}
          />
        </div>
      </PageHeader>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : isLoading ? (
        <CardGridSkeleton />
      ) : list.length === 0 ? (
        <EmptyState icon={BookmarkIcon} title={query ? "No links match" : "No links here"} action={<Button onClick={() => setCreating(true)}><PlusIcon /> Add link</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((bookmark) => (
            <article key={bookmark.id} className="group flex flex-col rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-sm font-semibold uppercase text-muted-foreground">
                  {hostname(bookmark.url).charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <a href={bookmark.url} target="_blank" rel="noreferrer" className="line-clamp-1 text-sm font-medium hover:underline">
                    {bookmark.title}
                  </a>
                  <p className="truncate text-xs text-muted-foreground">{hostname(bookmark.url)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFavorite(bookmark)}
                  aria-label={bookmark.favorite ? "Remove favorite" : "Mark favorite"}
                  aria-pressed={bookmark.favorite}
                  className="p-0.5 text-muted-foreground hover:text-amber-500"
                >
                  <StarIcon className={cn("size-4", bookmark.favorite && "fill-amber-400 text-amber-400")} />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label={`Actions for ${bookmark.title}`} />}>
                    <MoreHorizontalIcon />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem render={<a href={bookmark.url} target="_blank" rel="noreferrer" />}>
                      <ExternalLinkIcon /> Open
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditing(bookmark)}>
                      <PencilIcon /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => setDeleting(bookmark)}>
                      <Trash2Icon /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {bookmark.description && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{bookmark.description}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-1">
                <OptionBadge option={linkCategory(bookmark.category)} dot={false} />
                {bookmark.tags.map((t) => (
                  <Tag key={t}>#{t}</Tag>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      {creating && <LinkFormDialog open onOpenChange={setCreating} />}
      {editing && <LinkFormDialog key={editing.id} open bookmark={editing} onOpenChange={(o) => !o && setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete "${deleting?.title}"?`}
        onConfirm={async () => {
          if (deleting) await remove.mutate(deleting.id)
        }}
      />
    </div>
  )
}

const schema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  url: z.url("Enter a valid URL"),
  description: z.string(),
  category: z.enum(["jobs", "learning", "tools", "documentation", "career", "projects", "resources"]),
  tags: z.string(),
  favorite: z.boolean(),
})

type FormValues = z.infer<typeof schema>

function LinkFormDialog({ open, onOpenChange, bookmark }: { open: boolean; onOpenChange: (open: boolean) => void; bookmark?: Bookmark }) {
  const create = bookmarkHooks.useCreate()
  const update = bookmarkHooks.useUpdate()
  const { register, control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: bookmark?.title ?? "",
      url: bookmark?.url ?? "",
      description: bookmark?.description ?? "",
      category: bookmark?.category ?? "resources",
      tags: bookmark?.tags.join(", ") ?? "",
      favorite: bookmark?.favorite ?? false,
    },
  })
  const errors = formState.errors
  const onSubmit = handleSubmit(async (values) => {
    const input = { ...values, tags: parseTags(values.tags) }
    const result = bookmark ? await update.mutate(bookmark.id, input) : await create.mutate(input)
    if (result) onOpenChange(false)
  })
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={bookmark ? "Edit link" : "Add link"}
      submitLabel={bookmark ? "Save" : "Add link"}
      pending={create.isPending || update.isPending}
      onSubmit={onSubmit}
    >
      <Field label="URL" htmlFor="ln-url" error={errors.url?.message}>
        <Input id="ln-url" placeholder="https://…" aria-invalid={!!errors.url} {...register("url")} />
      </Field>
      <Field label="Title" htmlFor="ln-title" error={errors.title?.message}>
        <Input id="ln-title" aria-invalid={!!errors.title} {...register("title")} />
      </Field>
      <Field label="Description" htmlFor="ln-desc">
        <Textarea id="ln-desc" rows={2} {...register("description")} />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Category">
          <Controller control={control} name="category" render={({ field }) => <SimpleSelect value={field.value} onValueChange={field.onChange} options={LINK_CATEGORIES} />} />
        </Field>
        <Field label="Tags" htmlFor="ln-tags" hint="Comma separated">
          <Input id="ln-tags" {...register("tags")} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-[var(--brand)]" {...register("favorite")} /> Mark as favorite
      </label>
    </FormDialog>
  )
}

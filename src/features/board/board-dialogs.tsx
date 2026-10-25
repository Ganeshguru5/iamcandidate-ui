"use client"

import { useEffect, useState } from "react"
import { EyeIcon, EyeOffIcon, LockIcon } from "lucide-react"
import { cn } from "cn"

import { Field, parseTags, SimpleSelect } from "@/components/shared/form"
import { FormDialog } from "@/components/shared/form-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { seal, unlockVault, unseal, useVault } from "@/lib/crypto/vault"
import type { BoardColor, BoardItem, BoardItemKind } from "@/lib/types"

import { useCreateBoardItem, useUpdateBoardItem } from "./hooks"

export const BOARD_KINDS: ReadonlyArray<{ value: BoardItemKind; label: string }> = [
  { value: "text", label: "Text" },
  { value: "code", label: "Code" },
  { value: "link", label: "Link" },
  { value: "secret", label: "Secret" },
]

export const BOARD_COLORS: Record<BoardColor, { label: string; swatch: string; accent: string }> = {
  default: { label: "None", swatch: "bg-muted-foreground/30", accent: "" },
  teal: { label: "Teal", swatch: "bg-teal-500", accent: "border-l-teal-500" },
  amber: { label: "Amber", swatch: "bg-amber-500", accent: "border-l-amber-500" },
  blue: { label: "Blue", swatch: "bg-blue-500", accent: "border-l-blue-500" },
  rose: { label: "Rose", swatch: "bg-rose-500", accent: "border-l-rose-500" },
  violet: { label: "Violet", swatch: "bg-violet-500", accent: "border-l-violet-500" },
}

/* ------------------------------------------------------------------ */

export function UnlockDialog({
  open,
  onOpenChange,
  sample,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** An existing secret to check the passphrase against; none means first-time setup. */
  sample?: string
}) {
  const [passphrase, setPassphrase] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)
  const firstTime = !sample

  /** Clears what was typed whenever the dialog closes. */
  const close = (next: boolean) => {
    if (!next) {
      setPassphrase("")
      setConfirm("")
      setError(undefined)
    }
    onOpenChange(next)
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (passphrase.length < 8) return setError("Use at least 8 characters")
    if (firstTime && passphrase !== confirm) return setError("Passphrases don't match")
    setPending(true)
    const ok = await unlockVault(passphrase, sample)
    setPending(false)
    if (!ok) return setError("Wrong passphrase")
    close(false)
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={close}
      size="sm"
      title={firstTime ? "Set a vault passphrase" : "Unlock vault"}
      description={
        firstTime
          ? "Secrets are encrypted on this device with this passphrase before they sync. Use the same one on every system."
          : "Enter the passphrase you use for board secrets."
      }
      submitLabel={firstTime ? "Set passphrase" : "Unlock"}
      pendingLabel="Checking…"
      pending={pending}
      onSubmit={submit}
    >
      <Field label="Passphrase" htmlFor="vault-pass" error={firstTime ? undefined : error}>
        <Input
          id="vault-pass"
          type="password"
          autoComplete="off"
          autoFocus
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
        />
      </Field>
      {firstTime && (
        <Field label="Confirm passphrase" htmlFor="vault-confirm" error={error}>
          <Input
            id="vault-confirm"
            type="password"
            autoComplete="off"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
      )}
      {firstTime && (
        <p className="text-xs text-muted-foreground">
          knot never sees this passphrase, so it can&apos;t be recovered. If you forget it, the secrets can&apos;t be read.
        </p>
      )}
    </FormDialog>
  )
}

/* ------------------------------------------------------------------ */

/** Remount with a new `key` per item so the form starts from that item's values. */
export function BoardItemDialog({
  open,
  onOpenChange,
  item,
  onNeedUnlock,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Edits this item; creates a new one when absent. */
  item?: BoardItem
  onNeedUnlock: () => void
}) {
  const { unlocked } = useVault()
  const create = useCreateBoardItem()
  const update = useUpdateBoardItem()
  const [title, setTitle] = useState(item?.title ?? "")
  const [kind, setKind] = useState<BoardItemKind>(item?.kind ?? "text")
  const [content, setContent] = useState(item?.kind === "secret" ? "" : (item?.content ?? ""))
  const [tags, setTags] = useState(item?.tags.join(", ") ?? "")
  const [color, setColor] = useState<BoardColor>(item?.color ?? "default")
  const [pinned, setPinned] = useState(item?.pinned ?? false)
  const [showSecret, setShowSecret] = useState(false)
  const [error, setError] = useState<string>()
  const [sealing, setSealing] = useState(false)

  // Decrypt an existing secret into the form once the vault is open.
  useEffect(() => {
    if (item?.kind !== "secret" || !unlocked) return
    unseal(item.content).then(setContent, () => setError("This secret was encrypted with a different passphrase"))
  }, [item, unlocked])

  const lockedSecret = kind === "secret" && !unlocked
  const pending = create.isPending || update.isPending || sealing

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (lockedSecret) return onNeedUnlock()
    if (!title.trim()) return setError("Give it a title")
    if (!content.trim()) return setError("Nothing to save yet")
    if (kind === "link" && !/^https?:\/\//i.test(content.trim())) return setError("Links must start with http:// or https://")
    setSealing(true)
    let stored = content
    try {
      if (kind === "secret") stored = await seal(content)
      else if (kind === "link") stored = content.trim()
    } catch {
      setSealing(false)
      return onNeedUnlock()
    }
    setSealing(false)
    const input = { title: title.trim(), kind, content: stored, tags: parseTags(tags), color, pinned }
    const saved = item ? await update.mutate(item.id, input) : await create.mutate(input)
    if (saved) onOpenChange(false)
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={item ? "Edit item" : "New board item"}
      submitLabel={lockedSecret ? "Unlock to save" : item ? "Save" : "Add to board"}
      pending={pending}
      onSubmit={submit}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_10rem]">
        <Field label="Title" htmlFor="board-title">
          <Input id="board-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. OpenAI key, Wi-Fi password, deploy script" />
        </Field>
        <Field label="Type" htmlFor="board-kind">
          <SimpleSelect id="board-kind" value={kind} onValueChange={(v) => setKind(v as BoardItemKind)} options={BOARD_KINDS} />
        </Field>
      </div>

      <Field
        label={kind === "secret" ? "Secret value" : kind === "link" ? "URL" : "Content"}
        htmlFor="board-content"
        error={error}
        hint={kind === "secret" ? "Encrypted on this device before it syncs" : undefined}
      >
        {lockedSecret ? (
          <button
            type="button"
            onClick={onNeedUnlock}
            className="flex h-24 items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-muted-foreground hover:bg-muted/50"
          >
            <LockIcon className="size-4" /> Unlock the vault to {item ? "view and edit" : "add"} this secret
          </button>
        ) : kind === "link" ? (
          <Input id="board-content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="https://" />
        ) : (
          <div className="relative">
            <Textarea
              id="board-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={kind === "text" ? 6 : 8}
              spellCheck={kind === "text"}
              autoComplete="off"
              className={cn(
                "max-h-[50dvh]",
                kind !== "text" && "font-mono text-[13px]",
                kind === "secret" && !showSecret && "[-webkit-text-security:disc]",
              )}
            />
            {kind === "secret" && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="absolute top-1.5 right-1.5"
                aria-label={showSecret ? "Hide secret" : "Show secret"}
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? <EyeOffIcon /> : <EyeIcon />}
              </Button>
            )}
          </div>
        )}
      </Field>

      <Field label="Tags" htmlFor="board-tags" hint="Comma separated">
        <Input id="board-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="work, laptop" />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2" role="radiogroup" aria-label="Color">
          {(Object.keys(BOARD_COLORS) as BoardColor[]).map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              aria-label={BOARD_COLORS[c].label}
              onClick={() => setColor(c)}
              className={cn(
                "size-5 rounded-full ring-offset-2 ring-offset-background transition",
                BOARD_COLORS[c].swatch,
                color === c && "ring-2 ring-foreground/60",
              )}
            />
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={pinned} onCheckedChange={setPinned} /> Pin to top
        </label>
      </div>
    </FormDialog>
  )
}

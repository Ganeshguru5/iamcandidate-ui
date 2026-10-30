"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ClipboardPasteIcon, Link2Icon, SendHorizontalIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { applicationService, contactService } from "@/lib/services"
import { SESSION_PENDING, useSession } from "@/lib/store/session"
import type { ContactExtraction, ExtractedContact, JobExtraction } from "@/lib/types"
import { createId } from "@/lib/utils/id"

import { chatStore, useChatItems, type CardItem, type ChatItem } from "./chat-store"
import { ContactReviewCard } from "./contact-review-card"
import { JobReviewCard } from "./job-review-card"
import { Bubble } from "./link-card"
import { looksLikeJobText, parseJobText } from "./job-text"
import { findEmails, findLinks, linkKind, MAX_LINKS, siteOfLink, withoutLinks } from "./links"

const SITES = "LinkedIn, Greenhouse, Lever, Ashby, Workday, Naukri, Indeed and most company career pages"

const emptyContact = (overrides: Partial<ExtractedContact> = {}): ExtractedContact => ({
  name: "",
  role: "",
  company: "",
  location: "",
  email: "",
  phone: "",
  linkedin: "",
  website: "",
  about: "",
  ...overrides,
})

/** "priya.raman@acme.com" → "Priya Raman" (a guess to edit). */
const nameFromEmail = (email: string) =>
  (email.split("@")[0] ?? "")
    .replace(/\d+/g, "")
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()

/** Paste job or profile links (or emails); each is read, reviewed and saved as an application or contact. */
export function JobChatView() {
  const session = useSession()
  const owner = session && session !== SESSION_PENDING ? session.userId : ""
  const items = useChatItems(owner)
  const [text, setText] = useState("")
  const endRef = useRef<HTMLDivElement>(null)
  const lastCount = useRef(items.length)

  // Follow the conversation as messages arrive (not on edits inside a card).
  useEffect(() => {
    if (items.length > lastCount.current) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    lastCount.current = items.length
  }, [items.length])

  const read = (item: Pick<CardItem, "id" | "type" | "url">) => {
    const { id, url } = item
    chatStore.update(owner, id, { status: "loading", error: undefined })
    const request: Promise<JobExtraction | ContactExtraction> =
      item.type === "contact" ? contactService.extractFromLink(url) : applicationService.extractFromLink(url)
    request
      .then((extraction) => chatStore.update(owner, id, { status: "ready", extraction }))
      .catch((error: unknown) =>
        chatStore.update(owner, id, {
          status: "error",
          error: error instanceof Error ? error.message : "Something went wrong",
        }),
      )
  }

  const send = (message = text) => {
    const trimmed = message.trim()
    if (!trimmed || !owner) return
    setText("")
    const links = findLinks(trimmed)
    // A pasted posting (e.g. copied off Naukri, which can't be fetched): one job card,
    // with the posting's link, if one came along, kept as its job link.
    if (looksLikeJobText(withoutLinks(trimmed))) {
      const url = links.find((link) => linkKind(link) === "job") ?? ""
      const site = siteOfLink(url)
      const job = parseJobText(withoutLinks(trimmed))
      chatStore.add(
        owner,
        { id: createId("msg"), type: "user", text: trimmed },
        {
          id: createId("job"),
          type: "job",
          url,
          status: "ready",
          extraction: {
            url,
            kind: job.role ? "job" : "unknown",
            site,
            via: "text",
            job: { ...job, jobUrl: url, source: site },
          },
        },
      )
      return
    }
    const emails = findEmails(trimmed)
    const replies: ChatItem[] = []
    if (!links.length && !emails.length) {
      replies.push({
        id: createId("msg"),
        type: "reply",
        text: "I didn't find a link in that. Paste a job posting or a LinkedIn / GitHub profile link, or an email address.",
      })
    } else if (links.length + emails.length > MAX_LINKS) {
      replies.push({
        id: createId("msg"),
        type: "reply",
        text: `That's ${links.length + emails.length} items — I'll take the first ${MAX_LINKS}. Send the rest in another message.`,
      })
    }
    const cards: CardItem[] = links.map((url) => {
      const type = linkKind(url)
      return { id: createId(type === "job" ? "job" : "person"), type, url, status: "loading" }
    })
    // Typed emails need no lookup: straight to a contact card.
    for (const email of emails) {
      cards.push({
        id: createId("person"),
        type: "contact",
        url: `mailto:${email}`,
        status: "ready",
        extraction: {
          url: `mailto:${email}`,
          kind: "unknown",
          site: "",
          contact: emptyContact({ email, name: nameFromEmail(email) }),
        },
      })
    }
    const accepted = cards.slice(0, MAX_LINKS)
    chatStore.add(owner, { id: createId("msg"), type: "user", text: trimmed }, ...replies, ...accepted)
    for (const card of accepted) if (card.status === "loading") read(card)
  }

  // Shared in: "Share → iamcandidate" on Android, or an iOS Shortcut opening
  // /career/chat?url=…. Sent once, then the URL is cleaned so a reload doesn't resend.
  const params = useSearchParams()
  const router = useRouter()
  const shared = useRef("")
  useEffect(() => {
    const url = params.get("url")?.trim() ?? ""
    const sharedText = params.get("text")?.trim() ?? ""
    if (!url && !sharedText) {
      shared.current = ""
      return
    }
    if (!owner) return
    const key = `${url}\n${sharedText}`
    if (shared.current === key) return
    shared.current = key
    // Android often puts the link in `text`; `title` is just the page's name.
    send([sharedText, url && !sharedText.includes(url) ? url : ""].filter(Boolean).join("\n"))
    router.replace("/career/chat")
    // `send` is recreated each render; this runs once per shared link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner, params, router])

  const pasteFromClipboard = async () => {
    try {
      const clip = await navigator.clipboard.readText()
      if (clip.trim()) send(clip)
      else toast.info("Your clipboard is empty")
    } catch {
      toast.error("Couldn't read the clipboard", { description: "Paste it into the message box instead." })
    }
  }

  const fillManually = (item: CardItem) => {
    const extraction: JobExtraction | ContactExtraction =
      item.type === "contact"
        ? {
            url: item.url,
            kind: "unknown",
            site: "",
            contact: emptyContact(item.url.includes("linkedin.com") ? { linkedin: item.url } : { website: item.url }),
          }
        : {
            url: item.url,
            kind: "unknown",
            site: "",
            via: "page",
            job: {
              role: "",
              company: "",
              location: "",
              workMode: "",
              salary: "",
              jobId: "",
              jobUrl: item.url,
              source: "",
              description: "",
            },
          }
    chatStore.update(owner, item.id, { status: "ready", extraction, error: undefined })
  }

  return (
    // Fills the screen between the top bar and the tab bar / home indicator
    // (main's top padding included, its bottom padding cancelled) so the
    // composer rests at the bottom even before there are messages.
    <div className="mx-auto -mb-6 flex min-h-[calc(100dvh-3.25rem-1px-env(safe-area-inset-top)-max(var(--bottom-nav),env(safe-area-inset-bottom))-1.5rem)] w-full max-w-3xl flex-col lg:-mb-8 lg:min-h-[calc(100dvh-3.25rem-1px-env(safe-area-inset-top)-max(var(--bottom-nav),env(safe-area-inset-bottom))-2rem)]">
      <PageHeader
        title="Chat"
        description="Paste a job or profile link. iamcandidate reads it, you check the details, and it's saved to Applications or Contacts."
        actions={
          items.length > 0 && (
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => chatStore.clear()}>
              <Trash2Icon /> Clear chat
            </Button>
          )
        }
      />

      <div className="flex-1 space-y-4 pb-4" aria-live="polite">
        <Bubble>
          <div className="flex gap-2.5">
            <Link2Icon className="mt-0.5 size-4 shrink-0 text-brand" />
            <div className="space-y-1.5 text-sm">
              <p>Send me a job link — or a few at once — and I&apos;ll pull out the role, company, location, salary and description.</p>
              <p className="text-muted-foreground">Works with {SITES}.</p>
              <p>If a site won&apos;t let me read a link, copy the job&apos;s text from the page and paste it here instead.</p>
              <p>
                Paste a LinkedIn or GitHub profile link, or an email address, and I&apos;ll add the person to your
                contacts.
              </p>
            </div>
          </div>
        </Bubble>

        {items.map((item) =>
          item.type === "user" ? (
            <div key={item.id} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-sm break-words whitespace-pre-wrap text-primary-foreground">
                {item.text}
              </p>
            </div>
          ) : item.type === "reply" ? (
            <Bubble key={item.id}>
              <p className="text-sm">{item.text}</p>
            </Bubble>
          ) : item.type === "contact" ? (
            <ContactReviewCard
              key={item.id}
              item={item}
              onRetry={() => read(item)}
              onFillManually={() => fillManually(item)}
              onDismiss={() => chatStore.remove(owner, item.id)}
              onSaved={(savedId, savedTitle) => chatStore.update(owner, item.id, { savedId, savedTitle })}
            />
          ) : (
            <JobReviewCard
              key={item.id}
              item={item}
              onRetry={() => read(item)}
              onFillManually={() => fillManually(item)}
              onDismiss={() => chatStore.remove(owner, item.id)}
              onSaved={(savedId, savedTitle) => chatStore.update(owner, item.id, { savedId, savedTitle })}
            />
          ),
        )}
        <div ref={endRef} />
      </div>

      {/* Composer: stays just above the tab bar (or the home indicator). */}
      <form
        className="sticky bottom-[var(--bottom-nav)] -mx-4 bg-linear-to-t from-background from-70% to-transparent px-4 pt-4 pb-[max(0.75rem,calc(env(safe-area-inset-bottom)-var(--bottom-nav)))] sm:mx-0 sm:px-0"
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
      >
        <div className="flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-sm">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={pasteFromClipboard}
            aria-label="Paste link from clipboard"
            title="Paste from clipboard"
          >
            <ClipboardPasteIcon />
          </Button>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                send()
              }
            }}
            placeholder="Paste a job or profile link, or a job's text…"
            rows={1}
            enterKeyHint="send"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Message"
            className="max-h-40 min-h-9 resize-none border-0 bg-transparent py-2 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <Button type="submit" size="icon" className="shrink-0" disabled={!text.trim()} aria-label="Send">
            <SendHorizontalIcon />
          </Button>
        </div>
      </form>
    </div>
  )
}

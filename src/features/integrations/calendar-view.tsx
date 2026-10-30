"use client"

import { useState } from "react"
import { CalendarCheckIcon, CalendarClockIcon, CheckSquareIcon, Loader2Icon, RefreshCwIcon, UnplugIcon, UsersIcon } from "lucide-react"
import { toast } from "sonner"

import { ErrorState } from "@/components/shared/empty-state"
import { DetailList, DetailRow, Panel } from "@/components/shared/panel"
import { ListSkeleton } from "@/components/shared/skeletons"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { isApiMode } from "@/lib/api/config"
import { integrationsApi } from "@/lib/services/api/integrations"
import { QK } from "@/lib/store/queries"
import { invalidateQueries, setQueryData, useMutation } from "@/lib/store/query"
import type { GoogleCalendarStatus } from "@/lib/types"
import { formatDate, timeAgo } from "@/lib/utils/dates"

import { ApiOnlyNotice, IntegrationPageHeader, IQK, useCalendarStatus } from "./integration-page"

const WHAT_SYNCS = [
  { icon: CalendarClockIcon, title: "Scheduled interviews", detail: "At their time, with the meeting link and interviewers." },
  { icon: UsersIcon, title: "Follow-ups", detail: "Application, contact and open referral follow-up dates, as all-day events." },
  { icon: CheckSquareIcon, title: "Task due dates", detail: "Open tasks with a due date, as all-day events." },
]

export function CalendarView() {
  if (!isApiMode) {
    return (
      <>
        <IntegrationPageHeader id="google_calendar" title="Google Calendar" description="Put interviews, follow-ups and task due dates on your Google Calendar." />
        <ApiOnlyNotice name="Google Calendar" />
      </>
    )
  }
  return <CalendarConnected />
}

function CalendarConnected() {
  const { data: status, isLoading, error, refetch } = useCalendarStatus()
  const [redirecting, setRedirecting] = useState(false)
  const [disconnectOpen, setDisconnectOpen] = useState(false)

  const update = (next: GoogleCalendarStatus) => {
    setQueryData<GoogleCalendarStatus>(IQK.calendar, () => next)
    invalidateQueries(QK.integrations)
  }

  const sync = useMutation(() => integrationsApi.calendar.sync(), {
    onSuccess: update,
    success: (s) => `Calendar synced — ${s.lastSync?.synced ?? 0} events up to date`,
    error: "Sync failed",
  })

  const connect = async () => {
    setRedirecting(true)
    try {
      window.location.assign(await integrationsApi.calendar.authUrl())
    } catch (caught) {
      setRedirecting(false)
      toast.error("Couldn't start Google sign-in", { description: caught instanceof Error ? caught.message : undefined })
    }
  }

  return (
    <div>
      <IntegrationPageHeader
        id="google_calendar"
        title="Google Calendar"
        description="Put interviews, follow-ups and task due dates on your Google Calendar. Sync again any time; events are updated, never duplicated."
        connected={status?.connected}
        actions={
          status?.connected ? (
            <>
              <Button variant="outline" onClick={() => setDisconnectOpen(true)}>
                <UnplugIcon /> Disconnect
              </Button>
              <Button disabled={sync.isPending} onClick={() => void sync.mutate()}>
                {sync.isPending ? <Loader2Icon className="animate-spin" /> : <RefreshCwIcon />}
                {sync.isPending ? "Syncing…" : "Sync now"}
              </Button>
            </>
          ) : undefined
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : isLoading || !status ? (
        <ListSkeleton rows={3} />
      ) : !status.connected ? (
        <Panel>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Connect your Google account</p>
              <p className="mt-1 text-sm text-muted-foreground">
                iamcandidate asks only to manage calendar events. It can&apos;t read your email or Drive through this connection.
              </p>
              {!status.available && (
                <p className="mt-2 text-sm text-destructive">
                  Google sign-in isn&apos;t configured on the server yet (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET).
                </p>
              )}
            </div>
            <Button disabled={!status.available || redirecting} onClick={() => void connect()}>
              {redirecting ? <Loader2Icon className="animate-spin" /> : <CalendarCheckIcon />}
              Continue to Google
            </Button>
          </div>
        </Panel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
          <Panel title="Last sync">
            {status.lastSync && status.lastSyncedAt ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat label="Interviews" value={status.lastSync.interviews} />
                <Stat label="Follow-ups" value={status.lastSync.followUps} />
                <Stat label="Tasks" value={status.lastSync.tasks} />
                <Stat label="Removed" value={status.lastSync.removed} />
                <p className="col-span-full text-xs text-muted-foreground">
                  {timeAgo(status.lastSyncedAt)} · {status.lastSync.synced} event{status.lastSync.synced === 1 ? "" : "s"} on your calendar
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing synced yet. Click Sync now to add your upcoming interviews and follow-ups.</p>
            )}
          </Panel>
          <Panel title="Account">
            <DetailList>
              <DetailRow label="Google account">{status.account}</DetailRow>
              {status.connectedAt && <DetailRow label="Connected">{formatDate(status.connectedAt, true)}</DetailRow>}
              <DetailRow label="Calendar">Primary</DetailRow>
            </DetailList>
          </Panel>
        </div>
      )}

      <Panel title="What gets synced" className="mt-4">
        <ul className="grid gap-4 sm:grid-cols-3">
          {WHAT_SYNCS.map(({ icon: Icon, title, detail }) => (
            <li key={title} className="flex gap-3">
              <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground">{detail}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          Past items, cancelled interviews, done tasks and closed referrals are removed from your calendar on the next sync. Edit details in iamcandidate: changes made in Google Calendar are overwritten.
        </p>
      </Panel>

      {disconnectOpen && <DisconnectDialog onClose={() => setDisconnectOpen(false)} onDone={update} />}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function DisconnectDialog({ onClose, onDone }: { onClose: () => void; onDone: (s: GoogleCalendarStatus) => void }) {
  const [removeEvents, setRemoveEvents] = useState(true)
  const disconnect = useMutation((remove: boolean) => integrationsApi.calendar.disconnect(remove), {
    onSuccess: onDone,
    success: "Google Calendar disconnected",
    error: "Couldn't disconnect",
  })
  return (
    <Dialog open onOpenChange={(open) => !open && !disconnect.isPending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Disconnect Google Calendar?</DialogTitle>
          <DialogDescription>iamcandidate will stop updating your calendar and its access will be revoked.</DialogDescription>
        </DialogHeader>
        <Label className="flex items-start gap-2 text-sm font-normal">
          <Checkbox checked={removeEvents} onCheckedChange={(checked) => setRemoveEvents(checked === true)} />
          Also remove the events iamcandidate added to my calendar
        </Label>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={disconnect.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={disconnect.isPending}
            onClick={async () => {
              if (await disconnect.mutate(removeEvents)) onClose()
            }}
          >
            {disconnect.isPending && <Loader2Icon className="animate-spin" />} Disconnect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

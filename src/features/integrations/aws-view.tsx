"use client"

import { useState } from "react"
import { ArchiveIcon, CheckIcon, CopyIcon, DatabaseBackupIcon, Loader2Icon, PencilIcon, UnplugIcon } from "lucide-react"
import { toast } from "sonner"

import { ErrorState } from "@/components/shared/empty-state"
import { Field } from "@/components/shared/form"
import { ConfirmDialog } from "@/components/shared/misc"
import { DetailList, DetailRow, Panel } from "@/components/shared/panel"
import { ListSkeleton } from "@/components/shared/skeletons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { isApiMode } from "@/lib/api/config"
import { integrationsApi } from "@/lib/services/api/integrations"
import { QK } from "@/lib/store/queries"
import { invalidateQueries, setQueryData, useMutation } from "@/lib/store/query"
import type { AwsBackupInput, AwsBackupStatus, BackupProgress } from "@/lib/types"
import { formatDate, timeAgo } from "@/lib/utils/dates"
import { formatBytes } from "@/lib/utils/format"

import { ApiOnlyNotice, IntegrationPageHeader, IQK, useAwsStatus } from "./integration-page"

function policyFor(bucket: string, prefix: string) {
  const path = `${prefix.replace(/^\/+|\/+$/g, "")}${prefix ? "/" : ""}iamcandidate-backup/*`
  return JSON.stringify(
    {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: ["s3:PutObject", "s3:GetObject"],
          Resource: `arn:aws:s3:::${bucket || "YOUR-BUCKET"}/${path}`,
        },
      ],
    },
    null,
    2,
  )
}

export function AwsView() {
  if (!isApiMode) {
    return (
      <>
        <IntegrationPageHeader id="aws" title="AWS S3 backup" description="Back up your data and documents to your own S3 bucket." />
        <ApiOnlyNotice name="S3 backup" />
      </>
    )
  }
  return <AwsBackup />
}

function AwsBackup() {
  const { data: status, isLoading, error, refetch } = useAwsStatus()
  const [editing, setEditing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const setStatus = (next: AwsBackupStatus) => {
    setQueryData<AwsBackupStatus>(IQK.aws, () => next)
    invalidateQueries(QK.integrations)
  }
  const disconnect = useMutation(() => integrationsApi.aws.disconnect(), {
    onSuccess: setStatus,
    success: "S3 backup disconnected",
    error: "Couldn't disconnect",
  })

  return (
    <div>
      <IntegrationPageHeader
        id="aws"
        title="AWS S3 backup"
        description="Keep your own copy of everything in iamcandidate: a JSON export of all your data plus every document file, in an S3 bucket you control."
        connected={status?.connected}
        actions={
          status?.connected && !editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(true)}>
                <PencilIcon /> Edit
              </Button>
              <Button variant="outline" onClick={() => setDisconnecting(true)}>
                <UnplugIcon /> Disconnect
              </Button>
            </>
          ) : undefined
        }
      />
      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : isLoading || !status ? (
        <ListSkeleton rows={4} />
      ) : !status.connected || editing ? (
        <BucketForm
          status={status}
          onSaved={(next) => {
            setStatus(next)
            setEditing(false)
          }}
          onCancel={status.connected ? () => setEditing(false) : undefined}
        />
      ) : (
        <BackupPanel status={status} onStatus={setStatus} />
      )}
      <ConfirmDialog
        open={disconnecting}
        onOpenChange={setDisconnecting}
        title="Disconnect S3 backup?"
        description="iamcandidate forgets the access key. Backups already in your bucket stay there."
        confirmLabel="Disconnect"
        onConfirm={() => disconnect.mutate()}
      />
    </div>
  )
}

function BucketForm({
  status,
  onSaved,
  onCancel,
}: {
  status: AwsBackupStatus
  onSaved: (s: AwsBackupStatus) => void
  onCancel?: () => void
}) {
  const [values, setValues] = useState<AwsBackupInput>({
    bucket: status.bucket ?? "",
    region: status.region ?? "ap-south-1",
    prefix: status.prefix ?? "",
    accessKeyId: "",
    secretAccessKey: "",
  })
  const [copied, setCopied] = useState(false)
  const save = useMutation((input: AwsBackupInput) => integrationsApi.aws.connect(input), {
    onSuccess: onSaved,
    success: "Bucket connected — iamcandidate wrote a test file to it",
    error: "Couldn't connect the bucket",
  })
  const set = (key: keyof AwsBackupInput) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: event.target.value }))
  const policy = policyFor(values.bucket, values.prefix)

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
      <Panel title={status.connected ? "Change bucket or key" : "Connect a bucket"}>
        <form
          className="grid items-start gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault()
            void save.mutate({ ...values, bucket: values.bucket.trim(), accessKeyId: values.accessKeyId.trim() })
          }}
        >
          <Field label="Bucket" htmlFor="aws-bucket">
            <Input id="aws-bucket" required value={values.bucket} onChange={set("bucket")} placeholder="my-iamcandidate-backups" />
          </Field>
          <Field label="Region" htmlFor="aws-region">
            <Input id="aws-region" required value={values.region} onChange={set("region")} placeholder="ap-south-1" />
          </Field>
          <Field label="Folder (optional)" htmlFor="aws-prefix" hint="Backups go under <folder>/iamcandidate-backup/." className="sm:col-span-2">
            <Input id="aws-prefix" value={values.prefix} onChange={set("prefix")} placeholder="personal" />
          </Field>
          <Field
            label="Access key ID"
            htmlFor="aws-key"
            hint={status.accessKeyId ? `Saved key ends in ${status.accessKeyId.replace("…", "")}. Enter it again to keep it.` : undefined}
          >
            <Input id="aws-key" required autoComplete="off" value={values.accessKeyId} onChange={set("accessKeyId")} placeholder="AKIA…" />
          </Field>
          <Field
            label="Secret access key"
            htmlFor="aws-secret"
            hint={status.connected ? "Leave empty to keep the saved secret." : "Stored encrypted on the iamcandidate server."}
          >
            <Input id="aws-secret" type="password" autoComplete="off" value={values.secretAccessKey} onChange={set("secretAccessKey")} />
          </Field>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2Icon className="animate-spin" />} {status.connected ? "Save" : "Test and connect"}
            </Button>
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Panel>
      <Panel
        title="Create a key for iamcandidate"
        description="Use an IAM user that can only write backups. Not your root keys."
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              void navigator.clipboard.writeText(policy).then(() => {
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              })
            }}
          >
            {copied ? <CheckIcon /> : <CopyIcon />} Copy
          </Button>
        }
      >
        <ol className="mb-3 list-decimal space-y-1 pl-4 text-sm text-muted-foreground">
          <li>Create an S3 bucket (keep Block Public Access on).</li>
          <li>Create an IAM user with this policy as an inline policy.</li>
          <li>Create an access key for it and paste it here.</li>
        </ol>
        <pre className="scrollbar-thin overflow-x-auto rounded-lg bg-muted/60 p-3 text-xs leading-relaxed">{policy}</pre>
      </Panel>
    </div>
  )
}

function BackupPanel({ status, onStatus }: { status: AwsBackupStatus; onStatus: (s: AwsBackupStatus) => void }) {
  const [progress, setProgress] = useState<BackupProgress | null>(null)
  const [running, setRunning] = useState(false)

  const run = async () => {
    setRunning(true)
    setProgress(null)
    try {
      let step = await integrationsApi.aws.backupStep()
      setProgress(step)
      while (!step.done && step.cursor) {
        step = await integrationsApi.aws.backupStep(step.cursor)
        setProgress(step)
      }
      if (step.summary) onStatus({ ...status, lastBackup: step.summary })
      invalidateQueries(QK.activities)
      toast.success("Backup complete", {
        description: `${step.copied} document${step.copied === 1 ? "" : "s"}${step.failed ? `, ${step.failed} failed` : ""}`,
      })
    } catch (caught) {
      toast.error("Backup failed", { description: caught instanceof Error ? caught.message : undefined })
    } finally {
      setRunning(false)
    }
  }

  const last = status.lastBackup
  const percent = progress && progress.total > 0 ? Math.round((progress.copied / progress.total) * 100) : running ? 5 : 100

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <Panel title="Back up now" description="Writes a fresh data export and copies new or changed documents.">
        <div className="space-y-4">
          <Button disabled={running} onClick={() => void run()}>
            {running ? <Loader2Icon className="animate-spin" /> : <DatabaseBackupIcon />} {running ? "Backing up…" : "Back up now"}
          </Button>
          {(running || progress) && (
            <div>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {progress ? `Documents ${progress.copied} of ${progress.total}` : "Exporting data…"}
                </span>
                <span className="tabular-nums">{percent}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Backup progress">
                <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${percent}%` }} />
              </div>
            </div>
          )}
          {last ? (
            <DetailList>
              <DetailRow label="Last backup">
                {formatDate(last.at, true)} ({timeAgo(last.at)})
              </DetailRow>
              <DetailRow label="Documents">
                {last.documents} copied{last.bytes > 0 && ` (${formatBytes(last.bytes)} new)`}
                {last.failed > 0 && <span className="text-destructive"> · {last.failed} failed</span>}
              </DetailRow>
              <DetailRow label="Data export">
                <code className="text-xs break-all">{last.dataKey}</code>
              </DetailRow>
            </DetailList>
          ) : (
            <p className="text-sm text-muted-foreground">No backups yet.</p>
          )}
        </div>
      </Panel>
      <Panel title="Bucket">
        <DetailList>
          <DetailRow label="Location">
            <code className="text-xs break-all">
              s3://{status.bucket}/{status.prefix}iamcandidate-backup/
            </code>
          </DetailRow>
          <DetailRow label="Region">{status.region}</DetailRow>
          <DetailRow label="Access key">{status.accessKeyId}</DetailRow>
        </DetailList>
        <p className="mt-4 flex gap-2 text-xs text-muted-foreground">
          <ArchiveIcon className="size-3.5 shrink-0" /> Each backup adds a dated JSON file under data/. Turn on bucket versioning or a lifecycle rule to manage old ones.
        </p>
      </Panel>
    </div>
  )
}

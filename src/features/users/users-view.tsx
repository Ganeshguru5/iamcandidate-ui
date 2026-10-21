"use client"

import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import {
  BanIcon,
  CheckCircle2Icon,
  KeyRoundIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  ShieldIcon,
  Trash2Icon,
  UserCogIcon,
} from "lucide-react"
import { z } from "zod"

import { EmptyState, ErrorState } from "@/components/shared/empty-state"
import { Field, SimpleSelect } from "@/components/shared/form"
import { FormDialog } from "@/components/shared/form-dialog"
import { ConfirmDialog, PersonAvatar, SearchInput } from "@/components/shared/misc"
import { PageHeader } from "@/components/shared/page-header"
import { ListSkeleton } from "@/components/shared/skeletons"
import { ToneBadge } from "@/components/shared/tone-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Option } from "@/lib/constants"
import { userService } from "@/lib/services"
import { QK, useUsers } from "@/lib/store/queries"
import { removeItem, upsertItem, useMutation } from "@/lib/store/query"
import { useIsAdmin, useSession } from "@/lib/store/session"
import type { AppUser, CreateUserInput, ID, UpdateUserInput, UserRole } from "@/lib/types"
import { formatDate, timeAgo } from "@/lib/utils/dates"
import { matchesQuery } from "@/lib/utils/format"
import { zodResolver } from "@/lib/utils/zod-resolver"

const ROLES: readonly Option<UserRole>[] = [
  { value: "admin", label: "Admin", tone: "violet" },
  { value: "user", label: "User", tone: "neutral" },
]

function useCreateUser() {
  return useMutation((input: CreateUserInput) => userService.create(input), {
    onSuccess: (user) => upsertItem(QK.users, user, "end"),
    success: (user) => `${user.name} can now sign in`,
    error: "Couldn't create user",
  })
}

function useUpdateUser(success?: string) {
  return useMutation((id: ID, patch: UpdateUserInput) => userService.update(id, patch), {
    onSuccess: (user) => upsertItem(QK.users, user),
    success: success ?? ((user) => `${user.name} updated`),
    error: "Couldn't update user",
  })
}

function useDeleteUser() {
  return useMutation((id: ID) => userService.remove(id), {
    onSuccess: (_, id) => removeItem(QK.users, id),
    success: "User deleted",
    error: "Couldn't delete user",
  })
}

export function UsersView() {
  const isAdmin = useIsAdmin()
  if (!isAdmin) {
    return (
      <EmptyState
        icon={ShieldIcon}
        title="Admins only"
        description="User management is available to admins when the app runs against the API backend."
      />
    )
  }
  return <UsersAdmin />
}

function UsersAdmin() {
  const session = useSession()
  const currentUserId = session && session !== "pending" ? session.userId : undefined
  const { data: users, isLoading, error, refetch } = useUsers()
  const toggle = useUpdateUser()
  const remove = useDeleteUser()
  const [query, setQuery] = useState("")
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<AppUser | null>(null)
  const [resetting, setResetting] = useState<AppUser | null>(null)
  const [deleting, setDeleting] = useState<AppUser | null>(null)

  const list = (users ?? []).filter((u) => matchesQuery(query, u.name, u.email))
  const admins = (users ?? []).filter((u) => u.role === "admin" && !u.disabled).length

  return (
    <div>
      <PageHeader
        title="Users"
        description={
          users ? `${users.length} accounts · ${admins} active admin${admins === 1 ? "" : "s"}` : "Manage who can sign in."
        }
        actions={
          <Button onClick={() => setCreating(true)}>
            <PlusIcon /> Add user
          </Button>
        }
      >
        <SearchInput value={query} onChange={setQuery} placeholder="Search by name or email…" />
      </PageHeader>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : isLoading ? (
        <ListSkeleton />
      ) : list.length === 0 ? (
        <EmptyState icon={UserCogIcon} title={query ? "No users match" : "No users yet"} />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Last sign-in</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((user) => {
                const isSelf = user.id === currentUserId
                const role = ROLES.find((r) => r.value === user.role) ?? ROLES[1]
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <PersonAvatar name={user.name} className="size-7" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {user.name}
                            {isSelf && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <ToneBadge tone={role.tone}>{role.label}</ToneBadge>
                    </TableCell>
                    <TableCell>
                      <ToneBadge tone={user.disabled ? "red" : "green"} dot>
                        {user.disabled ? "Disabled" : "Active"}
                      </ToneBadge>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {user.lastLoginAt ? timeAgo(user.lastLoginAt) : "Never"}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {formatDate(user.createdAt, true)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon-xs" aria-label={`Actions for ${user.name}`} />}
                        >
                          <MoreHorizontalIcon />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => setEditing(user)}>
                            <PencilIcon /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setResetting(user)}>
                            <KeyRoundIcon /> Reset password
                          </DropdownMenuItem>
                          {!isSelf && (
                            <DropdownMenuItem onClick={() => void toggle.mutate(user.id, { disabled: !user.disabled })}>
                              {user.disabled ? <CheckCircle2Icon /> : <BanIcon />}
                              {user.disabled ? "Enable" : "Disable"}
                            </DropdownMenuItem>
                          )}
                          {!isSelf && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" onClick={() => setDeleting(user)}>
                                <Trash2Icon /> Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {creating && <CreateUserDialog onOpenChange={setCreating} />}
      {editing && (
        <EditUserDialog
          key={editing.id}
          user={editing}
          isSelf={editing.id === currentUserId}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
      {resetting && (
        <ResetPasswordDialog key={resetting.id} user={resetting} onOpenChange={(open) => !open && setResetting(null)} />
      )}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.name}?`}
        description="Their account and all of their data — applications, documents, notes and everything else — are permanently deleted."
        confirmLabel="Delete user"
        onConfirm={async () => {
          if (deleting) await remove.mutate(deleting.id)
        }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */

const password = z.string().min(8, "Use at least 8 characters").max(200)

const createSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.email("Enter a valid email address"),
  password,
  role: z.enum(["admin", "user"]),
})

function CreateUserDialog({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const create = useCreateUser()
  const { register, control, handleSubmit, formState } = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", email: "", password: "", role: "user" },
  })
  const errors = formState.errors
  const onSubmit = handleSubmit(async (values) => {
    if (await create.mutate(values)) onOpenChange(false)
  })
  return (
    <FormDialog
      open
      onOpenChange={onOpenChange}
      title="Add user"
      description="They sign in with this email and password, and get their own empty workspace."
      submitLabel="Add user"
      pending={create.isPending}
      onSubmit={onSubmit}
      size="sm"
    >
      <Field label="Name" htmlFor="user-name" error={errors.name?.message}>
        <Input id="user-name" autoComplete="off" {...register("name")} />
      </Field>
      <Field label="Email" htmlFor="user-email" error={errors.email?.message}>
        <Input id="user-email" type="email" autoComplete="off" {...register("email")} />
      </Field>
      <Field label="Password" htmlFor="user-password" error={errors.password?.message}>
        <Input id="user-password" type="password" autoComplete="new-password" {...register("password")} />
      </Field>
      <Field label="Role">
        <Controller
          control={control}
          name="role"
          render={({ field }) => <SimpleSelect value={field.value} onValueChange={field.onChange} options={ROLES} />}
        />
      </Field>
    </FormDialog>
  )
}

const editSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  role: z.enum(["admin", "user"]),
})

function EditUserDialog({
  user,
  isSelf,
  onOpenChange,
}: {
  user: AppUser
  isSelf: boolean
  onOpenChange: (open: boolean) => void
}) {
  const update = useUpdateUser()
  const { register, control, handleSubmit, formState } = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: user.name, role: user.role },
  })
  const onSubmit = handleSubmit(async (values) => {
    if (await update.mutate(user.id, values)) onOpenChange(false)
  })
  return (
    <FormDialog
      open
      onOpenChange={onOpenChange}
      title="Edit user"
      description={user.email}
      pending={update.isPending}
      onSubmit={onSubmit}
      size="sm"
    >
      <Field label="Name" htmlFor="edit-name" error={formState.errors.name?.message}>
        <Input id="edit-name" {...register("name")} />
      </Field>
      <Field label="Role" hint={isSelf ? "You can't remove your own admin access." : undefined}>
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <SimpleSelect
              value={field.value}
              onValueChange={field.onChange}
              options={isSelf ? ROLES.filter((r) => r.value === "admin") : ROLES}
            />
          )}
        />
      </Field>
    </FormDialog>
  )
}

const resetSchema = z
  .object({ password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: "Passwords don't match", path: ["confirm"] })

function ResetPasswordDialog({ user, onOpenChange }: { user: AppUser; onOpenChange: (open: boolean) => void }) {
  const update = useUpdateUser(`Password reset for ${user.name}`)
  const { register, handleSubmit, formState } = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirm: "" },
  })
  const onSubmit = handleSubmit(async (values) => {
    if (await update.mutate(user.id, { password: values.password })) onOpenChange(false)
  })
  return (
    <FormDialog
      open
      onOpenChange={onOpenChange}
      title="Reset password"
      description={`Set a new password for ${user.email}. Share it with them securely.`}
      submitLabel="Reset password"
      pending={update.isPending}
      onSubmit={onSubmit}
      size="sm"
    >
      <Field label="New password" htmlFor="reset-password" error={formState.errors.password?.message}>
        <Input id="reset-password" type="password" autoComplete="new-password" {...register("password")} />
      </Field>
      <Field label="Confirm" htmlFor="reset-confirm" error={formState.errors.confirm?.message}>
        <Input id="reset-confirm" type="password" autoComplete="new-password" {...register("confirm")} />
      </Field>
    </FormDialog>
  )
}

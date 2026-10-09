import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UserRound } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/Toaster'
import { adminService } from '@/services/adminService'
import { useAuthStore } from '@/stores/authStore'
import { hasPermission, PERMISSIONS, ROLE_LABEL, ROLES } from '@/utils/permissions'

const RUNNER_TONE = { pending: 'warning', approved: 'brand', suspended: 'danger' }

/**
 * Admin console (first slice): people & roles. Buttons are shown according to the
 * signed-in user's permissions, and every action is re-authorised by the server.
 */
export default function AdminConsolePage() {
  const me = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const { data: users, isLoading, error } = useQuery({ queryKey: ['admin', 'users'], queryFn: adminService.listUsers })

  const onDone = (msg) => (updated) => {
    qc.setQueryData(['admin', 'users'], (list) => list?.map((u) => (u.id === updated.id ? updated : u)))
    toast.success(msg(updated))
  }
  const onError = (e) => toast.error(e.message)

  const runnerMutation = useMutation({
    mutationFn: ({ userId, status }) => adminService.setRunnerStatus(userId, status),
    onSuccess: onDone((u) => `${u.name}: runner ${u.runnerStatus}`),
    onError,
  })
  const roleMutation = useMutation({
    mutationFn: ({ userId, role, granted }) => adminService.setRole(userId, role, granted),
    onSuccess: onDone((u) => `${u.name}: roles updated`),
    onError,
  })

  const canApprove = hasPermission(me, PERMISSIONS.RUNNERS_APPROVE)
  const canAssign = hasPermission(me, PERMISSIONS.ROLES_ASSIGN)
  const busy = runnerMutation.isPending || roleMutation.isPending

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
      <p className="text-sm font-medium text-ink-subtle">Admin console</p>
      <h1 className="mt-1 font-display text-4xl font-bold tracking-display">People &amp; roles</h1>
      <p className="mt-2 max-w-xl text-ink-muted">
        Approve runner applicants and manage who can access each area. Sample accounts only — changes reset on reload.
      </p>

      {error && <p className="mt-6 rounded-tile bg-danger-soft p-3 text-sm font-medium text-danger">{error.message}</p>}

      <ul className="mt-8 grid gap-3" aria-busy={isLoading || busy}>
        {isLoading &&
          Array.from({ length: 3 }, (_, i) => (
            <li key={i}>
              <Skeleton className="h-24 rounded-card" />
            </li>
          ))}
        {users?.map((u) => {
          const isAdmin = u.roles.includes(ROLES.ADMIN)
          return (
            <li key={u.id}>
              <Card className="grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-center">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-tile bg-surface-2 text-ink-muted">
                    <UserRound className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {u.name} {u.id === me?.id && <span className="font-normal text-ink-subtle">(you)</span>}
                    </p>
                    <p className="truncate text-sm text-ink-subtle">{u.email}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {u.roles.map((r) => (
                        <Badge key={r} tone={r === ROLES.SUPER_ADMIN ? 'info' : 'neutral'}>{ROLE_LABEL[r]}</Badge>
                      ))}
                      {u.runnerStatus && <Badge tone={RUNNER_TONE[u.runnerStatus]}>Runner: {u.runnerStatus}</Badge>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 md:justify-end">
                  {canApprove && u.runnerStatus === 'pending' && (
                    <Button size="sm" disabled={busy} onClick={() => runnerMutation.mutate({ userId: u.id, status: 'approved' })}>
                      Approve runner
                    </Button>
                  )}
                  {canApprove && u.runnerStatus === 'approved' && (
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => runnerMutation.mutate({ userId: u.id, status: 'suspended' })}>
                      Suspend runner
                    </Button>
                  )}
                  {canAssign && !u.roles.includes(ROLES.SUPER_ADMIN) && (
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => roleMutation.mutate({ userId: u.id, role: ROLES.ADMIN, granted: !isAdmin })}>
                      {isAdmin ? 'Remove admin' : 'Make admin'}
                    </Button>
                  )}
                </div>
              </Card>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

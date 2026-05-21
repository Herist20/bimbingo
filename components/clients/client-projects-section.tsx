import Link from 'next/link';
import { ArrowRight, FolderKanban, KanbanSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ProjectStatusBadge } from '@/components/projects/project-status-badge';
import { listProjectsByClient } from '@/lib/actions/projects';
import { PROJECT_TYPE_LABEL } from '@/lib/schemas/project';
import { formatRupiah, formatTanggal, formatTanggalRelatif } from '@/lib/format';

interface ClientProjectsSectionProps {
  clientId: string;
  clientName: string;
}

export async function ClientProjectsSection({ clientId, clientName }: ClientProjectsSectionProps) {
  const result = await listProjectsByClient(clientId);
  const projects = result.ok ? result.data : [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-[var(--brand)]" />
            <CardTitle className="font-display text-base">
              Proyek skripsi
              <span className="ml-2 text-[11px] font-normal text-[var(--text-muted)]">
                {projects.length}
              </span>
            </CardTitle>
          </div>
          <Button asChild size="sm" variant="secondary">
            <Link href={`/projects/new?client=${clientId}`}>
              <Plus className="h-3.5 w-3.5" />
              Proyek baru
            </Link>
          </Button>
        </div>
        <CardDescription>
          Semua proyek yang pernah dikerjakan dengan {clientName}. Klik kartu untuk masuk ke detail.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)]">
              <FolderKanban className="h-5 w-5" />
            </span>
            <p className="font-display text-sm font-semibold text-[var(--text-display)]">
              Belum ada proyek
            </p>
            <p className="max-w-sm text-xs text-[var(--text-muted)]">
              Buat proyek pertama untuk klien ini. Milestone bab default akan auto-generate.
            </p>
            <Button asChild size="sm" className="mt-2">
              <Link href={`/projects/new?client=${clientId}`}>
                <Plus className="h-3.5 w-3.5" />
                Buat proyek pertama
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {projects.map((p) => {
              const typeLabel =
                (PROJECT_TYPE_LABEL as Record<string, string>)[p.type] ?? p.type;
              const isArchived = Boolean(p.archived_at);
              return (
                <li key={p.id}>
                  <Link
                    href={`/projects/${p.id}`}
                    className="group flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-[var(--bg-subtle)] sm:flex-row sm:items-center sm:gap-4"
                  >
                    {/* Title + meta */}
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-sm font-semibold text-[var(--text-display)] group-hover:underline">
                          {p.title}
                        </span>
                        <ProjectStatusBadge status={p.status} />
                        {isArchived ? <span className="chip">Arsip</span> : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--text-muted)]">
                        <span>{typeLabel}</span>
                        {p.target_end_date ? (
                          <span>
                            · Target {formatTanggal(p.target_end_date)} (
                            {formatTanggalRelatif(p.target_end_date)})
                          </span>
                        ) : null}
                      </div>

                      {/* Progress bar */}
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--bg-muted)] sm:max-w-[16rem]">
                          <div
                            className="h-full rounded-full bg-[var(--brand)]"
                            style={{ width: `${Math.min(100, Math.max(0, p.progress_percent))}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-[var(--text-muted)]">
                          {p.progress_percent}%
                        </span>
                      </div>
                    </div>

                    {/* Finance + action */}
                    <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
                      <div className="flex flex-col text-right">
                        <span className="font-display text-sm font-semibold text-[var(--text-display)]">
                          {formatRupiah(p.total_value)}
                        </span>
                        {p.outstanding > 0 ? (
                          <span className="text-[10px] text-[var(--warning)]">
                            sisa {formatRupiah(p.outstanding)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[var(--success)]">lunas</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/projects/${p.id}/board`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex h-7 items-center gap-1 rounded-md border bg-[var(--bg-base)] px-2 text-[10px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          <KanbanSquare className="h-3 w-3" />
                          Board
                        </Link>
                        <ArrowRight className="h-3.5 w-3.5 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

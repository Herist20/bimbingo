'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
} from '@tanstack/react-table';
import {
  ArchiveRestore,
  Archive,
  MoreHorizontal,
  PencilLine,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { archiveClient, restoreClient, type ClientRow } from '@/lib/actions/clients';
import { formatTanggal, formatTanggalRelatif } from '@/lib/format';
import { cn } from '@/lib/utils';

interface ClientsTableProps {
  data: ClientRow[];
}

type StatusFilter = 'active' | 'archived' | 'all';

const STATUS_OPTIONS: Array<{ key: StatusFilter; label: string }> = [
  { key: 'active', label: 'Aktif' },
  { key: 'archived', label: 'Arsip' },
  { key: 'all', label: 'Semua' },
];

export function ClientsTable({ data }: ClientsTableProps) {
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'target_defense', desc: false },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('active');
  const [pending, startTransition] = React.useTransition();

  const filteredByStatus = React.useMemo(() => {
    if (statusFilter === 'all') return data;
    if (statusFilter === 'archived') return data.filter((c) => c.archived_at !== null);
    return data.filter((c) => c.archived_at === null);
  }, [data, statusFilter]);

  const counts = React.useMemo(
    () => ({
      active: data.filter((c) => c.archived_at === null).length,
      archived: data.filter((c) => c.archived_at !== null).length,
      all: data.length,
    }),
    [data],
  );

  const handleArchive = (row: ClientRow) => {
    startTransition(async () => {
      const action = row.archived_at ? restoreClient : archiveClient;
      const result = await action(row.id);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success(row.archived_at ? 'Klien dipulihkan.' : 'Klien diarsipkan.');
    });
  };

  const columns = React.useMemo<ColumnDef<ClientRow>[]>(
    () => [
      {
        accessorKey: 'full_name',
        header: 'Nama',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Link
              href={`/clients/${row.original.id}`}
              className="text-sm font-medium text-[var(--text-primary)] hover:underline"
            >
              {row.original.full_name}
            </Link>
            {row.original.nickname ? (
              <span className="text-xs text-[var(--text-muted)]">
                {row.original.nickname}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: 'whatsapp',
        header: 'WhatsApp',
        cell: ({ getValue }) => (
          <span className="font-mono text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'university',
        header: 'Kampus',
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue<string | null>() ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'major',
        header: 'Jurusan',
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue<string | null>() ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'target_defense',
        header: 'Target sidang',
        sortingFn: 'datetime',
        cell: ({ getValue }) => {
          const v = getValue<string | null>();
          if (!v) return <span className="text-xs text-[var(--text-muted)]">—</span>;
          return (
            <div className="flex flex-col">
              <span className="text-sm">{formatTanggal(v)}</span>
              <span className="text-xs text-[var(--text-muted)]">
                {formatTanggalRelatif(v)}
              </span>
            </div>
          );
        },
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) =>
          row.original.archived_at ? (
            <Badge tone="neutral">Arsip</Badge>
          ) : (
            <Badge tone="brand">Aktif</Badge>
          ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Menu untuk ${row.original.full_name}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/clients/${row.original.id}`}>
                  <Search className="h-4 w-4" />
                  Lihat detail
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/clients/${row.original.id}/edit`}>
                  <PencilLine className="h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => handleArchive(row.original)}
                disabled={pending}
              >
                {row.original.archived_at ? (
                  <>
                    <ArchiveRestore className="h-4 w-4" />
                    Pulihkan
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4" />
                    Arsipkan
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [pending],
  );

  const table = useReactTable({
    data: filteredByStatus,
    columns,
    state: { globalFilter, sorting, columnFilters },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue).toLowerCase().trim();
      if (!q) return true;
      const r = row.original;
      return [r.full_name, r.nickname, r.whatsapp, r.university, r.major]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(q));
    },
    initialState: { pagination: { pageSize: 20 } },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Cari nama / WA / kampus…"
              className="pl-8"
            />
          </div>
          <div
            role="tablist"
            aria-label="Filter status klien"
            className="inline-flex rounded-md border p-0.5"
            style={{ borderColor: 'var(--border-strong)' }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                role="tab"
                aria-selected={statusFilter === opt.key}
                onClick={() => setStatusFilter(opt.key)}
                className={cn(
                  'rounded-sm px-2.5 py-1 text-xs font-medium transition-colors',
                  statusFilter === opt.key
                    ? 'bg-[var(--brand-soft)] text-[var(--brand)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]',
                )}
              >
                {opt.label}
                <span className="ml-1 text-[10px] text-[var(--text-muted)]">
                  {counts[opt.key]}
                </span>
              </button>
            ))}
          </div>
        </div>
        <span className="text-xs text-[var(--text-muted)]">
          {table.getFilteredRowModel().rows.length} klien
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-left">
          <thead className="bg-[var(--bg-subtle)] text-xs uppercase text-[var(--text-muted)]">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      'px-4 py-2 font-medium',
                      header.column.getCanSort() && 'cursor-pointer select-none',
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    {{
                      asc: ' ▲',
                      desc: ' ▼',
                    }[header.column.getIsSorted() as string] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-[var(--text-muted)]"
                >
                  Tidak ada klien yang cocok dengan pencarian.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t transition-colors hover:bg-[var(--bg-subtle)]"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-top">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>
          Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount() || 1}
        </span>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Sebelumnya
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </div>
  );
}

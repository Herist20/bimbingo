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
import { ColumnManager, type BuiltinColumnSpec } from '@/components/custom-fields/column-manager';
import { CustomFieldCell } from '@/components/custom-fields/custom-field-cell';
import { useColumnVisibility } from '@/hooks/use-column-visibility';
import { archiveClient, restoreClient, type ClientRow } from '@/lib/actions/clients';
import { formatTanggal, formatTanggalRelatif } from '@/lib/format';
import type { CustomFieldRow } from '@/lib/schemas/custom-field';
import { cn } from '@/lib/utils';

interface ClientsTableProps {
  data: ClientRow[];
  customFields?: CustomFieldRow[];
}

type StatusFilter = 'active' | 'archived' | 'all';

const STATUS_OPTIONS: Array<{ key: StatusFilter; label: string }> = [
  { key: 'active', label: 'Aktif' },
  { key: 'archived', label: 'Arsip' },
  { key: 'all', label: 'Semua' },
];

const BUILTIN_COLUMNS: BuiltinColumnSpec[] = [
  { key: 'full_name', label: 'Nama', toggleable: false },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'university', label: 'Kampus' },
  { key: 'major', label: 'Jurusan' },
  { key: 'target_defense', label: 'Target sidang' },
  { key: 'status', label: 'Status' },
];

const BUILTIN_DEFAULTS: Record<string, boolean> = Object.fromEntries(
  BUILTIN_COLUMNS.map((c) => [c.key, true]),
);

export function ClientsTable({ data, customFields: initialCustomFields = [] }: ClientsTableProps) {
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('active');
  const [pending, startTransition] = React.useTransition();
  const [customFields, setCustomFields] = React.useState<CustomFieldRow[]>(initialCustomFields);

  React.useEffect(() => setCustomFields(initialCustomFields), [initialCustomFields]);

  const defaultVisibility = React.useMemo(() => {
    const map = { ...BUILTIN_DEFAULTS };
    for (const f of customFields) {
      if (!f.archived_at) map[`cf:${f.key}`] = f.show_in_list;
    }
    return map;
  }, [customFields]);

  const { visible: columnVisibility, toggle: toggleColumn } = useColumnVisibility(
    'clients',
    defaultVisibility,
  );

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

  const columns = React.useMemo<ColumnDef<ClientRow>[]>(() => {
    const cols: ColumnDef<ClientRow>[] = [];

    if (columnVisibility.full_name !== false) {
      cols.push({
        id: 'full_name',
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
      });
    }

    if (columnVisibility.whatsapp !== false) {
      cols.push({
        id: 'whatsapp',
        accessorKey: 'whatsapp',
        header: 'WhatsApp',
        cell: ({ getValue }) => (
          <span className="font-mono text-xs">{getValue<string>()}</span>
        ),
      });
    }

    if (columnVisibility.university !== false) {
      cols.push({
        id: 'university',
        accessorKey: 'university',
        header: 'Kampus',
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue<string | null>() ?? '—'}</span>
        ),
      });
    }

    if (columnVisibility.major !== false) {
      cols.push({
        id: 'major',
        accessorKey: 'major',
        header: 'Jurusan',
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue<string | null>() ?? '—'}</span>
        ),
      });
    }

    if (columnVisibility.target_defense !== false) {
      cols.push({
        id: 'target_defense',
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
      });
    }

    // Custom field columns (visible only)
    for (const f of customFields) {
      if (f.archived_at) continue;
      const colKey = `cf:${f.key}`;
      if (columnVisibility[colKey] === false) continue;
      cols.push({
        id: colKey,
        header: f.label,
        cell: ({ row }) => (
          <CustomFieldCell field={f} value={row.original.custom_data?.[f.key]} />
        ),
      });
    }

    if (columnVisibility.status !== false) {
      cols.push({
        id: 'status',
        header: 'Status',
        cell: ({ row }) =>
          row.original.archived_at ? (
            <Badge tone="neutral">Arsip</Badge>
          ) : (
            <Badge tone="brand">Aktif</Badge>
          ),
      });
    }

    cols.push({
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
    });

    return cols;
  }, [columnVisibility, customFields, pending]);

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
            className="inline-flex h-10 items-center gap-0.5 rounded-md border bg-[var(--bg-base)] p-1"
            style={{ borderColor: 'var(--border-strong)' }}
          >
            {STATUS_OPTIONS.map((opt) => {
              const selected = statusFilter === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setStatusFilter(opt.key)}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-sm px-3 text-sm font-medium transition-all',
                    selected
                      ? 'bg-[var(--brand-soft)] text-[var(--brand-ink)] shadow-[var(--shadow-card)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]',
                  )}
                >
                  <span>{opt.label}</span>
                  <span
                    className={cn(
                      'inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums',
                      selected
                        ? 'bg-[var(--brand)] text-white'
                        : 'bg-[var(--bg-muted)] text-[var(--text-muted)]',
                    )}
                  >
                    {counts[opt.key]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ColumnManager
            entityType="client"
            builtinColumns={BUILTIN_COLUMNS}
            customFields={customFields}
            onCustomFieldsChange={setCustomFields}
            columnVisibility={columnVisibility}
            onToggleColumn={toggleColumn}
          />
          <span className="text-xs text-[var(--text-muted)]">
            {table.getFilteredRowModel().rows.length} klien
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border)' }}>
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

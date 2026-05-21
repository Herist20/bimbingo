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
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { MoreHorizontal, PencilLine, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProjectStatusBadge } from './project-status-badge';
import { ColumnManager, type BuiltinColumnSpec } from '@/components/custom-fields/column-manager';
import { CustomFieldCell } from '@/components/custom-fields/custom-field-cell';
import { useColumnVisibility } from '@/hooks/use-column-visibility';
import { PROJECT_TYPE_LABEL } from '@/lib/schemas/project';
import type { ProjectListRow } from '@/lib/actions/projects';
import type { CustomFieldRow } from '@/lib/schemas/custom-field';
import { formatRupiah, formatTanggal } from '@/lib/format';
import { cn } from '@/lib/utils';

interface ProjectsTableProps {
  data: ProjectListRow[];
  customFields?: CustomFieldRow[];
}

const BUILTIN_COLUMNS: BuiltinColumnSpec[] = [
  { key: 'title', label: 'Judul', toggleable: false },
  { key: 'client_name', label: 'Klien' },
  { key: 'status', label: 'Status' },
  { key: 'progress_percent', label: 'Progres' },
  { key: 'total_value', label: 'Nilai' },
  { key: 'target_end_date', label: 'Target' },
];

const BUILTIN_DEFAULTS: Record<string, boolean> = Object.fromEntries(
  BUILTIN_COLUMNS.map((c) => [c.key, true]),
);

export function ProjectsTable({ data, customFields: initialCustomFields = [] }: ProjectsTableProps) {
  const [globalFilter, setGlobalFilter] = React.useState('');
  // Data sudah disort server-side (updated_at desc). Biarkan kosong supaya
  // urutan default = urutan server, lalu user bisa override per kolom.
  const [sorting, setSorting] = React.useState<SortingState>([]);
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
    'projects',
    defaultVisibility,
  );

  const columns = React.useMemo<ColumnDef<ProjectListRow>[]>(() => {
    const cols: ColumnDef<ProjectListRow>[] = [];

    if (columnVisibility.title !== false) {
      cols.push({
        id: 'title',
        accessorKey: 'title',
        header: 'Judul',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Link
              href={`/projects/${row.original.id}`}
              className="text-sm font-medium text-[var(--text-primary)] hover:underline"
            >
              {row.original.title}
            </Link>
            <span className="text-xs text-[var(--text-muted)]">
              {(PROJECT_TYPE_LABEL as Record<string, string>)[row.original.type] ?? row.original.type}
            </span>
          </div>
        ),
      });
    }

    if (columnVisibility.client_name !== false) {
      cols.push({
        id: 'client_name',
        accessorKey: 'client_name',
        header: 'Klien',
        cell: ({ row }) => (
          <Link
            href={`/clients/${row.original.client_id}`}
            className="text-sm hover:underline"
          >
            {row.original.client_name}
          </Link>
        ),
      });
    }

    if (columnVisibility.status !== false) {
      cols.push({
        id: 'status',
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <ProjectStatusBadge status={getValue<string>()} />,
      });
    }

    if (columnVisibility.progress_percent !== false) {
      cols.push({
        id: 'progress_percent',
        accessorKey: 'progress_percent',
        header: 'Progres',
        cell: ({ getValue }) => {
          const pct = Number(getValue<number>() ?? 0);
          return (
            <div className="flex flex-col gap-1">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--bg-muted)]">
                <div
                  className="h-full rounded-full bg-[var(--brand)]"
                  style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                />
              </div>
              <span className="text-xs text-[var(--text-muted)]">{pct}%</span>
            </div>
          );
        },
      });
    }

    if (columnVisibility.total_value !== false) {
      cols.push({
        id: 'total_value',
        accessorKey: 'total_value',
        header: 'Nilai',
        cell: ({ row }) => (
          <div className="flex flex-col text-right">
            <span className="text-sm">{formatRupiah(row.original.total_value)}</span>
            {row.original.outstanding > 0 ? (
              <span className="text-xs text-[var(--warning)]">
                sisa {formatRupiah(row.original.outstanding)}
              </span>
            ) : (
              <span className="text-xs text-[var(--success)]">lunas</span>
            )}
          </div>
        ),
      });
    }

    if (columnVisibility.target_end_date !== false) {
      cols.push({
        id: 'target_end_date',
        accessorKey: 'target_end_date',
        header: 'Target',
        cell: ({ getValue }) => {
          const v = getValue<string | null>();
          return (
            <span className="text-xs text-[var(--text-secondary)]">
              {v ? formatTanggal(v) : '—'}
            </span>
          );
        },
      });
    }

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

    cols.push({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Menu untuk ${row.original.title}`}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/projects/${row.original.id}`}>
                <Search className="h-4 w-4" />
                Lihat detail
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/projects/${row.original.id}/edit`}>
                <PencilLine className="h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    });

    return cols;
  }, [columnVisibility, customFields]);

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue).toLowerCase().trim();
      if (!q) return true;
      const r = row.original;
      return [r.title, r.client_name, r.status, r.type]
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
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Cari judul / klien / status…"
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <ColumnManager
            entityType="project"
            builtinColumns={BUILTIN_COLUMNS}
            customFields={customFields}
            onCustomFieldsChange={setCustomFields}
            columnVisibility={columnVisibility}
            onToggleColumn={toggleColumn}
          />
          <span className="text-xs text-[var(--text-muted)]">
            {table.getFilteredRowModel().rows.length} proyek
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
                    {{ asc: ' ▲', desc: ' ▼' }[header.column.getIsSorted() as string] ?? null}
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
                  Tidak ada proyek yang cocok.
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

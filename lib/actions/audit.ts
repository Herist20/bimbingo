'use server';

import { getServerSupabase } from '@/lib/supabase/server';
import { fail, ok, requireUser, type ActionResult } from './_helper';

export type AuditAction = 'status_change' | 'insert' | 'update' | 'delete' | 'archive' | 'restore';

export interface AuditLogRow {
  id: number;
  actor_id: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  created_at: string;
  /** Label entitas yang ter-resolve (mis. judul proyek). */
  entity_label?: string | null;
}

export interface AuditLogFilter {
  entity_type?: string;
  entity_id?: string;
  action?: string;
  from?: string; // ISO date
  to?: string; // ISO date
  page?: number;
  pageSize?: number;
}

export interface AuditLogPayload {
  rows: AuditLogRow[];
  total: number;
  page: number;
  pageSize: number;
  entityTypes: string[];
  actions: string[];
}

const DEFAULT_PAGE_SIZE = 25;

export async function listAuditLogs(
  filter: AuditLogFilter = {},
): Promise<ActionResult<AuditLogPayload>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();

    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.min(100, Math.max(5, filter.pageSize ?? DEFAULT_PAGE_SIZE));
    const fromIdx = (page - 1) * pageSize;
    const toIdx = fromIdx + pageSize - 1;

    let query = supabase
      .from('audit_logs')
      .select('id, actor_id, entity_type, entity_id, action, before_data, after_data, created_at', {
        count: 'exact',
      })
      .order('created_at', { ascending: false });

    if (filter.entity_type) query = query.eq('entity_type', filter.entity_type);
    if (filter.entity_id) query = query.eq('entity_id', filter.entity_id);
    if (filter.action) query = query.eq('action', filter.action);
    if (filter.from) query = query.gte('created_at', filter.from);
    if (filter.to) query = query.lte('created_at', `${filter.to}T23:59:59.999Z`);

    const { data, error, count } = await query.range(fromIdx, toIdx);
    if (error) throw error;

    const rows = (data ?? []) as AuditLogRow[];

    // Resolve label untuk entity_type = 'project'
    const projectIds = Array.from(
      new Set(rows.filter((r) => r.entity_type === 'project').map((r) => r.entity_id)),
    );
    if (projectIds.length > 0) {
      const { data: projects } = await supabase
        .from('projects')
        .select('id, title')
        .in('id', projectIds);
      const labelMap = new Map((projects ?? []).map((p) => [p.id, p.title]));
      for (const r of rows) {
        if (r.entity_type === 'project') r.entity_label = labelMap.get(r.entity_id) ?? null;
      }
    }

    // Facet: distinct entity_type + action dari hasil global (untuk filter UI)
    const [typesRes, actionsRes] = await Promise.all([
      supabase
        .from('audit_logs')
        .select('entity_type')
        .order('entity_type', { ascending: true })
        .limit(50),
      supabase
        .from('audit_logs')
        .select('action')
        .order('action', { ascending: true })
        .limit(50),
    ]);

    const entityTypes = Array.from(
      new Set((typesRes.data ?? []).map((r) => r.entity_type as string)),
    );
    const actions = Array.from(new Set((actionsRes.data ?? []).map((r) => r.action as string)));

    return ok({
      rows,
      total: count ?? rows.length,
      page,
      pageSize,
      entityTypes,
      actions,
    });
  } catch (e) {
    return fail(e);
  }
}

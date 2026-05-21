'use server';

import { getServerSupabase } from '@/lib/supabase/server';
import { fail, ok, requireUser, type ActionResult } from './_helper';

export type SearchHitKind = 'client' | 'project' | 'lecturer';

export interface SearchHit {
  kind: SearchHitKind;
  id: string;
  label: string;
  hint?: string;
  href: string;
}

export interface SearchPayload {
  query: string;
  hits: SearchHit[];
  truncated: boolean;
}

const LIMIT_PER_KIND = 5;
const MIN_QUERY = 2;

function escapeIlike(input: string) {
  return input.replace(/[%_]/g, (m) => `\\${m}`);
}

export async function globalSearch(rawQuery: string): Promise<ActionResult<SearchPayload>> {
  try {
    await requireUser();
    const query = rawQuery.trim();
    if (query.length < MIN_QUERY) {
      return ok({ query, hits: [], truncated: false });
    }

    const needle = `%${escapeIlike(query)}%`;
    const supabase = await getServerSupabase();

    const [clientsRes, projectsRes, lecturersRes] = await Promise.all([
      supabase
        .from('clients')
        .select('id, full_name, nickname, university, archived_at')
        .or(`full_name.ilike.${needle},nickname.ilike.${needle},university.ilike.${needle},whatsapp.ilike.${needle}`)
        .order('updated_at', { ascending: false })
        .limit(LIMIT_PER_KIND),
      supabase
        .from('projects')
        .select('id, title, status, client:clients!inner(full_name)')
        .ilike('title', needle)
        .order('updated_at', { ascending: false })
        .limit(LIMIT_PER_KIND),
      supabase
        .from('lecturers')
        .select('id, full_name, title, university')
        .or(`full_name.ilike.${needle},university.ilike.${needle}`)
        .order('full_name', { ascending: true })
        .limit(LIMIT_PER_KIND),
    ]);

    const hits: SearchHit[] = [];

    if (clientsRes.data) {
      for (const c of clientsRes.data) {
        const status = c.archived_at ? 'arsip' : 'aktif';
        hits.push({
          kind: 'client',
          id: c.id,
          label: c.full_name,
          hint: [c.nickname, c.university].filter(Boolean).join(' · ') || status,
          href: `/clients/${c.id}`,
        });
      }
    }
    if (projectsRes.data) {
      for (const p of projectsRes.data) {
        const clientName =
          (p as unknown as { client?: { full_name?: string } }).client?.full_name ?? '—';
        hits.push({
          kind: 'project',
          id: p.id,
          label: p.title,
          hint: `${clientName} · ${p.status}`,
          href: `/projects/${p.id}`,
        });
      }
    }
    if (lecturersRes.data) {
      for (const l of lecturersRes.data) {
        const name = l.title ? `${l.title} ${l.full_name}` : l.full_name;
        hits.push({
          kind: 'lecturer',
          id: l.id,
          label: name,
          hint: l.university ?? undefined,
          href: `/lecturers/${l.id}`,
        });
      }
    }

    const truncated =
      (clientsRes.data?.length ?? 0) === LIMIT_PER_KIND ||
      (projectsRes.data?.length ?? 0) === LIMIT_PER_KIND ||
      (lecturersRes.data?.length ?? 0) === LIMIT_PER_KIND;

    return ok({ query, hits, truncated });
  } catch (e) {
    return fail(e);
  }
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MessageSquare } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { CommentThread } from '@/components/portal/comment-thread';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ProjectCommentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: project } = await supabase
    .from('projects')
    .select('id, title')
    .eq('id', id)
    .maybeSingle();
  if (!project) notFound();

  const { data: milestones } = await supabase
    .from('project_milestones')
    .select('id, title, sequence, status')
    .eq('project_id', id)
    .order('sequence', { ascending: true });

  return (
    <div className="space-y-6">
      <Link
        href={`/projects/${id}`}
        className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Kembali ke proyek
      </Link>

      <PageHeader
        kicker={`Proyek · ${project.title}`}
        title="Komentar klien"
        description="Balas pertanyaan klien per milestone. Klien hanya bisa post komentar — admin yang ubah status milestone."
      />

      {(milestones ?? []).length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-[var(--text-muted)]">
            Proyek ini belum punya milestone. Tambahkan dulu di halaman Overview.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(milestones ?? []).map((m) => (
            <Card key={m.id}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2 font-display text-base">
                  <MessageSquare className="h-4 w-4 text-[var(--brand-ink)]" />
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">
                    #{m.sequence.toString().padStart(2, '0')}
                  </span>
                  <span>{m.title}</span>
                  <Badge>{m.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CommentThread milestoneId={m.id} currentUserId={user.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

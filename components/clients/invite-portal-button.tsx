'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { inviteClientToPortal } from '@/lib/actions/portal';

export function InvitePortalButton({ clientId }: { clientId: string }) {
  const [pending, start] = useTransition();

  function handleClick() {
    start(async () => {
      const res = await inviteClientToPortal({ clientId });
      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }
      toast.success('Email invite berhasil dikirim ke klien.');
    });
  }

  return (
    <Button onClick={handleClick} disabled={pending}>
      {pending ? 'Mengirim…' : 'Aktifkan portal'}
    </Button>
  );
}

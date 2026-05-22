'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { revokeClientPortalAccess } from '@/lib/actions/portal';

export function RevokePortalButton({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function handleConfirm() {
    start(async () => {
      const res = await revokeClientPortalAccess({ clientId });
      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }
      toast.success('Akses portal klien dicabut.');
      setOpen(false);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="secondary" size="sm">
          Cabut akses
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cabut akses portal?</AlertDialogTitle>
          <AlertDialogDescription>
            Klien tidak bisa login lagi ke portal. Tindakan ini dapat dilakukan
            ulang dengan invite baru kalau dibutuhkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="ghost" disabled={pending}>
              Batal
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="danger"
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              disabled={pending}
            >
              {pending ? 'Mencabut…' : 'Ya, cabut'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

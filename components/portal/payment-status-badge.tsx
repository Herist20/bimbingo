import { Badge } from '@/components/ui/badge';

export function PaymentStatusBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <Badge tone="success">Terverifikasi</Badge>
  ) : (
    <Badge tone="warning">Menunggu verifikasi</Badge>
  );
}

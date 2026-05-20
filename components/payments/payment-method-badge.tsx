import { Badge } from '@/components/ui/badge';
import { PAYMENT_METHOD_LABEL, PAYMENT_METHOD_TONE } from '@/lib/schemas/payment';

export function PaymentMethodBadge({ method }: { method: string }) {
  const m = method as keyof typeof PAYMENT_METHOD_LABEL;
  return (
    <Badge tone={PAYMENT_METHOD_TONE[m] ?? 'neutral'}>
      {PAYMENT_METHOD_LABEL[m] ?? method}
    </Badge>
  );
}

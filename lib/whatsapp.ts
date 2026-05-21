/**
 * Normalize nomor WhatsApp Indonesia ke format internasional tanpa "+".
 * wa.me URL hanya terima format `62xxxxxxxxx` (E.164 minus plus).
 *
 * Contoh:
 *  - "081234567890" → "6281234567890"
 *  - "+6281234567890" → "6281234567890"
 *  - "6281234567890" → "6281234567890"
 *  - "0812-3456-7890" → "6281234567890"
 */
export function normalizeWhatsApp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, ''); // strip non-digit (spasi, dash, +)
  if (digits.length === 0) return null;
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('08')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

export interface WaLinkOptions {
  phone: string | null | undefined;
  message?: string;
}

/**
 * Bangun deeplink WhatsApp.
 * Return null jika nomor tidak valid (kurang dari 10 digit setelah normalize).
 */
export function waLink({ phone, message }: WaLinkOptions): string | null {
  const normalized = normalizeWhatsApp(phone);
  if (!normalized || normalized.length < 10) return null;
  const base = `https://wa.me/${normalized}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export interface WaTemplateContext {
  clientName: string;
  projectTitle?: string;
  milestone?: string;
  daysToDeadline?: number;
  outstanding?: number;
  ownerName?: string;
}

/**
 * Template pesan default — Indonesian friendly tone.
 * Konteks opsional, fallback graceful kalau field tidak ada.
 */
export const WA_TEMPLATES: Record<
  'greeting' | 'deadline' | 'payment' | 'followup' | 'invoice',
  { label: string; build: (ctx: WaTemplateContext) => string }
> = {
  greeting: {
    label: 'Sapa awal',
    build: (ctx) =>
      `Halo Kak ${ctx.clientName}, ini ${ctx.ownerName ?? 'pendamping'} dari Bimbingo. ` +
      (ctx.projectTitle ? `Mau diskusi soal proyek "${ctx.projectTitle}". ` : '') +
      `Kapan waktu yang nyaman untuk ngobrol singkat? 🙏`,
  },
  deadline: {
    label: 'Reminder deadline',
    build: (ctx) => {
      const when =
        ctx.daysToDeadline === undefined
          ? 'mendekat'
          : ctx.daysToDeadline === 0
            ? 'hari ini'
            : ctx.daysToDeadline > 0
              ? `dalam ${ctx.daysToDeadline} hari`
              : `terlambat ${Math.abs(ctx.daysToDeadline)} hari`;
      return (
        `Halo Kak ${ctx.clientName}, sekadar mengingatkan ` +
        (ctx.milestone ? `deadline ${ctx.milestone} ` : 'deadline task ') +
        (ctx.projectTitle ? `proyek "${ctx.projectTitle}" ` : '') +
        `${when}. ` +
        `Kalau ada yang perlu didiskusikan, kabari ya. Semangat! 💪`
      );
    },
  },
  payment: {
    label: 'Reminder pembayaran',
    build: (ctx) => {
      const amount =
        ctx.outstanding && ctx.outstanding > 0
          ? ` sebesar Rp ${ctx.outstanding.toLocaleString('id-ID')}`
          : '';
      return (
        `Halo Kak ${ctx.clientName}, mau follow up pembayaran termin` +
        (ctx.projectTitle ? ` untuk "${ctx.projectTitle}"` : '') +
        `${amount}. ` +
        `Mohon dikabari kalau sudah ditransfer ya, supaya saya bisa update di sistem. Terima kasih 🙏`
      );
    },
  },
  followup: {
    label: 'Follow up halus',
    build: (ctx) =>
      `Halo Kak ${ctx.clientName}, semoga sehat selalu. ` +
      (ctx.projectTitle ? `Untuk "${ctx.projectTitle}", ` : '') +
      `apa ada update atau ada yang perlu saya bantu? ` +
      `Kabari kapan pun ya. 🙂`,
  },
  invoice: {
    label: 'Kirim invoice',
    build: (ctx) =>
      `Halo Kak ${ctx.clientName}, terima kasih banyak atas kepercayaannya. ` +
      `Berikut saya kirim invoice` +
      (ctx.projectTitle ? ` untuk "${ctx.projectTitle}"` : '') +
      `. Mohon dicek ya, kalau ada pertanyaan langsung kabari. 🙏`,
  },
};

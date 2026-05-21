'use client';

import * as React from 'react';
import { MessageCircle, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  WA_TEMPLATES,
  normalizeWhatsApp,
  waLink,
  type WaTemplateContext,
} from '@/lib/whatsapp';

interface WhatsAppButtonProps {
  phone: string | null | undefined;
  context: WaTemplateContext;
  /** Default = "WhatsApp". Bisa diubah ke "Sapa klien" dll. */
  label?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function WhatsAppButton({
  phone,
  context,
  label = 'WhatsApp',
  variant = 'secondary',
  size = 'md',
}: WhatsAppButtonProps) {
  const normalized = normalizeWhatsApp(phone);
  const disabled = !normalized || normalized.length < 10;

  function openTemplate(key: keyof typeof WA_TEMPLATES) {
    if (disabled) {
      toast.error('Nomor WhatsApp tidak valid.');
      return;
    }
    const tmpl = WA_TEMPLATES[key];
    const message = tmpl.build(context);
    const url = waLink({ phone, message });
    if (!url) {
      toast.error('Gagal membangun link WhatsApp.');
      return;
    }
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  function openBlank() {
    if (disabled) {
      toast.error('Nomor WhatsApp tidak valid.');
      return;
    }
    const url = waLink({ phone });
    if (!url) return;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant={variant} size={size} disabled={disabled}>
          <MessageCircle className="h-4 w-4" />
          {label}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <span className="text-sm">Pilih template pesan</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(WA_TEMPLATES) as Array<keyof typeof WA_TEMPLATES>).map((key) => {
          const t = WA_TEMPLATES[key];
          return (
            <DropdownMenuItem key={key} onSelect={() => openTemplate(key)}>
              <span className="flex flex-1 flex-col">
                <span className="text-sm">{t.label}</span>
                <span className="line-clamp-1 text-[10px] text-[var(--text-muted)]">
                  {t.build(context).slice(0, 60)}…
                </span>
              </span>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={openBlank}>
          <span className="text-sm">Buka chat (tanpa template)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

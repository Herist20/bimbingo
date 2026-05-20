# Tech Stack & Arsitektur — Bimbingo

---

## 1. Filosofi Pemilihan Stack

Empat kriteria utama yang memandu setiap pilihan teknologi:

1. **Biaya = Rp 0 untuk MVP.** Semua komponen harus punya free tier yang cukup untuk volume 10–50 klien.
2. **Maintain rendah.** Hindari self-host server / database. Pakai managed services.
3. **DX modern + dokumentasi melimpah.** Kemudahan debug & onboarding kontributor baru.
4. **Path to scale jelas.** Saat sukses, tinggal upgrade plan, bukan rewrite.

Hasilnya: Next.js + Supabase + Vercel — tiga produk yang saling melengkapi dan saat ini menjadi de-facto stack untuk startup MVP.

---

## 2. Stack Final

| Layer | Pilihan | Alasan |
|-------|---------|--------|
| **Framework** | **Next.js 16 (App Router)** | React Server Components mengurangi JS bundle ~ 60%, Server Actions sederhanakan API, runtime Node.js penuh via Fluid Compute |
| **Bahasa** | **TypeScript 5.x (strict)** | Catch bug compile-time, integrasi sempurna dengan Supabase generated types |
| **Styling** | **Tailwind CSS v4** | Zero-runtime, file CSS tunggal, JIT compiler |
| **UI components** | **shadcn/ui** | Bukan library — copy-paste komponen ke repo (full control), built on Radix + Tailwind |
| **Backend** | **Next.js Server Actions + Supabase** | Tidak perlu API route terpisah untuk write; Supabase handle DB + Auth + Storage |
| **Database** | **PostgreSQL via Supabase** | SQL standar, RLS native, generated TS types, free 500 MB |
| **Auth** | **Supabase Auth** | Email/password + magic link gratis, integrasi RLS built-in |
| **Storage** | **Supabase Storage** | S3-compatible, ACL via RLS, 1 GB free |
| **Realtime** | **Supabase Realtime** | Untuk update Kanban antar-tab (dipakai opsional) |
| **Form** | **react-hook-form + zod** | Performa baik (uncontrolled), validasi schema-first, terintegrasi dgn server actions |
| **Data fetch (client)** | **TanStack Query v5** | Cache, optimistic update, dipakai untuk view yang interaktif |
| **Drag-drop** | **dnd-kit** | Modern, accessible, lightweight (vs react-beautiful-dnd yang deprecated) |
| **Tabel data** | **TanStack Table v8** | Headless, full TS, sorting/filter/pagination |
| **Chart** | **Recharts** | Cukup untuk bar/line/pie dashboard finansial |
| **Date** | **date-fns + locale `id`** | Tree-shakable, format Indonesia |
| **Icons** | **lucide-react** | Konsisten dengan shadcn/ui |
| **Validation server** | **zod** (sama dengan client) | Single source of truth schema |
| **Logger (dev)** | **console + Next.js built-in** | Tidak butuh tool berat untuk MVP |
| **Monitoring (prod)** | **Vercel Analytics + Speed Insights** | Free di Hobby plan |
| **Error tracking** | **Sentry (free tier)** | Opsional, masuk di fase 2 |
| **Hosting** | **Vercel (Hobby)** | Otomatis deploy dari Git, free SSL, edge CDN |
| **CI/CD** | **GitHub Actions + Vercel Git integration** | Build & deploy otomatis di push |
| **Package manager** | **pnpm** | Cepat, hemat disk, lockfile deterministik |
| **Linter** | **ESLint + Prettier** | Standar industri |
| **Testing** | **Vitest + Playwright** | Vitest cepat untuk unit, Playwright untuk e2e |

---

## 3. Arsitektur Sistem

### 3.1 Diagram Tingkat Tinggi

```
                    ┌──────────────────────────┐
                    │       User (Admin)       │
                    │   Browser desktop/mobile │
                    └───────────────┬──────────┘
                                    │ HTTPS
                          ┌─────────▼──────────┐
                          │  Vercel Edge CDN   │
                          │ (static assets +   │
                          │  middleware)       │
                          └─────────┬──────────┘
                                    │
                          ┌─────────▼──────────────┐
                          │  Next.js 16 App Router │
                          │  (Fluid Compute - Node)│
                          │                        │
                          │  • RSC rendering       │
                          │  • Server Actions      │
                          │  • Route Handlers      │
                          │  • Middleware          │
                          └─────┬────────────┬─────┘
                                │            │
                  ┌─────────────▼──┐   ┌─────▼─────────────┐
                  │  Supabase JS   │   │  Supabase Admin   │
                  │  (anon client) │   │  (service role)   │
                  └────────┬───────┘   └──────────┬────────┘
                           │                       │
                           └───────────┬───────────┘
                                       │
                  ┌────────────────────▼─────────────────────┐
                  │         Supabase (Singapore)             │
                  │                                          │
                  │  ┌──────────┐ ┌─────────┐ ┌───────────┐ │
                  │  │ Postgres │ │  Auth   │ │  Storage  │ │
                  │  │  + RLS   │ │  + JWT  │ │  + ACL    │ │
                  │  └──────────┘ └─────────┘ └───────────┘ │
                  │  ┌────────────────────────┐             │
                  │  │ Realtime (WebSocket)   │             │
                  │  └────────────────────────┘             │
                  └──────────────────────────────────────────┘
```

### 3.2 Aliran Request (contoh: lihat board Kanban)

1. User buka `/projects/[id]/board`.
2. Vercel Edge serve static shell + jalankan middleware → cek session cookie Supabase.
3. Bila tidak ada session → redirect `/login`. Bila ada → lanjut.
4. Next.js Fluid Compute jalankan RSC: panggil `supabase.from('tasks').select(...)` dengan client server-side (anon key + cookie).
5. RLS Postgres memfilter task ke `owner_id = auth.uid()`.
6. RSC render HTML → stream ke client.
7. Klien hydrate komponen interaktif (dnd-kit board).
8. Saat user drag task → fire **Server Action** `updateTaskStatus(id, status)`.
9. Server Action revalidate path `/projects/[id]/board` → client re-render.

### 3.3 Aliran Request (contoh: upload file draf bab)

1. User pilih file di komponen `<UploadDraftButton/>`.
2. Server Action `getSignedUploadUrl(projectId, taskId, filename)` dipanggil → buat path: `<userId>/<projectId>/<uuid>-<filename>` lalu return signed URL.
3. Browser upload langsung ke Supabase Storage via signed URL (browser → Supabase, **bypass Vercel** untuk hemat bandwidth).
4. Server Action `recordFileMetadata(...)` dipanggil setelah upload sukses → insert row di tabel `files`.
5. UI di-revalidate.

---

## 4. Struktur Folder

```
bimbingo/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── callback/route.ts
│   ├── (dashboard)/
│   │   ├── layout.tsx               # sidebar + topbar
│   │   ├── page.tsx                 # dashboard utama
│   │   ├── clients/
│   │   │   ├── page.tsx             # list klien
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx        # detail klien
│   │   ├── projects/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx         # detail + overview
│   │   │       ├── board/page.tsx   # kanban
│   │   │       ├── timeline/page.tsx
│   │   │       ├── files/page.tsx
│   │   │       └── finance/page.tsx
│   │   ├── lecturers/page.tsx
│   │   ├── finance/page.tsx         # ringkasan keuangan global
│   │   └── settings/page.tsx
│   ├── (marketing)/                 # landing publik
│   │   ├── page.tsx
│   │   ├── pricing/page.tsx
│   │   └── about/page.tsx
│   ├── api/
│   │   └── webhook/                 # untuk fase 2 (payment gateway)
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                          # shadcn/ui (button, card, dialog, ...)
│   ├── forms/                       # ClientForm, ProjectForm, PaymentForm
│   ├── board/                       # KanbanBoard, KanbanColumn, TaskCard
│   ├── files/                       # FileUploader, FileList
│   ├── finance/                     # PaymentTable, FinanceSummary
│   └── shared/                      # AppShell, Sidebar, Topbar, EmptyState
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # browser client
│   │   ├── server.ts                # server (RSC + Actions)
│   │   ├── admin.ts                 # service role (hanya server)
│   │   └── middleware.ts            # untuk middleware Next.js
│   ├── actions/                     # Server Actions per modul
│   │   ├── clients.ts
│   │   ├── projects.ts
│   │   ├── tasks.ts
│   │   ├── payments.ts
│   │   └── files.ts
│   ├── schemas/                     # zod schemas (shared client+server)
│   ├── format.ts                    # formatRupiah, formatTanggal
│   └── utils.ts                     # cn(), dll
├── types/
│   ├── database.ts                  # generated Supabase types
│   └── domain.ts                    # tipe turunan untuk UI
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── config.toml
├── public/
├── tests/
│   ├── unit/
│   └── e2e/
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── vercel.ts                        # konfigurasi Vercel TypeScript
└── package.json
```

---

## 5. Pola Penting

### 5.1 Supabase Client di 3 konteks

```ts
// lib/supabase/server.ts — untuk RSC & Server Actions
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { /* read & write via cookieStore */ } }
  );
}
```

```ts
// lib/supabase/client.ts — untuk Client Components
import { createBrowserClient } from '@supabase/ssr';
export const supabaseBrowser = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
```

```ts
// lib/supabase/admin.ts — service role, HANYA server
import { createClient } from '@supabase/supabase-js';
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);
```

### 5.2 Server Action pattern

```ts
// lib/actions/clients.ts
'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getServerSupabase } from '@/lib/supabase/server';

const ClientSchema = z.object({
  full_name: z.string().min(2).max(100),
  whatsapp: z.string().regex(/^\+?\d{8,15}$/),
  university: z.string().optional(),
  // ...
});

export async function createClient(input: unknown) {
  const data = ClientSchema.parse(input);
  const supabase = await getServerSupabase();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('clients')
    .insert({ ...data, owner_id: user.user.id });
  if (error) throw error;

  revalidatePath('/clients');
}
```

### 5.3 Authorization layered

1. **Layer 1 — Middleware:** redirect tanpa session → `/login`.
2. **Layer 2 — Server (RSC/Action):** revalidasi `auth.getUser()`. Service role tidak pernah dipakai untuk operasi atas nama user.
3. **Layer 3 — Database (RLS):** baris di-filter otomatis berdasarkan `auth.uid()`. **Ini adalah safety net jika layer atas bocor.**

> Aturan: **jangan pernah** percaya layer 1 atau 2 sendirian. RLS adalah lapisan terakhir yang tidak boleh di-bypass.

---

## 6. Performance Strategy

| Teknik | Penerapan |
|--------|-----------|
| React Server Components | Default semua route, kurangi bundle JS |
| Streaming Suspense | Dashboard sections load paralel |
| Partial Prerendering (Next 16) | Shell static + dynamic stream |
| `cache()` & `unstable_cache` | Untuk data jarang berubah (mis. lecturers list) |
| Image Optimization | `next/image` untuk avatar & bukti transfer |
| Edge Middleware | Auth check di edge (latency rendah) |
| Bundle analysis | `next build --analyze` sebelum tiap deploy mayor |
| DB indexes | Sesuai section 3 di `02-database-schema.md` |

Target Lighthouse (mobile):
- Performance ≥ 90
- Accessibility ≥ 95
- Best Practices ≥ 95
- SEO ≥ 95 (untuk landing)

---

## 7. Alternatif yang Dipertimbangkan & Ditolak

| Pilihan dipertimbangkan | Alasan ditolak |
|-------------------------|----------------|
| **Remix / Astro** | DX bagus tapi ekosistem komponen (shadcn) lebih kuat di Next; banyak guide Supabase + Next |
| **Firebase** | Bukan SQL → harder reporting. Vendor lock-in lebih kuat |
| **Pocketbase self-host** | Butuh server VPS, kontradiksi dengan budget Rp 0 |
| **Prisma ORM** | Tambah build complexity. Supabase client cukup untuk MVP. Bisa dimasukkan nanti |
| **MUI / Chakra** | Bundle besar dan kurang fleksibel dibanding shadcn copy-paste |
| **Redux / Zustand** | Tidak dibutuhkan — RSC + TanStack Query sudah handle state |
| **Mantine** | Bagus tapi shadcn lebih sejalan dengan Tailwind |
| **Drizzle ORM** | Lebih ringan dari Prisma, kandidat untuk fase 2 saat schema makin kompleks |

---

## 8. Daftar Dependency Awal (`package.json` snippet)

```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/ssr": "^0.5.0",
    "@tanstack/react-query": "^5.55.0",
    "@tanstack/react-table": "^8.20.0",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0",
    "zod": "^3.23.0",
    "date-fns": "^4.1.0",
    "recharts": "^2.13.0",
    "lucide-react": "^0.450.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "tailwindcss": "^4.0.0",
    "@types/node": "^22.5.0",
    "eslint": "^9.10.0",
    "eslint-config-next": "^16.0.0",
    "prettier": "^3.3.0",
    "prettier-plugin-tailwindcss": "^0.6.0",
    "vitest": "^2.1.0",
    "@playwright/test": "^1.48.0",
    "supabase": "^1.200.0"
  }
}
```

---

## 9. Keputusan Arsitektur (ADR Singkat)

| ID | Keputusan | Konteks | Konsekuensi |
|----|-----------|---------|-------------|
| ADR-001 | Next.js App Router (bukan Pages Router) | Stack baru, RSC default | Wajib pakai server/client component split |
| ADR-002 | Supabase managed (bukan self-host) | Budget Rp 0 + maintain rendah | Tergantung uptime Supabase; mitigasi: backup harian |
| ADR-003 | Server Actions (bukan REST API route) | Lebih ringkas, type-safe | Tidak ada REST yang bisa dipakai mobile app native sebelum fase 2 |
| ADR-004 | shadcn/ui copy-paste (bukan npm install) | Full control + kustomisasi | Update component manual (cek changelog upstream) |
| ADR-005 | RLS sebagai layer otorisasi utama | Defense in depth | Wajib test RLS dengan 2 user terpisah sebelum prod |
| ADR-006 | Tidak pakai ORM (langsung Supabase client) | Reduce complexity, types sudah generated | Migrasi ke Drizzle bila join kompleks bertambah |

Detail keamanan lengkap di [`10-security-compliance.md`](./10-security-compliance.md).

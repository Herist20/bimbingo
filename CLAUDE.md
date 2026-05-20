# CLAUDE.md — Bimbingo

Pedoman kerja untuk Claude (atau kontributor manusia) di project ini.
**Sumber kebenaran lengkap ada di [`docs/`](./docs).** File ini hanya intisari operasional.

---

## 1. Apa ini

**Bimbingo** — sistem manajemen task & operasional untuk layanan pendampingan skripsi.
- Mode 1 (MVP, sekarang): admin-first internal tool, 1 user.
- Mode 2 (roadmap fase 2): + client portal + payment gateway.
- Mode 3 (roadmap fase 3): SaaS multi-tenant.

Stack: **Next.js 16 App Router · TypeScript strict · Tailwind v4 · shadcn-style UI · Supabase (Postgres + Auth + Storage) · Vercel**.

---

## 2. Lima Prinsip Utama (jangan langgar)

1. **YAGNI.** Tulis kode yang dibutuhkan sekarang. Tidak ada abstraksi spekulatif "untuk nanti".
2. **DRY tapi tidak premature.** Tiga duplikasi mirip → pertimbangkan ekstrak. Dua → tunggu.
3. **RLS adalah safety net wajib.** Setiap tabel domain harus RLS-enabled. Service-role hanya untuk webhook/cron, tidak pernah atas nama user.
4. **Server Action default, REST hanya untuk webhook/integrasi eksternal.** Schema zod dipakai shared client ↔ server.
5. **Validasi di boundary, percaya internal.** Input external (form, API) divalidasi zod. Antar function internal: trust the types.

---

## 3. Konvensi File & Struktur

```
app/
├── (app)/                # route group, layout dengan sidebar + topbar (auth-gated)
│   ├── dashboard/        # /dashboard
│   ├── clients/          # /clients
│   ├── projects/         # /projects
│   ├── lecturers/        # /lecturers
│   ├── finance/          # /finance
│   ├── settings/         # /settings
│   └── layout.tsx        # auth gate via getServerSupabase().auth.getUser()
├── (auth)/               # route group untuk halaman auth (no sidebar)
│   └── login/
├── auth/                 # route handler /auth/callback, /auth/sign-out (POST)
├── api/                  # route handlers /api/health
├── page.tsx              # landing publik di /
├── layout.tsx            # root: ThemeProvider, fonts, Toaster
└── globals.css           # Tailwind v4 + token OKLCH

components/
├── ui/                   # primitives (button, input, card, dropdown-menu, dst.)
└── shared/               # app-level (Sidebar, Topbar, ThemeProvider, NAV_ITEMS)

lib/
├── actions/              # Server Actions per modul ('use server' di file action; helper TANPA 'use server')
├── schemas/              # zod schemas shared client + server
├── supabase/             # server / client / admin / middleware
├── env.ts                # validated env vars via zod
├── format.ts             # formatRupiah, formatTanggal
└── utils.ts              # cn() etc.

supabase/
├── migrations/           # SQL migrations (timestamp prefix)
├── seed.sql
└── config.toml

types/
└── database.ts           # auto-generated; jangan edit manual

docs/                     # 13 file — PRD, schema, roadmap, security, dst.
```

### Naming
- File komponen UI: `kebab-case.tsx` (mengikuti shadcn). Default-export OR named-export konsisten per file.
- Server Action file: `lib/actions/<resource>.ts` (clients.ts, projects.ts).
- zod schema file: `lib/schemas/<resource>.ts` dengan named export `<Resource><Action>Schema`.

### Imports
- Path alias `@/*` selalu dipakai (`@/lib/...`, `@/components/...`). Hindari `../../..`.
- `import type {}` untuk type-only imports (ESLint rule mendorong ini).

---

## 4. Pola Server Action

Setiap action mengikuti pola di [`docs/11-api-spec.md`](./docs/11-api-spec.md):

```ts
'use server';

import { ResourceSchema } from '@/lib/schemas/resource';
import { requireUser, ok, fail, ActionError } from './_helper';
import { getServerSupabase } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createResource(input: unknown) {
  try {
    const user = await requireUser();
    const parsed = ResourceSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError('validation_error', 'Input tidak valid', parsed.error.flatten().fieldErrors);
    }
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from('resources')
      .insert({ ...parsed.data, owner_id: user.id })
      .select('id')
      .single();
    if (error) throw error;
    revalidatePath('/resources');
    return ok({ id: data.id });
  } catch (e) {
    return fail(e);
  }
}
```

**Aturan:**
- Return tipe `ActionResult<T>`, **tidak pernah** `void`.
- Tidak ada try/catch yang melempar ulang dengan info berbeda. `fail(e)` menormalisasi.
- `revalidatePath` setelah mutasi yang mengubah list yang sedang ditampilkan user.
- Helper class/type/sync function tidak boleh di file dengan directive `'use server'` (Next.js menolak non-async exports). Pakai `import 'server-only'` saja di helper.

---

## 5. Database & RLS

Lihat [`docs/02-database-schema.md`](./docs/02-database-schema.md).

**Aturan emas:**
- Tiap tabel domain: `owner_id` + RLS policy `owner_id = auth.uid()`.
- Tabel tanpa `owner_id` (mis. `tasks`): RLS via parent yang punya `owner_id`.
- Custom fields per entitas via JSONB column `custom_data` + tabel meta `custom_fields`. Lihat [`docs/12-custom-fields-extensibility.md`](./docs/12-custom-fields-extensibility.md).
- Migrasi: `pnpm supabase migration new <name>` → file SQL di `supabase/migrations/`. Naming `YYYYMMDDHHMMSS_<snake_case>.sql`.
- **Jangan** drop column/table di migrasi production tanpa review.
- Setelah migrasi push, `pnpm db:types` regen `types/database.ts`.

### Encoding
- Migrasi & file teks lain **wajib UTF-8 tanpa BOM**. Postgres reject BOM dengan SQLSTATE 42601.
- Hindari `Set-Content -Encoding UTF8` di Windows PowerShell 5.1 (writes BOM). Pakai Edit tool atau `[System.IO.File]::WriteAllText($p, $c, [System.Text.UTF8Encoding]::new($false))`.

---

## 6. Security Checklist (sebelum commit code yang menyentuh data user)

- [ ] Action panggil `requireUser()` di awal.
- [ ] Input divalidasi zod.
- [ ] Tidak ada `getAdminSupabase()` di code-path user-facing.
- [ ] RLS-tested: kalau bikin tabel baru, tambah policy + smoke test cross-tenant.
- [ ] Tidak ada `SUPABASE_SERVICE_ROLE_KEY` di file `'use client'`.
- [ ] Tidak ada console.log dengan PII (nama klien, NIM, dosbing) — pakai UUID saja.
- [ ] Error message ke user generic, bukan leak schema info ("Email atau password salah" bukan "User not found").

Lihat [`docs/10-security-compliance.md`](./docs/10-security-compliance.md).

---

## 7. Quality Gates Wajib

Sebelum commit:

```bash
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint .
```

Sebelum merge ke `main`:
- ✅ typecheck
- ✅ lint
- ✅ test unit (`pnpm test`) — saat sudah ada
- ✅ smoke test manual di browser desktop + mobile DevTools

---

## 8. Git Workflow

- Branch: **main only** (single-branch strategy).
- Remote: 1 `origin` dengan dua push URL (GitHub + GitLab). `git push origin main` push ke keduanya.
- Commit message: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
- Multi-paragraph: `git commit -m "subject" -m "para 1" -m "para 2"`. Tidak perlu temp file.
- Tidak push ke `main` tanpa lulus typecheck + lint.

---

## 9. Anti-Overcoding Rules

Hindari:
- ❌ Helper "untuk jaga-jaga" yang belum ada caller. Buat saat dibutuhkan, bukan sekarang.
- ❌ Abstraksi 3-layer ketika 1 file 50-line sudah cukup.
- ❌ Try/catch wrapper di setiap function. Catch di boundary (server action).
- ❌ Error handling untuk skenario yang DB constraint sudah handle (mis. unique constraint).
- ❌ Validation di tempat yang RLS sudah handle (mis. cek owner_id manual di action — RLS yang tolak).
- ❌ Feature flag untuk fitur yang belum ada cabang lain. Cukup pakai branch git.
- ❌ Refactor di PR fitur. Refactor PR sendiri.
- ❌ Komentar yang mengulangi kode (`// increment counter` di atas `counter++`).
- ❌ JSDoc di function private internal. Type signature sudah cukup.

Dianjurkan:
- ✅ Komentar untuk **non-obvious why**: workaround bug eksternal, batasan platform, keputusan trade-off.
- ✅ Pakai discriminated union untuk state (`ActionResult<T>`) daripada `result.data?.error`.
- ✅ Server Component default. `'use client'` hanya untuk komponen yang butuh interaktivitas / state lokal.

---

## 10. UX & Tonalitas

- Bahasa UI: **Indonesia natural**. Sentence case untuk button label.
- Format: `formatRupiah(1500000)` → `Rp 1.500.000`, `formatTanggal(date)` → `20 Mei 2026` (date-fns `id` locale).
- Toast feedback wajib untuk: success action, error action. Confirmation destruktif wajib via AlertDialog.
- Loading state: Skeleton, bukan spinner di tengah.
- Empty state: ilustrasi sederhana + CTA action utama.
- Lihat [`docs/05-ui-ux-design.md`](./docs/05-ui-ux-design.md).

---

## 11. Quick Reference Path

| Topik | File |
|-------|------|
| Visi & lingkup MVP | `docs/01-product-requirements.md` |
| Schema DB + RLS | `docs/02-database-schema.md` |
| Tech stack alasan | `docs/03-tech-stack-architecture.md` |
| Spek fitur + AC | `docs/04-feature-specifications.md` |
| Design system | `docs/05-ui-ux-design.md` |
| Timeline 22 hari | `docs/06-implementation-roadmap.md` |
| Landing PRD | `docs/07-landing-page-prd.md` |
| Deploy + DevOps | `docs/08-deployment-devops.md` |
| Roadmap eskalasi | `docs/09-monetization-scalability.md` |
| Security & UU PDP | `docs/10-security-compliance.md` |
| Server Action spec | `docs/11-api-spec.md` |
| Custom fields | `docs/12-custom-fields-extensibility.md` |

---

## 12. Saat Ragu

1. Baca `docs/` yang relevan dulu.
2. Pilih solusi paling sederhana yang menyelesaikan masalah saat ini.
3. Tanya owner (`nosuke1@gmail.com`) sebelum keputusan arsitektur besar atau destruktif (drop table, force-push, ubah RLS policy).

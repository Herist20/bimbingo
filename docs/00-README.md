# Bimbingo — Dokumentasi Proyek

> Sistem manajemen task & operasional untuk layanan pendampingan / joki skripsi.
> Stack: **Next.js 16 (App Router) + Supabase + Tailwind CSS + shadcn/ui + Vercel**.
> Target biaya operasional awal: **Rp 0 / bulan** (free tier semua platform).

---

## Tujuan Proyek

Membangun aplikasi web internal (admin-first) untuk mengelola siklus pengerjaan skripsi klien — mulai dari intake klien, perencanaan bab, pelacakan progres bimbingan, pencatatan keuangan termin, sampai arsip dokumen. Sistem ini menggantikan kombinasi spreadsheet, WhatsApp, dan Google Drive yang biasanya dipakai pelaku jasa joki skripsi.

Dirancang single-tenant (1 admin / tim kecil mengelola N klien) untuk MVP, dengan jalur eskalasi yang jelas ke multi-tenant + portal klien + payment gateway di fase berikutnya.

---

## Struktur Dokumen

| File | Fokus | Audiens |
|------|-------|---------|
| [`01-product-requirements.md`](./01-product-requirements.md) | PRD utama, visi, persona, scope MVP vs out-of-scope | Owner, PM |
| [`02-database-schema.md`](./02-database-schema.md) | Skema PostgreSQL, RLS policies, indexes, migrations | Backend dev |
| [`03-tech-stack-architecture.md`](./03-tech-stack-architecture.md) | Pemilihan stack + arsitektur sistem + alasan | Tech lead |
| [`04-feature-specifications.md`](./04-feature-specifications.md) | Spek fitur detail + acceptance criteria | Dev, QA |
| [`05-ui-ux-design.md`](./05-ui-ux-design.md) | Design system, tipografi, layout, komponen | Designer, FE dev |
| [`06-implementation-roadmap.md`](./06-implementation-roadmap.md) | Roadmap 4 minggu + breakdown task harian | Dev, PM |
| [`07-landing-page-prd.md`](./07-landing-page-prd.md) | PRD landing page publik untuk akuisisi klien | Marketing, FE dev |
| [`08-deployment-devops.md`](./08-deployment-devops.md) | Vercel, env vars, CI/CD, backup | DevOps |
| [`09-monetization-scalability.md`](./09-monetization-scalability.md) | Strategi eskalasi, monetisasi, multi-tenant | Owner, PM |
| [`10-security-compliance.md`](./10-security-compliance.md) | Auth, RLS, OWASP top 10, data privacy | Security, lead dev |
| [`11-api-spec.md`](./11-api-spec.md) | Kontrak Server Actions / REST routes | FE & BE dev |
| [`12-custom-fields-extensibility.md`](./12-custom-fields-extensibility.md) | Custom fields per entitas (ala Jira/ClickUp) | Tech lead, dev |

---

## Cara Membaca

1. **Baru bergabung?** Mulai dari `01-product-requirements.md` untuk paham _why_, lalu `03-tech-stack-architecture.md` untuk paham _how_.
2. **Mau langsung coding?** Buka `06-implementation-roadmap.md` — task sudah dipecah per hari.
3. **Mau modifikasi skema DB?** Wajib baca `02-database-schema.md` + `10-security-compliance.md` sebelum push migration ke Supabase.
4. **Deploy?** Ikuti `08-deployment-devops.md` step-by-step.

---

## Ringkasan Stack

```
Frontend  : Next.js 16 (App Router, RSC) + TypeScript
Styling   : Tailwind CSS v4 + shadcn/ui
Backend   : Next.js Server Actions + Supabase (Postgres + Auth + Storage + Realtime)
Hosting   : Vercel (Hobby plan, free)
Auth      : Supabase Auth (email/password + magic link)
Database  : PostgreSQL via Supabase (free tier: 500 MB)
Storage   : Supabase Storage (free tier: 1 GB)
Realtime  : Supabase Realtime (untuk update Kanban live)
Form      : react-hook-form + zod (validation)
State     : React Server Components + TanStack Query (client cache)
Icons     : lucide-react
Dates     : date-fns + date-fns/locale (id)
Charts    : Recharts (untuk dashboard finansial)
```

---

## Quick Start (Setelah Repo Ada)

```bash
# 1. Clone & install
git clone <repo-url> bimbingo
cd bimbingo
pnpm install

# 2. Setup env (lihat 08-deployment-devops.md)
cp .env.example .env.local
# isi NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# 3. Jalankan migrasi Supabase (lihat 02-database-schema.md)
pnpm supabase db push

# 4. Dev server
pnpm dev
# buka http://localhost:3000
```

---

## Status Proyek

| Milestone | Status | Target |
|-----------|--------|--------|
| Dokumentasi lengkap | ✅ Selesai | 2026-05-20 |
| Bootstrap repo + Supabase | ⏳ Pending | Minggu 1 |
| MVP siap pakai internal | ⏳ Pending | Minggu 4 |
| Landing page live | ⏳ Pending | Bulan 2 |
| Client portal + payment gateway | ⏳ Pending | Bulan 3 |

---

## Kontak / Ownership

- **Project owner:** nosuke1@gmail.com
- **Tanggal dokumen dibuat:** 2026-05-20
- **Lisensi:** Internal / Proprietary

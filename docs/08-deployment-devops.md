# Deployment & DevOps — Bimbingo

---

## 1. Lingkungan

| Env             | Branch Git       | URL                                      | Database                                                       |
| --------------- | ---------------- | ---------------------------------------- | -------------------------------------------------------------- |
| **Development** | feature branches | `http://localhost:3000`                  | Supabase project (linked) atau `supabase start` lokal          |
| **Preview**     | PR ke `main`     | URL otomatis Vercel `*.vercel.app`       | Supabase project yang sama (atau Branch via Supabase Branches) |
| **Production**  | `main`           | `bimbingo.vercel.app` atau domain custom | Supabase project (Singapore)                                   |

---

## 2. Variabel Lingkungan

`.env.example`:

```bash
# Public (boleh expose ke browser)
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Server only (jangan expose ke browser)
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_DB_URL=postgresql://...
# Untuk fase 2:
# RESEND_API_KEY=
# MIDTRANS_SERVER_KEY=
# FONNTE_API_KEY=

# Optional dev
NEXT_TELEMETRY_DISABLED=1
```

**Aturan keamanan kunci:**

- `SUPABASE_SERVICE_ROLE_KEY` **HANYA** dipakai di server-side (RSC, Server Actions, Route Handlers).
- Tidak boleh ada `process.env.SUPABASE_SERVICE_ROLE_KEY` di file `'use client'`.
- Tambahkan ESLint rule `no-restricted-properties` untuk catch ini.

### Sinkronisasi env

Pakai Vercel CLI:

```bash
# Pull env dari Vercel ke local
vercel env pull .env.local

# Push env baru
vercel env add SUPABASE_SERVICE_ROLE_KEY production
```

---

## 3. Vercel Setup

### 3.1 Bootstrap project

```bash
pnpm i -g vercel
vercel login
vercel link    # Hubungkan repo ke Vercel project
vercel env pull .env.local
```

### 3.2 `vercel.ts` (TypeScript config)

```ts
// vercel.ts
import { routes, type VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  buildCommand: 'pnpm build',
  installCommand: 'pnpm install --frozen-lockfile',
  framework: 'nextjs',

  // Functions config
  functions: {
    'app/api/**/route.ts': { maxDuration: 60 },
  },

  // Cron jobs (fase 2)
  crons: [
    // {
    //   path: '/api/cron/deadline-reminders',
    //   schedule: '0 0 * * *', // 07:00 WIB = 00:00 UTC
    // },
    // {
    //   path: '/api/cron/keepalive', // hindari free-tier Supabase pause
    //   schedule: '0 */6 * * *',
    // },
  ],

  headers: [
    routes.cacheControl('/static/(.*)', { public: true, maxAge: '1 year', immutable: true }),
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ],
};
```

### 3.3 Plan

- **Hobby (free).** Cukup untuk MVP.
  - 100 GB bandwidth / bulan.
  - 100K Edge function invocations.
  - 100 hours build / bulan.
- Upgrade ke **Pro ($20/bulan)** saat:
  - Bandwidth > 80% di bulan berturut-turut.
  - Butuh team collaboration.
  - Butuh SLA & monitoring lebih dalam.

### 3.4 Domain custom (opsional)

- Beli domain di Namecheap/IDwebhost (~ Rp 150rb/tahun).
- Vercel Dashboard → Project Settings → Domains → tambah.
- DNS otomatis ter-validasi.

---

## 4. Supabase Setup

### 4.1 Project creation

- Region: **Singapore (ap-southeast-1)**.
- Database password: simpan di password manager (tidak di repo).
- DB plan: **Free** untuk MVP.

### 4.2 CLI local link

```bash
pnpm supabase login
pnpm supabase link --project-ref <ref>
```

### 4.3 Apply migrations

```bash
# Local dev (jika pakai supabase start)
pnpm supabase db reset

# Production
pnpm supabase db push
```

### 4.4 Generate TypeScript types

```bash
pnpm supabase gen types typescript --linked > types/database.ts
```

Tambah ke script `package.json`:

```json
{
  "scripts": {
    "db:types": "supabase gen types typescript --linked > types/database.ts",
    "db:push": "supabase db push",
    "db:reset": "supabase db reset"
  }
}
```

### 4.5 Backup

- **Auto backup harian** (free tier: retain 7 hari).
- **Manual backup mingguan** via cron lokal:

```bash
# Tambahkan ke crontab atau Windows Task Scheduler
# 02:00 setiap Senin
0 2 * * 1 pg_dump $SUPABASE_DB_URL | gzip > ~/bimbingo-backups/$(date +\%Y-\%m-\%d).sql.gz
```

Atau pakai GitHub Actions terjadwal yang dump ke GitHub artifact (free).

### 4.6 Cegah free-tier pause

Supabase free tier akan pause project setelah ~ 7 hari inaktif. Mitigasi:

- Vercel Cron tiap 6 jam ping endpoint `/api/health` yang melakukan `select 1`.
- Atau cukup pastikan admin login minimal sekali per minggu.

---

## 5. CI/CD

### 5.1 Vercel Git Integration (default)

- Push ke `main` → production deploy.
- Push ke branch lain → preview deploy.
- Comment otomatis di PR berisi URL preview.

### 5.2 GitHub Actions (tambahan)

`.github/workflows/ci.yml`:

```yaml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lint-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: '24', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test

  e2e:
    runs-on: ubuntu-latest
    needs: lint-test
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: '24', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e
        env:
          E2E_BASE_URL: ${{ secrets.E2E_BASE_URL }}
          E2E_TEST_EMAIL: ${{ secrets.E2E_TEST_EMAIL }}
          E2E_TEST_PASSWORD: ${{ secrets.E2E_TEST_PASSWORD }}
```

### 5.3 Migration safety

- PR yang ubah `supabase/migrations/*.sql` wajib di-review.
- Tambahkan workflow yang jalankan `supabase db lint` (jika tersedia) atau `pg_validate` di CI.
- Untuk production, jalankan `supabase db push --linked` **manual** dari workstation (jangan otomatis di Vercel build, supaya kontrol kapan migrasi run).

---

## 6. Monitoring

| Aspek                     | Tool                                        | Setup                                               |
| ------------------------- | ------------------------------------------- | --------------------------------------------------- |
| Performance web vitals    | **Vercel Speed Insights**                   | Aktifkan di Vercel dashboard, install paket di Next |
| Analytics traffic         | **Vercel Analytics**                        | Aktifkan + install paket                            |
| Error tracking (opsional) | **Sentry** (free 5K events/bln)             | Setup di fase 2                                     |
| Database query slow log   | Supabase Dashboard → Performance            | Cek mingguan                                        |
| Storage usage             | Supabase Dashboard → Storage                | Cek mingguan                                        |
| Uptime                    | **UptimeRobot** (free) atau **BetterStack** | Set monitor ping `/api/health` tiap 5 menit         |

### Endpoint `/api/health`

```ts
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await getServerSupabase();
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) throw error;
    return NextResponse.json({ status: 'ok', ts: Date.now() });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: (err as Error).message }, { status: 503 });
  }
}
```

---

## 7. Logging

- **Server logs:** Vercel native (lihat `vercel logs <deployment>`).
- **Structured log helper** sederhana di `lib/logger.ts`:

```ts
export const log = {
  info: (msg: string, ctx?: object) =>
    console.log(JSON.stringify({ level: 'info', msg, ts: new Date().toISOString(), ...ctx })),
  warn: (msg: string, ctx?: object) =>
    console.warn(JSON.stringify({ level: 'warn', msg, ts: new Date().toISOString(), ...ctx })),
  error: (msg: string, ctx?: object) =>
    console.error(JSON.stringify({ level: 'error', msg, ts: new Date().toISOString(), ...ctx })),
};
```

- **Tidak ada PII** (nama klien, NIM) di log. Hanya ID UUID.

---

## 8. Rollback Strategy

Vercel menyimpan setiap deploy. Untuk rollback:

```bash
# Lihat deployment list
vercel ls

# Promote deployment lama ke production
vercel promote <deployment-url> --scope <team>
```

Untuk perubahan DB destruktif: SIAPKAN migration rollback (`supabase migration new --rollback`) sebelum apply.

---

## 9. Cost Tracking

| Layanan        | Free tier                | Trigger upgrade                   |
| -------------- | ------------------------ | --------------------------------- |
| Vercel Hobby   | 100 GB bandwidth         | > 80 GB/bulan 2x berturut         |
| Supabase Free  | 500 MB DB + 1 GB storage | > 400 MB DB atau > 800 MB storage |
| Domain         | ~ Rp 150rb/tahun         | (sudah dibayar)                   |
| Resend (email) | 3K/bln                   | Fase 2 jika butuh notif email     |
| Sentry         | 5K events/bln            | Fase 2 jika butuh error tracking  |

Total **target biaya MVP: Rp 0/bulan** (domain opsional).

---

## 10. Disaster Recovery Plan

| Scenario        | Action                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------- |
| Vercel down     | Tidak ada SLO; Vercel uptime historis > 99.99%. Tunggu recovery                                   |
| Supabase down   | Tidak ada SLO free tier. Untuk Pro: support ticket. Fallback: tampilkan halaman maintenance + log |
| Data corruption | Restore dari backup harian Supabase atau dump mingguan                                            |
| Code regression | `vercel promote` ke deployment sebelumnya                                                         |
| Domain hijack   | Aktifkan registrar lock + 2FA Namecheap                                                           |

---

## 11. Pre-Launch Checklist

- [ ] Semua env vars di Vercel production sudah ter-set.
- [ ] Migrasi DB di production sama dengan local.
- [ ] RLS aktif di semua tabel domain (cek via Supabase dashboard).
- [ ] HTTPS aktif (otomatis dari Vercel).
- [ ] Security headers (lihat `vercel.ts` section 3.2).
- [ ] `/api/health` mengembalikan 200.
- [ ] Lighthouse mobile ≥ 85 di halaman utama.
- [ ] Logout berfungsi (token revoked di server).
- [ ] User dummy bisa dihapus dari Supabase Auth.
- [ ] Privacy & Terms placeholder ada.
- [ ] Domain custom (opsional) ter-config + DNS propagated.
- [ ] UptimeRobot monitor `/api/health`.
- [ ] Backup script harian / mingguan terjadwal.

---

## 12. Runbook Singkat untuk Insiden

1. **Site error 500.** Cek `vercel logs` 5 menit terakhir → identifikasi route → reproduce local.
2. **Slow query Supabase.** Cek Supabase Performance → tambah index → push migrasi.
3. **Login bermasalah.** Cek `auth.users` di Supabase → cek session cookie di browser dev tools → cek `middleware.ts` log.
4. **Storage upload gagal.** Cek bucket policy + quota usage di Supabase dashboard.
5. **Free tier paused.** Klik "Restore project" di Supabase dashboard. Aktifkan keepalive cron.

---

## 10. Konfigurasi Email Template Supabase — Client Portal

Diperlukan setelah migrasi `20260522000001_client_portal.sql` diapply, agar invite + login OTP klien berfungsi.

### 10.1 Switch Magic Link template ke OTP code (anti-linkify)

Supabase Dashboard → Authentication → Email Templates → **Magic Link**:

- **Subject:** `Kode masuk Bimbingo: {{ .Token }}`
- **Body (HTML, anti auto-linkify Gmail/Outlook/Apple Mail):**

  ```html
  <!-- Anti format-detection iOS/Apple Mail -->
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
    <p style="font-size: 14px; color: #555; margin: 0 0 8px;">
      Kode masuk Bimbingo Anda:
    </p>

    <!-- Wrap dalam <a href="#"> + pointer-events:none supaya email client tidak override jadi link IP/telepon -->
    <a href="#" style="
      display: inline-block;
      color: #7a3e1c;
      text-decoration: none;
      pointer-events: none;
      font-family: 'Courier New', Consolas, monospace;
      font-size: 28px;
      font-weight: 600;
      letter-spacing: 0.4em;
      padding: 14px 20px 14px 24px;
      background: #fdf6ec;
      border: 1px solid #d4a574;
      border-radius: 8px;
      margin: 8px 0;
    ">{{ .Token }}</a>

    <p style="font-size: 13px; color: #888; margin: 12px 0 0;">
      <strong style="color: #c4542a;">Salin (copy)</strong> kode di atas dan tempel ke kolom OTP di portal.
      <strong style="color: #c4542a;">Jangan diklik</strong> — kode bukan link.
    </p>

    <p style="font-size: 12px; color: #aaa; margin-top: 16px;">
      Kode berlaku 1 jam. Jangan bagikan ke siapapun.
    </p>
  </div>

  <style>
    /* Apple Mail data detector override */
    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
      pointer-events: none !important;
    }
  </style>
  ```

**Alasan teknis (2 lapis bug yang ditangani):**

1. **Default `{{ .ConfirmationURL }}` rentan email prefetcher.** Microsoft Defender Safe Links / Gmail prefetcher "bakar" link sebelum klien klik → error `Token has expired or is invalid`. OTP code text-only tidak punya masalah ini.

2. **Auto-linkify email client.** Gmail (web + mobile), Outlook, Apple Mail otomatis bikin teks numerik jadi link kalau pattern cocok dengan IPv4 atau nomor telepon. Token 10 digit `1102189146` → Gmail render sebagai `http://1.102.189.146/` (tiap oktet ≤ 255 = valid IPv4). Klik = nyasar ke IP random.

   Mitigasi:
   - `letter-spacing: 0.4em` antar digit memecah pola → email client tidak deteksi numerik.
   - Bungkus dalam `<a href="#"` + `pointer-events: none` → email client tidak overwrite anchor existing.
   - Label visual "Jangan diklik" instruksi eksplisit ke pengguna.
   - `<style>` untuk Apple Mail `x-apple-data-detectors` override.

### 10.1.1 OTP length (opsional)

Default Supabase OTP length = 6 digit. Length 6 ideal — mudah disalin, tidak bertabrakan dengan pola IP/telepon yang sering di-linkify. Jangan set > 6 kecuali ada alasan kuat.

Kalau sudah terlanjur set 8+ digit: Auth → Providers → Email → OTP Length → balik ke `6` → Save.

### 10.2 Customize Invite User template — pakai `token_hash` flow (HTML)

Authentication → Email Templates → **Invite User**:

- **Subject:** `Anda diundang ke Portal Bimbingo`
- **Body (HTML, dengan CTA button supaya jelas + anti-linkify pendukung):**

  ```html
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
    <h2 style="font-size: 20px; color: #7a3e1c; margin: 0 0 12px;">
      Halo {{ .Data.full_name }} 👋
    </h2>

    <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 0 0 16px;">
      Anda diundang mengakses <strong>Portal Klien Bimbingo</strong> untuk memantau
      progres skripsi, status tahap, dan pembayaran termin.
    </p>

    <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 0 0 20px;">
      Klik tombol di bawah untuk mengaktifkan akun:
    </p>

    <a
      href="{{ .SiteURL }}/portal/auth/callback?token_hash={{ .TokenHash }}&type=invite"
      style="
        display: inline-block;
        background: #c4542a;
        color: #ffffff;
        padding: 12px 24px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        font-size: 15px;
        margin: 8px 0;
      "
    >
      Aktifkan akun portal →
    </a>

    <p style="font-size: 13px; color: #888; line-height: 1.6; margin: 20px 0 0;">
      Setelah aktif, login berikutnya cukup masukkan email Anda dan kode OTP 6 digit
      yang akan kami kirim ke email ini.
    </p>

    <p style="font-size: 12px; color: #aaa; margin-top: 24px; border-top: 1px solid #eee; padding-top: 12px;">
      Tidak merasa diundang? Abaikan email ini — akun tidak akan aktif tanpa Anda
      klik tombol di atas.
    </p>
  </div>

  <style>
    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
      pointer-events: none !important;
    }
  </style>
  ```

**Alasan teknis:**

1. **Token hash flow lebih bersih.** Default `{{ .ConfirmationURL }}` pakai **implicit hash flow** (`#access_token=...`) → token di hash fragment yang tidak dikirim ke server, harus diproses JS browser. Pakai `{{ .TokenHash }}` di query param → server route `/portal/auth/callback` langsung baca lewat `verifyOtp({ token_hash, type: 'invite' })`. Tidak ada JS hack, tidak ada token bocor di URL bar.

2. **Format CTA button (bukan raw link).** Tombol berwarna brand-coloured + label jelas "Aktifkan akun portal" menghilangkan ambiguitas: ini link beneran (boleh klik), beda dari OTP code (jangan klik).

3. **`{{ .Data.full_name }}`** mengambil dari user_metadata yang dikirim server action `inviteClientToPortal` saat memanggil `auth.admin.inviteUserByEmail({ data: { full_name, role: 'client' } })`.

4. **`x-apple-data-detectors`** override mencegah Apple Mail iOS otomatis ubah email/teks lain di body jadi link.

### 10.3 Redirect URLs allowlist + Site URL

Authentication → URL Configuration:

- **Site URL:** `https://<prod-domain>.vercel.app` (Production). Saat dev manual invite dari `pnpm dev`, sementara ubah ke `http://localhost:3000`.
- **Redirect URLs** (tambah semuanya):
  - `http://localhost:3000/portal/auth/callback`
  - `https://<prod-domain>.vercel.app/portal/auth/callback`
  - Opsional wildcard: `http://localhost:3000/**` dan `https://<prod-domain>.vercel.app/**`

Tanpa URL di allowlist, Supabase **fall back ke Site URL** dan abaikan `redirectTo` dari `inviteUserByEmail`. Itu yang bikin invite mendarat di `http://localhost:3000/#access_token=...` alih-alih `/portal/auth/callback`.

### 10.4 Defense in depth — `HashAuthCatcher`

Kalau template lama masih dipakai atau Redirect URL belum di-allowlist, klien bisa nyasar ke Site URL dengan hash. Komponen `components/shared/hash-auth-catcher.tsx` (terpasang di root layout) auto-forward `#access_token=...` ke `/portal/auth/callback#...` yang punya HTML fallback untuk `setSession` via supabase-js browser client. Tidak mengganggu navigasi normal (no-op kalau hash tidak ada).

### 10.5 Smoke test (continued)

1. Login admin → buka klien dengan email diisi → klik tombol "Aktifkan portal".
2. Buka inbox klien (gunakan email alternate untuk testing) → klik link invite.
3. Browser arahkan ke `{{ .SiteURL }}/portal/auth/callback?token_hash=...&type=invite` → server `verifyOtp` → redirect ke `/portal`.
4. Verifikasi: dashboard tampil, cuma data klien tersebut yang muncul.
5. Logout via tombol di header → `/portal/login`.
6. Masuk lagi: input email → terima 6-digit code → input → masuk portal.
7. Coba akses `/dashboard` sebagai klien → middleware redirect ke `/portal` (admin route diblok).
8. Dari admin: klien yang sama → klik "Cabut akses" → konfirmasi.
9. Klien refresh (atau tunggu ≤5 menit cache cookie `bm_role`) → request berikutnya redirect ke `/portal/login` karena auth user sudah dihapus.

### 10.6 RLS smoke test

Jalankan `tests/rls/portal.sql` via Supabase SQL editor — substitute UUID, compare counts dengan expected value yang tertulis di komentar tiap query. Lihat `tests/rls/README.md` untuk panduan.

### 10.7 SMTP rate limit & custom SMTP email

Supabase built-in SMTP punya **rate limit ketat** untuk email auth (default ~2–4 email/jam per project di free tier). Saat testing aktif (invite + login OTP berulang), gampang kena `429: email rate limit exceeded`.

Gejala: `requestPortalOtp` return error `'rate_limited'` → toast "Terlalu banyak permintaan kode. Coba lagi dalam 1 jam, atau hubungi admin."

**Solusi short-term**: tunggu 1 jam, atau hubungi admin yang trigger invite ulang.

**Solusi proper (untuk produksi)**: setup **custom SMTP** di Authentication → Email Templates → SMTP Settings.

Rekomendasi: **Resend** (3K email/bulan free):

1. Daftar Resend → buat API key → verify domain pengirim.
2. Supabase Dashboard → Authentication → Email Templates → SMTP Settings → Enable Custom SMTP:
   - Host: `smtp.resend.com`
   - Port: `465` (TLS) atau `587` (STARTTLS)
   - Username: `resend`
   - Password: API key Resend
   - Sender email: email yang terverifikasi di Resend
   - Sender name: `Bimbingo`
3. Klik Save → trigger test email.

Custom SMTP **menghilangkan rate limit** Supabase (limit beralih ke kuota Resend yang jauh lebih besar).

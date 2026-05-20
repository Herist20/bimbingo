# Security & Compliance — Bimbingo

---

## 1. Threat Model Singkat

Data sensitif yang dijaga:
- **Identitas klien** — nama lengkap, NIM, kampus, kontak. Bukan PII paling sensitif (mis. tidak ada KTP), tapi tetap private.
- **Detail dosen** — nama, karakteristik. Berpotensi defamasi jika bocor.
- **Data keuangan** — nominal kontrak, bukti pembayaran.
- **Dokumen draf skripsi** — karya intelektual klien.

Aktor ancaman:
1. **Curious public** — mencoba akses URL tanpa login.
2. **Bug exploiter** — coba SQL injection, IDOR, XSS.
3. **Eks-klien / kompetitor** — punya kredensial lama, coba scrape data klien lain.
4. **Akun admin terkompromi** — phishing / password lemah.
5. **Insider** (skenario tim) — admin lain mengintip data yang bukan kewenangannya.

---

## 2. Defense in Depth

Empat lapisan otorisasi yang saling backup:

```
┌──────────────────────────────────────────────────────┐
│  L1. Vercel Edge — HTTPS, WAF, Firewall, BotID       │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│  L2. Next.js Middleware — Session cookie validation  │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│  L3. Server Action / RSC — Re-verify auth.getUser()  │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│  L4. Supabase RLS — Filter rows by auth.uid()        │
└──────────────────────────────────────────────────────┘
```

Aturan: **L4 (RLS) adalah safety net.** Jangan pernah skip RLS dengan service-role di operasi user-facing.

---

## 3. Authentication

| Aspek | Implementasi |
|-------|--------------|
| Provider | Supabase Auth |
| Metode | Email + password, magic link |
| Session | JWT di httpOnly cookie, expire 7 hari, refresh sliding |
| Password policy | Min 12 char, kombinasi huruf + angka. Supabase enforce |
| Rate limit | 5 failed login / 15 min per IP (Supabase default) |
| MFA | TOTP opsional (Supabase Pro). Free tier: disabled. Aktifkan saat skenario A |
| Password reset | Email link, expire 1 jam, single-use |
| Email verification | Wajib sebelum login pertama (untuk user baru) |

---

## 4. Authorization (RLS)

Lihat detail policy di [`02-database-schema.md`](./02-database-schema.md) section 5.

Aturan implementasi:
- **Semua tabel domain** punya RLS enabled. Tabel tanpa RLS = bug.
- **Service role hanya untuk:**
  - Cron jobs (mis. reminder deadline).
  - Webhook handler (payment gateway callback).
  - Migration script.
- Service role **tidak pernah** dipakai untuk operasi atas nama user yang sedang login. Selalu pakai client dengan cookie session user.

### Test RLS wajib
Sebelum production, jalankan test script:

```sql
-- tests/rls/cross-tenant-check.sql
-- Skenario: user B coba akses data user A
set role authenticated;
set request.jwt.claim.sub = '<user-B-uuid>';

select count(*) from clients;
-- Expected: 0 (karena clients hanya milik user A)

select * from clients where id = '<client-of-user-A-uuid>';
-- Expected: empty
```

---

## 5. Input Validation

- **Server-side validation** dengan zod **wajib** untuk semua server action. Tidak boleh percaya input client.
- **Client-side validation** sebagai UX, bukan keamanan.
- Schema **shared** antara client & server (file di `lib/schemas/`).

### Contoh

```ts
// lib/schemas/client.ts
import { z } from 'zod';

export const ClientCreateSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  whatsapp: z.string().regex(/^(\+62|62|0)8\d{8,12}$/, 'Format WhatsApp tidak valid'),
  email: z.string().email().optional().or(z.literal('')),
  university: z.string().max(150).optional(),
  semester: z.number().int().min(1).max(20).optional(),
  target_defense: z.string().date().optional(),
  // ... validasi field lain
});

export type ClientCreateInput = z.infer<typeof ClientCreateSchema>;
```

---

## 6. OWASP Top 10 — Coverage

| # | Risk | Mitigasi |
|---|------|----------|
| A01 | Broken Access Control | RLS + 4 layer (section 2). Test cross-tenant wajib |
| A02 | Cryptographic Failures | HTTPS enforced di Vercel; Supabase data at-rest dienkripsi |
| A03 | Injection | Tidak ada raw SQL dari user input. Pakai Supabase client (parameterized). Zod validasi semua input |
| A04 | Insecure Design | RLS-first, secure-by-default. Threat model didokumentasikan |
| A05 | Security Misconfiguration | Security headers di `vercel.ts`. CSP minimal (lihat section 7) |
| A06 | Vulnerable Components | `pnpm audit` mingguan + Dependabot di GitHub |
| A07 | Identification & Auth Failures | Supabase Auth managed; rate limit; password policy |
| A08 | Data Integrity Failures | Migration di-review. Webhook signature verify (Midtrans/Xendit fase 2) |
| A09 | Logging Failures | Structured log (lib/logger.ts). Vercel logs retain 7 hari (Hobby) |
| A10 | SSRF | Tidak ada user-controlled outbound URL. Upload file pakai signed URL Supabase (bukan server proxy) |

---

## 7. Security Headers

Set via `vercel.ts`:

```
X-Frame-Options: DENY                          # cegah clickjacking
X-Content-Type-Options: nosniff                # cegah MIME sniffing
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload   # via Vercel auto
```

CSP (Content Security Policy) — direkomendasikan tapi opsional di MVP. Set di middleware:

```ts
// middleware.ts (snippet CSP)
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors 'none'",
].join('; ');
```

---

## 8. File Upload Security

- **Signed URL** Supabase: token expire 5 menit untuk upload, 1 jam untuk download.
- **MIME type whitelist**: pdf, doc, docx, jpg, png, webp, zip. Server action verifikasi mime sebelum return signed URL.
- **Max size 25 MB** per file (cek di server action sebelum signed URL).
- **Path namespaced**: `<owner_id>/<project_id>/<uuid>-<filename>` — RLS storage memverifikasi prefix.
- **No public bucket.** Semua file via signed URL.
- **Antivirus scanning**: tidak dilakukan di MVP. Risiko diterima karena admin-only. Pertimbangkan ClamAV / VirusTotal API di fase 2.

---

## 9. Data Privacy

### 9.1 Data minimization
- **Tidak menyimpan KTP** atau dokumen identitas pemerintah klien.
- **Tidak menyimpan password klien** (klien tidak punya akun di MVP).
- Field opsional dibuat opsional di UI — tidak memaksa input data yang tidak perlu.

### 9.2 Hak data subjek (UU PDP Indonesia)
Walaupun MVP internal, persiapkan compliance UU PDP No. 27/2022:
- **Right to access**: admin dapat export semua data 1 klien (CSV) bila diminta.
- **Right to delete**: tombol "Hapus permanen klien & semua data terkait" (di luar arsip biasa).
- **Privacy policy** publik (di landing) menjelaskan apa yang dikumpulkan dan tujuan.
- **Retensi**: data klien selesai disimpan max 2 tahun setelah ACC, lalu auto-archive. Hapus permanen setelah 5 tahun.

### 9.3 Data Processor Agreement
- Supabase: tunduk pada Supabase Data Processing Addendum (signing optional di Pro plan).
- Vercel: tunduk pada Vercel DPA.

### 9.4 Lokasi data
- Region Supabase: **Singapore** (bukan Indonesia). UU PDP membolehkan transfer keluar negeri jika ada perjanjian. Mitigasi: dokumentasikan di Privacy Policy.

---

## 10. Audit Trail

Tabel `audit_logs` mencatat:
- Perubahan status proyek.
- CRUD pembayaran (verifikasi, edit nominal, hapus).
- Hapus klien permanen.
- Login admin (opsional — bisa pakai Supabase Auth logs).

UI audit log di `/settings/audit-log` (skenario A).

---

## 11. Secret Management

| Secret | Lokasi |
|--------|--------|
| Supabase anon key | `.env.local` (dev), Vercel env (prod). Aman di-expose ke browser (tapi tetap diperlakukan sebagai env) |
| Supabase service role | Vercel env (server only). **Tidak pernah** di repo |
| DB password | Password manager (1Password / Bitwarden). Tidak di repo |
| API keys fase 2 (Midtrans, Fonnte, Resend) | Vercel env |

Aturan:
- `.env.local` di `.gitignore`.
- Pre-commit hook (Husky + git-secrets) untuk deteksi accidental commit.
- Rotasi service role key setiap 6 bulan atau saat ada tim member keluar.

---

## 12. Backup & Recovery

- Supabase auto-backup harian (free: retain 7 hari, Pro: 30 hari).
- Manual SQL dump mingguan ke storage lokal (lihat `08-deployment-devops.md` section 4.5).
- Restore drill: lakukan trial restore ke dev environment setiap 3 bulan.

---

## 13. Dependency Hygiene

```bash
# Audit mingguan
pnpm audit

# Update non-breaking
pnpm update

# Major update — review changelog dulu
pnpm outdated
```

- Dependabot aktif di repo (PR otomatis untuk patch security).
- Pin versi dengan caret hanya (`^x.y.z`), tidak `latest`.

---

## 14. Compliance Checklist Pre-Launch

- [ ] RLS enabled di semua tabel.
- [ ] Cross-tenant test passed (user A tidak lihat data user B).
- [ ] Service role key tidak ada di kode client.
- [ ] HTTPS enforced (otomatis Vercel).
- [ ] Security headers ter-set.
- [ ] `.env*` di `.gitignore`.
- [ ] Privacy Policy + Terms (placeholder OK untuk MVP, real untuk launch publik).
- [ ] `pnpm audit` lulus (0 high/critical).
- [ ] Login rate limit aktif.
- [ ] Backup harian aktif di Supabase dashboard.
- [ ] Tombol logout berfungsi (cookie cleared).
- [ ] Tombol arsip/hapus klien berfungsi.
- [ ] File upload size limit di-enforce server-side.
- [ ] Login email verification aktif.

---

## 15. Incident Response

Jika ada indikasi kebocoran:
1. **Immediate**: rotasi service role key + force logout semua user (`supabase.auth.admin.signOut(userId)` untuk semua).
2. **Containment**: matikan endpoint terkait via Vercel deployment rollback.
3. **Investigation**: cek Vercel logs + Supabase auth logs + audit_logs.
4. **Notification**: jika data klien terdampak, notifikasi via email + WA dalam 72 jam (sesuai UU PDP).
5. **Post-mortem**: dokumen di `docs/incidents/<date>.md`.

---

## 16. Penetration Testing

- Manual test cross-tenant pre-launch (lihat section 4).
- Pakai **OWASP ZAP** atau **Burp Suite Community** untuk scan otomatis sebelum production.
- Skenario C (SaaS): pertimbangkan bug bounty atau pen-test profesional (Rp 5–15jt).

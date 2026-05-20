# Monetization & Scalability — Joki Portal

---

## 1. Visi Jangka Panjang

Sistem ini dimulai sebagai **internal operational tool** untuk satu pelaku jasa skripsi. Tiga skenario eskalasi yang dapat ditempuh, dari paling konservatif sampai paling ambisius:

| Skenario | Deskripsi | Modal Tambahan | Timeline |
|----------|-----------|----------------|----------|
| **A. Konsolidasi Operasional** | Tetap internal, fokus efisiensi, multi-admin | Rp 0 – 500rb | Bulan 2–3 |
| **B. Add-on Klien (Hybrid)** | Klien dapat akses portal sendiri + payment gateway | Rp 0 (semua per-transaksi) | Bulan 3–6 |
| **C. SaaS B2B** | Jual sistem ke pelaku jasa lain (multi-tenant) | Rp 1–5 juta | Bulan 6–12 |

Disarankan eksekusi **berurutan**: A → B → C.

---

## 2. Skenario A — Konsolidasi Operasional

### Tujuan
Memaksimalkan nilai sistem untuk operasional internal sebelum upscale.

### Fitur tambahan (fase 2.A)
1. **Multi-admin** — tim 2–3 orang dapat login terpisah, RBAC sederhana (admin / assistant / viewer).
2. **Assignee task realistik** — task dapat di-assign ke assistant; assistant hanya lihat task yang di-assign.
3. **Audit log UI** — lihat siapa yang ubah apa kapan.
4. **Cmd-K global search**.
5. **Reminder deadline in-app** — cron harian set notifikasi H-7 / H-3.
6. **Export laporan bulanan** — PDF/Excel rekap pendapatan, klien aktif, completion rate.
7. **Template milestone** — admin dapat simpan template "Skripsi 5 Bab", "Tesis 6 Bab", dst.
8. **Calendar view** — view kalender semua deadline lintas proyek.

### Biaya
- Tetap **Rp 0/bulan** (semua di free tier).
- Naik ke Supabase Pro ($25/bln) jika klien aktif > 30.

### Effort
~ 3–4 minggu setelah MVP.

---

## 3. Skenario B — Add-on Klien (Hybrid)

### Tujuan
Berikan klien akses self-service supaya mengurangi load koordinasi via WhatsApp + otomatisasi pembayaran.

### Komponen baru
1. **Client Portal** (`/portal/...`).
   - Klien login dengan email + OTP (Supabase Auth dengan role `client`).
   - Lihat progres proyek, daftar bab, status pembayaran, draf bab (read-only).
   - Tidak bisa edit task atau lihat klien lain.

2. **Payment Gateway**.
   - Integrasi **Midtrans Snap** atau **Xendit**.
   - Klien terima invoice termin → klik bayar → pilih metode (QRIS / VA / e-wallet) → callback otomatis update status pembayaran.
   - Fee per transaksi (~ 0.7% QRIS, ~ 2% VA), **tidak ada biaya bulanan**.

3. **Notifikasi WhatsApp otomatis**.
   - Pakai **Fonnte** (~ Rp 50rb/bln untuk paket basic) atau **Whapi.cloud** atau **WaSenderApi**.
   - Trigger: status bab berubah, pembayaran masuk, deadline H-3.
   - Template opt-in (klien pilih ya/tidak di portal).

4. **Notifikasi email**.
   - **Resend** free tier (3K email/bln cukup untuk skala awal).
   - Trigger: bukti pembayaran terverifikasi, draf bab siap di-review.

5. **Schema perubahan**:
   - Tambah role `client` di `profiles.role`.
   - Tabel `project_clients` untuk link `auth.users (client)` ↔ `projects` (akses read-only).
   - Tabel `notifications`, `invoices`, `webhook_logs`.
   - Tabel `whatsapp_templates`.

### Biaya operasional
- Midtrans/Xendit: per transaksi (dipotong dari nominal masuk).
- Fonnte: ~ Rp 50–100rb/bln.
- Resend: free.
- **Total: Rp 50–150rb/bulan** sebagai opex.

### Model monetisasi untuk klien
- Klien tidak dikenakan biaya tambahan; cost diserap dari margin operasional.
- Optional: surcharge transparan untuk QRIS (0.7%) ditambahkan ke nominal tagihan.

### Effort
~ 4–6 minggu setelah skenario A selesai.

---

## 4. Skenario C — SaaS B2B Multi-tenant

### Tujuan
Ubah sistem internal jadi produk SaaS yang dijual ke pelaku jasa pendampingan lain (freelancer / agency kecil).

### Perubahan arsitektur
1. **Multi-tenant via Row-level `organization_id`**.
   - Tabel `organizations`, `organization_members`.
   - Semua tabel domain tambah `organization_id`, RLS update untuk filter via membership.
   - Tidak perlu pisah database; satu instance Supabase cukup sampai 100 organisasi.

2. **Billing & subscription**.
   - Integrasi **Stripe** atau **Paddle** (Paddle handle PPN otomatis untuk Indonesia).
   - Plan tier:
     - **Solo** (Rp 99K/bln): 1 admin, 20 klien aktif, 2 GB storage.
     - **Tim** (Rp 249K/bln): 5 admin, 100 klien aktif, 10 GB storage, branding kustom.
     - **Agency** (Rp 599K/bln): unlimited admin, 500 klien aktif, 50 GB storage, API access, white-label.
   - Trial 14 hari, no credit card.

3. **Custom branding (white-label)**.
   - Tiap org bisa upload logo, custom subdomain (`<org>.jokiportal.app`), atau custom domain.

4. **Onboarding wizard**.
   - Import CSV dari spreadsheet existing.
   - Template milestone industri.

5. **Marketplace integrasi** (fase lanjutan).
   - Stripe Connect untuk org terima pembayaran langsung.
   - Webhook untuk Zapier/Make.

### Mode landing
Aktifkan `LANDING_MODE=saas` (lihat `07-landing-page-prd.md`). Copy fokus ke value prop produk:
- "Manage your skripsi mentoring business — without spreadsheets."

### Biaya operasional pada skala
| MRR | Infra cost | Margin |
|-----|------------|--------|
| Rp 5 jt (50 customers Solo) | Supabase Pro ($25) + Vercel Pro ($20) + lain (~$10) = ~ Rp 900rb | ~ 82% |
| Rp 25 jt (100 Solo + 30 Tim) | Supabase Team ($599) + lain | ~ 75% |

### Effort
~ 3 bulan refactor + go-to-market.

### Risiko & Mitigasi
- **Adopsi rendah** — validasi sebelum invest besar: launch waiting list di landing, lakukan customer interview 10 calon user.
- **Hukum & reputasi** — produk SaaS untuk industri "jasa joki" punya risk reputasi; positioning bisa di-rebrand ke "academic mentoring CRM" supaya audiens lebih lebar.
- **Vendor lock** — sudah pakai stack standar, mudah pindah.

---

## 5. Roadmap Visualisasi

```
                   MVP Internal              Skenario A              Skenario B              Skenario C
   ──────────●────────────────────●──────────────────●──────────────────●──────────────────●─────►
              Bulan 1                Bulan 2-3             Bulan 4-6             Bulan 6+
              (Rp 0/bln)             (Rp 0-25/bln)         (Rp 50-200rb/bln)      (Pro plans, revenue)
```

---

## 6. Strategi Akuisisi (untuk B & C)

### Skenario B (klien jasa skripsi)
- Landing service mode (sudah ada).
- IG content: behind-the-scene sistem tracking → bangun trust.
- Referral mahasiswa: diskon Rp 50rb / referral berhasil.
- Partnership dengan content creator akademik IG/TikTok.

### Skenario C (SaaS B2B)
- Komunitas: posting di grup Telegram/Facebook freelancer skripsi.
- Content marketing: artikel "cara manage 20+ klien skripsi tanpa ribet".
- Cold outreach DM ke akun IG jasa skripsi yang ber-engagement tinggi.
- Affiliate: 20% rev share lifetime untuk referral.

---

## 7. Pricing Psychology (skenario C)

- **Anchor tertinggi (Agency Rp 599K).** Bukan pasar utama, tapi membuat tier Tim terasa "value".
- **Tier Tim sebagai sweet spot** (Rp 249K). Target utama: agency 3–5 orang.
- **Tier Solo (Rp 99K) sebagai pintu masuk.** Free trial 14 hari memudahkan konversi.
- **Annual discount 20%** untuk improve cash flow.
- **Tidak ada free forever plan** di awal — kanibalisasi tier berbayar.

---

## 8. Metric to Watch

| Phase | Primary metric |
|-------|----------------|
| MVP | Active days/week, jumlah klien yang dikelola |
| Skenario A | Time saved per task (vs spreadsheet), uptime |
| Skenario B | % klien yang aktif di portal, % pembayaran via gateway vs manual |
| Skenario C | MRR, churn bulanan, CAC, LTV/CAC ratio |

---

## 9. Exit Strategy (skenario C — opsional)

Jika tumbuh konsisten ke MRR Rp 100jt+:
- Akuisisi oleh ed-tech regional (RuangGuru, Zenius) — _strategic acquisition_.
- Continue bootstrap → micro-PE / lifestyle business.
- Open-source community edition + hosted enterprise.

Tidak relevan untuk MVP, tapi memandu keputusan arsitektur agar tetap clean & dokumentasi rapi.

---

## 10. Keputusan untuk Owner

Sebelum eksekusi fase 2:
1. Apakah berkomitmen skenario A → B → C? Atau cukup A saja?
2. Naming brand final (impact SEO + paid acquisition).
3. Apakah white-label fitur penting di skenario C? (mempengaruhi arsitektur custom domain di awal).
4. Pertimbangan compliance: pajak (PPN 11%), badan hukum (CV/PT) sebelum jadi SaaS.

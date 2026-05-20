# PRD — Landing Page

**Versi:** 1.0
**Tanggal:** 2026-05-20
**Status:** Draft

---

## 1. Tujuan Landing Page

Landing page publik (di route `/(marketing)/*` Next.js) memiliki tiga peran sekaligus:

1. **Akuisisi klien jasa skripsi.** Calon klien menemukan jasa via Google / IG → landing → CTA kontak WhatsApp.
2. **Posisi kredibel & profesional.** Bukti operasional menggunakan sistem internal sendiri → meningkatkan trust.
3. **Persiapan monetisasi produk SaaS.** Jika di fase berikutnya sistem ini dijadikan produk dijual ke kompetitor / freelancer lain (B2B), landing siap untuk berperan sebagai _product landing_.

Karena dual-purpose, copy ditulis dengan dua narasi yang dapat diaktifkan via flag `LANDING_MODE`:
- `service` (default fase 1) — promosi jasa joki skripsi.
- `saas` (fase 2+) — promosi produk SaaS untuk pelaku jasa lain.

Untuk MVP, fokus ke mode `service`.

---

## 2. Audience Mode `service`

**Primer:** Mahasiswa S1/S2 tingkat akhir yang butuh pendampingan skripsi.
- Karakter: 21–28 tahun, mobile-first, browse di IG/TikTok/Google, evaluasi via testimoni.
- Mood saat datang ke landing: deadline mepet, panik, butuh kepastian.
- Yang dicari: **bukti reliable**, **harga jelas**, **proses tertata**, **rahasia terjaga**.

**Sekunder:** Orang tua mahasiswa yang membayar jasa (jarang, tapi ada).

---

## 3. Audience Mode `saas` (fase 2+)

Freelancer / agency joki skripsi lain yang sudah operasional tapi pakai spreadsheet manual.

---

## 4. Strategi Pesan Utama (Service mode)

| Slot | Pesan |
|------|-------|
| Headline | "Pendampingan Skripsi yang Tertata, Terlacak, dan Tepat Waktu." |
| Sub-headline | "Kami membantu Anda menyelesaikan skripsi dengan workflow profesional: timeline jelas, revisi tercatat, dan komunikasi rapi — bukan lewat chat berantakan." |
| Diferensiasi | Sistem internal sendiri → transparansi progres real-time. |
| Risk reversal | Garansi revisi sampai ACC dosen. Pembayaran termin per bab. |
| Sosial proof | Testimoni mahasiswa + jumlah skripsi yang sudah didampingi. |
| Primary CTA | "Konsultasi Gratis via WhatsApp" |
| Secondary CTA | "Lihat Layanan & Harga" |

---

## 5. Struktur Halaman

```
1. Hero
   - Headline
   - Sub-headline (1 kalimat)
   - 2 CTA (WA primary + Anchor #layanan secondary)
   - Visual: screenshot blurred dashboard internal (social proof visual)

2. Trust strip
   - 4 metric: "100+ Skripsi", "5 Kampus Mitra", "3 Tahun Pengalaman", "95% On-Time"

3. Cara Kerja (3-4 langkah)
   - Konsultasi → Kesepakatan → Pengerjaan → Sidang
   - Per langkah ada icon + 1-2 kalimat

4. Layanan & Harga
   - 3 paket tier: Konsultasi, Pendampingan, Full Service
   - Per tier: harga indikatif, deliverable, durasi
   - CTA "Tanya Detail" per tier

5. Bukti Sistem Internal
   - 3 screenshot dari aplikasi (board kanban, timeline, finance)
   - Tagline: "Setiap klien punya dashboard tersendiri yang bisa dipantau bersama"
   - (Untuk mode SaaS nantinya: ganti jadi value prop produk)

6. Testimoni
   - 4-6 kutipan + nama (atau initial bila request privacy) + kampus
   - Foto opsional

7. FAQ
   - 6-10 pertanyaan umum (lihat section 9)

8. CTA Akhir
   - Box besar: "Skripsi Anda butuh dijadwalkan?"
   - Tombol WhatsApp + alternatif Email

9. Footer
   - About, Kontak, Privacy Policy, Terms
   - Sosial media link
```

---

## 6. Acceptance Criteria

- [AC-L.1] Halaman accessible di `/` (saat `LANDING_MODE=service`, app dashboard pindah ke `/app`).
- [AC-L.2] Lighthouse: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95.
- [AC-L.3] LCP < 1.8s di koneksi 4G simulasi.
- [AC-L.4] Mobile-first responsive, hero readable tanpa scroll horizontal di 360px width.
- [AC-L.5] Meta tags lengkap: title, description, OG image, Twitter card.
- [AC-L.6] `sitemap.xml` & `robots.txt` ter-generate.
- [AC-L.7] CTA WhatsApp membuka `https://wa.me/<nomor>?text=<pesan>` dengan pesan template terisi.
- [AC-L.8] Form kontak email (opsional) mengirim ke `nosuke1@gmail.com` via Resend free tier atau Vercel native API.
- [AC-L.9] Analytics: Vercel Analytics + (opsional) Plausible/Umami self-host.
- [AC-L.10] Compliance: link Privacy Policy & Terms aktif (placeholder konten OK untuk MVP, real text di fase 2).

---

## 7. Komponen Teknis

Path: `app/(marketing)/`

```
app/(marketing)/
├── layout.tsx               # header marketing + footer
├── page.tsx                 # landing utama (sections)
├── layanan/page.tsx         # detail layanan & harga
├── faq/page.tsx
├── about/page.tsx
├── kontak/page.tsx          # form kontak opsional
├── privacy/page.tsx
├── terms/page.tsx
└── components/
    ├── HeroSection.tsx
    ├── TrustStrip.tsx
    ├── HowItWorks.tsx
    ├── PricingCards.tsx
    ├── SystemProof.tsx
    ├── Testimonials.tsx
    ├── FAQ.tsx
    ├── FinalCTA.tsx
    ├── MarketingHeader.tsx
    └── MarketingFooter.tsx
```

Aset:
- Logo wordmark (Inter 700, brand indigo).
- Screenshot internal: 3 PNG hasil `playwright screenshot` dari aplikasi dengan data dummy.
- OG image: generate via Next.js `opengraph-image.tsx` (Edge runtime).

---

## 8. SEO Strategy

| Element | Implementasi |
|---------|--------------|
| Title | "Pendampingan Skripsi Profesional & Tertata \| Bimbingo" (≤ 60 char) |
| Description | "Layanan pendampingan skripsi dengan workflow terstruktur, progres real-time, dan revisi sampai ACC. Konsultasi gratis via WhatsApp." (≤ 155 char) |
| Heading | Single `<h1>` di hero, `<h2>` untuk setiap section |
| Schema.org | `Organization` + `Service` + `FAQPage` JSON-LD |
| Internal links | Antar section pakai anchor (`#layanan`, `#faq`) |
| Sitemap | `app/sitemap.ts` (built-in Next 16) |
| robots | `app/robots.ts` allow all kecuali `/app/*` (dashboard internal) |
| Image alt | Semua image punya alt text deskriptif |
| Open Graph | `app/opengraph-image.tsx` (1200×630) |

### Kata kunci target (Indonesia)
- "jasa pendampingan skripsi"
- "joki skripsi terpercaya"
- "bantuan skripsi online"
- "konsultan skripsi profesional"
- "jasa bimbingan skripsi"

(Hindari literal "joki" di copy publik jika ingin SEO friendly — gunakan "pendampingan" lebih aman secara reputasi.)

---

## 9. FAQ Konten (draft)

1. **Apakah jasa ini legal?** — Kami memberikan pendampingan, konsultasi, dan pendampingan teknis. Pengerjaan tetap melibatkan klien dalam pembelajaran. Final approval ada di dosen pembimbing & sidang.
2. **Bagaimana sistem pembayarannya?** — Termin per bab. DP 30%, pelunasan setelah ACC. Tidak ada biaya tersembunyi.
3. **Apa saja yang dikerjakan?** — Tergantung paket: konsultasi metodologi, bantuan struktur, review dan revisi, hingga pendampingan penuh.
4. **Apakah data saya aman?** — Semua data klien disimpan di sistem terenkripsi. Hanya admin kami yang punya akses. Lihat Privacy Policy.
5. **Berapa lama prosesnya?** — Skripsi penuh: 2–4 bulan tergantung kompleksitas dan responsivitas dosen.
6. **Apakah ada garansi?** — Kami garansi revisi sampai dosen ACC, sesuai paket yang diambil.
7. **Bagaimana jika dosen pembimbing saya killer?** — Kami profilkan karakter dosen di sistem internal supaya pengerjaan menyesuaikan gaya revisi.
8. **Bisa partial (cuma bab tertentu)?** — Bisa, paket konsultasi.
9. **Kampus mana yang sudah ditangani?** — Sudah menangani UI, UGM, IPB, ITB, dan kampus swasta lain.
10. **Bagaimana memulai?** — Klik tombol "Konsultasi Gratis via WhatsApp", tim akan respon < 1 jam di jam kerja.

---

## 10. Conversion Tracking

| Event | Tools |
|-------|-------|
| Klik CTA WhatsApp | Vercel Analytics custom event |
| Submit form kontak | Vercel Analytics custom event |
| Page view per section (scroll depth) | Optional, fase 2 |

UTM dipertahankan via JavaScript di link CTA (mis. saat user datang dari IG → WhatsApp link include UTM source).

---

## 11. Copy Sample (Hero)

> # Pendampingan Skripsi yang Tertata, Terlacak, dan Tepat Waktu.
>
> Workflow profesional menggantikan chat WhatsApp yang berantakan: timeline jelas, revisi dosen tercatat, draf bab tersimpan rapi.
>
> [💬 Konsultasi Gratis via WhatsApp] [Lihat Paket Layanan →]
>
> _100+ skripsi diselesaikan • Garansi revisi sampai ACC • Pembayaran per termin_

---

## 12. Implementation Timeline

Landing page dikerjakan **setelah MVP dashboard selesai** (mulai Minggu 5):

| Hari | Task |
|------|------|
| 1 | Setup route group `(marketing)`, header + footer + base sections layout |
| 2 | Hero + Trust strip + How It Works |
| 3 | Pricing + System Proof + Testimonials |
| 4 | FAQ + Final CTA + Privacy/Terms placeholder |
| 5 | SEO meta + sitemap + robots + OG image + Lighthouse audit |

**Total:** 1 minggu untuk landing siap launch.

---

## 13. Future Enhancement (Backlog)

- A/B test headline variations.
- Blog SEO untuk traffic organic (artikel "tips skripsi", "cara hadapi dosen killer", dst).
- Mode `saas` aktif saat produk dijual ke pelaku jasa lain.
- Self-service signup (klien langsung lihat progres mereka di landing).
- Multi-language ID/EN (untuk klien mahasiswa internasional di kampus Indonesia).

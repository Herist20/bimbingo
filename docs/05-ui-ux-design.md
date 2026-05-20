# UI / UX Design — Bimbingo

---

## 1. Prinsip Desain

1. **Clarity over cleverness.** Admin akan pakai sistem ini berulang setiap hari — kejelasan label lebih penting dari estetika eksperimental.
2. **Density yang nyaman.** Tabel padat informasi (admin akan compare data antar baris), bukan card boros space.
3. **Mobile-first untuk consume, desktop-first untuk create.** Mayoritas update progres dari HP saat di kampus; pembuatan klien & proyek dari laptop.
4. **Familiar > unique.** Pola UI mirip Notion / Linear / Jira / Clickup / Vercel Dashboard — admin tidak perlu re-learn.
5. **Indonesia-first.** Format tanggal `dd MMM yyyy` (`20 Mei 2026`), mata uang `Rp` thousand-separator `.`.

---

## 2. Brand & Tonalitas

| Aspek | Pilihan |
|-------|---------|
| Nama (sementara) | Bimbingo |
| Tone | Profesional tapi hangat. Tidak kaku, tidak gaul. |
| Bahasa UI | Bahasa Indonesia natural ("Tambah Klien", bukan "Buat Klien Baru" yang kepanjangan) |
| Sentence case | "Tambah klien" bukan "Tambah Klien" untuk action buttons (sentence case, satu kapital di awal) |
| Emoji di UI | Tidak. Pakai icon dari lucide-react |

---

## 3. Color Tokens

Dipakai di `tailwind.config.ts` + CSS variables.

```css
:root {
  /* Surface */
  --bg-base:        oklch(0.99 0.005 250);   /* hampir putih, sedikit cool */
  --bg-subtle:      oklch(0.97 0.005 250);
  --bg-muted:       oklch(0.94 0.005 250);
  --border:         oklch(0.90 0.005 250);
  --border-strong:  oklch(0.82 0.008 250);

  /* Text */
  --text-primary:   oklch(0.20 0.015 250);
  --text-secondary: oklch(0.45 0.010 250);
  --text-muted:     oklch(0.60 0.005 250);

  /* Brand: indigo - modern, professional, tidak cliche */
  --brand:          oklch(0.55 0.18 270);
  --brand-hover:    oklch(0.48 0.20 270);
  --brand-soft:     oklch(0.95 0.04 270);

  /* Status */
  --success:        oklch(0.60 0.18 145);
  --warning:        oklch(0.75 0.15 75);
  --danger:         oklch(0.60 0.20 25);
  --info:           oklch(0.70 0.10 230);
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-base:        oklch(0.15 0.01 250);
    --bg-subtle:      oklch(0.18 0.01 250);
    --bg-muted:       oklch(0.22 0.01 250);
    --border:         oklch(0.28 0.01 250);
    --border-strong:  oklch(0.36 0.01 250);
    --text-primary:   oklch(0.95 0.005 250);
    --text-secondary: oklch(0.75 0.005 250);
    --text-muted:     oklch(0.55 0.005 250);
    --brand:          oklch(0.70 0.17 270);
    --brand-soft:     oklch(0.30 0.05 270);
  }
}
```

Status badge mapping:
- `active`, `in-progress` → indigo / brand
- `review-dosen`, `revisi` → amber / warning
- `done`, `approved`, `completed` → green / success
- `on-hold`, `draft`, `backlog` → slate / muted
- `cancelled` → red / danger

---

## 4. Typography

| Token | Font | Size | Line-height | Use |
|-------|------|------|-------------|-----|
| `display` | Inter (display) | 36/40px | 1.1 | Hero landing |
| `h1` | Inter | 28px | 1.2 | Page title |
| `h2` | Inter | 22px | 1.3 | Section heading |
| `h3` | Inter | 18px | 1.4 | Card title |
| `body` | Inter | 14px | 1.5 | Default UI |
| `body-lg` | Inter | 16px | 1.6 | Form helper, landing copy |
| `small` | Inter | 12px | 1.4 | Caption, meta info |
| `mono` | JetBrains Mono | 12-14px | 1.4 | NIM, kode, ID |

Font load via `next/font/google` Inter + JetBrains Mono, weight 400/500/600/700.

---

## 5. Spacing & Layout

- **Base unit:** 4px. Pakai skala Tailwind default (`1`=4px ... `8`=32px ... `16`=64px).
- **Container max-width dashboard:** `max-w-screen-2xl` (1536px). Padding kiri-kanan `px-6` desktop, `px-4` mobile.
- **Section gap:** `gap-6` (24px) antar major section.
- **Card padding:** `p-4` (16px) untuk card normal, `p-6` untuk hero card.

### App Shell (Dashboard)

```
┌─────────────────────────────────────────────────────────┐
│ Topbar (h-14)  [logo]   [search ⌘K]    [bell] [avatar]   │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│   Sidebar    │            Main content                  │
│   (w-60)     │            (flex-1)                      │
│              │                                          │
│  • Dashboard │                                          │
│  • Klien     │                                          │
│  • Proyek    │                                          │
│  • Dosen     │                                          │
│  • Finance   │                                          │
│  • Settings  │                                          │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
```

Mobile: sidebar collapse jadi sheet (slide dari kiri), trigger via hamburger di topbar.

---

## 6. Komponen Utama (dari shadcn/ui)

Wajib di-install (`npx shadcn@latest add ...`):

| Komponen | Pakai untuk |
|----------|-------------|
| `button` | Semua action |
| `input`, `textarea`, `label` | Form |
| `select`, `combobox` | Picker dosen, kampus |
| `dialog`, `sheet` | Modal create/edit, detail task di mobile |
| `dropdown-menu` | Aksi per row tabel |
| `table` | List klien, list payments |
| `tabs` | Navigasi tab di detail proyek |
| `card` | Container metric, section |
| `badge` | Status |
| `avatar` | Profil admin & klien |
| `tooltip` | Hint icon |
| `toast` | Feedback aksi (success/error) |
| `popover` | Date picker, mini filter |
| `progress` | Progress bar proyek |
| `command` | Cmd-K search |
| `skeleton` | Loading state |
| `separator` | Divider |
| `alert`, `alert-dialog` | Konfirmasi destruktif |
| `breadcrumb` | Navigasi hierarki |
| `calendar` | Picker tanggal |

Custom komponen (di `components/`):
- `KanbanBoard`, `KanbanColumn`, `TaskCard`
- `ClientForm`, `ProjectForm`, `PaymentForm`, `MilestoneEditor`
- `FileUploader`, `FileList`
- `KPICard`, `FinanceChart`
- `EmptyState`, `ErrorBoundary`, `LoadingTable`

---

## 7. Pola Interaksi

### 7.1 Form
- Validasi inline saat blur, BUKAN saat keystroke (avoid noise).
- Tombol submit disabled saat invalid + saat submitting (`isPending`).
- Setelah submit sukses → toast + redirect. Setelah error → toast merah + tetap di form.
- Field wajib ditandai `*` warna `var(--danger)`.

### 7.2 Tabel
- Hover row → background `var(--bg-subtle)`.
- Klik row body → ke detail. Aksi (edit/hapus) di kolom kanan via dropdown 3-dot.
- Loading: `Skeleton` per row, JANGAN spinner di tengah (jaga layout stability).
- Empty state: ilustrasi sederhana + CTA "Tambah klien pertama".

### 7.3 Konfirmasi Destruktif
- Pakai `AlertDialog` shadcn.
- Tombol konfirmasi memakai warna `danger` + label spesifik ("Hapus klien Andi Pratama") bukan "OK".

### 7.4 Toast
- Posisi: bottom-right desktop, top-center mobile.
- Auto-dismiss 4 detik untuk success, 6 detik untuk error.
- Action button di toast (mis. "Undo" untuk soft delete).

---

## 8. Layout Halaman Kunci

### 8.1 Dashboard `/`
```
┌─ KPI Cards ────────────────────────────────────────────────┐
│ [Klien Aktif] [Proyek Aktif] [Pendapatan Bln Ini] [Piutang]│
└────────────────────────────────────────────────────────────┘
┌─ Deadline Mendekat (kiri) ─┬─ Proyek Butuh Perhatian (kanan)┐
│  • Task A — 2 hari lagi    │  • Skripsi Andi (5 hari diam)   │
│  • Task B — 4 hari lagi    │  • Skripsi Sari (7 hari diam)   │
└────────────────────────────┴─────────────────────────────────┘
┌─ Chart Pendapatan 6 Bulan ─────────────────────────────────┐
│  [Recharts BarChart]                                       │
└────────────────────────────────────────────────────────────┘
```

### 8.2 Detail Proyek `/projects/[id]`
```
[← Kembali]  Skripsi: "Pengaruh ..."   [Status: Active ▾]  [⋮]

[Klien: Andi Pratama]  [Target: 15 Agt 2026]  [██████████ 65%]

┌─ Tab: Overview | Board | Timeline | Files | Finance ──────┐

(content per tab)
```

### 8.3 Kanban Board
```
┌─ Backlog ─┬─ In Progress ─┬─ Review Dosen ─┬─ Revisi ─┬─ Done ─┐
│ [card]    │ [card]        │ [card]         │ [card]    │ [card] │
│ [card]    │ [card]        │                │           │ [card] │
│ + Task    │ + Task        │                │           │        │
└───────────┴───────────────┴────────────────┴───────────┴────────┘
```

Card task:
```
┌────────────────────────────┐
│ Bab 2 — Tinjauan Pustaka   │  ← title
│ ⏰ 22 Mei  •  🔥 High       │  ← due + priority
│ ▸ Milestone: Bab 2          │  ← parent
└────────────────────────────┘
```

### 8.4 Finance Page `/finance`
```
[Date range picker]  [Export CSV]

┌─ [Bulan ini] [YTD] [Piutang] ─────────────────────────────┐
└────────────────────────────────────────────────────────────┘

┌─ Pendapatan per bulan (Bar) ──┬─ Per metode (Pie) ────────┐
│                                │                            │
└────────────────────────────────┴────────────────────────────┘

┌─ Tabel transaksi (filterable) ────────────────────────────┐
│ Tgl  | Klien   | Proyek | Nominal | Metode | Label        │
└────────────────────────────────────────────────────────────┘
```

---

## 9. Responsive Breakpoints

Pakai default Tailwind:

| Breakpoint | Width | Strategi |
|------------|-------|----------|
| `sm` | ≥ 640 | Stack ke single column, tabel pakai card list |
| `md` | ≥ 768 | Sidebar overlay (sheet) |
| `lg` | ≥ 1024 | Sidebar permanent, tabel tampil penuh |
| `xl` | ≥ 1280 | Padding lebih lega, chart 2 kolom |
| `2xl` | ≥ 1536 | Container max-width tercapai |

Kanban di < `lg` otomatis switch ke tampilan list dengan filter status (lebih ergonomis di HP).

---

## 10. Accessibility (WCAG 2.1 AA)

- **Kontras:** semua kombinasi teks ≥ 4.5:1 untuk body, 3:1 untuk teks besar.
- **Focus indicator:** ring 2px `var(--brand)` di semua interactive.
- **Keyboard navigation:** seluruh fitur dapat diakses tanpa mouse. Cmd-K untuk search global.
- **Screen reader:** semua icon-only button punya `aria-label`. Modal pakai `aria-labelledby`.
- **Form errors:** field error punya `aria-invalid` + `aria-describedby` linked ke pesan error.
- **Toast:** pakai `role="status"` (atau `role="alert"` untuk error).
- **Reduced motion:** respect `prefers-reduced-motion` — drag-drop tetap berfungsi tapi tanpa animasi transition card.

---

## 11. Loading & Empty States

### Loading
- Skeleton untuk tabel, card, board.
- Streaming via Suspense — render bagian yang siap terlebih dahulu.
- Tidak pakai full-page spinner.

### Empty
- Ilustrasi: SVG sederhana (line-art) atau icon Lucide large + helper text.
- Selalu sertakan CTA aksi utama.
- Contoh: halaman klien kosong → "Belum ada klien. Mulai dengan menambahkan klien pertama Anda." + tombol [+ Tambah Klien].

### Error
- Error boundary per route segment.
- Pesan: ringkasan + tombol "Coba lagi" + (dev only) detail expandable.

---

## 12. Asset & Iconography

- **Logo placeholder:** wordmark "Bimbingo" font Inter weight 700, warna `var(--brand)`. Final logo bisa dibuat di Canva (template wordmark).
- **Favicon:** generate dari logo via realfavicongenerator.net.
- **Empty state illustration:** pakai dari unDraw (free, customizable color).
- **OG image landing:** generate via `og:image` (built-in Next.js).

---

## 13. Design Tokens Implementation Checklist

- [ ] Setup `tailwind.config.ts` dengan token color, font, spacing.
- [ ] Buat `app/globals.css` dengan CSS variables (light + dark).
- [ ] Install Inter + JetBrains Mono via `next/font/google`.
- [ ] Install minimal 18 komponen shadcn (lihat section 6).
- [ ] Buat komponen custom shared di `components/shared/`.
- [ ] Audit kontras dengan `axe DevTools` atau Lighthouse.

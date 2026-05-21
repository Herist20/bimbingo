import { ImageResponse } from 'next/og';

export const alt = 'Bimbingo — Almanak kerja pendampingan skripsi';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          background:
            'radial-gradient(60% 60% at 20% 0%, #f4d9b7 0%, transparent 60%), radial-gradient(40% 50% at 100% 100%, #d6e4cb 0%, transparent 60%), #fbf3e6',
          fontFamily: 'sans-serif',
          color: '#2a1a12',
        }}
      >
        {/* Top — brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: '#c45c2e',
              color: '#fbf3e6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 700,
            }}
          >
            B
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em' }}>
              Bimbingo
            </span>
            <span
              style={{
                fontSize: 14,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#8a7a6b',
              }}
            >
              Studio Almanak
            </span>
          </div>
        </div>

        {/* Middle — headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <span
            style={{
              fontSize: 18,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#c45c2e',
              fontWeight: 600,
            }}
          >
            ── Almanak kerja
          </span>
          <h1
            style={{
              fontSize: 96,
              lineHeight: 1.02,
              letterSpacing: '-0.03em',
              fontWeight: 700,
              margin: 0,
            }}
          >
            Tutup spreadsheet.
            <br />
            <span style={{ fontStyle: 'italic', color: '#c45c2e' }}>Buka almanak.</span>
          </h1>
          <p
            style={{
              fontSize: 28,
              color: '#5a4a3e',
              maxWidth: 880,
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            Workspace warm-tone untuk pendampingan skripsi — klien, board task, milestone bab,
            dan termin pembayaran dalam satu permukaan tenang.
          </p>
        </div>

        {/* Bottom — meta */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 32,
            borderTop: '2px solid #d5c4b0',
            fontSize: 18,
            color: '#8a7a6b',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          <span>Next.js 16 · Supabase · Tailwind v4</span>
          <span>v0.1 · MVP · Open source</span>
        </div>
      </div>
    ),
    { ...size },
  );
}

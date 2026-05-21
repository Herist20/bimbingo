import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#c45c2e',
          color: '#fbf3e6',
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          borderRadius: 8,
        }}
      >
        B
      </div>
    ),
    { ...size },
  );
}

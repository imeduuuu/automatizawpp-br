import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          background: '#000000',
          borderRadius: 112,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          border: '3px solid #22c55e',
          boxShadow: '0 0 40px #22c55e88',
        }}
      >
        {/* WhatsApp-style chat bubble */}
        <svg width="220" height="220" viewBox="0 0 220 220" fill="none">
          <circle cx="110" cy="100" r="76" stroke="#22c55e" strokeWidth="14" fill="none" />
          <path
            d="M 60 160 Q 85 145 110 176"
            stroke="#22c55e"
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        {/* Brand name */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 6,
            fontSize: 44,
            fontWeight: 700,
            letterSpacing: 3,
            fontFamily: 'sans-serif',
          }}
        >
          <span style={{ color: '#ffffff' }}>AUTOMATIZA</span>
          <span style={{ color: '#22c55e' }}>WPP</span>
        </div>
      </div>
    ),
    { ...size }
  );
}

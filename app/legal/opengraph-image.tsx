import { ImageResponse } from 'next/og';

export const alt = 'POKYH – Impressum & Datenschutz';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #09090C 0%, #0d1117 50%, #0f1923 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '0 80px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginBottom: 36 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              background: 'linear-gradient(135deg, #0A84FF 0%, #5E5CE6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 56,
              fontWeight: 900,
              color: 'white',
              letterSpacing: -2,
            }}
          >
            P
          </div>
          <span style={{ fontSize: 80, fontWeight: 900, color: 'white', letterSpacing: -4 }}>POKYH</span>
        </div>
        <p style={{ fontSize: 40, color: 'white', fontWeight: 700, margin: '0 0 16px 0' }}>Impressum & Datenschutz</p>
        <p style={{ fontSize: 26, color: '#8b8fa8', margin: 0, textAlign: 'center' }}>
          Rechtliche Informationen · DSGVO · POKYH Schulapp LBS Brixen
        </p>
        <p style={{ fontSize: 20, color: '#3d4055', marginTop: 48 }}>pokyh.app</p>
      </div>
    ),
    { ...size },
  );
}

import { ImageResponse } from 'next/og';

export const alt = 'POKYH – Die Schulapp für LBS Brixen Schüler';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  const features = ['Stundenplan', 'Noten', 'Mensa', 'Nachrichten', 'Abwesenheiten'];

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
        {/* Logo + Name */}
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
          <span
            style={{
              fontSize: 80,
              fontWeight: 900,
              color: 'white',
              letterSpacing: -4,
            }}
          >
            POKYH
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: 32,
            color: '#8b8fa8',
            margin: '0 0 12px 0',
            textAlign: 'center',
          }}
        >
          Die Schulapp für LBS Brixen
        </p>
        <p
          style={{
            fontSize: 22,
            color: '#5a5d72',
            margin: '0 0 48px 0',
            textAlign: 'center',
          }}
        >
          Stundenplan · Noten · Mensa · Nachrichten · Kostenlos
        </p>

        {/* Feature chips */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          {features.map((f) => (
            <div
              key={f}
              style={{
                background: 'rgba(10, 132, 255, 0.12)',
                border: '1px solid rgba(10, 132, 255, 0.25)',
                borderRadius: 14,
                padding: '10px 22px',
                color: '#4da3ff',
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              {f}
            </div>
          ))}
        </div>

        {/* URL */}
        <p style={{ fontSize: 20, color: '#3d4055', marginTop: 48 }}>pokyh.app</p>
      </div>
    ),
    { ...size },
  );
}

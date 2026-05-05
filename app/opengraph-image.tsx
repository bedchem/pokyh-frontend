import { ImageResponse } from 'next/og';

export const alt = 'POKYH – WebUntis App für LBS Brixen';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
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
        <span
          style={{
            fontSize: 80,
            fontWeight: 900,
            color: 'white',
            letterSpacing: -4,
            marginBottom: 36,
          }}
        >
          POKYH
        </span>

        {/* Tagline */}
        <p
          style={{
            fontSize: 32,
            color: '#8b8fa8',
            margin: '0 0 8px 0',
            textAlign: 'center',
          }}
        >
          WebUntis App für LBS Brixen
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
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: 14,
                padding: '10px 22px',
                color: '#a5b4fc',
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

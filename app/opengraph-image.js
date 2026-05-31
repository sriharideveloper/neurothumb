import { ImageResponse } from 'next/og';

export const alt = 'Crossaint Labs thumbnail intelligence dashboard preview';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#090807',
          color: '#fff7ea',
          fontFamily: 'Arial',
          padding: 58,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 12% 20%, rgba(255,184,107,.32), transparent 28%), radial-gradient(circle at 84% 12%, rgba(111,214,255,.24), transparent 26%), linear-gradient(135deg, #090807 0%, #15110d 48%, #07090a 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 70,
            top: 72,
            width: 430,
            height: 300,
            border: '1px solid rgba(255,255,255,.15)',
            borderRadius: 30,
            background: 'rgba(255,255,255,.08)',
            display: 'flex',
            flexDirection: 'column',
            padding: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: 178,
              borderRadius: 22,
              background:
                'linear-gradient(135deg, #ffb86b 0%, #20120b 48%, #5fd2ff 100%)',
              border: '1px solid rgba(255,255,255,.18)',
            }}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
            {[68, 84, 52, 92].map((w) => (
              <div
                key={w}
                style={{
                  width: w,
                  height: 10,
                  borderRadius: 999,
                  background: 'rgba(255,255,255,.34)',
                }}
              />
            ))}
          </div>
          <div
            style={{
              marginTop: 20,
              display: 'flex',
              width: '82%',
              height: 12,
              borderRadius: 999,
              background: 'linear-gradient(90deg, #ffb86b, #6fd6ff)',
            }}
          />
        </div>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            maxWidth: 700,
          }}
        >
          <div
            style={{
              fontSize: 30,
              letterSpacing: 7,
              textTransform: 'uppercase',
              color: '#ffb86b',
              marginBottom: 24,
            }}
          >
            Crossaint Labs
          </div>
          <div
            style={{
              fontSize: 76,
              lineHeight: 0.95,
              fontWeight: 700,
              letterSpacing: -3,
              marginBottom: 30,
            }}
          >
            Frontier attention modeling for thumbnails.
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 27,
              lineHeight: 1.35,
              color: 'rgba(255,247,234,.78)',
              maxWidth: 640,
            }}
          >
            Meta frontier neuro-model heatmaps, cognitive metrics, and Crossaint Labs AI Assistant for creators, studios, agencies, and brand teams.
          </div>
        </div>
      </div>
    ),
    size,
  );
}

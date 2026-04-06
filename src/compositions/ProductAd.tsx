import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const ProductAd: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title: 0-1s fade in
  const titleOpacity = interpolate(frame, [0, fps * 1], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // CTA: 20s'de slide in
  const ctaTranslate = interpolate(
    frame,
    [fps * 20, fps * 22],
    [60, 0],
    { extrapolateRight: 'clamp' }
  );
  const ctaOpacity = interpolate(
    frame,
    [fps * 20, fps * 22],
    [0, 1],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#1a1a2e',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 24,
        fontFamily: 'sans-serif',
      }}
    >
      {/* HOOK */}
      <div
        style={{
          opacity: titleOpacity,
          fontSize: 64,
          fontWeight: 900,
          color: '#ffffff',
          textAlign: 'center',
          padding: '0 48px',
        }}
      >
        Your morning deserves better
      </div>

      {/* FEATURES */}
      {['Single Origin Beans', 'Roasted Fresh Weekly', 'Shipped to Your Door'].map(
        (text, i) => {
          const start = fps * (5 + i * 3);
          const featureOpacity = interpolate(frame, [start, start + fps], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const featureX = interpolate(frame, [start, start + fps], [-100, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <div
              key={text}
              style={{
                opacity: featureOpacity,
                transform: `translateX(${featureX}px)`,
                fontSize: 36,
                color: '#e67e22',
                fontWeight: 700,
              }}
            >
              {text}
            </div>
          );
        }
      )}

      {/* CTA */}
      <div
        style={{
          opacity: ctaOpacity,
          transform: `translateY(${ctaTranslate}px)`,
          fontSize: 28,
          color: '#ffffff',
          marginTop: 32,
          backgroundColor: '#e67e22',
          padding: '16px 40px',
          borderRadius: 8,
        }}
      >
        mountainbrew.co
      </div>
    </AbsoluteFill>
  );
};

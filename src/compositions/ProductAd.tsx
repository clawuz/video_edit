import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export interface ProductAdProps {
  title: string;
  features: string[];
  cta: string;
  accentColor: string;
  fontFamily: string;
}

export const ProductAd: React.FC<ProductAdProps> = ({
  title,
  features,
  cta,
  accentColor,
  fontFamily,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title: 0-1s fade in
  const titleOpacity = interpolate(frame, [0, fps * 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const ctaTranslate = interpolate(
    frame,
    [fps * 20, fps * 22],
    [60, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const ctaOpacity = interpolate(
    frame,
    [fps * 20, fps * 22],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#1a1a2e',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 24,
        fontFamily,
      }}
    >
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
        {title}
      </div>

      {features.slice(0, 4).map((text, i) => {
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
              color: accentColor,
              fontWeight: 700,
            }}
          >
            {text}
          </div>
        );
      })}

      <div
        style={{
          opacity: ctaOpacity,
          transform: `translateY(${ctaTranslate}px)`,
          fontSize: 28,
          color: '#ffffff',
          marginTop: 32,
          backgroundColor: accentColor,
          padding: '16px 40px',
          borderRadius: 8,
        }}
      >
        {cta}
      </div>
    </AbsoluteFill>
  );
};

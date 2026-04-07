import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Img,
  Video,
  staticFile,
} from 'remotion';
import { z } from 'zod';

export const productAdSchema = z.object({
  title: z.string(),
  /** Maximum 4 items. Additional items are ignored. */
  features: z.array(z.string()),
  cta: z.string(),
  accentColor: z.string(),
  backgroundColor: z.string().default('#1a1a2e'),
  fontFamily: z.string(),
  backgroundMedia: z.string().default(''),
  titleFontSize: z.number().default(72),
  bodyFontSize: z.number().default(36),
  animationType: z.enum(['fade', 'slide', 'zoom', 'pop']).default('fade'),
});

export type ProductAdProps = z.infer<typeof productAdSchema>;

function getAnimatedStyle(
  frame: number,
  startFrame: number,
  animationType: string
): React.CSSProperties {
  const duration = 20
  const progress = Math.min(1, Math.max(0, (frame - startFrame) / duration))

  if (animationType === 'fade') {
    return { opacity: progress }
  }
  if (animationType === 'slide') {
    return {
      opacity: progress,
      transform: `translateY(${(1 - progress) * 40}px)`,
    }
  }
  if (animationType === 'zoom') {
    return {
      opacity: progress,
      transform: `scale(${0.5 + progress * 0.5})`,
    }
  }
  if (animationType === 'pop') {
    const scale = progress < 0.7
      ? progress / 0.7 * 1.15
      : 1.15 - (progress - 0.7) / 0.3 * 0.15
    return {
      opacity: Math.min(1, progress * 2),
      transform: `scale(${scale})`,
    }
  }
  return { opacity: progress }
}

export const ProductAd: React.FC<ProductAdProps> = ({
  title,
  features,
  cta,
  accentColor,
  backgroundColor,
  fontFamily,
  backgroundMedia,
  titleFontSize,
  bodyFontSize,
  animationType,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleStyle = getAnimatedStyle(frame, 0, animationType);

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
        backgroundColor,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 24,
        fontFamily,
      }}
    >
      {backgroundMedia && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          {/\.(mp4|webm|mov)$/i.test(backgroundMedia) ? (
            <Video
              src={/^(https?:|data:)/.test(backgroundMedia) ? backgroundMedia : staticFile(backgroundMedia)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Img
              src={/^(https?:|data:)/.test(backgroundMedia) ? backgroundMedia : staticFile(backgroundMedia)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </div>
      )}

      {/* HOOK */}
      <div
        style={{
          ...titleStyle,
          fontSize: titleFontSize,
          fontWeight: 900,
          color: '#ffffff',
          textAlign: 'center',
          padding: '0 48px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {title}
      </div>

      {/* FEATURES */}
      {features.slice(0, 4).map((text, i) => {
        const start = fps * (5 + i * 3);
        const featureStyle = getAnimatedStyle(frame, start, animationType);
        return (
          <div
            key={`${i}-${text}`}
            style={{
              ...featureStyle,
              fontSize: bodyFontSize,
              color: accentColor,
              fontWeight: 700,
              position: 'relative',
              zIndex: 1,
            }}
          >
            {text}
          </div>
        );
      })}

      {/* CTA */}
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
          position: 'relative',
          zIndex: 1,
        }}
      >
        {cta}
      </div>
    </AbsoluteFill>
  );
};

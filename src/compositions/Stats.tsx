import React from 'react';
import { z } from 'zod';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Img,
  Video,
  staticFile,
} from 'remotion';

const statItemSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const statsSchema = z.object({
  stats: z.array(statItemSchema),
  countUp: z.boolean(),
  accentColor: z.string(),
  backgroundColor: z.string().default('#0f0f0f'),
  fontFamily: z.string(),
  backgroundMedia: z.string().default(''),
  bodyFontSize: z.number().default(36),
  animationType: z.enum(['fade', 'slide', 'zoom', 'pop']).default('fade'),
});

export type StatsProps = z.infer<typeof statsSchema>;

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

export const Stats: React.FC<StatsProps> = ({
  stats,
  countUp,
  accentColor,
  backgroundColor,
  fontFamily,
  backgroundMedia,
  bodyFontSize,
  animationType,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 48,
        fontFamily,
      }}
    >
      {backgroundMedia && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          {/\.(mp4|webm|mov)$/i.test(backgroundMedia) ? (
            <Video
              src={backgroundMedia.startsWith('http') ? backgroundMedia : staticFile(backgroundMedia)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Img
              src={backgroundMedia.startsWith('http') ? backgroundMedia : staticFile(backgroundMedia)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </div>
      )}

      {stats.slice(0, 4).map((stat, i) => {
        const start = fps * (i * 3);
        const animStyle = getAnimatedStyle(frame, start, animationType);

        // Count-up: parse numeric part of value
        const numericMatch = stat.value.match(/[\d.]+/);
        const suffix = stat.value.replace(/[\d.]+/, '');
        const displayValue =
          countUp && numericMatch
            ? interpolate(
                frame,
                [start, start + fps * 1.5],
                [0, parseFloat(numericMatch[0])],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              ).toFixed(numericMatch[0].includes('.') ? 1 : 0) + suffix
            : stat.value;

        return (
          <div
            key={`${i}-${stat.value}`}
            style={{
              ...animStyle,
              textAlign: 'center',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div
              style={{
                fontSize: bodyFontSize * 2,
                fontWeight: 900,
                color: accentColor,
                lineHeight: 1,
              }}
            >
              {displayValue}
            </div>
            <div
              style={{
                fontSize: bodyFontSize,
                color: '#ffffff',
                marginTop: 8,
                opacity: 0.8,
              }}
            >
              {stat.label}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

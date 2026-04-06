import React from 'react';
import { z } from 'zod';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const statItemSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const statsSchema = z.object({
  stats: z.array(statItemSchema),
  countUp: z.boolean(),
  accentColor: z.string(),
  backgroundColor: z.string(),
  fontFamily: z.string(),
});

export type StatsProps = z.infer<typeof statsSchema>;

export const Stats: React.FC<StatsProps> = ({
  stats,
  countUp,
  accentColor,
  backgroundColor,
  fontFamily,
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
      {stats.slice(0, 4).map((stat, i) => {
        const start = fps * (i * 3);
        const opacity = interpolate(frame, [start, start + fps], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const scale = interpolate(frame, [start, start + fps * 0.5], [0.7, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

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
              opacity,
              transform: `scale(${scale})`,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 80,
                fontWeight: 900,
                color: accentColor,
                lineHeight: 1,
              }}
            >
              {displayValue}
            </div>
            <div
              style={{
                fontSize: 28,
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

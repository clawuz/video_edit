import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Img,
} from 'remotion';
import { z } from 'zod';

const subtitleEntrySchema = z.object({
  startMs: z.number(),
  endMs: z.number(),
  text: z.string(),
}).refine((s) => s.endMs > s.startMs, {
  message: 'endMs must be greater than startMs',
});

export const talkingHeadSchema = z.object({
  subtitles: z.array(subtitleEntrySchema),
  lowerThird: z.string(),
  logoUrl: z.string(),
  accentColor: z.string(),
  backgroundColor: z.string(),
  fontFamily: z.string(),
});

export type TalkingHeadProps = z.infer<typeof talkingHeadSchema>;

export const TalkingHead: React.FC<TalkingHeadProps> = ({
  subtitles,
  lowerThird,
  logoUrl,
  accentColor,
  backgroundColor,
  fontFamily,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentMs = (frame / fps) * 1000;

  const activeSubtitle = subtitles.find(
    (s) => currentMs >= s.startMs && currentMs < s.endMs
  );

  const lowerThirdOpacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        fontFamily,
        position: 'relative',
      }}
    >
      {/* Camera area placeholder */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${backgroundColor} 0%, #2d2d4e 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ fontSize: 48, opacity: 0.2 }}>📹</div>
      </div>

      {/* Logo */}
      {logoUrl && (
        <div style={{ position: 'absolute', top: 32, right: 32, width: 120, height: 48 }}>
          <Img src={logoUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      )}

      {/* Lower third */}
      <div
        style={{
          position: 'absolute',
          bottom: 120,
          left: 0,
          right: 0,
          opacity: lowerThirdOpacity,
          padding: '12px 32px',
          backgroundColor: accentColor,
        }}
      >
        <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>
          {lowerThird}
        </div>
      </div>

      {/* Altyazı */}
      <div
        style={{
          position: 'absolute',
          bottom: 48,
          left: 0,
          right: 0,
          padding: '10px 24px',
          backgroundColor: activeSubtitle ? 'rgba(0,0,0,0.65)' : 'transparent',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 32, fontWeight: 600, color: '#ffffff', lineHeight: 1.4 }}>
          {activeSubtitle?.text ?? ''}
        </div>
      </div>
    </AbsoluteFill>
  );
};

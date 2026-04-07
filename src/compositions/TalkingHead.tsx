import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  Img,
  Video,
  staticFile,
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
  backgroundMedia: z.string().default(''),
  titleFontSize: z.number().default(24),
  bodyFontSize: z.number().default(32),
  animationType: z.enum(['fade', 'slide', 'zoom', 'pop']).default('fade'),
});

export type TalkingHeadProps = z.infer<typeof talkingHeadSchema>;

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

export const TalkingHead: React.FC<TalkingHeadProps> = ({
  subtitles,
  lowerThird,
  logoUrl,
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
  const currentMs = (frame / fps) * 1000;

  const activeSubtitle = subtitles.find(
    (s) => currentMs >= s.startMs && currentMs < s.endMs
  );

  const lowerThirdOpacity = getAnimatedStyle(frame, 0, animationType).opacity;

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        fontFamily,
        position: 'relative',
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

      {/* Camera area placeholder */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background: `linear-gradient(135deg, ${backgroundColor} 0%, #2d2d4e 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: backgroundMedia ? 0 : 1,
        }}
      >
        <div style={{ fontSize: 48, opacity: 0.2 }}>📹</div>
      </div>

      {/* Logo */}
      {logoUrl && (
        <div style={{ position: 'absolute', top: 32, right: 32, width: 120, height: 48, zIndex: 2 }}>
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
          opacity: lowerThirdOpacity as number,
          padding: '12px 32px',
          backgroundColor: accentColor,
          zIndex: 2,
        }}
      >
        <div style={{ fontSize: titleFontSize, fontWeight: 700, color: '#fff' }}>
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
          zIndex: 2,
        }}
      >
        <div style={{ fontSize: bodyFontSize, fontWeight: 600, color: '#ffffff', lineHeight: 1.4 }}>
          {activeSubtitle?.text ?? ''}
        </div>
      </div>
    </AbsoluteFill>
  );
};

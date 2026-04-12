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
import { ENTRY_ANIM_TYPES, EXIT_ANIM_TYPES, EntryAnimType, ExitAnimType, BodyItem, PER_LETTER_ENTRY, PER_LETTER_EXIT } from './types'
import { getElementStyle } from './animations'
import { LetterAnimated } from './LetterAnimated'

const EntryAnimSchema = z.enum(ENTRY_ANIM_TYPES as unknown as [EntryAnimType, ...EntryAnimType[]])
const ExitAnimSchema = z.enum(EXIT_ANIM_TYPES as unknown as [ExitAnimType, ...ExitAnimType[]])

const BodyItemSchema = z.object({
  text: z.string(),
  slot: z.number().min(1).max(10),
  startSec: z.number().min(0),
  durationSec: z.number().min(0.1),
  entryAnim: EntryAnimSchema,
  exitAnim: ExitAnimSchema,
})

export const productAdSchema = z.object({
  // Title
  title: z.string(),
  showTitle: z.boolean().default(true),
  titleStartSec: z.number().default(0),
  titleDurationSec: z.number().default(10),
  titleEntryAnim: EntryAnimSchema.default('fade'),
  titleExitAnim: ExitAnimSchema.default('fade-out'),

  // Body
  body: z.array(BodyItemSchema).max(10).default([]),
  showBody: z.boolean().default(true),

  // CTA
  cta: z.string(),
  showCta: z.boolean().default(true),
  ctaMode: z.enum(['text', 'logo']).default('text'),
  ctaStartSec: z.number().default(20),
  ctaDurationSec: z.number().default(8),
  ctaEntryAnim: EntryAnimSchema.default('slide-up'),
  ctaExitAnim: ExitAnimSchema.default('fade-out'),
  ctaBgColor: z.string().default('#e67e22'),
  ctaOpacity: z.number().default(100),
  ctaLogoUrl: z.string().default(''),
  ctaLogoHeight: z.number().default(80),

  // Common
  accentColor: z.string(),
  accentOpacity: z.number().default(100),
  backgroundColor: z.string(),
  fontFamily: z.string(),
  backgroundMedia: z.string(),
  titleFontSize: z.number(),
  bodyFontSize: z.number(),
})

export type ProductAdProps = z.infer<typeof productAdSchema>

function hexToRgba(hex: string, opacity: number): string {
  if (!hex) return 'transparent'
  if (opacity >= 100) return hex
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`
}

export const ProductAd: React.FC<ProductAdProps> = ({
  title, showTitle, titleStartSec, titleDurationSec, titleEntryAnim, titleExitAnim,
  body, showBody,
  cta, showCta, ctaMode, ctaStartSec, ctaDurationSec, ctaEntryAnim, ctaExitAnim,
  ctaBgColor, ctaOpacity, ctaLogoUrl, ctaLogoHeight,
  accentColor, accentOpacity, backgroundColor, fontFamily, backgroundMedia,
  titleFontSize, bodyFontSize,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const renderText = (
    text: string,
    entryAnim: EntryAnimType,
    exitAnim: ExitAnimType,
    ep: number,
    xp: number,
  ) => {
    if (PER_LETTER_ENTRY.has(entryAnim) || PER_LETTER_EXIT.has(exitAnim)) {
      return <LetterAnimated text={text} entryProgress={ep} exitProgress={xp} entryAnim={entryAnim} exitAnim={exitAnim} />
    }
    return text
  }

  const slotMap = new Map<number, BodyItem[]>()
  body.forEach(item => {
    if (!slotMap.has(item.slot)) slotMap.set(item.slot, [])
    slotMap.get(item.slot)!.push(item)
  })

  const ctaBgCss = hexToRgba(ctaBgColor, ctaOpacity)
  const accentCss = hexToRgba(accentColor, accentOpacity)

  return (
    <AbsoluteFill style={{ backgroundColor, justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 24, fontFamily }}>
      {/* Background media */}
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

      {/* Title */}
      {showTitle && (() => {
        const { style, entryProgress, exitProgress } = getElementStyle(
          frame, fps, titleStartSec, titleDurationSec,
          titleEntryAnim as EntryAnimType, titleExitAnim as ExitAnimType
        )
        return (
          <div style={{ ...style, fontSize: titleFontSize, fontWeight: 900, color: '#ffffff', textAlign: 'center', padding: '0 48px', position: 'relative', zIndex: 1 }}>
            {renderText(title, titleEntryAnim as EntryAnimType, titleExitAnim as ExitAnimType, entryProgress, exitProgress)}
          </div>
        )
      })()}

      {/* Body slots */}
      {showBody && Array.from(slotMap.keys()).sort().map(slot => (
        <div key={slot} style={{ position: 'relative', width: '100%', textAlign: 'center', minHeight: bodyFontSize * 1.6, zIndex: 1 }}>
          {slotMap.get(slot)!.map((item, i) => {
            const entryAnim = item.entryAnim as EntryAnimType
            const exitAnim = item.exitAnim as ExitAnimType
            const { style, entryProgress, exitProgress } = getElementStyle(
              frame, fps, item.startSec, item.durationSec, entryAnim, exitAnim
            )
            return (
              <div key={i} style={{ position: 'absolute', width: '100%', ...style, fontSize: bodyFontSize, color: accentCss, fontWeight: 700 }}>
                {renderText(item.text, entryAnim, exitAnim, entryProgress, exitProgress)}
              </div>
            )
          })}
        </div>
      ))}

      {/* CTA */}
      {showCta && (() => {
        const { style } = getElementStyle(
          frame, fps, ctaStartSec, ctaDurationSec,
          ctaEntryAnim as EntryAnimType, ctaExitAnim as ExitAnimType
        )
        return (
          <div style={{ ...style, position: 'relative', zIndex: 1, marginTop: 32 }}>
            {ctaMode === 'logo' && ctaLogoUrl ? (
              <Img
                src={/^(https?:|data:)/.test(ctaLogoUrl) ? ctaLogoUrl : staticFile(ctaLogoUrl)}
                style={{ height: ctaLogoHeight, objectFit: 'contain' }}
              />
            ) : (
              <div style={{
                backgroundColor: ctaBgCss,
                border: ctaBgColor ? 'none' : `2px solid ${accentCss}`,
                color: ctaBgColor ? '#ffffff' : accentCss,
                padding: '16px 40px',
                borderRadius: 8,
                fontSize: 28,
                fontWeight: 700,
              }}>
                {cta}
              </div>
            )}
          </div>
        )
      })()}
    </AbsoluteFill>
  )
}

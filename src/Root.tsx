import React from 'react'
import { Composition } from 'remotion'
import { HelloWorld } from './compositions/HelloWorld'
import { ProductAd, ProductAdProps } from './compositions/ProductAd'
import { Stats, StatsProps } from './compositions/Stats'
import { Subtitle, SubtitleProps } from './compositions/Subtitle'
import { PLATFORMS } from './compositions/platforms'

const productAdDefaults = {
  platform: '9:16',
  title: 'Your morning deserves better',
  showTitle: true,
  titleStartSec: 0,
  titleDurationSec: 10,
  titleEntryAnim: 'fade',
  titleExitAnim: 'fade-out',
  body: [
    { text: 'Single Origin Beans', slot: 1, startSec: 5, durationSec: 8, entryAnim: 'slide-up', exitAnim: 'fade-out' },
    { text: 'Roasted Fresh Weekly', slot: 2, startSec: 8, durationSec: 8, entryAnim: 'slide-up', exitAnim: 'fade-out' },
    { text: 'Shipped to Your Door', slot: 3, startSec: 11, durationSec: 8, entryAnim: 'slide-up', exitAnim: 'fade-out' },
  ],
  showBody: true,
  cta: 'mountainbrew.co',
  showCta: true,
  ctaMode: 'text',
  ctaStartSec: 20,
  ctaDurationSec: 8,
  ctaEntryAnim: 'slide-up',
  ctaExitAnim: 'fade-out',
  ctaBgColor: '#e67e22',
  ctaOpacity: 100,
  ctaLogoUrl: '',
  ctaLogoHeight: 80,
  accentColor: '#e67e22',
  accentOpacity: 100,
  backgroundColor: '#1a1a2e',
  fontFamily: 'sans-serif',
  backgroundMedia: '',
  titleFontSize: 72,
  bodyFontSize: 36,
} as unknown as ProductAdProps

const statsDefaults = {
  platform: '9:16',
  stats: [
    { value: '47%', label: 'Increase in Engagement' },
    { value: '2.3x', label: 'Return on Investment' },
    { value: '150+', label: 'Happy Clients' },
    { value: '$1.2M', label: 'Revenue Generated' },
  ],
  countUp: true,
  accentColor: '#3b82f6',
  backgroundColor: '#0f0f0f',
  fontFamily: 'sans-serif',
  backgroundMedia: '',
  bodyFontSize: 36,
  animationType: 'fade' as const,
} as unknown as StatsProps

const subtitleDefaults: SubtitleProps = {
  platform: '9:16',
  backgroundMedia: '',
  subtitles: [
    { startMs: 0, endMs: 3000, text: 'Merhaba!' },
    { startMs: 3000, endMs: 6000, text: 'Bu bir örnek altyazı.' },
  ],
  splitMode: 'sentence',
  chunkSize: 5,
  subtitlePosition: 'bottom',
  subtitleFontSize: 52,
  subtitleFontFamily: 'Poppins',
  subtitleColor: '#ffffff',
  subtitleBgColor: 'rgba(0,0,0,0.65)',
  subtitleBold: true,
  subtitleOutline: false,
  subtitleOutlineColor: '#000000',
  showLowerThird: false,
  lowerThirdText: '',
  lowerThirdColor: '#10b981',
  logoUrl: '',
  accentColor: '#10b981',
  backgroundColor: '#000000',
}

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ProductAd"
        component={ProductAd}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={productAdDefaults}
        calculateMetadata={({ props }) => {
          const p = PLATFORMS[(props as any).platform ?? '9:16'] ?? PLATFORMS['9:16']
          const durationInFrames = (props as any).durationInFrames ?? 900
          return { width: p.w, height: p.h, durationInFrames, props }
        }}
      />
      <Composition
        id="Stats"
        component={Stats}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={statsDefaults}
        calculateMetadata={({ props }) => {
          const p = PLATFORMS[(props as any).platform ?? '9:16'] ?? PLATFORMS['9:16']
          const durationInFrames = (props as any).durationInFrames ?? 600
          return { width: p.w, height: p.h, durationInFrames, props }
        }}
      />
      <Composition
        id="Subtitle"
        component={Subtitle}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={subtitleDefaults}
        calculateMetadata={({ props }) => {
          const p = PLATFORMS[(props as any).platform ?? '9:16'] ?? PLATFORMS['9:16']
          const durationInFrames = (props as any).durationInFrames ?? 900
          return { width: p.w, height: p.h, durationInFrames, props }
        }}
      />
    </>
  )
}

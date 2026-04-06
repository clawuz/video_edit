# VideoEdit Web — Plan 1: Next.js Kurulum + Video Oluştur Tab

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `web/` klasöründe çalışan Next.js uygulaması: 3 Remotion şablonunu props ile parametreleştir, form arayüzü üzerinden render tetikle, MP4 indir.

**Architecture:** Next.js 14 App Router (`web/`) Remotion projesinin (`../`) yanında bağımsız çalışır. API route shell ile `npx remotion render` çalıştırır. Frontend Clean White tasarımıyla TopNav + split panel layout kullanır.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS 3, Remotion 4.x (mevcut), Jest + React Testing Library

---

## Dosya Haritası

| Durum | Yol | Sorumluluk |
|-------|-----|------------|
| Oluştur | `web/package.json` | Next.js bağımlılıkları |
| Oluştur | `web/next.config.ts` | Next.js konfigürasyonu |
| Oluştur | `web/.env.local` | REMOTION_PROJECT_DIR env var |
| Oluştur | `web/jest.config.ts` | Jest konfigürasyonu |
| Oluştur | `web/jest.setup.ts` | RTL kurulumu |
| Oluştur | `web/app/layout.tsx` | Root layout + Tailwind |
| Oluştur | `web/app/page.tsx` | Video Oluştur sayfası |
| Oluştur | `web/app/globals.css` | Tailwind direktifleri |
| Oluştur | `web/app/api/render/route.ts` | POST: render tetikle |
| Oluştur | `web/app/api/download/[id]/route.ts` | GET: MP4 stream |
| Oluştur | `web/lib/templates.ts` | Şablon şemaları + default değerler |
| Oluştur | `web/lib/renderer.ts` | npx remotion render shell wrapper |
| Oluştur | `web/components/TopNav.tsx` | Üst navigasyon (3 tab) |
| Oluştur | `web/components/TemplateGrid.tsx` | 3 şablon kartı |
| Oluştur | `web/components/ParamForm.tsx` | Dinamik form (şablona göre) |
| Oluştur | `web/components/VideoPreview.tsx` | Telefon mockup + animasyon |
| Değiştir | `src/compositions/ProductAd.tsx` | Props ile parametreleştir |
| Oluştur | `src/compositions/Stats.tsx` | Yeni: istatistik composition |
| Oluştur | `src/compositions/TalkingHead.tsx` | Yeni: talking head composition |
| Değiştir | `src/Root.tsx` | calculateMetadata ile dinamik boyut |

---

## Task 1: Next.js Projesi Kur

**Files:**
- Create: `web/package.json`
- Create: `web/next.config.ts`
- Create: `web/.env.local`
- Create: `web/jest.config.ts`
- Create: `web/jest.setup.ts`
- Create: `web/tsconfig.json`
- Create: `web/app/globals.css`
- Create: `web/app/layout.tsx`

- [ ] **Step 1: web/ klasörünü oluştur ve Next.js kur**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit
mkdir web && cd web
npx create-next-app@14 . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --yes
```

Beklenen: `package.json`, `app/`, `tailwind.config.ts` oluşur.

- [ ] **Step 2: Test bağımlılıklarını kur**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit/web
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event ts-jest
```

- [ ] **Step 3: `web/jest.config.ts` oluştur**

```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
}

export default createJestConfig(config)
```

- [ ] **Step 4: `web/jest.setup.ts` oluştur**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 5: `web/.env.local` oluştur**

```
REMOTION_PROJECT_DIR=../
RENDER_OUT_DIR=../out
```

- [ ] **Step 6: `web/next.config.ts` oluştur**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {},
}

export default nextConfig
```

- [ ] **Step 7: `web/app/globals.css` içini Tailwind direktifleriyle değiştir**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 8: `web/app/layout.tsx` yaz**

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VideoEdit',
  description: 'Remotion video oluşturma ve altyazı ekleme',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 9: Kurulumu doğrula**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit/web
npm run dev &
sleep 3
curl -s http://localhost:3000 | head -5
kill %1
```

Beklenen: HTML çıktısı gelir, hata yok.

- [ ] **Step 10: Commit**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit
git add web/
git commit -m "feat: init Next.js web project with Tailwind and Jest"
```

---

## Task 2: ProductAd Composition'ını Parametreleştir

**Files:**
- Modify: `src/compositions/ProductAd.tsx`
- Modify: `src/Root.tsx`

- [ ] **Step 1: `src/compositions/ProductAd.tsx`'i props alacak şekilde yeniden yaz**

```tsx
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
```

- [ ] **Step 2: `src/Root.tsx`'i calculateMetadata ile güncelle**

```tsx
import React from "react";
import { Composition } from "remotion";
import { HelloWorld } from "./compositions/HelloWorld";
import { ProductAd, ProductAdProps } from "./compositions/ProductAd";
import { Stats, StatsProps } from "./compositions/Stats";
import { TalkingHead, TalkingHeadProps } from "./compositions/TalkingHead";

const productAdDefaults: ProductAdProps = {
  title: 'Your morning deserves better',
  features: ['Single Origin Beans', 'Roasted Fresh Weekly', 'Shipped to Your Door'],
  cta: 'mountainbrew.co',
  accentColor: '#e67e22',
  fontFamily: 'sans-serif',
};

const statsDefaults: StatsProps = {
  stats: [
    { value: '47%', label: 'Dönüşüm artışı' },
    { value: '2.3x', label: 'Reklam getirisi' },
    { value: '150+', label: 'Müşteri' },
    { value: '$1.2M', label: 'Gelir' },
  ],
  countUp: true,
  accentColor: '#3b82f6',
  fontFamily: 'sans-serif',
};

const talkingHeadDefaults: TalkingHeadProps = {
  subtitles: [
    { startMs: 0, endMs: 3000, text: 'Merhaba!' },
    { startMs: 3000, endMs: 6000, text: 'Bu bir örnek.' },
  ],
  lowerThird: 'Ad Soyad — Ünvan',
  logoUrl: '',
  accentColor: '#10b981',
  fontFamily: 'sans-serif',
};

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
      />
      <Composition
        id="Stats"
        component={Stats}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={statsDefaults}
      />
      <Composition
        id="TalkingHead"
        component={TalkingHead}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={talkingHeadDefaults}
      />
    </>
  );
};
```

- [ ] **Step 3: Composition'ın hâlâ çalıştığını doğrula**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit
npx remotion compositions
```

Beklenen: `HelloWorld` ve `ProductAd` listelenir (Stats ve TalkingHead henüz yok, hata normal).

- [ ] **Step 4: Commit**

```bash
git add src/compositions/ProductAd.tsx src/Root.tsx
git commit -m "feat: parametrize ProductAd with props, update Root.tsx"
```

---

## Task 3: Stats Composition Yaz

**Files:**
- Create: `src/compositions/Stats.tsx`
- Modify: `src/Root.tsx` (Stats import zaten var, TypeScript hatası giderilir)

- [ ] **Step 1: `src/compositions/Stats.tsx` oluştur**

```tsx
import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export interface StatItem {
  value: string;
  label: string;
}

export interface StatsProps {
  stats: StatItem[];
  countUp: boolean;
  accentColor: string;
  fontFamily: string;
}

export const Stats: React.FC<StatsProps> = ({
  stats,
  countUp,
  accentColor,
  fontFamily,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0f0f0f',
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

        // Count-up: sayısal değerleri parse et
        const numericMatch = stat.value.match(/[\d.]+/);
        const suffix = stat.value.replace(/[\d.]+/, '');
        const displayValue =
          countUp && numericMatch
            ? interpolate(frame, [start, start + fps * 1.5], [0, parseFloat(numericMatch[0])], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }).toFixed(numericMatch[0].includes('.') ? 1 : 0) + suffix
            : stat.value;

        return (
          <div
            key={i}
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
```

- [ ] **Step 2: Composition'ın tanındığını doğrula**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit
npx remotion compositions
```

Beklenen: `Stats` listede görünür (600 frames, 1080×1920).

- [ ] **Step 3: Commit**

```bash
git add src/compositions/Stats.tsx src/Root.tsx
git commit -m "feat: add Stats composition with count-up animation"
```

---

## Task 4: TalkingHead Composition Yaz

**Files:**
- Create: `src/compositions/TalkingHead.tsx`

- [ ] **Step 1: `src/compositions/TalkingHead.tsx` oluştur**

```tsx
import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Img,
} from 'remotion';

export interface SubtitleEntry {
  startMs: number;
  endMs: number;
  text: string;
}

export interface TalkingHeadProps {
  subtitles: SubtitleEntry[];
  lowerThird: string;
  logoUrl: string;
  accentColor: string;
  fontFamily: string;
}

export const TalkingHead: React.FC<TalkingHeadProps> = ({
  subtitles,
  lowerThird,
  logoUrl,
  accentColor,
  fontFamily,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
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
        backgroundColor: '#1a1a2e',
        fontFamily,
        position: 'relative',
      }}
    >
      {/* Kamera alanı placeholder */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d4e 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ fontSize: 48, opacity: 0.2 }}>📹</div>
      </div>

      {/* Logo */}
      {logoUrl && (
        <div style={{ position: 'absolute', top: 32, right: 32 }}>
          <Img src={logoUrl} style={{ height: 48, objectFit: 'contain' }} />
        </div>
      )}

      {/* Lower third */}
      <div
        style={{
          position: 'absolute',
          bottom: activeSubtitle ? 120 : 48,
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
      {activeSubtitle && (
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            left: 0,
            right: 0,
            padding: '10px 24px',
            backgroundColor: 'rgba(0,0,0,0.65)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 600, color: '#ffffff', lineHeight: 1.4 }}>
            {activeSubtitle.text}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Tüm composition'ların tanındığını doğrula**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit
npx remotion compositions
```

Beklenen çıktı (4 composition):
```
HelloWorld    30    1920x1080    150
ProductAd     30    1080x1920    900
Stats         30    1080x1920    600
TalkingHead   30    1080x1920    300
```

- [ ] **Step 3: Commit**

```bash
git add src/compositions/TalkingHead.tsx
git commit -m "feat: add TalkingHead composition with subtitle overlay"
```

---

## Task 5: lib/templates.ts — Şablon Şemaları

**Files:**
- Create: `web/lib/templates.ts`
- Create: `web/lib/__tests__/templates.test.ts`

- [ ] **Step 1: Test yaz**

`web/lib/__tests__/templates.test.ts`:

```typescript
import { TEMPLATES, getTemplate, buildRenderProps } from '../templates'

describe('templates', () => {
  test('TEMPLATES has 3 entries', () => {
    expect(TEMPLATES).toHaveLength(3)
  })

  test('getTemplate returns correct template by id', () => {
    const t = getTemplate('ProductAd')
    expect(t.id).toBe('ProductAd')
    expect(t.label).toBe('Ürün Reklamı')
  })

  test('getTemplate throws for unknown id', () => {
    expect(() => getTemplate('Unknown')).toThrow('Unknown template: Unknown')
  })

  test('buildRenderProps merges defaults with overrides', () => {
    const props = buildRenderProps('ProductAd', { title: 'Test Başlık' })
    expect(props.title).toBe('Test Başlık')
    expect(props.accentColor).toBe('#e67e22') // default korunur
    expect(props.features).toBeDefined()
  })

  test('buildRenderProps includes width/height/durationInFrames/fps', () => {
    const props = buildRenderProps('ProductAd', {}, '1920x1080', 15)
    expect(props.width).toBe(1920)
    expect(props.height).toBe(1080)
    expect(props.durationInFrames).toBe(450) // 15s * 30fps
    expect(props.fps).toBe(30)
  })
})
```

- [ ] **Step 2: Testi çalıştır, fail bekleniyor**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit/web
npx jest lib/__tests__/templates.test.ts 2>&1 | tail -5
```

Beklenen: `Cannot find module '../templates'`

- [ ] **Step 3: `web/lib/templates.ts` yaz**

```typescript
export interface TemplateRenderMeta {
  width: number;
  height: number;
  durationInFrames: number;
  fps: number;
}

export interface Template {
  id: string;
  label: string;
  description: string;
  gradient: string;
  defaultDurationSeconds: number;
  defaultFormat: '1080x1920' | '1920x1080';
  defaultProps: Record<string, unknown>;
}

export const TEMPLATES: Template[] = [
  {
    id: 'ProductAd',
    label: 'Ürün Reklamı',
    description: 'Animasyonlu başlık, özellikler ve CTA',
    gradient: 'from-indigo-600 to-purple-600',
    defaultDurationSeconds: 30,
    defaultFormat: '1080x1920',
    defaultProps: {
      title: 'Your morning deserves better',
      features: ['Single Origin Beans', 'Roasted Fresh Weekly', 'Shipped to Your Door'],
      cta: 'mountainbrew.co',
      accentColor: '#e67e22',
      fontFamily: 'sans-serif',
    },
  },
  {
    id: 'Stats',
    label: 'İstatistik',
    description: 'Count-up animasyonlu sayısal veriler',
    gradient: 'from-blue-500 to-cyan-500',
    defaultDurationSeconds: 20,
    defaultFormat: '1080x1920',
    defaultProps: {
      stats: [
        { value: '47%', label: 'Dönüşüm artışı' },
        { value: '2.3x', label: 'Reklam getirisi' },
        { value: '150+', label: 'Müşteri' },
        { value: '$1.2M', label: 'Gelir' },
      ],
      countUp: true,
      accentColor: '#3b82f6',
      fontFamily: 'sans-serif',
    },
  },
  {
    id: 'TalkingHead',
    label: 'Talking Head',
    description: 'Altyazılı sunum şablonu',
    gradient: 'from-emerald-500 to-teal-500',
    defaultDurationSeconds: 30,
    defaultFormat: '1080x1920',
    defaultProps: {
      subtitles: [
        { startMs: 0, endMs: 3000, text: 'Merhaba!' },
        { startMs: 3000, endMs: 6000, text: 'Bu bir örnek.' },
      ],
      lowerThird: 'Ad Soyad — Ünvan',
      logoUrl: '',
      accentColor: '#10b981',
      fontFamily: 'sans-serif',
    },
  },
]

export function getTemplate(id: string): Template {
  const t = TEMPLATES.find((t) => t.id === id)
  if (!t) throw new Error(`Unknown template: ${id}`)
  return t
}

export function buildRenderProps(
  templateId: string,
  overrides: Record<string, unknown>,
  format?: string,
  durationSeconds?: number
): Record<string, unknown> & TemplateRenderMeta {
  const template = getTemplate(templateId)

  const fmt = format ?? template.defaultFormat
  const [w, h] = fmt.split('x').map(Number)
  const fps = 30
  const dur = durationSeconds ?? template.defaultDurationSeconds

  return {
    ...template.defaultProps,
    ...overrides,
    width: w,
    height: h,
    fps,
    durationInFrames: dur * fps,
  }
}
```

- [ ] **Step 4: Testleri çalıştır, geçmeli**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit/web
npx jest lib/__tests__/templates.test.ts
```

Beklenen: `5 passed`

- [ ] **Step 5: Commit**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit
git add web/lib/templates.ts web/lib/__tests__/templates.test.ts
git commit -m "feat: add template schemas and buildRenderProps"
```

---

## Task 6: lib/renderer.ts — Render Shell Wrapper

**Files:**
- Create: `web/lib/renderer.ts`
- Create: `web/lib/__tests__/renderer.test.ts`

- [ ] **Step 1: Test yaz**

`web/lib/__tests__/renderer.test.ts`:

```typescript
import { buildRenderCommand, getOutputPath } from '../renderer'

describe('renderer', () => {
  test('buildRenderCommand üretilen komutu doğru oluşturur', () => {
    const cmd = buildRenderCommand({
      compositionId: 'ProductAd',
      outputPath: '/tmp/test.mp4',
      props: { title: 'Test', accentColor: '#fff' },
    })
    expect(cmd).toContain('npx remotion render ProductAd')
    expect(cmd).toContain('/tmp/test.mp4')
    expect(cmd).toContain('--props=')
    expect(cmd).toContain('Test')
  })

  test('getOutputPath uuid içeren mp4 yolu döner', () => {
    const p = getOutputPath('/tmp/out')
    expect(p).toMatch(/\/tmp\/out\/.+\.mp4$/)
    // Her çağrıda farklı UUID
    expect(p).not.toBe(getOutputPath('/tmp/out'))
  })
})
```

- [ ] **Step 2: Testi çalıştır, fail bekleniyor**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit/web
npx jest lib/__tests__/renderer.test.ts 2>&1 | tail -5
```

Beklenen: `Cannot find module '../renderer'`

- [ ] **Step 3: `web/lib/renderer.ts` yaz**

```typescript
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { randomUUID } from 'crypto'
import fs from 'fs'

const execAsync = promisify(exec)

const REMOTION_DIR = path.resolve(process.cwd(), process.env.REMOTION_PROJECT_DIR ?? '../')
const OUT_DIR = path.resolve(process.cwd(), process.env.RENDER_OUT_DIR ?? '../out')

export function getOutputPath(outDir: string = OUT_DIR): string {
  return path.join(outDir, `${randomUUID()}.mp4`)
}

export function buildRenderCommand(opts: {
  compositionId: string
  outputPath: string
  props: Record<string, unknown>
}): string {
  const propsJson = JSON.stringify(opts.props).replace(/'/g, "\\'")
  return `npx remotion render ${opts.compositionId} "${opts.outputPath}" --props='${propsJson}'`
}

export async function render(opts: {
  compositionId: string
  props: Record<string, unknown>
}): Promise<string> {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const outputPath = getOutputPath()
  const cmd = buildRenderCommand({ ...opts, outputPath })
  await execAsync(cmd, { cwd: REMOTION_DIR, maxBuffer: 1024 * 1024 * 100 })
  return outputPath
}
```

- [ ] **Step 4: Testleri çalıştır, geçmeli**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit/web
npx jest lib/__tests__/renderer.test.ts
```

Beklenen: `2 passed`

- [ ] **Step 5: Commit**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit
git add web/lib/renderer.ts web/lib/__tests__/renderer.test.ts
git commit -m "feat: add renderer shell wrapper with buildRenderCommand"
```

---

## Task 7: API Routes — Render + Download

**Files:**
- Create: `web/app/api/render/route.ts`
- Create: `web/app/api/download/[id]/route.ts`

- [ ] **Step 1: `web/app/api/render/route.ts` yaz**

```typescript
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { render } from '@/lib/renderer'
import { buildRenderProps } from '@/lib/templates'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      templateId: string
      overrides: Record<string, unknown>
      format?: string
      durationSeconds?: number
    }

    const { templateId, overrides, format, durationSeconds } = body

    if (!templateId) {
      return NextResponse.json({ error: 'templateId gerekli' }, { status: 400 })
    }

    const props = buildRenderProps(templateId, overrides ?? {}, format, durationSeconds)
    const outputPath = await render({ compositionId: templateId, props })
    const id = path.basename(outputPath, '.mp4')

    return NextResponse.json({ id, outputPath })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Render hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 2: `web/app/api/download/[id]/route.ts` yaz**

```typescript
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

const OUT_DIR = path.resolve(process.cwd(), process.env.RENDER_OUT_DIR ?? '../out')

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  // Güvenlik: path traversal engelle
  if (!/^[a-f0-9-]+$/.test(id)) {
    return NextResponse.json({ error: 'Geçersiz id' }, { status: 400 })
  }

  const filePath = path.join(OUT_DIR, `${id}.mp4`)

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 })
  }

  const fileBuffer = fs.readFileSync(filePath)
  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Disposition': `attachment; filename="${id}.mp4"`,
      'Content-Length': fileBuffer.length.toString(),
    },
  })
}
```

- [ ] **Step 3: Sunucuyu başlat ve render API'yi test et**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit/web
npm run dev &
sleep 4
curl -s -X POST http://localhost:3000/api/render \
  -H "Content-Type: application/json" \
  -d '{"templateId":"ProductAd","overrides":{"title":"API Test"},"durationSeconds":5}' \
  | python3 -m json.tool
```

Beklenen: `{"id": "<uuid>", "outputPath": "..."}` — render 30-60 saniye sürebilir.

- [ ] **Step 4: Download endpoint'ini test et**

```bash
# Önceki testten gelen id'yi kullan
ID="<uuid-from-previous-test>"
curl -s -o /tmp/test-download.mp4 http://localhost:3000/api/download/$ID
file /tmp/test-download.mp4
```

Beklenen: `ISO Media, MP4 Base Media...`

```bash
kill %1
```

- [ ] **Step 5: Commit**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit
git add web/app/api/
git commit -m "feat: add render and download API routes"
```

---

## Task 8: TopNav Bileşeni

**Files:**
- Create: `web/components/TopNav.tsx`
- Create: `web/components/__tests__/TopNav.test.tsx`

- [ ] **Step 1: Test yaz**

`web/components/__tests__/TopNav.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { TopNav } from '../TopNav'

describe('TopNav', () => {
  test('logo görünür', () => {
    render(<TopNav activeTab="create" onTabChange={() => {}} />)
    expect(screen.getByText('🎬 VideoEdit')).toBeInTheDocument()
  })

  test('3 tab gösterir', () => {
    render(<TopNav activeTab="create" onTabChange={() => {}} />)
    expect(screen.getByText('Video Oluştur')).toBeInTheDocument()
    expect(screen.getByText('Altyazı Ekle')).toBeInTheDocument()
    expect(screen.getByText('Geçmiş')).toBeInTheDocument()
  })

  test('aktif tab underline alır', () => {
    render(<TopNav activeTab="subtitle" onTabChange={() => {}} />)
    const subtitleTab = screen.getByText('Altyazı Ekle').closest('button')
    expect(subtitleTab).toHaveClass('border-b-2')
  })

  test('tab tıklandığında onTabChange çağrılır', async () => {
    const onChange = jest.fn()
    const { getByText } = render(<TopNav activeTab="create" onTabChange={onChange} />)
    getByText('Geçmiş').closest('button')!.click()
    expect(onChange).toHaveBeenCalledWith('history')
  })
})
```

- [ ] **Step 2: Testi çalıştır, fail bekleniyor**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit/web
npx jest components/__tests__/TopNav.test.tsx 2>&1 | tail -5
```

Beklenen: `Cannot find module '../TopNav'`

- [ ] **Step 3: `web/components/TopNav.tsx` yaz**

```tsx
'use client'

export type TabId = 'create' | 'subtitle' | 'history'

const TABS: { id: TabId; label: string }[] = [
  { id: 'create', label: 'Video Oluştur' },
  { id: 'subtitle', label: 'Altyazı Ekle' },
  { id: 'history', label: 'Geçmiş' },
]

interface TopNavProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export function TopNav({ activeTab, onTabChange }: TopNavProps) {
  return (
    <nav className="bg-white border-b border-gray-200 px-5 flex items-center gap-6 h-12 shrink-0">
      <span className="text-sm font-black tracking-tight text-gray-900">🎬 VideoEdit</span>
      <div className="flex flex-1 gap-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`text-xs px-4 h-12 font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <button className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-md font-semibold">
        + Yeni
      </button>
    </nav>
  )
}
```

- [ ] **Step 4: Testleri çalıştır, geçmeli**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit/web
npx jest components/__tests__/TopNav.test.tsx
```

Beklenen: `4 passed`

- [ ] **Step 5: Commit**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit
git add web/components/TopNav.tsx web/components/__tests__/TopNav.test.tsx
git commit -m "feat: add TopNav component with tab navigation"
```

---

## Task 9: TemplateGrid Bileşeni

**Files:**
- Create: `web/components/TemplateGrid.tsx`
- Create: `web/components/__tests__/TemplateGrid.test.tsx`

- [ ] **Step 1: Test yaz**

`web/components/__tests__/TemplateGrid.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TemplateGrid } from '../TemplateGrid'

describe('TemplateGrid', () => {
  test('3 şablon kartı gösterir', () => {
    render(<TemplateGrid selected="ProductAd" onSelect={() => {}} />)
    expect(screen.getByText('Ürün Reklamı')).toBeInTheDocument()
    expect(screen.getByText('İstatistik')).toBeInTheDocument()
    expect(screen.getByText('Talking Head')).toBeInTheDocument()
  })

  test('seçili kart kalın border alır', () => {
    render(<TemplateGrid selected="Stats" onSelect={() => {}} />)
    const statsCard = screen.getByText('İstatistik').closest('button')
    expect(statsCard).toHaveClass('border-gray-900')
  })

  test('kart tıklandığında onSelect çağrılır', async () => {
    const onSelect = jest.fn()
    render(<TemplateGrid selected="ProductAd" onSelect={onSelect} />)
    await userEvent.click(screen.getByText('Talking Head'))
    expect(onSelect).toHaveBeenCalledWith('TalkingHead')
  })
})
```

- [ ] **Step 2: Testi çalıştır, fail bekleniyor**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit/web
npx jest components/__tests__/TemplateGrid.test.tsx 2>&1 | tail -5
```

- [ ] **Step 3: `web/components/TemplateGrid.tsx` yaz**

```tsx
'use client'

import { TEMPLATES } from '@/lib/templates'

interface TemplateGridProps {
  selected: string
  onSelect: (id: string) => void
}

export function TemplateGrid({ selected, onSelect }: TemplateGridProps) {
  return (
    <div className="grid grid-cols-3 gap-3 mb-5">
      {TEMPLATES.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={`text-left rounded-lg overflow-hidden border-2 transition-all ${
            selected === t.id
              ? 'border-gray-900'
              : 'border-gray-200 hover:border-gray-400'
          }`}
        >
          <div className={`h-11 bg-gradient-to-br ${t.gradient}`} />
          <div className="p-2">
            <div
              className={`text-xs font-semibold ${
                selected === t.id ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              {t.label}
            </div>
            <div className="text-xs text-gray-400 mt-0.5 leading-tight">
              {t.description}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Testleri çalıştır, geçmeli**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit/web
npx jest components/__tests__/TemplateGrid.test.tsx
```

Beklenen: `3 passed`

- [ ] **Step 5: Commit**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit
git add web/components/TemplateGrid.tsx web/components/__tests__/TemplateGrid.test.tsx
git commit -m "feat: add TemplateGrid component"
```

---

## Task 10: ParamForm Bileşeni

**Files:**
- Create: `web/components/ParamForm.tsx`
- Create: `web/components/__tests__/ParamForm.test.tsx`

- [ ] **Step 1: Test yaz**

`web/components/__tests__/ParamForm.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ParamForm } from '../ParamForm'

const productAdDefaults = {
  title: 'Test başlık',
  features: ['Özellik 1', 'Özellik 2'],
  cta: 'test.com',
  accentColor: '#e67e22',
  fontFamily: 'sans-serif',
}

describe('ParamForm', () => {
  test('ProductAd için başlık alanı gösterir', () => {
    render(
      <ParamForm
        templateId="ProductAd"
        values={productAdDefaults}
        onChange={() => {}}
        onSubmit={() => {}}
        loading={false}
      />
    )
    expect(screen.getByLabelText('Başlık')).toBeInTheDocument()
    expect(screen.getByLabelText('CTA Metni')).toBeInTheDocument()
  })

  test('onChange başlık değiştiğinde çağrılır', async () => {
    const onChange = jest.fn()
    render(
      <ParamForm
        templateId="ProductAd"
        values={productAdDefaults}
        onChange={onChange}
        onSubmit={() => {}}
        loading={false}
      />
    )
    const input = screen.getByLabelText('Başlık')
    await userEvent.clear(input)
    await userEvent.type(input, 'Yeni Başlık')
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ title: expect.stringContaining('Y') }))
  })

  test('loading=true iken buton disabled', () => {
    render(
      <ParamForm
        templateId="ProductAd"
        values={productAdDefaults}
        onChange={() => {}}
        onSubmit={() => {}}
        loading={true}
      />
    )
    expect(screen.getByRole('button', { name: /render/i })).toBeDisabled()
  })
})
```

- [ ] **Step 2: Testi çalıştır, fail bekleniyor**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit/web
npx jest components/__tests__/ParamForm.test.tsx 2>&1 | tail -5
```

- [ ] **Step 3: `web/components/ParamForm.tsx` yaz**

```tsx
'use client'

const FONTS = ['sans-serif', 'Inter', 'Poppins', 'Roboto']
const ACCENT_PRESETS = ['#e67e22', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6']
const DURATIONS = [15, 30, 60]
const FORMATS = ['1080x1920', '1920x1080']

interface ParamFormProps {
  templateId: string
  values: Record<string, unknown>
  onChange: (values: Record<string, unknown>) => void
  onSubmit: () => void
  loading: boolean
}

export function ParamForm({ templateId, values, onChange, onSubmit, loading }: ParamFormProps) {
  const update = (key: string, value: unknown) => onChange({ ...values, [key]: value })

  return (
    <div className="space-y-4">
      {/* ProductAd alanları */}
      {templateId === 'ProductAd' && (
        <>
          <div>
            <label htmlFor="title" className="block text-xs text-gray-500 mb-1 font-medium">Başlık</label>
            <input
              id="title"
              className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              value={String(values.title ?? '')}
              onChange={(e) => update('title', e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="features" className="block text-xs text-gray-500 mb-1 font-medium">Özellikler (her satır ayrı, max 4)</label>
            <textarea
              id="features"
              rows={4}
              className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 resize-none focus:outline-none focus:ring-1 focus:ring-gray-900"
              value={(values.features as string[] ?? []).join('\n')}
              onChange={(e) => update('features', e.target.value.split('\n').slice(0, 4))}
            />
          </div>
          <div>
            <label htmlFor="cta" className="block text-xs text-gray-500 mb-1 font-medium">CTA Metni</label>
            <input
              id="cta"
              className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              value={String(values.cta ?? '')}
              onChange={(e) => update('cta', e.target.value)}
            />
          </div>
        </>
      )}

      {/* Stats alanları */}
      {templateId === 'Stats' && (
        <>
          {(values.stats as { value: string; label: string }[] ?? []).map((stat, i) => (
            <div key={i} className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Değer {i + 1}</label>
                <input
                  className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm"
                  value={stat.value}
                  onChange={(e) => {
                    const updated = [...(values.stats as { value: string; label: string }[])]
                    updated[i] = { ...updated[i], value: e.target.value }
                    update('stats', updated)
                  }}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Açıklama {i + 1}</label>
                <input
                  className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm"
                  value={stat.label}
                  onChange={(e) => {
                    const updated = [...(values.stats as { value: string; label: string }[])]
                    updated[i] = { ...updated[i], label: e.target.value }
                    update('stats', updated)
                  }}
                />
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 font-medium">Count-up animasyonu</label>
            <input
              type="checkbox"
              checked={Boolean(values.countUp)}
              onChange={(e) => update('countUp', e.target.checked)}
              className="rounded"
            />
          </div>
        </>
      )}

      {/* TalkingHead alanları */}
      {templateId === 'TalkingHead' && (
        <>
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Lower Third Metni</label>
            <input
              className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm"
              value={String(values.lowerThird ?? '')}
              onChange={(e) => update('lowerThird', e.target.value)}
            />
          </div>
        </>
      )}

      {/* Ortak alanlar */}
      <div>
        <label className="block text-xs text-gray-500 mb-1 font-medium">Vurgu Rengi</label>
        <div className="flex gap-2 items-center">
          {ACCENT_PRESETS.map((c) => (
            <button
              key={c}
              onClick={() => update('accentColor', c)}
              className="w-5 h-5 rounded-full transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                boxShadow: values.accentColor === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : undefined,
              }}
            />
          ))}
          <input
            type="color"
            value={String(values.accentColor ?? '#e67e22')}
            onChange={(e) => update('accentColor', e.target.value)}
            className="w-5 h-5 rounded cursor-pointer border-0"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="fontFamily" className="block text-xs text-gray-500 mb-1 font-medium">Font</label>
          <select
            id="fontFamily"
            className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm"
            value={String(values.fontFamily ?? 'sans-serif')}
            onChange={(e) => update('fontFamily', e.target.value)}
          >
            {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="format" className="block text-xs text-gray-500 mb-1 font-medium">Format</label>
          <select
            id="format"
            className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm"
            value={String(values.format ?? '1080x1920')}
            onChange={(e) => update('format', e.target.value)}
          >
            {FORMATS.map((f) => <option key={f} value={f}>{f === '1080x1920' ? '1080×1920 (Dikey)' : '1920×1080 (Yatay)'}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="duration" className="block text-xs text-gray-500 mb-1 font-medium">Süre</label>
          <select
            id="duration"
            className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm"
            value={String(values.durationSeconds ?? 30)}
            onChange={(e) => update('durationSeconds', Number(e.target.value))}
          >
            {DURATIONS.map((d) => <option key={d} value={d}>{d} saniye</option>)}
          </select>
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={loading}
        className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors mt-2"
      >
        {loading ? 'Render ediliyor...' : '▶ Videoyu Oluştur'}
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Testleri çalıştır, geçmeli**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit/web
npx jest components/__tests__/ParamForm.test.tsx
```

Beklenen: `3 passed`

- [ ] **Step 5: Commit**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit
git add web/components/ParamForm.tsx web/components/__tests__/ParamForm.test.tsx
git commit -m "feat: add ParamForm component with template-specific fields"
```

---

## Task 11: VideoPreview + app/page.tsx — Entegrasyon

**Files:**
- Create: `web/components/VideoPreview.tsx`
- Modify: `web/app/page.tsx`

- [ ] **Step 1: `web/components/VideoPreview.tsx` yaz**

```tsx
'use client'

interface VideoPreviewProps {
  renderId: string | null
  loading: boolean
  accentColor: string
}

export function VideoPreview({ renderId, loading, accentColor }: VideoPreviewProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 h-full">
        <div
          className="w-20 h-36 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: '#1a1a2e' }}
        >
          <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
        </div>
        <p className="text-xs text-gray-400">Render ediliyor...</p>
      </div>
    )
  }

  if (renderId) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 h-full">
        <video
          src={`/api/download/${renderId}`}
          controls
          className="max-h-64 rounded-xl shadow-lg"
        />
        <a
          href={`/api/download/${renderId}`}
          download={`video-${renderId}.mp4`}
          className="bg-white border-2 border-gray-200 text-gray-700 text-xs px-4 py-2 rounded-lg font-semibold hover:border-gray-400 transition-colors"
        >
          ⬇ MP4 İndir
        </a>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 h-full">
      <p className="text-xs text-gray-400">Önizleme</p>
      <div
        className="w-20 h-36 rounded-xl flex flex-col items-center justify-center gap-1.5 overflow-hidden"
        style={{ backgroundColor: '#1a1a2e' }}
      >
        <div className="text-xs font-black text-white text-center px-2 leading-tight">
          Video çıktısı
        </div>
        <div className="text-xs font-bold" style={{ color: accentColor }}>
          burada
        </div>
        <div className="text-xs font-bold" style={{ color: accentColor }}>
          görünür
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: `web/app/page.tsx`'i yaz**

```tsx
'use client'

import { useState } from 'react'
import { TopNav, TabId } from '@/components/TopNav'
import { TemplateGrid } from '@/components/TemplateGrid'
import { ParamForm } from '@/components/ParamForm'
import { VideoPreview } from '@/components/VideoPreview'
import { getTemplate } from '@/lib/templates'

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('create')
  const [selectedTemplate, setSelectedTemplate] = useState('ProductAd')
  const [params, setParams] = useState<Record<string, unknown>>(
    getTemplate('ProductAd').defaultProps
  )
  const [loading, setLoading] = useState(false)
  const [renderId, setRenderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleTemplateSelect = (id: string) => {
    setSelectedTemplate(id)
    setParams(getTemplate(id).defaultProps)
    setRenderId(null)
    setError(null)
  }

  const handleRender = async () => {
    setLoading(true)
    setError(null)
    setRenderId(null)
    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate,
          overrides: params,
          format: String(params.format ?? '1080x1920'),
          durationSeconds: Number(params.durationSeconds ?? 30),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Render hatası')
      setRenderId(data.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <TopNav activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'create' && (
        <div className="flex flex-1 overflow-hidden">
          {/* Sol panel */}
          <div className="w-[52%] p-5 border-r border-gray-100 overflow-y-auto">
            <div className="text-sm font-bold text-gray-800 mb-4">Şablon Seç</div>
            <TemplateGrid selected={selectedTemplate} onSelect={handleTemplateSelect} />
            <ParamForm
              templateId={selectedTemplate}
              values={params}
              onChange={setParams}
              onSubmit={handleRender}
              loading={loading}
            />
            {error && (
              <div className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                {error}
              </div>
            )}
          </div>

          {/* Sağ panel */}
          <div className="flex-1 bg-gray-50 flex items-center justify-center">
            <VideoPreview
              renderId={renderId}
              loading={loading}
              accentColor={String(params.accentColor ?? '#e67e22')}
            />
          </div>
        </div>
      )}

      {activeTab === 'subtitle' && (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Altyazı Ekle — Plan 2'de uygulanacak
        </div>
      )}

      {activeTab === 'history' && (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Geçmiş — Plan 3'te uygulanacak
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Uygulamayı başlat ve tarayıcıda test et**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit/web
npm run dev
```

Tarayıcıda `http://localhost:3000` aç:
1. 3 şablon kartı görünüyor mu?
2. "Ürün Reklamı" seçili, form alanları dolu mu?
3. "Vurgu Rengi" nokta seçici çalışıyor mu?
4. **"▶ Videoyu Oluştur"** butonuna tıkla → "Render ediliyor..." görünmeli, ~60 saniye sonra video player çıkmalı
5. "⬇ MP4 İndir" butonu ile dosya indirilebiliyor mu?

- [ ] **Step 4: Tüm testlerin geçtiğini doğrula**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit/web
npx jest --passWithNoTests
```

Beklenen: Tüm testler geçer.

- [ ] **Step 5: Commit**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit
git add web/components/VideoPreview.tsx web/app/page.tsx
git commit -m "feat: add VideoPreview and wire up create tab end-to-end"
```

---

## Self-Review

**Spec coverage:**
- ✅ Next.js 14 App Router kurulumu
- ✅ TypeScript + Tailwind CSS
- ✅ ProductAd props ile parametreleştirme
- ✅ Stats composition
- ✅ TalkingHead composition
- ✅ TopNav (3 tab)
- ✅ TemplateGrid (3 şablon)
- ✅ ParamForm: Ürün Reklamı, İstatistik, Talking Head alanları
- ✅ Vurgu rengi seçici (5 preset + custom hex)
- ✅ Font, süre, format dropdown'ları
- ✅ POST /api/render
- ✅ GET /api/download/[id]
- ✅ VideoPreview (loading / video player / placeholder)
- ✅ Render butonu
- ✅ MP4 indir butonu
- ⚠️ Altyazı ve Geçmiş tab'ları → Plan 2 ve Plan 3'e bırakıldı (placeholder gösterilir)

**Tip tutarlılığı:**
- `buildRenderProps` → `Record<string, unknown> & TemplateRenderMeta` — Task 5'te tanımlandı, Task 7'de kullanıldı ✅
- `TabId` → Task 8'de tanımlandı, Task 11'de import edildi ✅
- `getTemplate` → Task 5'te tanımlandı, Task 9 ve 11'de kullanıldı ✅

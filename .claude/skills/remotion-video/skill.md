---
name: remotion-video
description: Create, preview, and render Remotion video compositions
---

# /remotion-video

## Overview
Remotion kullanarak profesyonel video composition'ları oluştur, Remotion Studio'da önizle ve MP4 olarak render et.

## Capabilities
- Metin açıklamasından yeni Remotion composition oluştur
- Animasyonlu text overlay, geçiş ve efekt ekle
- Video süresini, çözünürlüğünü ve kare hızını ayarla
- Remotion Studio'da tarayıcı tabanlı önizleme aç
- MP4 olarak render et

## Project Structure
```
src/
  Root.tsx              ← tüm composition'ları register et
  compositions/
    <AdName>.tsx        ← her video için ayrı dosya
  index.ts              ← remotion entry point
```

## Workflow
1. Kullanıcı istediği videoyu açıklar (süre, renkler, metin, yapı)
2. `src/compositions/<AdName>.tsx` dosyasını oluştur
3. `src/Root.tsx` içine yeni composition'ı kaydet (`src/index.ts` `registerRoot(RemotionRoot)` çağrısı zaten mevcut olmalı)
4. `npx remotion studio` ile önizleme aç
5. Kullanıcı onayladıktan sonra `npx remotion render <CompositionId> out/<name>.mp4` ile render et

## Animation Patterns

### Fade In
```tsx
import { interpolate, useCurrentFrame } from 'remotion';
const frame = useCurrentFrame();
const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
```

### Slide In (soldan)
```tsx
const translateX = interpolate(frame, [0, 20], [-200, 0], { extrapolateRight: 'clamp' });
// style={{ transform: `translateX(${translateX}px)` }}
```

### Count Up (sayısal animasyon)
```tsx
const value = Math.round(interpolate(frame, [0, 60], [0, 100], { extrapolateRight: 'clamp' }));
```

## Composition Template
```tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

export const MyComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f0f0f' }}>
      {/* İçerik buraya */}
    </AbsoluteFill>
  );
};
```

## Root.tsx Registration
```tsx
import React from 'react';
import { Composition } from 'remotion';
import { MyComposition } from './compositions/MyComposition';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="MyComposition"
      component={MyComposition}
      durationInFrames={30 * 30}  // 30 saniye @ 30fps
      fps={30}
      width={1920}   // kullanıcı isteğine göre ayarla (örn. 1080x1920 dikey)
      height={1080}
    />
  </>
);
```

## Render Commands
```bash
# Önizleme
npx remotion studio

# Render
npx remotion render <CompositionId> out/<filename>.mp4

# Port çakışmasında
npx remotion studio --port 3005
```

## Prompt Format (Kullanıcıdan beklenen)
Şu bilgileri iste:
- Video adı ve amacı
- Süre (saniye)
- Çözünürlük (örn. 1080x1920 dikey, 1920x1080 yatay)
- Renk paleti (hex kodlarıyla)
- Bölüm yapısı: Hook (0-Xs), İçerik (X-Ys), CTA (Y-Zs)
- Her bölümdeki metin içeriği

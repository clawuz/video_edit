# Remotion Skill Setup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/remotion-video` slash komutuyla Claude Code'dan doğrudan Remotion videoları oluşturup render edebilen tam çalışan bir proje kurulumu.

**Architecture:** Proje üç katmandan oluşur: (1) `.claude/skills/remotion-video/skill.md` — Claude'a Remotion workflow'unu öğreten skill dosyası; (2) Remotion proje iskeleti — `src/compositions/` klasörü altındaki React bileşenleri; (3) `Root.tsx` kayıt merkezi — tüm composition'ları birleştiren giriş noktası.

**Tech Stack:** Node.js 25, Remotion 4.x, React 18, TypeScript, npx remotion CLI

---

## Dosya Haritası

| Durum | Yol | Sorumluluk |
|-------|-----|------------|
| Oluştur | `.claude/skills/remotion-video/skill.md` | Claude'a Remotion workflow'unu tanıtan skill |
| Oluştur | `src/Root.tsx` | Tüm composition'ları register eder |
| Oluştur | `src/compositions/HelloWorld.tsx` | İlk test composition'ı |
| Oluştur | `src/index.ts` | Remotion entry point |
| Oluştur | `package.json` | Proje bağımlılıkları |
| Oluştur | `tsconfig.json` | TypeScript konfigürasyonu |
| Oluştur | `remotion.config.ts` | Remotion render ayarları |

---

## Task 1: Remotion Projesini Başlat

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `remotion.config.ts`

- [ ] **Step 1: Remotion proje iskeletini oluştur**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit
npx create-video@latest . --yes
```

Beklenen çıktı: Remotion starter dosyaları (`package.json`, `tsconfig.json`, `src/`) oluşturulur.

- [ ] **Step 2: Bağımlılıkları kur**

```bash
npm install
```

Beklenen çıktı: `node_modules/` klasörü oluşur, `package-lock.json` yazılır.

- [ ] **Step 3: Kurulumu doğrula**

```bash
npx remotion compositions
```

Beklenen çıktı: En az bir composition listelenir (örn. `HelloWorld`).

- [ ] **Step 4: Commit**

```bash
git init
git add package.json package-lock.json tsconfig.json remotion.config.ts src/
git commit -m "feat: init remotion project"
```

---

## Task 2: Skill Dosya Yapısını Oluştur

**Files:**
- Create: `.claude/skills/remotion-video/skill.md`

- [ ] **Step 1: Klasör yapısını oluştur**

```bash
mkdir -p .claude/skills/remotion-video
```

Beklenen: `.claude/skills/remotion-video/` klasörü mevcut.

- [ ] **Step 2: `skill.md` dosyasını oluştur**

Dosyayı `.claude/skills/remotion-video/skill.md` olarak kaydet:

```markdown
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
3. `src/Root.tsx` içine yeni composition'ı kaydet
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
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

export const MyComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f0f0f' }}>
      {/* İçerik buraya */}
    </AbsoluteFill>
  );
};
```

## Root.tsx Registration
```tsx
import { Composition } from 'remotion';
import { MyComposition } from './compositions/MyComposition';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="MyComposition"
      component={MyComposition}
      durationInFrames={30 * 30}  // 30 saniye @ 30fps
      fps={30}
      width={1080}
      height={1920}
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
```

- [ ] **Step 3: Skill dosyasının doğru yerde olduğunu doğrula**

```bash
ls -la .claude/skills/remotion-video/skill.md
```

Beklenen çıktı: Dosya listelenir (0 byte'dan büyük).

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/remotion-video/skill.md
git commit -m "feat: add remotion-video claude code skill"
```

---

## Task 3: İlk Composition'ı Oluştur ve Test Et

**Files:**
- Modify: `src/Root.tsx`
- Create: `src/compositions/ProductAd.tsx`

- [ ] **Step 1: `src/compositions/ProductAd.tsx` oluştur**

```tsx
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const ProductAd: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Hook: 0-5s — fade in başlık
  const titleOpacity = interpolate(frame, [0, fps * 1], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // CTA: 20s'de slide in
  const ctaTranslate = interpolate(
    frame,
    [fps * 20, fps * 22],
    [60, 0],
    { extrapolateRight: 'clamp' }
  );
  const ctaOpacity = interpolate(
    frame,
    [fps * 20, fps * 22],
    [0, 1],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#1a1a2e',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 24,
        fontFamily: 'sans-serif',
      }}
    >
      {/* HOOK */}
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
        Your morning deserves better
      </div>

      {/* FEATURES */}
      {['Single Origin Beans', 'Roasted Fresh Weekly', 'Shipped to Your Door'].map(
        (text, i) => {
          const start = fps * (5 + i * 3);
          const featureOpacity = interpolate(frame, [start, start + fps], [0, 1], {
            extrapolateRight: 'clamp',
          });
          const featureX = interpolate(frame, [start, start + fps], [-100, 0], {
            extrapolateRight: 'clamp',
          });
          return (
            <div
              key={text}
              style={{
                opacity: featureOpacity,
                transform: `translateX(${featureX}px)`,
                fontSize: 36,
                color: '#e67e22',
                fontWeight: 700,
              }}
            >
              {text}
            </div>
          );
        }
      )}

      {/* CTA */}
      <div
        style={{
          opacity: ctaOpacity,
          transform: `translateY(${ctaTranslate}px)`,
          fontSize: 28,
          color: '#ffffff',
          marginTop: 32,
          backgroundColor: '#e67e22',
          padding: '16px 40px',
          borderRadius: 8,
        }}
      >
        mountainbrew.co
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: `src/Root.tsx` içine composition'ı kaydet**

Mevcut `src/Root.tsx` dosyasını aç ve `ProductAd` composition'ını ekle:

```tsx
import { Composition } from 'remotion';
import { ProductAd } from './compositions/ProductAd';
// ... mevcut import'lar korunur

export const RemotionRoot: React.FC = () => (
  <>
    {/* ... mevcut composition'lar */}
    <Composition
      id="ProductAd"
      component={ProductAd}
      durationInFrames={30 * 30}
      fps={30}
      width={1080}
      height={1920}
    />
  </>
);
```

- [ ] **Step 3: Composition'ın kayıtlı olduğunu doğrula**

```bash
npx remotion compositions
```

Beklenen çıktı: `ProductAd` listede görünür.

- [ ] **Step 4: Remotion Studio ile önizle**

```bash
npx remotion studio
```

Tarayıcıda `http://localhost:3000` aç, `ProductAd` composition'ını seç, animasyonları frame frame kontrol et.

- [ ] **Step 5: MP4 olarak render et**

```bash
mkdir -p out
npx remotion render ProductAd out/product-ad.mp4
```

Beklenen çıktı: `out/product-ad.mp4` oluşur, terminal `Rendered X/900 frames` satırları gösterir.

- [ ] **Step 6: Commit**

```bash
git add src/compositions/ProductAd.tsx src/Root.tsx
git commit -m "feat: add ProductAd composition with fade/slide animations"
```

---

## Task 4: Skill'i Claude Code'da Doğrula

**Files:** Değişiklik yok — bu task sadece doğrulama.

- [ ] **Step 1: Claude Code panelini aç**

`Cmd+L` ile Claude Code input'unu aç.

- [ ] **Step 2: Skill komutunu test et**

```
/remotion-video
```

Beklenen: Skill tanınır ve Claude Remotion workflow'unu yükler.

- [ ] **Step 3: Örnek prompt ile test et**

```
/remotion-video
30 saniyelik bir kahve dükkanı videosu oluştur.
Arka plan: #1a1a2e. Vurgu rengi: turuncu (#e67e22).
Hook (0-5s): "En iyi kahve senin için" fade-in.
CTA (25-30s): "mountainbrew.co" slide-up.
Çözünürlük: 1080x1920.
```

Beklenen: Claude `src/compositions/` altına yeni bir dosya oluşturur ve `Root.tsx`'i günceller.

---

## Sorun Giderme Referansı

| Hata | Çözüm |
|------|-------|
| `Skill not found` | `.claude/skills/remotion-video/skill.md` yolunu kontrol et |
| Port 3000 meşgul | `npx remotion studio --port 3005` |
| `Cannot find module` | `npm install` tekrar çalıştır |
| Render başarısız | `npx remotion compositions` ile ID'nin doğru olduğunu kontrol et |

# Timing & Animation System — Design Spec

**Date:** 2026-04-10  
**Status:** Approved  
**Builds on:** `2026-04-06-videoedit-web-design.md`

---

## Goal

ProductAd şablonuna altı özellik ekle:

1. **Video önizleme %25 büyük** — mockup boyutu 200×356 → 250×445px
2. **Body section** — "Özellikler" yeniden adlandırılır, max 10 öğe, her öğenin bağımsız slot konumu + timing'i var
3. **Aktif/pasif toggle** — Başlık, Body ve CTA bölümleri ayrı ayrı kapatılabilir
4. **Giriş + Çıkış animasyonları** — Her öğe kendi giriş+çıkış animasyonunu taşır; 18 giriş + 16 çıkış seçeneği
5. **Premium renk seçici** — Palet sekmeleri + özel hex + opaklık slider; yazı rengi ve CTA rengi için kullanılır; "renk yok" seçeneği
6. **CTA geliştirmeleri** — Arka plan rengi "yok" seçeneği, Logo modu (metin yerine logo görseli)

---

## 1. Video Preview Boyutu

`web/components/VideoPreview.tsx` içinde:

| Değişken | Eski | Yeni |
|----------|------|------|
| Portrait mockup | `w-[200px] h-[356px]` | `w-[250px] h-[445px]` |
| Landscape mockup | `w-[356px] h-[200px]` | `w-[445px] h-[250px]` |
| Portrait video max | `max-h-[400px]` | `max-h-[500px]` |
| Landscape video max | `max-w-[400px]` | `max-w-[500px]` |

---

## 2. Animasyon Kütüphanesi

Giriş ve çıkış animasyonları için ortak tipler. Her ikisi de `20 frame` sürer (entry ve exit ayrı ayrı).

### Giriş Animasyonları (`EntryAnimType`)

| Key | Görünüm | Teknik |
|-----|---------|--------|
| `none` | Anlık görünür | opacity toggle |
| `fade` | opacity 0→1 | interpolate |
| `zoom` | scale 0.5→1 + fade | transform |
| `slide-up` | aşağıdan yukarı + fade | translateY |
| `slide-down` | yukarıdan aşağı + fade | translateY |
| `slide-left` | sağdan sola + fade | translateX |
| `slide-right` | soldan sağa + fade | translateX |
| `pop` | scale 0→1.15→1 (overshoot) | spring easing |
| `typewriter` | karakter karakter reveal | clipPath: inset(0 X% 0 0) |
| `blur` | blur(20px)→blur(0) + fade | filter |
| `flip` | rotateX(90deg)→0 + fade | perspective + rotateX |
| `elastic` | scale overshoot + titreme | custom spring curve |
| `rise` | yavaş yükseliş + scale 0.9→1 | translateY + scale |
| `wave` | harf harf staggered translateY | per-letter span array |
| `split` | iki yandan merkeze birleşir | clipPath ya da iki half div |
| `neon-glow` | text-shadow parlar, opacity gelir | filter + opacity |
| `spin-3d` | rotateY(90deg)→0 | perspective + rotateY |
| `glitch` | offset katman + clip noise | pseudo-layer translateX |

### Çıkış Animasyonları (`ExitAnimType`)

| Key | Görünüm | Teknik |
|-----|---------|--------|
| `none` | Anlık kaybolur | opacity toggle |
| `fade-out` | opacity 1→0 | interpolate |
| `zoom-out` | scale 1→0.5 + fade | transform |
| `slide-out-up` | yukarı kayarak çıkar | translateY |
| `slide-out-down` | aşağı kayarak çıkar | translateY |
| `slide-out-left` | sola kayarak çıkar | translateX |
| `slide-out-right` | sağa kayarak çıkar | translateX |
| `shrink` | scale 1→0 (merkeze çekilerek) | transform |
| `blur-out` | blur(0)→blur(20px) + fade | filter |
| `flip-out` | rotateX(0)→90deg | perspective + rotateX |
| `wave-out` | harf harf staggered dağılır | per-letter span array |
| `split-out` | iki yana ayrılır | iki half div |
| `glitch-out` | bozularak gider | offset katman + opacity |
| `neon-flicker` | text-shadow titreşerek söner | rapid opacity oscillation |
| `dissolve` | scale + opacity + blur birlikte | combined filter |
| `light-speed` | hızla sağa fırlar + skew | translateX + skewX |

### Per-letter animasyonlar için sarmalayıcı

`wave`, `wave-out`, `split`, `split-out`, `glitch`, `glitch-out`, `typewriter` per-letter rendering gerektirir:

```tsx
// src/compositions/LetterAnimated.tsx (yeni)
// text'i karakterlere böler, her birine stagger uygulanır
export function LetterAnimated({ text, progress, animType }: ...) {
  return (
    <span style={{ display: 'inline-flex' }}>
      {text.split('').map((char, i) => {
        const delay = i / text.length
        const p = Math.max(0, Math.min(1, (progress - delay * 0.6) / 0.4))
        return <span key={i} style={letterStyle(p, animType)}>{char}</span>
      })}
    </span>
  )
}
```

### `getElementStyle` fonksiyonu

```ts
// src/compositions/animations.ts (yeni dosya)
const ANIM_FRAMES = 20

export function getElementStyle(
  frame: number, fps: number,
  startSec: number, durationSec: number,
  entryAnim: EntryAnimType, exitAnim: ExitAnimType,
): { style: React.CSSProperties; entryProgress: number; exitProgress: number } {
  const startFrame = Math.round(startSec * fps)
  const endFrame = Math.round((startSec + durationSec) * fps)

  if (frame < startFrame || frame >= endFrame)
    return { style: { opacity: 0, pointerEvents: 'none' }, entryProgress: 0, exitProgress: 0 }

  if (frame < startFrame + ANIM_FRAMES) {
    const p = (frame - startFrame) / ANIM_FRAMES
    return { style: applyEntry(p, entryAnim), entryProgress: p, exitProgress: 0 }
  }

  if (frame >= endFrame - ANIM_FRAMES) {
    const p = (frame - (endFrame - ANIM_FRAMES)) / ANIM_FRAMES
    return { style: applyExit(p, exitAnim), entryProgress: 1, exitProgress: p }
  }

  return { style: { opacity: 1 }, entryProgress: 1, exitProgress: 0 }
}
```

`entryProgress` ve `exitProgress` per-letter bileşene aktarılır.

---

## 3. Body Section (Slot Sistemi)

### Veri Yapısı

```ts
// src/compositions/types.ts (yeni)
export interface BodyItem {
  text: string
  slot: number        // 1–10: videodaki dikey sıra konumu
  startSec: number
  durationSec: number
  entryAnim: EntryAnimType
  exitAnim: ExitAnimType
}
```

**Slot mantığı:** Slot numarası = `flexColumn` layout'ta dikey sıra. Aynı slot numaralı birden fazla öğe olabilir — her biri kendi `startSec`/`durationSec` aralığında `frame` bazlı render edilir, diğer zaman `opacity: 0`. Slot = fiziksel pozisyon, zaman çakışması olmaması kullanıcı sorumluluğu.

**Çakışma uyarısı:** Aynı slot'ta iki öğenin zaman aralığı çakışıyorsa ParamForm sarı badge gösterir: "⚠ Slot X çakışıyor". Render engellemez.

### Schema Değişiklikleri (`ProductAd.tsx`)

```ts
// Kaldırılan:
features: z.array(z.string())   // silinir
animationType: z.enum(...)      // silinir — per-element entryAnim alır

// Eklenenler:
showTitle: z.boolean().default(true),
titleStartSec: z.number().default(0),
titleDurationSec: z.number().default(10),
titleEntryAnim: EntryAnimTypeSchema.default('fade'),
titleExitAnim: ExitAnimTypeSchema.default('fade-out'),

body: z.array(BodyItemSchema).max(10).default([]),
showBody: z.boolean().default(true),

showCta: z.boolean().default(true),
ctaMode: z.enum(['text', 'logo']).default('text'),
ctaStartSec: z.number().default(20),
ctaDurationSec: z.number().default(8),
ctaEntryAnim: EntryAnimTypeSchema.default('slide-up'),
ctaExitAnim: ExitAnimTypeSchema.default('fade-out'),
ctaBgColor: z.string().default('#e67e22'),  // '' = renk yok
ctaLogoUrl: z.string().default(''),
ctaLogoHeight: z.number().default(80),
```

### Render Mantığı (ProductAd.tsx)

```tsx
// Body: slot bazlı gruplama
const slotMap = new Map<number, BodyItem[]>()
body.forEach(item => {
  if (!slotMap.has(item.slot)) slotMap.set(item.slot, [])
  slotMap.get(item.slot)!.push(item)
})

Array.from(slotMap.keys()).sort().map(slot => (
  <div key={slot} style={{ position: 'relative', minHeight: bodyFontSize * 1.5 }}>
    {slotMap.get(slot)!.map((item, i) => {
      const { style, entryProgress, exitProgress } = getElementStyle(
        frame, fps, item.startSec, item.durationSec, item.entryAnim, item.exitAnim
      )
      const needsLetterAnim = PER_LETTER_ANIMS.includes(item.entryAnim) || PER_LETTER_ANIMS.includes(item.exitAnim)
      return (
        <div key={i} style={{ position: 'absolute', width: '100%', ...style }}>
          {needsLetterAnim
            ? <LetterAnimated text={item.text} entryProgress={entryProgress} exitProgress={exitProgress} entryAnim={item.entryAnim} exitAnim={item.exitAnim} />
            : item.text}
        </div>
      )
    })}
  </div>
))
```

---

## 4. Premium Renk Seçici (`ColorPicker` bileşeni)

`web/components/ColorPicker.tsx` — yeni bağımsız bileşen. Yazı rengi, vurgu rengi ve CTA rengi için paylaşılır.

### Yapı

- **Palet sekmeleri:** Temel / Pastel / Neon / Koyu — her sekme 12 renk swatchi gösterir
- **İlk swatch daima "renk yok"** — kesik çizgili kare, `value: ''` döner
- **Özel renk:** Spektrum dairesi + hex input
- **Opaklık:** Slider (0–100%) + preset butonlar (25%, 50%, 75%, 100%)
- **Output:** `rgba(r,g,b,opacity)` string ya da `''` (renk yok)

### Palet içerikleri

| Sekme | Renkler |
|-------|---------|
| Temel | #e67e22, #ef4444, #f59e0b, #10b981, #3b82f6, #8b5cf6, #ec4899, #fff, #e5e5e5, #6b7280, #1f2937, #000 |
| Pastel | #fde68a, #fca5a5, #86efac, #93c5fd, #c4b5fd, #f9a8d4, #a5f3fc, #d9f99d, #fed7aa, #e9d5ff, #bfdbfe, #bbf7d0 |
| Neon | #ff0090, #00ff88, #00cfff, #ff6600, #aaff00, #ff00ff, #ffff00, #00ffff, #ff3300, #9900ff, #33ff00, #ff9900 |
| Koyu | #1a1a2e, #0f172a, #1e293b, #111827, #18181b, #1c1917, #14532d, #1e3a5f, #3b0764, #7f1d1d, #1a1a1a, #0a0a0a |

---

## 5. CTA Geliştirmeleri

### Mod sistemi

CTA bölümünde iki mod:
- **Metin modu** (`ctaMode: 'text'`): metin input + arka plan rengi seçici
- **Logo modu** (`ctaMode: 'logo'`): logo upload + yükseklik; metin input gizlenir

### Logo upload

- Dosya upload → `/api/upload` endpoint (mevcut) → `ctaLogoUrl` güncellenir
- Kabul edilen formatlar: PNG, JPG, SVG, WebP
- Remotion render'ında `<Img src={staticFile(ctaLogoUrl)} height={ctaLogoHeight} />`

### Arka plan rengi "yok"

- `ctaBgColor: ''` → `backgroundColor: 'transparent'`, `border: '2px solid accentColor'`
- ColorPicker'da "renk yok" swatchi ilk sıradadır

---

## 6. UI — ParamForm Değişiklikleri

### Accordion + Toggle Switch Yapısı

Her ana bölüm (Başlık, Body, CTA) accordion olarak çalışır:
- Toggle switch: bölümü aktif/pasif yapar, `show*: false` olur, içerik gizlenir
- Chevron: içeriği genişletir/daraltır
- Pasif bölüm başlığı grileşir + üstü çizili

### Başlık Bölümü

- Metin input
- Giriş (sn) | Süre (sn) | Giriş animasyonu | Çıkış animasyonu
- Mini timeline şeridi

### Body Bölümü

- Her öğe: slot dropdown (renkli badge) + metin input + giriş/süre/giriş-anim/çıkış-anim + sil
- "+ Yeni öğe ekle (X/10)" butonu
- Çakışma uyarısı badge (slot bazlı)
- Tüm öğeleri gösteren mini timeline

### CTA Bölümü

- Metin / Logo mod toggle
- Metin modunda: metin input + ColorPicker (arka plan rengi)
- Logo modunda: dosya upload alanı + yükseklik input
- Giriş (sn) | Süre (sn) | Giriş animasyonu | Çıkış animasyonu

### Animasyon Dropdown

Tüm animasyon dropdown'ları gruplu `<optgroup>` kullanır:
```
— Yok
--- Temel ---
Fade, Zoom, ...
--- Kayma ---
Slide ↑, Slide ↓, ...
--- Premium ---
Pop, Typewriter, Wave, ...
```

---

## 7. Etkilenen Dosyalar

| Dosya | Değişiklik Tipi |
|-------|-----------------|
| `src/compositions/animations.ts` | **Yeni** — tüm animasyon fonksiyonları |
| `src/compositions/types.ts` | **Yeni** — `BodyItem`, `EntryAnimType`, `ExitAnimType` |
| `src/compositions/LetterAnimated.tsx` | **Yeni** — per-letter animasyon bileşeni |
| `src/compositions/ProductAd.tsx` | **Güncellenir** — yeni schema + render mantığı |
| `src/Root.tsx` | **Güncellenir** — yeni defaultProps |
| `web/components/ColorPicker.tsx` | **Yeni** — premium renk seçici bileşeni |
| `web/components/ParamForm.tsx` | **Güncellenir** — accordion UI, body öğe yönetimi, CTA logo |
| `web/components/VideoPreview.tsx` | **Güncellenir** — %25 büyük boyutlar |
| `web/lib/templates.ts` | **Güncellenir** — yeni defaultProps |

Stats ve TalkingHead şablonları bu sprint'te değişmez.

---

## 8. Out of Scope

- Stats ve TalkingHead şablonlarına timing sistemi (sonraki sprint)
- Drag-drop timeline — accordion yeterli
- Body öğelerinin sürükle-bırak sıralama
- SVG filter gerektiren animasyonlar: melting, gooey, matrix
- Variable font animasyonları (Nabla vb.)
- CTA logo üzerine metin bindirme

# Timing & Animation System — Design Spec

**Date:** 2026-04-10  
**Status:** Approved  
**Builds on:** `2026-04-06-videoedit-web-design.md`

---

## Goal

ProductAd şablonuna dört özellik ekle:

1. **Video önizleme %25 büyük** — mockup boyutu 200×356 → 250×445px
2. **Body section** — "Özellikler" yeniden adlandırılır, max 10 öğe, her öğenin bağımsız slot konumu + timing'i var
3. **Aktif/pasif toggle** — Başlık, Body ve CTA bölümleri ayrı ayrı kapatılabilir
4. **Giriş + Çıkış animasyonları** — Her öğe kendi çıkış animasyonu taşır; genişletilmiş animasyon kütüphanesi

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

Giriş ve çıkış animasyonları için ortak tipler. Her ikisi de `20 frame` sürer.

### Giriş Animasyonları (`EntryAnimType`)

| Key | Görünüm |
|-----|---------|
| `fade` | opacity 0→1 |
| `slide-up` | aşağıdan yukarı kayma + fade |
| `slide-down` | yukarıdan aşağı kayma + fade |
| `slide-left` | sağdan sola kayma + fade |
| `slide-right` | soldan sağa kayma + fade |
| `zoom` | scale 0.5→1 + fade |
| `pop` | scale 0→1.15→1 (overshoot bounce) |
| `typewriter` | karakter karakter soldan sağa reveal (clip-path: inset) |
| `blur` | blur(20px)→blur(0) + fade |
| `flip` | rotateX(90deg)→0 + fade (3D çevirme) |

### Çıkış Animasyonları (`ExitAnimType`)

| Key | Görünüm |
|-----|---------|
| `fade-out` | opacity 1→0 |
| `slide-out-up` | yukarı kayarak çıkar + fade |
| `slide-out-down` | aşağı kayarak çıkar + fade |
| `slide-out-left` | sola kayarak çıkar + fade |
| `slide-out-right` | sağa kayarak çıkar + fade |
| `zoom-out` | scale 1→0.5 + fade |
| `blur-out` | blur(0)→blur(20px) + fade |
| `shrink` | scale 1→0 (merkeze çekilerek yok olur) |

### Implementasyon (`getElementStyle`)

```ts
// src/compositions/animations.ts (yeni dosya)

export type EntryAnimType = 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'zoom' | 'pop' | 'typewriter' | 'blur' | 'flip'
export type ExitAnimType = 'fade-out' | 'slide-out-up' | 'slide-out-down' | 'slide-out-left' | 'slide-out-right' | 'zoom-out' | 'blur-out' | 'shrink'

const ANIM_FRAMES = 20

export function getElementStyle(
  frame: number,
  fps: number,
  startSec: number,
  durationSec: number,
  entryAnim: EntryAnimType,
  exitAnim: ExitAnimType,
): React.CSSProperties {
  const startFrame = Math.round(startSec * fps)
  const endFrame = Math.round((startSec + durationSec) * fps)

  // Görünmez aralık
  if (frame < startFrame || frame >= endFrame) {
    return { opacity: 0, pointerEvents: 'none' }
  }

  // Giriş fazı
  const entryProgress = Math.min(1, (frame - startFrame) / ANIM_FRAMES)
  if (frame < startFrame + ANIM_FRAMES) {
    return applyEntry(entryProgress, entryAnim)
  }

  // Çıkış fazı
  const exitStart = endFrame - ANIM_FRAMES
  if (frame >= exitStart) {
    const exitProgress = (frame - exitStart) / ANIM_FRAMES
    return applyExit(exitProgress, exitAnim)
  }

  return { opacity: 1 }
}
```

`typewriter` için `clipPath: inset(0 ${(1-p)*100}% 0 0)` kullanılır.  
`flip` için `perspective: 800px` sarmalayıcı gerekir, `rotateX` uygulanır.  
`blur` ve `blur-out` için `filter: blur(${...}px)` kullanılır.

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

### Schema Değişiklikleri (`ProductAd.tsx`)

```ts
// Kaldırılan alan:
features: z.array(z.string())   // → silinir

// Eklenen alanlar:
showTitle: z.boolean().default(true),
titleStartSec: z.number().default(0),
titleDurationSec: z.number().default(10),
titleEntryAnim: z.enum([...EntryAnimTypes]).default('fade'),
titleExitAnim: z.enum([...ExitAnimTypes]).default('fade-out'),

body: z.array(BodyItemSchema).max(10).default([]),
showBody: z.boolean().default(true),

showCta: z.boolean().default(true),
ctaStartSec: z.number().default(20),
ctaDurationSec: z.number().default(8),
ctaEntryAnim: z.enum([...EntryAnimTypes]).default('slide-up'),
ctaExitAnim: z.enum([...ExitAnimTypes]).default('fade-out'),
```

`animationType` alanı **kaldırılır** — yerini per-element `entryAnim` alır.

### Render Mantığı (ProductAd.tsx)

```tsx
// Body render: slot bazlı gruplama
const slotMap = new Map<number, BodyItem[]>()
body.forEach(item => {
  if (!slotMap.has(item.slot)) slotMap.set(item.slot, [])
  slotMap.get(item.slot)!.push(item)
})

// Slotları sıralı render et
Array.from(slotMap.keys()).sort().map(slot => (
  <div key={slot} style={{ position: 'relative', minHeight: bodyFontSize * 1.5 }}>
    {slotMap.get(slot)!.map((item, i) => (
      <div key={i} style={{
        position: 'absolute', width: '100%',
        ...getElementStyle(frame, fps, item.startSec, item.durationSec, item.entryAnim, item.exitAnim)
      }}>
        {item.text}
      </div>
    ))}
  </div>
))
```

---

## 4. UI — ParamForm Değişiklikleri

### Accordion + Toggle Switch Yapısı

Her ana bölüm (Başlık, Body, CTA) accordion olarak çalışır:
- Toggle switch: bölümü aktif/pasif yapar, pasifken içerik gizlenir ve schema'da `show*: false`
- Chevron: içeriği genişletir/daraltır (bağımsız toggle'dan)
- Pasif bölüm başlığı grileşir + üstü çizili görünür

### Başlık Bölümü

- Metin input (mevcut)
- Giriş zamanı (sn) | Süre (sn) | Giriş animasyonu | Çıkış animasyonu
- Mini timeline şeridi (30sn üzerinde)

### Body Bölümü

- Öğe listesi (max 10), her öğe:
  - Slot seçici (1–10 dropdown, renkli badge)
  - Metin input
  - Giriş (sn) | Süre (sn) | Giriş animasyonu | Çıkış animasyonu
  - Sil butonu
- "+ Yeni öğe ekle (X/10)" butonu
- Tüm body öğelerini gösteren mini timeline (slot bazlı satırlar)

### CTA Bölümü

- Metin input (mevcut)
- Giriş (sn) | Süre (sn) | Giriş animasyonu | Çıkış animasyonu

---

## 5. Etkilenen Dosyalar

| Dosya | Değişiklik Tipi |
|-------|-----------------|
| `src/compositions/animations.ts` | **Yeni** — tüm animasyon fonksiyonları |
| `src/compositions/types.ts` | **Yeni** — `BodyItem`, `EntryAnimType`, `ExitAnimType` |
| `src/compositions/ProductAd.tsx` | **Güncellenir** — yeni schema + render mantığı |
| `src/Root.tsx` | **Güncellenir** — yeni defaultProps |
| `web/components/ParamForm.tsx` | **Güncellenir** — accordion UI, body öğe yönetimi |
| `web/components/VideoPreview.tsx` | **Güncellenir** — %25 büyük boyutlar |
| `web/lib/templates.ts` | **Güncellenir** — yeni defaultProps |

Stats ve TalkingHead şablonları bu sprint'te değişmez.

---

## 6. Out of Scope

- Stats ve TalkingHead şablonlarına timing sistemi (sonraki sprint)
- Drag-drop timeline (C seçeneği) — accordion yeterli
- Body öğelerinin sürükle-bırak sıralama
- Giriş animasyonunun önizlemesi (render edilmiş video gösterir)

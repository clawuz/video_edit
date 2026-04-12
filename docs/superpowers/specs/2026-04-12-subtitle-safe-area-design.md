# Subtitle & Safe Area System — Design Spec

**Date:** 2026-04-12  
**Status:** Approved  
**Builds on:** `2026-04-10-timing-animations-design.md`

---

## Goal

İki ana bileşen:

1. **Platform & Safe Area sistemi** — tüm şablonlara ortak, merkezi platform tanımları + safe area sabitleri
2. **Subtitle şablonu** — TalkingHead'in yerine geçen yeni composition; Whisper Local (faster-whisper Large v3), SRT import/export, kelime/cümle/chunk bölümleme, platform safe area'ya duyarlı konumlandırma

---

## 1. Platform & Safe Area Sistemi

### `src/compositions/platforms.ts` — Yeni dosya

Tüm şablon ve bileşenler bu dosyadan import eder.

```ts
export const PLATFORM_KEYS = [
  'instagram-reels', 'instagram-story', 'tiktok',
  'youtube-shorts', 'facebook-reels', 'linkedin',
  '1:1', '16:9', '9:16', 'universal',
] as const

export type PlatformKey = typeof PLATFORM_KEYS[number]

export interface PlatformConfig {
  label: string
  w: number
  h: number
  safeTop: number
  safeBottom: number
  safeLeft: number
  safeRight: number
}

export const PLATFORMS: Record<PlatformKey, PlatformConfig> = {
  'instagram-reels': { label: 'Instagram Reels', w: 1080, h: 1920, safeTop: 250, safeBottom: 250, safeLeft: 35,  safeRight: 35  },
  'instagram-story': { label: 'Instagram Story', w: 1080, h: 1920, safeTop: 250, safeBottom: 300, safeLeft: 35,  safeRight: 35  },
  'tiktok':          { label: 'TikTok',           w: 1080, h: 1920, safeTop: 160, safeBottom: 480, safeLeft: 120, safeRight: 120 },
  'youtube-shorts':  { label: 'YouTube Shorts',   w: 1080, h: 1920, safeTop: 380, safeBottom: 380, safeLeft: 60,  safeRight: 120 },
  'facebook-reels':  { label: 'Facebook Reels',   w: 1080, h: 1920, safeTop: 250, safeBottom: 300, safeLeft: 35,  safeRight: 35  },
  'linkedin':        { label: 'LinkedIn',          w: 1080, h: 1920, safeTop: 100, safeBottom: 200, safeLeft: 40,  safeRight: 40  },
  '1:1':             { label: '1:1 Kare',          w: 1080, h: 1080, safeTop: 80,  safeBottom: 80,  safeLeft: 80,  safeRight: 80  },
  '16:9':            { label: '16:9 Yatay',        w: 1920, h: 1080, safeTop: 60,  safeBottom: 60,  safeLeft: 100, safeRight: 100 },
  '9:16':            { label: '9:16 Genel',        w: 1080, h: 1920, safeTop: 260, safeBottom: 260, safeLeft: 90,  safeRight: 90  },
  'universal':       { label: 'Evrensel (900×1400)',w: 1080, h: 1920, safeTop: 260, safeBottom: 260, safeLeft: 90,  safeRight: 90  },
}
```

### Font Listesi — `src/compositions/platforms.ts`'e taşınır

`ParamForm.tsx`'deki `FONTS` sabiti buraya alınır, tüm şablonlar ortak kullanır:

```ts
export const FONTS = [
  'sans-serif', 'Inter', 'Poppins', 'Roboto',
  'Montserrat', 'Oswald', 'Noto Sans',
]
```

`Noto Sans` Türkçe karakter desteği için zorunlu. `Montserrat` ve `Oswald` altyazı için kalın/okunabilir seçenekler.

### `format` → `platform` Migrasyonu

| Etkilenen dosya | Değişiklik |
|-----------------|-----------|
| `web/lib/templates.ts` | `defaultFormat: '1080x1920'` → `defaultPlatform: PlatformKey` |
| `web/lib/templates.ts` `buildRenderProps` | `format` param kaldırılır, `platform`'dan `w/h` türetilir |
| `web/components/ParamForm.tsx` | `FORMATS` array → `PLATFORMS` dropdown, ilk sıraya alınır |
| `src/Root.tsx` | Tüm Composition'larda `width/height` platform'dan gelir |

### Safe Area Overlay (VideoPreview)

`web/components/VideoPreview.tsx` içinde, seçili platform'un safe zone sınırı kırmızı/sarı noktalı çerçeve olarak preview üstüne çizilir. Platform UI simüle edilmez, sadece sınır gösterilir.

---

## 2. Veri Yapıları

### `src/compositions/types.ts`'e eklenir

```ts
export interface SubtitleEntry {
  startMs: number
  endMs: number
  text: string
}

// Whisper'dan gelen word-level timestamp
export interface WordSegment {
  word: string
  startMs: number
  endMs: number
}

export type SubtitleSplitMode = 'sentence' | 'word' | 'chunk'
```

---

## 3. Subtitle Composition

### `src/compositions/Subtitle.tsx` — Yeni şablon (TalkingHead kaldırılır)

#### Schema

```ts
export const subtitleSchema = z.object({
  platform: z.enum(PLATFORM_KEYS).default('9:16'),
  backgroundMedia: z.string().default(''),

  // Altyazı verisi
  subtitles: z.array(subtitleEntrySchema).default([]),

  // Bölümleme
  splitMode: z.enum(['sentence', 'word', 'chunk']).default('sentence'),
  chunkSize: z.number().min(1).max(20).default(5),

  // Görünüm
  subtitlePosition: z.enum(['bottom', 'top', 'middle']).default('bottom'),
  subtitleFontSize: z.number().min(24).max(120).default(52),
  subtitleFontFamily: z.string().default('Poppins'),
  subtitleColor: z.string().default('#ffffff'),
  subtitleBgColor: z.string().default('rgba(0,0,0,0.65)'),  // '' = yok
  subtitleBold: z.boolean().default(true),
  subtitleOutline: z.boolean().default(false),
  subtitleOutlineColor: z.string().default('#000000'),

  // Lower third (opsiyonel)
  showLowerThird: z.boolean().default(false),
  lowerThirdText: z.string().default(''),
  lowerThirdColor: z.string().default('#10b981'),

  logoUrl: z.string().default(''),
  accentColor: z.string().default('#10b981'),
  backgroundColor: z.string().default('#000000'),
})
```

#### Safe Area'ya Göre Konumlandırma

```ts
const platform = PLATFORMS[props.platform]

// bottom pozisyonu
const subtitleBottom = platform.safeBottom + 20
const subtitleLeft   = platform.safeLeft
const subtitleRight  = platform.safeRight

// top pozisyonu
const subtitleTop = platform.safeTop + 20

// middle pozisyonu: (h - safeTop - safeBottom) / 2 + safeTop
```

#### Aktif Altyazı Seçimi

```ts
const currentMs = (frame / fps) * 1000
const active = subtitles.find(s => currentMs >= s.startMs && currentMs < s.endMs)
```

#### Bölümleme Modları

| Mod | Davranış |
|-----|---------|
| `sentence` | Noktalama işaretlerinde (`.`, `!`, `?`, `…`) bölünür. Türkçe ve İngilizce için geçerli. |
| `word` | Her kelime ayrı bir `SubtitleEntry` olur, Whisper word-segment timestamp'leri kullanılır |
| `chunk` | `chunkSize` kelimelik gruplar, uzun Türkçe kelimeler satır başına wrap edilir |

Bölümleme işlemi server-side'da (`/api/transcribe` response işlenirken) yapılır. Whisper'dan gelen `WordSegment[]` → `SubtitleEntry[]` dönüşümü burada gerçekleşir.

---

## 4. Whisper Local Servisi

### Dizin Yapısı

```
whisper_service/
  server.py          # FastAPI, port 8765
  requirements.txt   # faster-whisper, fastapi, uvicorn
  README.md          # kurulum talimatları
```

### `server.py` — Endpoint

```python
POST /transcribe
Body: { media_path: str, language: "tr" | "en", split_mode: "sentence" | "word" | "chunk", chunk_size: int }
Response: { segments: WordSegment[], subtitles: SubtitleEntry[] }
```

**Model seçimi:**
- `language = "tr"` → `selimc/whisper-large-v3-turbo-turkish` (fine-tuned, ~%92-95 doğruluk)
- `language = "en"` → `openai/whisper-large-v3` (~%97-98 doğruluk)
- Diğer diller → `openai/whisper-large-v3`

**CPU performansı:** 30 saniyelik video ~45-60 saniye işleme süresi.

### Node.js Entegrasyonu

```ts
// web/app/api/transcribe/route.ts — Yeni endpoint
POST /api/transcribe
Body: { mediaUrl: string, language: 'tr' | 'en', splitMode: SubtitleSplitMode, chunkSize?: number }
Response: { subtitles: SubtitleEntry[], jobId: string }
```

Node route → Python servisine `fetch('http://localhost:8765/transcribe')` ile proxy eder.

**Whisper servisi çalışmıyorsa:** `503` + `{ error: 'Whisper servisi çalışmıyor. whisper_service/server.py başlatın.' }` döner.

---

## 5. SRT Import / Export

### Import

```ts
// web/app/api/srt-parse/route.ts — Yeni endpoint
POST /api/srt-parse
Body: FormData { file: .srt }
Response: { subtitles: SubtitleEntry[] }
```

SRT parse mantığı:
```
1\n00:00:00,000 --> 00:00:02,500\nMerhaba dünya.\n
```
→ `{ startMs: 0, endMs: 2500, text: 'Merhaba dünya.' }`

### Export

```ts
// web/app/api/srt-export/route.ts — Yeni endpoint
POST /api/srt-export
Body: { subtitles: SubtitleEntry[] }
Response: .srt dosyası (Content-Disposition: attachment)
```

SRT format:
```srt
1
00:00:00,000 --> 00:00:02,500
Merhaba, bu bir örnek altyazı.

2
00:00:02,500 --> 00:00:05,000
İkinci cümle burada görünür.
```

---

## 6. ParamForm UI (Subtitle Şablonu)

### Layout

```
Platform Seçimi        [TikTok ▼]           ← tüm şablonlarda ortak, ilk sıra
Arkaplan Medya         [Yükle]

── ALTYAZI ─────────────────────────────────
Dil:  ○ Türkçe  ○ İngilizce
[🎤 Whisper ile Oluştur]   [📂 SRT Yükle]

Bölümleme:  ○ Cümle  ○ Kelime  ○ Chunk [5]

┌─ Altyazı #1 ──────────────────────────┐
│ 0:00.0 → 0:02.5  [Merhaba, örnek.  ] │  ← timestamp + metin düzenlenebilir
│                               [Sil]   │
└───────────────────────────────────────┘
...
[+ Altyazı Ekle]
[⬇ SRT İndir]

── GÖRÜNÜM ─────────────────────────────────
Font       [Poppins ▼]    Boyut [52  ][px]
Metin Rengi  [■ #ffffff]              ← ColorPicker
Arka Plan    [■ rgba(0,0,0,0.65)]     ← ColorPicker, '' = yok
Konum        ○ Alt  ○ Orta  ○ Üst
[x] Kalın    [ ] Outline   Outline Rengi [■]

── LOWER THIRD (opsiyonel) ─────────────────
[ ] Göster
Metin  [________________________]
Renk   [■]
```

### Whisper Buton Durumları

| Durum | UI |
|-------|----|
| Hazır | `🎤 Altyazı Oluştur` — mavi |
| İşleniyor | `⏳ Analiz ediliyor...` spinner, disabled |
| Tamamlandı | `✓ 24 altyazı oluşturuldu` — yeşil badge |
| Servis yok | `⚠ Whisper servisi çalışmıyor` — kırmızı |

---

## 7. Etkilenen / Yeni Dosyalar

| Dosya | Değişiklik |
|-------|-----------|
| `src/compositions/platforms.ts` | **Yeni** — PLATFORMS, PLATFORM_KEYS, FONTS sabitleri |
| `src/compositions/types.ts` | **Güncellenir** — SubtitleEntry, WordSegment, SubtitleSplitMode eklenir |
| `src/compositions/Subtitle.tsx` | **Yeni** — Subtitle composition (TalkingHead'in yerine) |
| `src/Root.tsx` | **Güncellenir** — TalkingHead kaldırılır, Subtitle eklenir; tüm Composition'lara platform prop'u |
| `web/lib/templates.ts` | **Güncellenir** — `defaultFormat` → `defaultPlatform`, `buildRenderProps` güncellenir, Subtitle template eklenir |
| `web/components/ParamForm.tsx` | **Güncellenir** — platform dropdown ilk sıraya, FONTS buradan kaldırılır, Subtitle UI eklenir |
| `web/components/VideoPreview.tsx` | **Güncellenir** — safe area overlay çizimi |
| `web/app/api/transcribe/route.ts` | **Yeni** — Whisper proxy endpoint |
| `web/app/api/srt-parse/route.ts` | **Yeni** — SRT import endpoint |
| `web/app/api/srt-export/route.ts` | **Yeni** — SRT export endpoint |
| `whisper_service/server.py` | **Yeni** — FastAPI Whisper servisi |
| `whisper_service/requirements.txt` | **Yeni** |

### Kaldırılan Dosyalar

| Dosya | Neden |
|-------|-------|
| `src/compositions/TalkingHead.tsx` | Subtitle şablonu ile değiştirilir |

---

## 8. Out of Scope

- ProductAd / Stats şablonlarına subtitle katmanı (sonraki sprint)
- Gerçek zamanlı (live) transkripsiyon
- Konuşmacı ayrımı (speaker diarization)
- Whisper GPU hızlandırma kurulumu
- Subtitle animasyonları (karaoke highlight, word-by-word renk değişimi)
- Çoklu dil aynı videoda

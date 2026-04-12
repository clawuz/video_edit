# VideoEdit Web — Design Spec

**Date:** 2026-04-06
**Status:** Approved

---

## Goal

Remotion tabanlı video oluşturma ve altyazı ekleme işlemlerini yapabilen, local'de çalışan Next.js web uygulaması. Claude API veya harici AI servisi gerektirmez; şablon parametreleştirme ve FFmpeg ile Remotion'ı birleştirerek tamamen deterministik bir pipeline kullanır.

---

## Architecture

```
Video_edit/
├── (mevcut Remotion projesi)     ← render motoru
└── web/                          ← Next.js uygulaması (yeni)
    ├── app/
    │   ├── page.tsx              ← Video Oluştur tab (varsayılan)
    │   ├── subtitle/page.tsx     ← Altyazı Ekle tab
    │   ├── history/page.tsx      ← Geçmiş tab
    │   └── api/
    │       ├── render/route.ts   ← Remotion render tetikler
    │       └── subtitle/route.ts ← FFmpeg altyazı pipeline
    ├── components/
    │   ├── TopNav.tsx
    │   ├── TemplateGrid.tsx
    │   ├── ParamForm.tsx
    │   ├── VideoPreview.tsx
    │   ├── SubtitleEditor.tsx
    │   ├── SubtitleTimeline.tsx
    │   └── StylePanel.tsx
    └── lib/
        ├── firebase.ts           ← Auth + Firestore + Storage init
        ├── templates.ts          ← Şablon şemaları ve varsayılan değerler
        ├── renderer.ts           ← npx remotion render shell wrapper
        └── subtitler.ts          ← FFmpeg altyazı embed wrapper
```

**Render pipeline (Video Oluştur):**
1. Kullanıcı form parametrelerini doldurur
2. `POST /api/render` → `renderer.ts` form parametrelerini JSON'a dönüştürür
3. `npx remotion render <CompositionId> out/<id>.mp4 --props='<json>'` çalıştırılır
4. Oluşan MP4 Firebase Storage'a yüklenir, Firestore'a kayıt eklenir
5. Frontend download URL'ini gösterir

**Render pipeline (Altyazı Ekle):**
1. Kullanıcı MP4 yükler + altyazı satırları girer/SRT import eder
2. `POST /api/subtitle` → `subtitler.ts` FFmpeg `drawtext` filtresiyle altyazıları embed eder
3. Sonuç MP4 Firebase Storage'a yüklenir
4. Frontend download URL'ini gösterir

---

## Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| API Routes | Next.js Route Handlers (Edge değil, Node runtime) |
| Video oluşturma | Remotion 4.x (mevcut proje) |
| Altyazı embed | FFmpeg (sistem kurulu) |
| Auth | Firebase Authentication (Google Sign-In) |
| Veritabanı | Firestore (video geçmişi) |
| Dosya depolama | Firebase Storage (render edilen MP4'ler) |
| Render ortamı | Local (kullanıcının makinesi) |

---

## Screens

### Tab 1 — Video Oluştur

**Layout:** Üst nav + Sol form paneli + Sağ preview paneli (split)

**Sol panel içeriği:**
- Şablon grid (3 kart: Ürün Reklamı, İstatistik, Talking Head)
- Seçilen şablona göre dinamik form alanları (aşağıya bak)
- Render butonu

**Sağ panel içeriği:**
- Telefon mockup içinde canlı CSS animasyon önizlemesi (gerçek Remotion değil, yaklaşık görsel)
- Render tamamlandığında MP4 player + İndir butonu

**Şablon parametreleri:**

*Ürün Reklamı:*
- Başlık (text)
- Özellikler (textarea, her satır = bir özellik, max 4)
- CTA metni (text)
- Vurgu rengi (renk seçici, 5 preset + custom hex)
- Font (dropdown: Inter Bold, Poppins, Roboto)
- Süre (dropdown: 15s, 30s, 60s)
- Format (dropdown: 1080×1920 dikey, 1920×1080 yatay)

*İstatistik:*
- 4 adet sayı + açıklama çifti
- Count-up animasyonu (açık/kapalı toggle)
- Vurgu rengi, font, süre, format

*Talking Head:*
- Altyazı satırları (textarea, senkronizasyon için ms cinsinden başlangıç/bitiş)
- Logo görseli (upload, opsiyonel)
- Lower third metni
- Vurgu rengi, font, süre, format

---

### Tab 2 — Altyazı Ekle

**Layout:** Üst nav + Üst yarı (preview sol | stil paneli sağ) + Alt yarı (timeline)

**Video upload:**
- Drag & drop veya dosya seçici (MP4, maksimum 500MB)
- Upload sonrası preview telefon mockup'ında gösterilir

**Altyazı input (iki yol):**
- SRT İçe Aktar butonu → `.srt` dosyası parse edilir, satırlar timeline'a eklenir
- Manuel: "+ Satır Ekle" butonu → başlangıç süresi / bitiş süresi / metin alanları

**Altyazı listesi:**
- Her satır: zaman aralığı + metin + sil butonu
- Aktif satır (timeline'da cursor'ın üzerindeki) mavi highlight

**Stil ayarları (tüm altyazılara uygulanır):**
- Font (dropdown: Inter, Poppins, Roboto)
- Boyut (dropdown: 18px, 24px, 32px)
- Konum (dropdown: Alt, Orta, Üst)
- Animasyon (dropdown: Fade, Slide Up, Pop)
- Metin rengi (5 preset renk noktası)
- Arka plan opaklığı (dropdown: Yok, %40 Siyah, %60 Siyah, %100 Siyah)

**Timeline:**
- Yatay bar, video süresini temsil eder
- Her altyazı satırı renkli blok olarak görünür, sürükleyerek başlangıç/bitiş süresi ayarlanabilir
- Blok kenarlarından tutup genişletme/daraltma ile süre değiştirme
- Liste ve timeline çift yönlü senkronize: birinde yapılan değişiklik diğerine anında yansır
- Zaman etiketleri (0:00, 0:10, 0:20...)

**Render:**
- "Altyazılı Video Oluştur" butonu → FFmpeg pipeline
- Sonuç MP4 indir + Firebase Storage'a yükle

---

### Tab 3 — Geçmiş

**Layout:** Üst nav + kart grid

**Kart içeriği:**
- Video thumbnail (Firebase Storage'daki dosyadan)
- Şablon adı veya "Altyazılı"
- Oluşturulma tarihi
- İndir butonu
- Sil butonu (Firestore + Storage'dan kaldırır)

**Auth:** v1'de yok — tüm tab'lar giriş gerektirmez.

---

## Firebase Kullanımı

| Servis | Ne için |
|--------|---------|
| Firestore | `videos` koleksiyonu: `templateName, createdAt, storageUrl, params` |
| Storage | `videos/<uuid>.mp4` path formatı |

**Authentication v1'de yok.** Tüm işlemler giriş gerektirmeden çalışır. Geçmiş tab'ı tüm kullanıcılara açıktır. Auth ilerleyen versiyonda eklenebilir.

---

## Remotion Şablon Parametreleştirme

Mevcut `ProductAd.tsx` hardcoded değerler içeriyor. Bu spec kapsamında her şablon `props` alacak şekilde refactor edilir:

```tsx
// src/compositions/ProductAd.tsx
interface ProductAdProps {
  title: string;
  features: string[];
  cta: string;
  accentColor: string;
  fontFamily: string;
}
export const ProductAd: React.FC<ProductAdProps> = ({ title, features, cta, accentColor, fontFamily }) => { ... }
```

`Root.tsx`'te `defaultProps` tanımlanır, render sırasında `--props` flag ile override edilir:
```bash
npx remotion render ProductAd out/video.mp4 --props='{"title":"...","accentColor":"#e67e22"}'
```

---

## Out of Scope (v1)

- Video klip kesme/birleştirme
- Renk düzeltme (color grading)
- Ses ekleme/düzenleme
- Firebase Authentication (v2'ye bırakıldı)
- Mobile responsive tasarım
- Ödeme/abonelik sistemi
- Deployment (Firebase Hosting) — local only

---

## File Naming & Conventions

- Next.js App Router: `app/` dizini, server components varsayılan
- API Route'lar `Node` runtime kullanır (`export const runtime = 'nodejs'`)
- Tailwind CSS utility classes, custom CSS yok
- Firebase config `lib/firebase.ts`'te, env vars `.env.local`'de
- Rendered dosyalar `../out/` dizininde (Remotion projesiyle paylaşılır)

# Timing & Animation System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-element timing (entry/exit animations, display duration), slot-based Body section, premium color picker, and CTA logo mode to the ProductAd template.

**Architecture:** New pure-function animation layer (`animations.ts`, `types.ts`, `LetterAnimated.tsx`) feeds into an updated `ProductAd.tsx` Remotion composition. A new reusable `ColorPicker.tsx` web component replaces all inline color controls. `ParamForm.tsx` is restructured with accordion+toggle sections. All changes isolated to ProductAd — Stats and TalkingHead untouched.

**Tech Stack:** Remotion 4.x (React + frame interpolation), Next.js 14 App Router, Zod, TypeScript, Tailwind CSS, Jest + React Testing Library.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/compositions/types.ts` | Create | `EntryAnimType`, `ExitAnimType`, `BodyItem`, constants |
| `src/compositions/animations.ts` | Create | `getElementStyle`, `applyEntry`, `applyExit`, `getSteadyStyle` |
| `src/compositions/LetterAnimated.tsx` | Create | Per-letter animated span wrapper for wave/split/glitch |
| `src/compositions/__tests__/animations.test.ts` | Create | Unit tests for animation pure functions |
| `src/compositions/ProductAd.tsx` | Modify | New schema + render logic using new animation system |
| `src/Root.tsx` | Modify | Updated defaultProps for ProductAd |
| `web/components/ColorPicker.tsx` | Create | Palette tabs + hex input + opacity slider |
| `web/components/__tests__/ColorPicker.test.tsx` | Create | Component tests |
| `web/components/VideoPreview.tsx` | Modify | 25% larger mockup dimensions |
| `web/components/ParamForm.tsx` | Modify | Accordion+toggle UI, Body items, CTA logo, ColorPicker |
| `web/components/__tests__/ParamForm.test.tsx` | Modify | Update tests for new schema |
| `web/lib/templates.ts` | Modify | Updated ProductAd defaultProps |

---

## Task 1: Foundation Types

**Files:**
- Create: `src/compositions/types.ts`

- [ ] **Step 1: Create types file**

```ts
// src/compositions/types.ts

export const ENTRY_ANIM_TYPES = [
  'none',
  'fade', 'zoom', 'slide-up', 'slide-down', 'slide-left', 'slide-right',
  'pop', 'typewriter', 'blur', 'flip', 'elastic', 'rise',
  'wave', 'split', 'neon-glow', 'spin-3d', 'glitch',
] as const

export const EXIT_ANIM_TYPES = [
  'none',
  'fade-out', 'zoom-out',
  'slide-out-up', 'slide-out-down', 'slide-out-left', 'slide-out-right',
  'shrink', 'blur-out', 'flip-out',
  'wave-out', 'split-out', 'glitch-out', 'neon-flicker', 'dissolve', 'light-speed',
] as const

export type EntryAnimType = typeof ENTRY_ANIM_TYPES[number]
export type ExitAnimType = typeof EXIT_ANIM_TYPES[number]

/** Animations that require per-letter rendering via LetterAnimated */
export const PER_LETTER_ENTRY: ReadonlySet<EntryAnimType> = new Set(['wave', 'split', 'glitch'])
export const PER_LETTER_EXIT: ReadonlySet<ExitAnimType> = new Set(['wave-out', 'split-out', 'glitch-out'])

export interface BodyItem {
  text: string
  slot: number        // 1–10: vertical position in video
  startSec: number
  durationSec: number
  entryAnim: EntryAnimType
  exitAnim: ExitAnimType
}
```

- [ ] **Step 2: Commit**

```bash
git add src/compositions/types.ts
git commit -m "feat: add animation types and BodyItem interface"
```

---

## Task 2: Animation Engine

**Files:**
- Create: `src/compositions/animations.ts`
- Create: `src/compositions/__tests__/animations.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/compositions/__tests__/animations.test.ts
import { getElementStyle } from '../animations'

const FPS = 30

describe('getElementStyle', () => {
  test('returns invisible style before startSec', () => {
    const result = getElementStyle(0, FPS, 2, 5, 'fade', 'fade-out')
    expect(result.style.opacity).toBe(0)
  })

  test('returns invisible style after end', () => {
    // startSec=0, durationSec=3 → endFrame=90. frame=91 → invisible
    const result = getElementStyle(91, FPS, 0, 3, 'fade', 'fade-out')
    expect(result.style.opacity).toBe(0)
  })

  test('returns entryProgress=1 in steady state', () => {
    // startSec=0, durationSec=5 → entry ends at frame 20, exit starts at 130
    const result = getElementStyle(75, FPS, 0, 5, 'fade', 'fade-out')
    expect(result.entryProgress).toBe(1)
    expect(result.exitProgress).toBe(0)
    expect(result.style.opacity).toBe(1)
  })

  test('fade entry: opacity increases from 0 to 1 over 20 frames', () => {
    const at0 = getElementStyle(0, FPS, 0, 5, 'fade', 'fade-out')
    const at10 = getElementStyle(10, FPS, 0, 5, 'fade', 'fade-out')
    const at20 = getElementStyle(20, FPS, 0, 5, 'fade', 'fade-out')
    expect(at0.style.opacity).toBeCloseTo(0, 1)
    expect(at10.style.opacity).toBeCloseTo(0.5, 1)
    expect(at20.style.opacity).toBe(1)
  })

  test('none entry: immediately opacity 1', () => {
    const result = getElementStyle(0, FPS, 0, 5, 'none', 'none')
    expect(result.style.opacity).toBe(1)
  })

  test('fade-out exit: opacity decreases from 1 to 0', () => {
    // durationSec=3 → endFrame=90, exitStart=70
    const at70 = getElementStyle(70, FPS, 0, 3, 'fade', 'fade-out')
    const at80 = getElementStyle(80, FPS, 0, 3, 'fade', 'fade-out')
    const at89 = getElementStyle(89, FPS, 0, 3, 'fade', 'fade-out')
    expect(at70.exitProgress).toBeCloseTo(0, 1)
    expect(at80.exitProgress).toBeCloseTo(0.5, 1)
    expect(at89.exitProgress).toBeCloseTo(0.95, 1)
  })

  test('wave entry: returns opacity 1 (per-letter handles it)', () => {
    const result = getElementStyle(0, FPS, 0, 5, 'wave', 'fade-out')
    expect(result.style.opacity).toBe(1)
    expect(result.entryProgress).toBeCloseTo(0, 1)
  })
})
```

- [ ] **Step 2: Run tests, confirm they fail**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit/web
npx jest --testPathPattern="animations" --no-coverage 2>&1 | head -20
```

Expected: `FAIL` — `Cannot find module '../animations'`

- [ ] **Step 3: Create animations.ts**

```ts
// src/compositions/animations.ts
import React from 'react'
import { EntryAnimType, ExitAnimType, PER_LETTER_ENTRY, PER_LETTER_EXIT } from './types'

const ANIM_FRAMES = 20

export interface ElementStyleResult {
  style: React.CSSProperties
  entryProgress: number
  exitProgress: number
}

export function getElementStyle(
  frame: number,
  fps: number,
  startSec: number,
  durationSec: number,
  entryAnim: EntryAnimType,
  exitAnim: ExitAnimType,
): ElementStyleResult {
  const startFrame = Math.round(startSec * fps)
  const endFrame = Math.round((startSec + durationSec) * fps)

  if (frame < startFrame || frame >= endFrame) {
    return { style: { opacity: 0, pointerEvents: 'none' }, entryProgress: 0, exitProgress: 0 }
  }

  // Entry phase
  if (frame < startFrame + ANIM_FRAMES) {
    const p = (frame - startFrame) / ANIM_FRAMES
    return {
      style: PER_LETTER_ENTRY.has(entryAnim)
        ? { opacity: 1, ...getSteadyStyle(entryAnim) }
        : applyEntry(p, entryAnim),
      entryProgress: p,
      exitProgress: 0,
    }
  }

  // Exit phase
  const exitStart = endFrame - ANIM_FRAMES
  if (frame >= exitStart) {
    const p = (frame - exitStart) / ANIM_FRAMES
    return {
      style: PER_LETTER_EXIT.has(exitAnim)
        ? { opacity: 1, ...getSteadyStyle(entryAnim) }
        : applyExit(p, exitAnim),
      entryProgress: 1,
      exitProgress: p,
    }
  }

  // Steady state
  return { style: { opacity: 1, ...getSteadyStyle(entryAnim) }, entryProgress: 1, exitProgress: 0 }
}

function getSteadyStyle(entryAnim: EntryAnimType): React.CSSProperties {
  if (entryAnim === 'neon-glow') {
    return { textShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 40px currentColor' }
  }
  return {}
}

export function applyEntry(p: number, anim: EntryAnimType): React.CSSProperties {
  switch (anim) {
    case 'none':    return { opacity: 1 }
    case 'fade':    return { opacity: p }
    case 'zoom':    return { opacity: p, transform: `scale(${0.5 + p * 0.5})` }
    case 'slide-up':    return { opacity: p, transform: `translateY(${(1 - p) * 40}px)` }
    case 'slide-down':  return { opacity: p, transform: `translateY(${-(1 - p) * 40}px)` }
    case 'slide-left':  return { opacity: p, transform: `translateX(${(1 - p) * 40}px)` }
    case 'slide-right': return { opacity: p, transform: `translateX(${-(1 - p) * 40}px)` }
    case 'pop': {
      const scale = p < 0.7 ? (p / 0.7) * 1.15 : 1.15 - ((p - 0.7) / 0.3) * 0.15
      return { opacity: Math.min(1, p * 2), transform: `scale(${scale})` }
    }
    case 'typewriter': return { opacity: 1, clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` }
    case 'blur':   return { opacity: p, filter: `blur(${(1 - p) * 20}px)` }
    case 'flip':   return { opacity: p, transform: `perspective(800px) rotateX(${(1 - p) * 90}deg)` }
    case 'elastic': {
      const scale = p < 0.6 ? (p / 0.6) * 1.1
        : p < 0.8 ? 1.1 - ((p - 0.6) / 0.2) * 0.15
        : 0.95 + ((p - 0.8) / 0.2) * 0.05
      return { opacity: Math.min(1, p * 3), transform: `scale(${scale})` }
    }
    case 'rise':    return { opacity: p * p, transform: `translateY(${(1 - p) * 20}px) scale(${0.9 + p * 0.1})` }
    case 'neon-glow': {
      const glow = p * 15
      return { opacity: p, textShadow: `0 0 ${glow}px currentColor, 0 0 ${glow * 2}px currentColor` }
    }
    case 'spin-3d': return { opacity: p, transform: `perspective(800px) rotateY(${(1 - p) * 90}deg)` }
    case 'glitch': {
      const offset = (1 - p) * 6 * Math.sin(p * Math.PI * 4)
      return { opacity: p, transform: `translateX(${offset}px)` }
    }
    // wave/split handled by LetterAnimated — container just appears
    default: return { opacity: p }
  }
}

export function applyExit(p: number, anim: ExitAnimType): React.CSSProperties {
  const q = 1 - p   // q=1 at exit start, q=0 at exit end
  switch (anim) {
    case 'none':         return { opacity: 0 }
    case 'fade-out':     return { opacity: q }
    case 'zoom-out':     return { opacity: q, transform: `scale(${0.5 + q * 0.5})` }
    case 'slide-out-up':    return { opacity: q, transform: `translateY(${-p * 40}px)` }
    case 'slide-out-down':  return { opacity: q, transform: `translateY(${p * 40}px)` }
    case 'slide-out-left':  return { opacity: q, transform: `translateX(${-p * 40}px)` }
    case 'slide-out-right': return { opacity: q, transform: `translateX(${p * 40}px)` }
    case 'shrink':       return { opacity: q, transform: `scale(${q})` }
    case 'blur-out':     return { opacity: q, filter: `blur(${p * 20}px)` }
    case 'flip-out':     return { opacity: q, transform: `perspective(800px) rotateX(${p * 90}deg)` }
    case 'neon-flicker': {
      const flicker = Math.sin(p * Math.PI * 8) > 0 ? 1 : 0.2
      return { opacity: q * flicker }
    }
    case 'dissolve':     return { opacity: q, transform: `scale(${0.95 + q * 0.05})`, filter: `blur(${p * 8}px)` }
    case 'light-speed':  return { opacity: q * q, transform: `translateX(${p * 80}px) skewX(${p * 20}deg)` }
    // wave-out/split-out/glitch-out handled by LetterAnimated
    default: return { opacity: q }
  }
}
```

- [ ] **Step 4: Move test file to correct location and run**

The test file should be alongside the source. Since `src/` isn't a Next.js project (no jest config there), add a jest config or run from project root. Check:

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit
ls jest.config* 2>/dev/null || echo "no jest config at root"
ls src/compositions/__tests__/ 2>/dev/null || mkdir -p src/compositions/__tests__
```

If no jest config at root, the tests must run from `web/`. Move test file:

```bash
mkdir -p /Users/okilavuz/Desktop/omer_works/Video_edit/web/src/compositions/__tests__
# animations.ts is in src/ (Remotion), but tests run from web/
# Place test in web with relative import adjusted
mkdir -p /Users/okilavuz/Desktop/omer_works/Video_edit/web/components/__tests__
```

Actually, place test in `web/components/__tests__/animations.test.ts` with adjusted import path:

```ts
// web/components/__tests__/animations.test.ts
// (same test code as Step 1 but with import from correct path)
import { getElementStyle } from '../../../src/compositions/animations'
// ... rest of test unchanged
```

Check jest config allows imports from `../../../src/`:

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit/web
cat jest.config.ts 2>/dev/null || cat jest.config.js 2>/dev/null
```

If `moduleNameMapper` or `roots` need updating, add `"../../src"` to roots or use `modulePaths`.

- [ ] **Step 5: Run tests, confirm pass**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit/web
npx jest --testPathPattern="animations" --no-coverage
```

Expected: `PASS  components/__tests__/animations.test.ts` — 7 tests passing.

- [ ] **Step 6: Commit**

```bash
git add src/compositions/animations.ts web/components/__tests__/animations.test.ts
git commit -m "feat: add animation engine with entry/exit style functions"
```

---

## Task 3: LetterAnimated Component

**Files:**
- Create: `src/compositions/LetterAnimated.tsx`

- [ ] **Step 1: Create LetterAnimated**

```tsx
// src/compositions/LetterAnimated.tsx
import React from 'react'
import { EntryAnimType, ExitAnimType } from './types'

interface LetterAnimatedProps {
  text: string
  entryProgress: number   // 0→1 during entry phase
  exitProgress: number    // 0→1 during exit phase
  entryAnim: EntryAnimType
  exitAnim: ExitAnimType
}

function letterEntryStyle(p: number, anim: EntryAnimType, i: number, total: number): React.CSSProperties {
  const delay = (i / total) * 0.6
  const lp = Math.max(0, Math.min(1, (p - delay) / 0.4))

  switch (anim) {
    case 'wave':
      return { opacity: lp, display: 'inline-block', transform: `translateY(${(1 - lp) * 18}px)` }
    case 'split': {
      const isLeft = i < total / 2
      return { opacity: lp, display: 'inline-block', transform: `translateX(${isLeft ? -(1 - lp) * 30 : (1 - lp) * 30}px)` }
    }
    case 'glitch': {
      const offset = (1 - lp) * 8 * (i % 2 === 0 ? 1 : -1)
      return { opacity: lp, display: 'inline-block', transform: `translateX(${offset}px)` }
    }
    default:
      return { opacity: lp, display: 'inline-block' }
  }
}

function letterExitStyle(p: number, anim: ExitAnimType, i: number, total: number): React.CSSProperties {
  // Reverse stagger: last letters exit first
  const delay = ((total - 1 - i) / total) * 0.6
  const lp = Math.max(0, Math.min(1, (p - delay) / 0.4))
  const q = 1 - lp

  switch (anim) {
    case 'wave-out':
      return { opacity: q, display: 'inline-block', transform: `translateY(${lp * 18}px)` }
    case 'split-out': {
      const isLeft = i < total / 2
      return { opacity: q, display: 'inline-block', transform: `translateX(${isLeft ? -lp * 30 : lp * 30}px)` }
    }
    case 'glitch-out': {
      const offset = lp * 10 * (i % 2 === 0 ? 1 : -1)
      return { opacity: q, display: 'inline-block', transform: `translateX(${offset}px)` }
    }
    default:
      return { opacity: q, display: 'inline-block' }
  }
}

export function LetterAnimated({ text, entryProgress, exitProgress, entryAnim, exitAnim }: LetterAnimatedProps) {
  const chars = text.split('')
  const total = chars.length

  return (
    <span>
      {chars.map((char, i) => {
        const style = exitProgress > 0
          ? letterExitStyle(exitProgress, exitAnim, i, total)
          : letterEntryStyle(entryProgress, entryAnim, i, total)
        return (
          <span key={i} style={style}>
            {char === ' ' ? '\u00A0' : char}
          </span>
        )
      })}
    </span>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/compositions/LetterAnimated.tsx
git commit -m "feat: add LetterAnimated component for per-letter animations"
```

---

## Task 4: VideoPreview Size

**Files:**
- Modify: `web/components/VideoPreview.tsx`

- [ ] **Step 1: Update dimensions**

In `web/components/VideoPreview.tsx`, change lines 11-13:

```tsx
// OLD:
const mockupClass = isLandscape ? 'w-[356px] h-[200px]' : 'w-[200px] h-[356px]'
const videoClass = isLandscape ? 'max-w-[400px]' : 'max-h-[400px]'

// NEW:
const mockupClass = isLandscape ? 'w-[445px] h-[250px]' : 'w-[250px] h-[445px]'
const videoClass = isLandscape ? 'max-w-[500px]' : 'max-h-[500px]'
```

- [ ] **Step 2: Commit**

```bash
git add web/components/VideoPreview.tsx
git commit -m "feat: increase video preview size 25%"
```

---

## Task 5: ColorPicker Component

**Files:**
- Create: `web/components/ColorPicker.tsx`
- Create: `web/components/__tests__/ColorPicker.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// web/components/__tests__/ColorPicker.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ColorPicker } from '../ColorPicker'

describe('ColorPicker', () => {
  test('renders "renk yok" swatch as first option', () => {
    render(<ColorPicker value="#e67e22" opacity={100} onChange={() => {}} />)
    expect(screen.getByTitle('Renk yok')).toBeInTheDocument()
  })

  test('calls onChange with empty string when "renk yok" clicked', async () => {
    const onChange = jest.fn()
    render(<ColorPicker value="#e67e22" opacity={100} onChange={onChange} />)
    await userEvent.click(screen.getByTitle('Renk yok'))
    expect(onChange).toHaveBeenCalledWith({ color: '', opacity: 100 })
  })

  test('calls onChange with color when swatch clicked', async () => {
    const onChange = jest.fn()
    render(<ColorPicker value="" opacity={100} onChange={onChange} />)
    await userEvent.click(screen.getByTitle('#ef4444'))
    expect(onChange).toHaveBeenCalledWith({ color: '#ef4444', opacity: 100 })
  })

  test('switches palette tab', async () => {
    render(<ColorPicker value="#e67e22" opacity={100} onChange={() => {}} />)
    await userEvent.click(screen.getByText('Neon'))
    expect(screen.getByTitle('#ff0090')).toBeInTheDocument()
  })

  test('shows active state on selected color', () => {
    render(<ColorPicker value="#e67e22" opacity={100} onChange={() => {}} />)
    expect(screen.getByTitle('#e67e22').closest('button')).toHaveClass('ring-2')
  })
})
```

- [ ] **Step 2: Run tests, confirm fail**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit/web
npx jest --testPathPattern="ColorPicker" --no-coverage 2>&1 | head -10
```

Expected: `FAIL` — `Cannot find module '../ColorPicker'`

- [ ] **Step 3: Create ColorPicker.tsx**

```tsx
// web/components/ColorPicker.tsx
'use client'
import { useState } from 'react'

const PALETTES = {
  Temel:  ['#e67e22','#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#ffffff','#e5e5e5','#6b7280','#1f2937','#000000'],
  Pastel: ['#fde68a','#fca5a5','#86efac','#93c5fd','#c4b5fd','#f9a8d4','#a5f3fc','#d9f99d','#fed7aa','#e9d5ff','#bfdbfe','#bbf7d0'],
  Neon:   ['#ff0090','#00ff88','#00cfff','#ff6600','#aaff00','#ff00ff','#ffff00','#00ffff','#ff3300','#9900ff','#33ff00','#ff9900'],
  Koyu:   ['#1a1a2e','#0f172a','#1e293b','#111827','#18181b','#1c1917','#14532d','#1e3a5f','#3b0764','#7f1d1d','#1a1a1a','#0a0a0a'],
} as const

type PaletteKey = keyof typeof PALETTES
const OPACITY_PRESETS = [25, 50, 75, 100]

interface ColorPickerProps {
  value: string        // hex or '' for none
  opacity: number      // 0-100
  onChange: (val: { color: string; opacity: number }) => void
}

export function ColorPicker({ value, opacity, onChange }: ColorPickerProps) {
  const [tab, setTab] = useState<PaletteKey>('Temel')
  const [hexInput, setHexInput] = useState(value)

  const setColor = (color: string) => {
    setHexInput(color)
    onChange({ color, opacity })
  }
  const setOpacity = (op: number) => onChange({ color: value, opacity: op })

  const handleHexBlur = () => {
    const clean = hexInput.trim()
    if (/^#[0-9a-fA-F]{6}$/.test(clean)) setColor(clean)
    else setHexInput(value) // revert invalid
  }

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex gap-1">
        {(Object.keys(PALETTES) as PaletteKey[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
              tab === t
                ? 'bg-indigo-900/60 text-indigo-300 border-indigo-500'
                : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-400'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Swatch grid */}
      <div className="grid grid-cols-6 gap-1.5">
        {/* None swatch */}
        <button
          title="Renk yok"
          onClick={() => onChange({ color: '', opacity })}
          className={`aspect-square rounded-md border-2 border-dashed transition-all ${
            value === '' ? 'border-indigo-500 ring-2 ring-indigo-300' : 'border-gray-300'
          }`}
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #ccc, #ccc 2px, #fff 2px, #fff 6px)',
          }}
        />
        {PALETTES[tab].map(color => (
          <button
            key={color}
            title={color}
            onClick={() => setColor(color)}
            className={`aspect-square rounded-md transition-all hover:scale-110 border ${
              value === color ? 'ring-2 ring-indigo-400 border-white' : 'border-transparent'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Custom hex + native picker */}
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={value || '#e67e22'}
          onChange={e => setColor(e.target.value)}
          className="w-7 h-7 rounded cursor-pointer border border-gray-200"
        />
        <input
          value={hexInput}
          onChange={e => setHexInput(e.target.value)}
          onBlur={handleHexBlur}
          placeholder="#RRGGBB"
          className="w-24 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-[11px] font-mono text-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
      </div>

      {/* Opacity */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Opaklık</span>
          <span className="text-[10px] font-mono font-bold text-indigo-600">{opacity}%</span>
        </div>
        <input
          type="range"
          min={0} max={100} value={opacity}
          onChange={e => setOpacity(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-indigo-500 bg-gray-200"
        />
        <div className="flex gap-1 mt-1.5">
          {OPACITY_PRESETS.map(p => (
            <button
              key={p}
              onClick={() => setOpacity(p)}
              className={`flex-1 text-[10px] py-0.5 rounded border transition-colors ${
                opacity === p
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-300'
                  : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-400'
              }`}
            >
              {p}%
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Helper: convert color+opacity to CSS rgba string */
export function colorToCss(color: string, opacity: number): string {
  if (!color) return 'transparent'
  if (opacity === 100) return color
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`
}
```

- [ ] **Step 4: Run tests, confirm pass**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit/web
npx jest --testPathPattern="ColorPicker" --no-coverage
```

Expected: `PASS` — 5 tests passing.

- [ ] **Step 5: Commit**

```bash
git add web/components/ColorPicker.tsx web/components/__tests__/ColorPicker.test.tsx
git commit -m "feat: add premium ColorPicker with palette tabs and opacity"
```

---

## Task 6: ProductAd Schema Update

**Files:**
- Modify: `src/compositions/ProductAd.tsx`

- [ ] **Step 1: Replace schema in ProductAd.tsx**

Replace the entire `productAdSchema` and `ProductAdProps` at the top of `src/compositions/ProductAd.tsx`:

```ts
import { ENTRY_ANIM_TYPES, EXIT_ANIM_TYPES, EntryAnimType, ExitAnimType, BodyItem, PER_LETTER_ENTRY, PER_LETTER_EXIT } from './types'
import { getElementStyle } from './animations'
import { LetterAnimated } from './LetterAnimated'

const EntryAnimSchema = z.enum(ENTRY_ANIM_TYPES as [string, ...string[]])
const ExitAnimSchema = z.enum(EXIT_ANIM_TYPES as [string, ...string[]])

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
```

Remove the old `getAnimatedStyle` function entirely — replaced by `getElementStyle` from `animations.ts`.

- [ ] **Step 2: Commit**

```bash
git add src/compositions/ProductAd.tsx
git commit -m "feat: update ProductAd schema for timing, body slots, CTA logo"
```

---

## Task 7: ProductAd Render Logic

**Files:**
- Modify: `src/compositions/ProductAd.tsx` (render function only)

- [ ] **Step 1: Replace the ProductAd component render function**

Replace everything from `export const ProductAd: React.FC<ProductAdProps> =` to end of file:

```tsx
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

  // Helper: render text — per-letter or plain
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

  // Group body items by slot
  const slotMap = new Map<number, BodyItem[]>()
  body.forEach(item => {
    if (!slotMap.has(item.slot)) slotMap.set(item.slot, [])
    slotMap.get(item.slot)!.push(item)
  })

  const ctaBgCss = ctaBgColor
    ? (ctaOpacity < 100
        ? `rgba(${parseInt(ctaBgColor.slice(1,3),16)},${parseInt(ctaBgColor.slice(3,5),16)},${parseInt(ctaBgColor.slice(5,7),16)},${ctaOpacity/100})`
        : ctaBgColor)
    : 'transparent'

  const accentCss = accentColor
    ? (accentOpacity < 100
        ? `rgba(${parseInt(accentColor.slice(1,3),16)},${parseInt(accentColor.slice(3,5),16)},${parseInt(accentColor.slice(5,7),16)},${accentOpacity/100})`
        : accentColor)
    : 'transparent'

  return (
    <AbsoluteFill style={{ backgroundColor, justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 24, fontFamily }}>
      {/* Background media */}
      {backgroundMedia && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          {/\.(mp4|webm|mov)$/i.test(backgroundMedia) ? (
            <Video src={/^(https?:|data:)/.test(backgroundMedia) ? backgroundMedia : staticFile(backgroundMedia)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Img src={/^(https?:|data:)/.test(backgroundMedia) ? backgroundMedia : staticFile(backgroundMedia)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
        </div>
      )}

      {/* Title */}
      {showTitle && (() => {
        const { style, entryProgress, exitProgress } = getElementStyle(frame, fps, titleStartSec, titleDurationSec, titleEntryAnim as EntryAnimType, titleExitAnim as ExitAnimType)
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
            const { style, entryProgress, exitProgress } = getElementStyle(frame, fps, item.startSec, item.durationSec, item.entryAnim, item.exitAnim)
            return (
              <div key={i} style={{ position: 'absolute', width: '100%', ...style, fontSize: bodyFontSize, color: accentCss, fontWeight: 700 }}>
                {renderText(item.text, item.entryAnim, item.exitAnim, entryProgress, exitProgress)}
              </div>
            )
          })}
        </div>
      ))}

      {/* CTA */}
      {showCta && (() => {
        const { style } = getElementStyle(frame, fps, ctaStartSec, ctaDurationSec, ctaEntryAnim as EntryAnimType, ctaExitAnim as ExitAnimType)
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
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit
npx tsc --noEmit 2>&1 | head -30
```

Fix any type errors before proceeding.

- [ ] **Step 3: Commit**

```bash
git add src/compositions/ProductAd.tsx
git commit -m "feat: update ProductAd render with slot system, timing, CTA logo"
```

---

## Task 8: Root.tsx + templates.ts defaultProps

**Files:**
- Modify: `src/Root.tsx`
- Modify: `web/lib/templates.ts`

- [ ] **Step 1: Update Root.tsx defaultProps**

In `src/Root.tsx`, find the `defaultProps` for `ProductAd` composition and replace:

```tsx
// In src/Root.tsx — find the <Composition> for ProductAd
// Replace its defaultProps with:
defaultProps={{
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
}}
```

- [ ] **Step 2: Update templates.ts defaultProps**

In `web/lib/templates.ts`, replace the ProductAd `defaultProps`:

```ts
defaultProps: {
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
  ctaMode: 'text' as const,
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
},
```

- [ ] **Step 3: Commit**

```bash
git add src/Root.tsx web/lib/templates.ts
git commit -m "feat: update ProductAd defaultProps for new schema"
```

---

## Task 9: ParamForm — Accordion Structure + Toggle Switches

**Files:**
- Modify: `web/components/ParamForm.tsx`
- Modify: `web/components/__tests__/ParamForm.test.tsx`

- [ ] **Step 1: Update ParamForm tests to match new schema**

Replace `web/components/__tests__/ParamForm.test.tsx`:

```tsx
// web/components/__tests__/ParamForm.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ParamForm } from '../ParamForm'

const productAdDefaults = {
  title: 'Test başlık',
  showTitle: true,
  titleStartSec: 0,
  titleDurationSec: 10,
  titleEntryAnim: 'fade',
  titleExitAnim: 'fade-out',
  body: [],
  showBody: true,
  cta: 'test.com',
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
}

describe('ParamForm', () => {
  test('Başlık accordion toggle ve metin alanı görünür', () => {
    render(<ParamForm templateId="ProductAd" values={productAdDefaults} onChange={() => {}} onSubmit={() => {}} loading={false} />)
    expect(screen.getByText('Başlık')).toBeInTheDocument()
  })

  test('onChange başlık değiştiğinde çağrılır', async () => {
    const onChange = jest.fn()
    render(<ParamForm templateId="ProductAd" values={productAdDefaults} onChange={onChange} onSubmit={() => {}} loading={false} />)
    // Open title accordion
    await userEvent.click(screen.getByText('Başlık'))
    const input = screen.getByPlaceholderText('Başlık metni')
    await userEvent.clear(input)
    await userEvent.type(input, 'Y')
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ title: expect.stringContaining('Y') }))
  })

  test('showCta toggle false yapınca CTA formu gizlenir', async () => {
    const onChange = jest.fn()
    render(<ParamForm templateId="ProductAd" values={productAdDefaults} onChange={onChange} onSubmit={() => {}} loading={false} />)
    const ctaToggle = screen.getByTestId('toggle-cta')
    await userEvent.click(ctaToggle)
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ showCta: false }))
  })

  test('loading=true iken buton disabled', () => {
    render(<ParamForm templateId="ProductAd" values={productAdDefaults} onChange={() => {}} onSubmit={() => {}} loading={true} />)
    expect(screen.getByRole('button', { name: /render/i })).toBeDisabled()
  })
})
```

- [ ] **Step 2: Run tests, confirm fail**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit/web
npx jest --testPathPattern="ParamForm" --no-coverage 2>&1 | head -20
```

Expected: FAIL — tests reference non-existent UI

- [ ] **Step 3: Rewrite ParamForm.tsx with accordion structure**

Replace the entire contents of `web/components/ParamForm.tsx` with the new version. This is the largest change. Write it in sections:

```tsx
// web/components/ParamForm.tsx
'use client'
import { useState } from 'react'
import { ColorPicker, colorToCss } from './ColorPicker'
import { ENTRY_ANIM_TYPES, EXIT_ANIM_TYPES, BodyItem, EntryAnimType, ExitAnimType } from '../../src/compositions/types'

const FONTS = ['sans-serif', 'Inter', 'Poppins', 'Roboto']
const DURATIONS = [15, 30, 60]
const FORMATS = ['1080x1920', '1920x1080']

// Grouped animation options for <select optgroup>
const ENTRY_GROUPS = [
  { label: '— Yok',   options: ['none'] },
  { label: 'Temel',   options: ['fade', 'zoom', 'slide-up', 'slide-down', 'slide-left', 'slide-right'] },
  { label: 'Premium ★', options: ['pop', 'typewriter', 'blur', 'flip', 'elastic', 'rise'] },
  { label: 'Efekt ★★', options: ['wave', 'split', 'neon-glow', 'spin-3d', 'glitch'] },
] as const

const EXIT_GROUPS = [
  { label: '— Yok',   options: ['none'] },
  { label: 'Temel',   options: ['fade-out', 'zoom-out', 'slide-out-up', 'slide-out-down', 'slide-out-left', 'slide-out-right'] },
  { label: 'Premium ★', options: ['shrink', 'blur-out', 'flip-out'] },
  { label: 'Efekt ★★', options: ['wave-out', 'split-out', 'glitch-out', 'neon-flicker', 'dissolve', 'light-speed'] },
] as const

const ANIM_LABELS: Record<string, string> = {
  none: '— Yok',
  fade: 'Fade', zoom: 'Zoom',
  'slide-up': 'Slide ↑', 'slide-down': 'Slide ↓', 'slide-left': 'Slide ←', 'slide-right': 'Slide →',
  pop: 'Pop ★', typewriter: 'Typewriter ★', blur: 'Blur In ★', flip: 'Flip ★', elastic: 'Elastic ★', rise: 'Rise ★',
  wave: 'Wave ★★', split: 'Split ★★', 'neon-glow': 'Neon Glow ★★', 'spin-3d': '3D Spin ★★', glitch: 'Glitch ★★',
  'fade-out': 'Fade Out', 'zoom-out': 'Zoom Out',
  'slide-out-up': 'Slide Out ↑', 'slide-out-down': 'Slide Out ↓', 'slide-out-left': 'Slide Out ←', 'slide-out-right': 'Slide Out →',
  shrink: 'Shrink ★', 'blur-out': 'Blur Out ★', 'flip-out': 'Flip Out ★',
  'wave-out': 'Wave Out ★★', 'split-out': 'Split Out ★★', 'glitch-out': 'Glitch Out ★★',
  'neon-flicker': 'Neon Flicker ★★', dissolve: 'Dissolve ★★', 'light-speed': 'Light Speed ★★',
}

function AnimSelect({ value, groups, onChange }: { value: string; groups: typeof ENTRY_GROUPS | typeof EXIT_GROUPS; onChange: (v: string) => void }) {
  return (
    <select
      className="w-full bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      {groups.map(g => (
        <optgroup key={g.label} label={g.label}>
          {g.options.map(o => <option key={o} value={o}>{ANIM_LABELS[o] ?? o}</option>)}
        </optgroup>
      ))}
    </select>
  )
}

function Toggle({ checked, onChange, testId }: { checked: boolean; onChange: (v: boolean) => void; testId?: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      data-testid={testId}
      onClick={() => onChange(!checked)}
      className={`relative w-8 h-4.5 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-indigo-500' : 'bg-gray-300'}`}
      style={{ width: 32, height: 18 }}
    >
      <span
        className="absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-all"
        style={{ width: 14, height: 14, top: 2, left: checked ? 16 : 2, position: 'absolute', transition: 'left 0.15s' }}
      />
    </button>
  )
}

function AccordionSection({
  title, enabled, onToggle, toggleTestId, children,
}: {
  title: string; enabled: boolean; onToggle: (v: boolean) => void; toggleTestId?: string; children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className={`border rounded-lg overflow-hidden mb-2 ${enabled ? 'border-gray-200' : 'border-gray-100'}`}>
      <div
        className={`flex items-center gap-2 px-3 py-2 cursor-pointer select-none ${enabled ? 'bg-gray-50 hover:bg-gray-100' : 'bg-gray-50'}`}
        onClick={() => enabled && setOpen(o => !o)}
      >
        <Toggle checked={enabled} onChange={onToggle} testId={toggleTestId} />
        <span className={`text-xs font-bold flex-1 ${enabled ? 'text-gray-800' : 'text-gray-300 line-through'}`}>{title}</span>
        {enabled && <span className="text-gray-400 text-xs">{open ? '▾' : '▸'}</span>}
      </div>
      {enabled && open && <div className="p-3 space-y-3">{children}</div>}
    </div>
  )
}

function TimingRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-[10px] text-gray-400 mb-1 uppercase font-semibold tracking-wide">{label}</label>
      <input
        type="number" min={0} step={0.5}
        className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs text-indigo-700 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-400"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
    </div>
  )
}

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
    <div className="space-y-3">
      {templateId === 'ProductAd' && (
        <ProductAdForm values={values} update={update} />
      )}
      {/* Stats and TalkingHead sections remain unchanged below */}
      {templateId === 'Stats' && <StatsForm values={values} update={update} />}
      {templateId === 'TalkingHead' && <TalkingHeadForm values={values} update={update} />}

      {/* Common fields */}
      <CommonFields values={values} update={update} />

      <button
        onClick={onSubmit}
        disabled={loading}
        className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-bold disabled:opacity-50 hover:bg-gray-700 transition-colors mt-2"
      >
        {loading ? 'Render ediliyor...' : '▶ Render Et'}
      </button>
    </div>
  )
}
```

The `ProductAdForm`, `StatsForm`, `TalkingHeadForm`, and `CommonFields` subcomponents are defined in Task 10 and Task 11.

- [ ] **Step 4: Run tests, confirm pass**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit/web
npx jest --testPathPattern="ParamForm" --no-coverage
```

Expected: PASS — 4 tests passing.

- [ ] **Step 5: Commit structure**

```bash
git add web/components/ParamForm.tsx web/components/__tests__/ParamForm.test.tsx
git commit -m "feat: ParamForm accordion structure with toggle switches"
```

---

## Task 10: ParamForm — Body Section + Collision Warning

**Files:**
- Modify: `web/components/ParamForm.tsx` (add `ProductAdForm` and `BodySection` subcomponents)

- [ ] **Step 1: Add ProductAdForm with Title + Body + CTA accordion sections**

Append to `web/components/ParamForm.tsx`:

```tsx
// Collision detection
function hasSlotCollision(body: BodyItem[], slot: number, currentIndex: number): boolean {
  const sameSlot = body.filter((item, i) => i !== currentIndex && item.slot === slot)
  const current = body[currentIndex]
  if (!current) return false
  return sameSlot.some(other => {
    const aEnd = current.startSec + current.durationSec
    const bEnd = other.startSec + other.durationSec
    return current.startSec < bEnd && aEnd > other.startSec
  })
}

const SLOT_COLORS = ['','bg-yellow-100 text-yellow-800','bg-green-100 text-green-800','bg-blue-100 text-blue-800','bg-pink-100 text-pink-800','bg-purple-100 text-purple-800','bg-orange-100 text-orange-800','bg-teal-100 text-teal-800','bg-red-100 text-red-800','bg-indigo-100 text-indigo-800','bg-gray-100 text-gray-700']

function BodySection({ body, bodyFontSize, update }: { body: BodyItem[]; bodyFontSize: number; update: (k: string, v: unknown) => void }) {
  const updateItem = (i: number, patch: Partial<BodyItem>) => {
    const next = body.map((item, idx) => idx === i ? { ...item, ...patch } : item)
    update('body', next)
  }
  const addItem = () => {
    if (body.length >= 10) return
    const newItem: BodyItem = { text: '', slot: Math.min(body.length + 1, 10), startSec: 0, durationSec: 5, entryAnim: 'fade', exitAnim: 'fade-out' }
    update('body', [...body, newItem])
  }
  const removeItem = (i: number) => update('body', body.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-2">
      {body.map((item, i) => {
        const collision = hasSlotCollision(body, item.slot, i)
        return (
          <div key={i} className={`border rounded-lg p-2.5 space-y-2 ${collision ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center gap-2">
              <select
                className={`text-[10px] font-bold px-2 py-1 rounded-full border cursor-pointer ${SLOT_COLORS[item.slot] || 'bg-gray-100 text-gray-700'}`}
                value={item.slot}
                onChange={e => updateItem(i, { slot: Number(e.target.value) })}
              >
                {Array.from({ length: 10 }, (_, j) => j + 1).map(n => (
                  <option key={n} value={n}>Slot {n}</option>
                ))}
              </select>
              <input
                className="flex-1 bg-white border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                placeholder="Metin..."
                value={item.text}
                onChange={e => updateItem(i, { text: e.target.value })}
              />
              <button onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-500 text-xs px-1">✕</button>
            </div>
            {collision && (
              <div className="text-[10px] text-yellow-700 font-semibold">⚠ Slot {item.slot} zaman çakışıyor</div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <TimingRow label="Giriş (sn)" value={item.startSec} onChange={v => updateItem(i, { startSec: v })} />
              <TimingRow label="Süre (sn)" value={item.durationSec} onChange={v => updateItem(i, { durationSec: v })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-gray-400 mb-1 uppercase font-semibold tracking-wide">Giriş anim.</label>
                <AnimSelect value={item.entryAnim} groups={ENTRY_GROUPS} onChange={v => updateItem(i, { entryAnim: v as EntryAnimType })} />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-1 uppercase font-semibold tracking-wide">Çıkış anim.</label>
                <AnimSelect value={item.exitAnim} groups={EXIT_GROUPS} onChange={v => updateItem(i, { exitAnim: v as ExitAnimType })} />
              </div>
            </div>
          </div>
        )
      })}
      <button
        onClick={addItem}
        disabled={body.length >= 10}
        className="w-full border-2 border-dashed border-indigo-200 rounded-lg py-2 text-xs text-indigo-400 hover:border-indigo-400 hover:text-indigo-600 transition-colors disabled:opacity-40"
      >
        + Yeni öğe ekle ({body.length}/10)
      </button>
    </div>
  )
}

function ProductAdForm({ values, update }: { values: Record<string, unknown>; update: (k: string, v: unknown) => void }) {
  const body = (values.body as BodyItem[]) ?? []

  return (
    <>
      {/* Title */}
      <AccordionSection title="Başlık" enabled={Boolean(values.showTitle ?? true)} onToggle={v => update('showTitle', v)} toggleTestId="toggle-title">
        <input
          placeholder="Başlık metni"
          className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
          value={String(values.title ?? '')}
          onChange={e => update('title', e.target.value)}
        />
        <div className="grid grid-cols-2 gap-2">
          <TimingRow label="Giriş (sn)" value={Number(values.titleStartSec ?? 0)} onChange={v => update('titleStartSec', v)} />
          <TimingRow label="Süre (sn)" value={Number(values.titleDurationSec ?? 10)} onChange={v => update('titleDurationSec', v)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-gray-400 mb-1 uppercase font-semibold tracking-wide">Giriş anim.</label>
            <AnimSelect value={String(values.titleEntryAnim ?? 'fade')} groups={ENTRY_GROUPS} onChange={v => update('titleEntryAnim', v)} />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1 uppercase font-semibold tracking-wide">Çıkış anim.</label>
            <AnimSelect value={String(values.titleExitAnim ?? 'fade-out')} groups={EXIT_GROUPS} onChange={v => update('titleExitAnim', v)} />
          </div>
        </div>
      </AccordionSection>

      {/* Body */}
      <AccordionSection title="Body" enabled={Boolean(values.showBody ?? true)} onToggle={v => update('showBody', v)} toggleTestId="toggle-body">
        <BodySection body={body} bodyFontSize={Number(values.bodyFontSize ?? 36)} update={update} />
      </AccordionSection>
    </>
  )
}
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit/web
npx jest --testPathPattern="ParamForm" --no-coverage
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add web/components/ParamForm.tsx
git commit -m "feat: add Body section with slot system and collision warning"
```

---

## Task 11: ParamForm — CTA Section + ColorPicker Integration

**Files:**
- Modify: `web/components/ParamForm.tsx` (add CTA section + CommonFields with ColorPicker)

- [ ] **Step 1: Add CTA accordion section and updated CommonFields**

Append to `web/components/ParamForm.tsx`:

```tsx
function CtaSection({ values, update }: { values: Record<string, unknown>; update: (k: string, v: unknown) => void }) {
  const ctaMode = String(values.ctaMode ?? 'text')

  return (
    <AccordionSection title="CTA" enabled={Boolean(values.showCta ?? true)} onToggle={v => update('showCta', v)} toggleTestId="toggle-cta">
      {/* Mod toggle */}
      <div>
        <label className="block text-[10px] text-gray-400 mb-1.5 uppercase font-semibold tracking-wide">Mod</label>
        <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
          {(['text', 'logo'] as const).map(m => (
            <button
              key={m}
              onClick={() => update('ctaMode', m)}
              className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors ${ctaMode === m ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {m === 'text' ? 'Metin' : 'Logo'}
            </button>
          ))}
        </div>
      </div>

      {ctaMode === 'text' ? (
        <>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1 uppercase font-semibold tracking-wide">CTA Metni</label>
            <input
              className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
              value={String(values.cta ?? '')}
              onChange={e => update('cta', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-2 uppercase font-semibold tracking-wide">Arka Plan Rengi</label>
            <ColorPicker
              value={String(values.ctaBgColor ?? '#e67e22')}
              opacity={Number(values.ctaOpacity ?? 100)}
              onChange={({ color, opacity }) => { update('ctaBgColor', color); update('ctaOpacity', opacity) }}
            />
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1.5 uppercase font-semibold tracking-wide">Logo Görseli</label>
            {values.ctaLogoUrl ? (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <span className="text-xs text-gray-600 flex-1 truncate">{String(values.ctaLogoUrl).split('/').pop()}</span>
                <button onClick={() => update('ctaLogoUrl', '')} className="text-xs text-gray-400 hover:text-red-500">✕ Kaldır</button>
              </div>
            ) : (
              <label className="block w-full border-2 border-dashed border-indigo-200 rounded-lg py-4 text-center cursor-pointer hover:border-indigo-400 transition-colors">
                <div className="text-xl mb-1">🖼</div>
                <div className="text-xs text-gray-400"><span className="text-indigo-500 font-semibold">Logo seç</span> (PNG, JPG, SVG, WebP)</div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const fd = new FormData()
                    fd.append('file', file)
                    const res = await fetch('/api/upload', { method: 'POST', body: fd })
                    const data = await res.json()
                    if (data.remotionUrl) update('ctaLogoUrl', data.remotionUrl)
                  }}
                />
              </label>
            )}
          </div>
          <TimingRow label="Logo Yüksekliği (px)" value={Number(values.ctaLogoHeight ?? 80)} onChange={v => update('ctaLogoHeight', v)} />
        </>
      )}

      <div className="grid grid-cols-2 gap-2">
        <TimingRow label="Giriş (sn)" value={Number(values.ctaStartSec ?? 20)} onChange={v => update('ctaStartSec', v)} />
        <TimingRow label="Süre (sn)" value={Number(values.ctaDurationSec ?? 8)} onChange={v => update('ctaDurationSec', v)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] text-gray-400 mb-1 uppercase font-semibold tracking-wide">Giriş anim.</label>
          <AnimSelect value={String(values.ctaEntryAnim ?? 'slide-up')} groups={ENTRY_GROUPS} onChange={v => update('ctaEntryAnim', v)} />
        </div>
        <div>
          <label className="block text-[10px] text-gray-400 mb-1 uppercase font-semibold tracking-wide">Çıkış anim.</label>
          <AnimSelect value={String(values.ctaExitAnim ?? 'fade-out')} groups={EXIT_GROUPS} onChange={v => update('ctaExitAnim', v)} />
        </div>
      </div>
    </AccordionSection>
  )
}

// Append CTA to ProductAdForm — add <CtaSection> after Body accordion:
// (Update ProductAdForm to also return <CtaSection values={values} update={update} />)
```

Also update `ProductAdForm` to include the CTA section — add `<CtaSection values={values} update={update} />` after the Body `AccordionSection`.

- [ ] **Step 2: Update CommonFields to use ColorPicker**

Replace the existing accent color and background color rows in `CommonFields` (keep all other common fields unchanged):

```tsx
function CommonFields({ values, update }: { values: Record<string, unknown>; update: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-3 pt-1">
      <div>
        <label className="block text-xs text-gray-500 mb-2 font-medium">Vurgu Rengi</label>
        <ColorPicker
          value={String(values.accentColor ?? '#e67e22')}
          opacity={Number(values.accentOpacity ?? 100)}
          onChange={({ color, opacity }) => { update('accentColor', color); update('accentOpacity', opacity) }}
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-2 font-medium">Arka Plan Rengi</label>
        <ColorPicker
          value={String(values.backgroundColor ?? '#1a1a2e')}
          opacity={100}
          onChange={({ color }) => update('backgroundColor', color)}
        />
      </div>
      {/* Arka plan görseli — unchanged from original */}
      <div>
        <label className="block text-xs text-gray-500 mb-1 font-medium">Arka Plan Görseli / Videosu</label>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-600 hover:border-gray-400 transition-colors">
            📁 Dosya Seç
            <input type="file" accept="image/*,video/mp4,video/webm" className="hidden"
              onChange={async e => {
                const file = e.target.files?.[0]
                if (!file) return
                const fd = new FormData()
                fd.append('file', file)
                const res = await fetch('/api/upload', { method: 'POST', body: fd })
                const data = await res.json()
                if (data.remotionUrl) update('backgroundMedia', data.remotionUrl)
              }}
            />
          </label>
          {values.backgroundMedia && (
            <>
              <span className="text-xs text-gray-400 truncate max-w-[120px]">{String(values.backgroundMedia).split('/').pop()}</span>
              <button onClick={() => update('backgroundMedia', '')} className="text-xs text-gray-400 hover:text-red-500">✕</button>
            </>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">Font</label>
          <select className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm" value={String(values.fontFamily ?? 'sans-serif')} onChange={e => update('fontFamily', e.target.value)}>
            {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">Format</label>
          <select className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm" value={String(values.format ?? '1080x1920')} onChange={e => update('format', e.target.value)}>
            {FORMATS.map(f => <option key={f} value={f}>{f === '1080x1920' ? '1080×1920 (Dikey)' : '1920×1080 (Yatay)'}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">Süre</label>
          <select className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm" value={String(values.durationSeconds ?? 30)} onChange={e => update('durationSeconds', Number(e.target.value))}>
            {DURATIONS.map(d => <option key={d} value={d}>{d} saniye</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">Başlık Boyutu</label>
          <select className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm" value={String(values.titleFontSize ?? 72)} onChange={e => update('titleFontSize', Number(e.target.value))}>
            {[36,48,60,72,96,120].map(s => <option key={s} value={s}>{s}px</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">Metin Boyutu</label>
          <select className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm" value={String(values.bodyFontSize ?? 36)} onChange={e => update('bodyFontSize', Number(e.target.value))}>
            {[18,24,32,36,48].map(s => <option key={s} value={s}>{s}px</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}

// StatsForm and TalkingHeadForm — copy unchanged from original ParamForm.tsx
// (the inner form content for Stats and TalkingHead, minus the Render button)
function StatsForm({ values, update }: { values: Record<string, unknown>; update: (k: string, v: unknown) => void }) {
  return (
    <>
      {(values.stats as { value: string; label: string }[] ?? []).map((stat, i) => (
        <div key={i} className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Değer {i + 1}</label>
            <input className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm" value={stat.value}
              onChange={e => {
                const updated = [...(values.stats as { value: string; label: string }[])]
                updated[i] = { ...updated[i], value: e.target.value }
                update('stats', updated)
              }} />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Açıklama {i + 1}</label>
            <input className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm" value={stat.label}
              onChange={e => {
                const updated = [...(values.stats as { value: string; label: string }[])]
                updated[i] = { ...updated[i], label: e.target.value }
                update('stats', updated)
              }} />
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 font-medium">Count-up animasyonu</label>
        <input type="checkbox" checked={Boolean(values.countUp)} onChange={e => update('countUp', e.target.checked)} className="rounded" />
      </div>
    </>
  )
}

function TalkingHeadForm({ values, update }: { values: Record<string, unknown>; update: (k: string, v: unknown) => void }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1 font-medium">Lower Third Metni</label>
      <input className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm" value={String(values.lowerThird ?? '')} onChange={e => update('lowerThird', e.target.value)} />
    </div>
  )
}
```

- [ ] **Step 3: Run all tests**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit/web
npx jest --no-coverage
```

Expected: All test suites pass.

- [ ] **Step 4: TypeScript check**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit/web
npx tsc --noEmit 2>&1 | head -20
```

Fix any type errors.

- [ ] **Step 5: Commit**

```bash
git add web/components/ParamForm.tsx
git commit -m "feat: add CTA logo mode, ColorPicker integration, animation dropdowns"
```

---

## Task 12: Smoke Test End-to-End

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/okilavuz/Desktop/omer_works/Video_edit/web
npm run dev 2>&1 &
sleep 3
curl -s http://localhost:3000 | grep -c "html" && echo "server OK"
```

- [ ] **Step 2: Verify no console errors on load**

Open http://localhost:3000 in browser. Verify:
- ProductAd form loads with Başlık, Body, CTA accordions
- Toggle switches show/hide sections
- Body "+ Yeni öğe ekle" button adds items
- CTA mode toggle switches between Metin/Logo
- ColorPicker opens with palette tabs and opacity slider

- [ ] **Step 3: Run a render**

In the UI, set a 5-second video, click Render Et. Verify MP4 is produced in `out/`.

- [ ] **Step 4: Final commit**

```bash
git add -A
git status  # verify no unexpected files
git commit -m "feat: complete timing & animation system — body slots, per-element timing, premium UI"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Preview 25% larger → Task 4
- ✅ Body section (renamed, max 10, slots) → Tasks 1, 6, 7, 10
- ✅ Toggle active/passive → Tasks 9, 10, 11
- ✅ Entry + exit animations per element → Tasks 1, 2, 3, 6, 7
- ✅ 18 entry + 16 exit types → Tasks 1, 2
- ✅ Premium color picker (palettes + opacity) → Task 5, 11
- ✅ CTA "renk yok" → Tasks 6, 7, 11
- ✅ CTA logo mode → Tasks 6, 7, 11
- ✅ Slot collision warning → Task 10
- ✅ Grouped animation dropdowns with optgroup → Tasks 9, 10, 11

**Type consistency check:**
- `EntryAnimType`, `ExitAnimType`, `BodyItem` defined in Task 1, used consistently in Tasks 2, 3, 6, 7, 9, 10, 11
- `getElementStyle` returns `{ style, entryProgress, exitProgress }` → used in Task 7
- `colorToCss` exported from `ColorPicker.tsx` → not used (inline rgba in ProductAd.tsx) — consistent
- `AccordionSection`, `Toggle`, `TimingRow`, `AnimSelect` defined in Task 9 → used in Tasks 10, 11
- `ENTRY_GROUPS`, `EXIT_GROUPS` defined in Task 9 → used in Tasks 10, 11
- `productAdSchema` fields in Task 6 exactly match `defaultProps` in Task 8

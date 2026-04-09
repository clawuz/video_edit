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
    default: return { opacity: p }
  }
}

export function applyExit(p: number, anim: ExitAnimType): React.CSSProperties {
  const q = 1 - p
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
    default: return { opacity: q }
  }
}

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

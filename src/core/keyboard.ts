import type { ImKey, KeyInput } from './types'

/** KeyboardEvent.code → unshifted US-QWERTY character. */
const CODE_TO_KEY: Record<string, ImKey> = {
  Backquote: '`',
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Semicolon: ';',
  Quote: "'",
  Comma: ',',
  Period: '.',
  Slash: '/',
  Space: ' ',
}

/**
 * Normalize a key event to an IM key using the PHYSICAL key position, so Caps Lock,
 * Dvorak/AZERTY OS layouts, or a stuck Shift never change what the IME sees.
 * Returns null for modifier chords and non-character keys (Backspace, Escape, arrows…).
 */
export function toImKey(input: KeyInput): ImKey | null {
  if (input.ctrlKey || input.metaKey || input.altKey) return null
  const { code } = input
  if (code.length === 4 && code.startsWith('Key')) return code[3]!.toLowerCase()
  if (code.length === 6 && code.startsWith('Digit')) return code[5]!
  return CODE_TO_KEY[code] ?? null
}

/** Does the browser report an active OS IME composition for this event? */
export function isImeComposing(e: { isComposing?: boolean; key: string; keyCode?: number }): boolean {
  return e.isComposing === true || e.key === 'Process' || e.keyCode === 229
}

export interface KeyCap {
  key: ImKey
  /** Width in key units (1 = normal key). */
  w: number
}

/** ANSI main block, used by the virtual root keyboard (digits row through bottom row). */
export const KEYBOARD_ROWS: KeyCap[][] = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='].map((key) => ({ key, w: 1 })),
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'].map((key) => ({ key, w: 1 })),
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"].map((key) => ({ key, w: 1 })),
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'].map((key) => ({ key, w: 1 })),
]

/** Horizontal stagger (in key units) of each row, like a real keyboard. */
export const KEYBOARD_ROW_OFFSETS = [0, 0.5, 0.75, 1.25]

/** Which finger (0 = left pinky … 7 = right pinky) types a key — used to tint the keyboard. */
export function fingerOf(key: ImKey): number {
  const cols: Record<string, number> = {
    '`': 0, '1': 0, q: 0, a: 0, z: 0,
    '2': 1, w: 1, s: 1, x: 1,
    '3': 2, e: 2, d: 2, c: 2,
    '4': 3, r: 3, f: 3, v: 3, '5': 3, t: 3, g: 3, b: 3,
    '6': 4, y: 4, h: 4, n: 4, '7': 4, u: 4, j: 4, m: 4,
    '8': 5, i: 5, k: 5, ',': 5,
    '9': 6, o: 6, l: 6, '.': 6,
    '0': 7, p: 7, ';': 7, '/': 7, '-': 7, '[': 7, "'": 7, '=': 7, ']': 7, '\\': 7,
  }
  return cols[key] ?? 7
}

/** Display a key for humans: letters upper-cased, space as ␣. */
export function keyDisplay(key: ImKey): string {
  if (key === ' ') return '空白'
  return /^[a-z]$/.test(key) ? key.toUpperCase() : key
}

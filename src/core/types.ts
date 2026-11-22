/**
 * 墨打 core contract.
 *
 * Everything under `src/core/` is framework-free TypeScript (no Vue imports) so it can be
 * unit-tested in Node and reused by the UI. The UI talks to the core ONLY through the
 * interfaces in this file. Do not change these shapes without updating the UI.
 */

// ───────────────────────────── Identifiers ─────────────────────────────

export type ImId = 'zhuyin' | 'boshiamy' | 'array' | 'dayi' | 'cangjie'

export const IM_IDS: readonly ImId[] = ['zhuyin', 'boshiamy', 'array', 'dayi', 'cangjie']

/**
 * A physical key in IM space: the character the key produces **unshifted on a US QWERTY
 * layout**, e.g. `a`, `1`, `,`, `;`, `'`, `[`, `/`, `-`. Space is `' '`.
 * Derived from `KeyboardEvent.code` (see `keyboard.ts`), so Caps Lock and the OS layout
 * never matter.
 */
export type ImKey = string

/** Minimal, DOM-free view of a KeyboardEvent (so the core is testable in Node). */
export interface KeyInput {
  code: string // KeyboardEvent.code, e.g. 'KeyA', 'Digit1', 'Comma', 'Space', 'Backspace'
  key: string // KeyboardEvent.key
  shiftKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
}

// ───────────────────────────── Static data files ─────────────────────────────

/** `public/data/im/<id>.json` */
export interface ImTableFile {
  meta: ImMeta
  /** key → label shown in the preedit/composition bar (e.g. cangjie 'a' → '日', zhuyin '1' → 'ㄅ'). */
  keynames: Record<ImKey, string>
  /** code (lower-case IM keys, no commit key) → candidates in real IME order. */
  table: Record<string, string[]>
  /**
   * Quick codes that are chosen ONLY with a selection key (行列 一級／二級簡碼: 1–2 keys, then a
   * digit). Slot order matters; '' marks an empty slot.
   */
  shortcodes?: Record<string, string[]>
}

export interface ImMeta {
  id: ImId
  name: string // '嘸蝦米'
  shortName: string // '嘸' — one glyph, used in compact UI
  version: string // '倉頡三代', '大易三碼', '行列30', 'liu57', '大千'
  maxCodeLength: number
  /** Keys that select candidates, in order (index 0 = first candidate). */
  selKeys: string
  /** Labels displayed next to candidates, same length/order as selKeys. */
  selLabels: string
  /** Keys that end composition and commit (besides selKeys). Usually ' ' ; zhuyin: ' 3467'. */
  commitKeys: string
  /** One-line taking rule (取碼規則), e.g. '取首、次、三、尾，最多四碼'. */
  rule: string
  source: string // human-readable source + URL
  license: string
}

/** `public/data/roots/<id>.json` */
export interface RootsFile {
  im: ImId
  keys: RootKey[]
  groups?: RootGroup[]
  rules: RuleSection[]
}

export interface RootKey {
  key: ImKey
  /** Main label printed on the key cap ('日', 'ㄇ', 'A', '1^'). */
  label: string
  /** Every root (incl. variants / auxiliary shapes) assigned to this key. */
  roots: string[]
  category?: string
  /** WHY these roots live on this key (形音義 / 哲理類 / 行列位置 …), Traditional Chinese. */
  mnemonic?: string
  note?: string
  /** 嘸蝦米 簡速字根: whole characters that act as one root on this key (e.g. 對、俞 on A). */
  shortcutRoots?: string[]
}

export interface RootGroup {
  name: string
  keys: ImKey[]
  note?: string
}

export interface RuleSection {
  title: string
  body: string
  examples?: { char: string; code: string; explain: string }[]
}

/** `public/data/decomp/<id>.json` : char → verified decompositions (one per code). */
export type DecompFile = Record<string, DecompEntry[]>

export interface DecompEntry {
  code: string
  /** Ideographic Description Sequence of the char, if known (e.g. '⿰日月'). */
  ids?: string
  /** All roots in writing order; root defaults to component. group names an expanded component. */
  parts: { component: string; root?: string; key: ImKey; group?: string }[]
  /** Indexes into `parts` that are actually taken into the code (取碼). */
  picked: number[]
  /** Role of each picked part, same length as `picked` ('首','次','三','尾','字首','字身',…). */
  roles: string[]
  /** Optional authored lines; compact generated files use the shared text generator. */
  explanation?: string[]
}

/** `public/data/articles/index.json` is ArticleMeta[]; `<id>.json` is Article. */
export type ArticleCategory = '古文' | '詩詞' | '近代散文' | '法規公文' | '原創' | '匯入'

export interface ArticleMeta {
  id: string
  title: string
  author: string
  era?: string
  category: ArticleCategory
  excerpt: boolean // 節選
  source: string
  license: string
  /** Number of CJK characters that must be typed. */
  length: number
  /** 1 (easy) … 5 (hard): from char frequency + average code length. */
  difficulty: 1 | 2 | 3 | 4 | 5
  /** First ~40 chars, for previews. */
  preview: string
}

export interface Article extends ArticleMeta {
  text: string
}

// ───────────────────────────── Input method runtime ─────────────────────────────

export interface InputMethod {
  readonly id: ImId
  readonly meta: ImMeta
  readonly keys: RootKey[]
  readonly roots: RootsFile

  /** Create a fresh composition state machine (one per typing session). */
  createComposer(): Composer

  /** Preedit display for a raw key buffer ('ab' → '日月'). */
  preedit(buffer: string): PreeditPart[]

  /** Candidates for a full code, in real IME order. Empty array = no such code. */
  candidates(code: string): string[]

  /**
   * Every way to type `char`, best first. `ctx` lets zhuyin pick the contextual reading
   * of a heteronym (the reading for this occurrence comes first).
   */
  codesFor(char: string, ctx?: ReadingCtx): CodeOption[]

  /** Build the hint card (字根卡) for `char`. Must never throw; fall back gracefully. */
  explain(char: string, ctx?: ReadingCtx): HintCard

  /**
   * Optional: per-index expected code for a whole text (zhuyin uses its phrase dictionary
   * to resolve heteronyms). Returned array has the same length as `[...text]`.
   */
  annotate?(text: string): (string | undefined)[]
}

export interface PreeditPart {
  key: ImKey
  label: string
}

export interface ReadingCtx {
  /** Full text and the index (in code points) of the char being typed. */
  text: string
  index: number
  /** Precomputed expected code from `annotate()`, if any. */
  expected?: string
}

export interface CodeOption {
  /** IM keys without the commit key, e.g. 'due'. */
  code: string
  /** Index of the char among the candidates of `code` (0 = first). */
  selection: number
  /**
   * Key that finalizes the commit when it is NOT Space (selKeys[selection]). Undefined means
   * "press Space". Usually set only when selection > 0, but 行列簡碼 need a digit even for slot 0.
   */
  selectionKey?: string
  /** Shortest way overall (最簡碼 / 簡速). */
  isShortest: boolean
  /** e.g. ['簡碼'], ['完整碼'], ['需選字'], ['特別碼'], ['破音:ㄏㄤˊ']. */
  tags: string[]
}

// ───────────────────────────── Composer (IME state machine) ─────────────────────────────

export interface ComposerState {
  /** Raw IM keys typed so far (lower-case), e.g. 'du'. */
  buffer: string
  preedit: PreeditPart[]
  /** Candidates for the current buffer (may be prefix matches for display; may be empty). */
  candidates: string[]
  /** Whether the candidates are exact matches of `buffer` (selection keys are live). */
  exact: boolean
}

export type ComposeResult =
  /** Key not handled by the IME (caller may treat as punctuation / skip key). */
  | { type: 'ignored' }
  /** Buffer / preedit / candidates changed. */
  | { type: 'update' }
  /** User committed. `index` = chosen candidate, or -1 for smart selection (zhuyin). */
  | { type: 'commit'; code: string; candidates: string[]; index: number; commitKey: ImKey }
  /** Commit attempted but `code` has no candidates. */
  | { type: 'invalid'; code: string; commitKey: ImKey }

export interface Composer {
  readonly state: ComposerState
  /** `key` is already normalized by `toImKey`; `input` is passed for modifiers / Backspace / Escape. */
  handle(key: ImKey | null, input: KeyInput): ComposeResult
  reset(): void
}

// ───────────────────────────── Hint card (字根卡) ─────────────────────────────

export interface HintKey {
  /** 嘸蝦米 簡速字根 on this key (whole characters used as one root). */
  shortcutRoots?: string[]
  key: ImKey
  /** Label shown on the key cap for this IM ('日', 'D', 'ㄉ', '1^'). */
  label: string
  /** Root(s) on this key, for the "this key holds…" tooltip. */
  roots: string[]
  /** Stable color slot 0..5 so parts and keys share a color. */
  color: number
}

export interface HintOption extends CodeOption {
  keys: HintKey[]
}

export interface HintCard {
  char: string
  im: ImId
  /** Contextual bopomofo reading, e.g. 'ㄅㄥ' (shown for every IM). */
  reading?: string
  /** Best option first. */
  options: HintOption[]
  decomposition?: {
    /** The code this decomposition explains (may be the full code while options[0] is a 簡碼). */
    code?: string
    ids?: string
    parts: { component: string; root: string; key: ImKey; picked: boolean; role?: string; color: number; group?: string }[]
    /** true = machine-verified against the real table; false = heuristic ("參考"). */
    verified: boolean
    explanation: string[]
  }
  /** General taking rule for this IM. */
  rule: string
  /** Memory aids for the keys involved. */
  mnemonics: { key: ImKey; label: string; text: string }[]
  /** Chars sharing the primary code (同碼字), so users learn to pick correctly. */
  confusables: string[]
}

// ───────────────────────────── Typing session ─────────────────────────────

export type PunctMode = 'skip' | 'any-key' | 'ime'

export type CharKind = 'cjk' | 'punct' | 'space' | 'newline' | 'latin'

export type CharStatus = 'pending' | 'current' | 'done' | 'skipped'

export interface CharCell {
  index: number
  char: string
  kind: CharKind
  status: CharStatus
  /** Wrong commits on this char. */
  errors: number
  /** Whether the hint card was shown for this char. */
  hinted: boolean
  /** ms timestamp (relative to session start) when completed. */
  doneAt?: number
  /** Expected code from annotate() (zhuyin reading), if any. */
  expected?: string
}

export interface SessionOptions {
  im: InputMethod
  text: string
  punctMode: PunctMode
  /** Show the hint card after this many wrong commits on the same char (default 3). */
  hintThreshold: number
  /** Allow hints at all (test mode may disable). */
  hintsEnabled: boolean
  /** Optional time limit (test mode). */
  timeLimitMs?: number
  /**
   * Wrap the mutable state so the UI can observe it (the UI passes Vue's `reactive`).
   * The session MUST mutate state only through the returned object.
   */
  wrap?: <T extends object>(state: T) => T
}

export interface SessionState {
  cells: CharCell[]
  /** Index of the current cell (cells.length when finished). */
  cursor: number
  composer: ComposerState
  /** Whether the hint card is currently open, and for which cell. */
  hint: { open: boolean; cellIndex: number; card?: HintCard; reason?: 'errors' | 'peek' }
  /** ms since epoch; undefined until the first key. */
  startedAt?: number
  finishedAt?: number
  paused: boolean
  stats: LiveStats
  /** Key presses that produced an error, for the keyboard heat map: key → count. */
  errorKeys: Record<ImKey, number>
  /** Timeline samples (every completed char) for the speed chart. */
  timeline: { t: number; done: number; errors: number }[]
}

export interface LiveStats {
  /** CJK chars completed correctly. */
  done: number
  /** Total CJK chars to type. */
  total: number
  /** Wrong commits. */
  errors: number
  /** Chars that needed the hint card. */
  hinted: number
  /** 字/分 = done / minutes elapsed. */
  cpm: number
  /** done / (done + errors), 0..1 (1 when nothing typed). */
  accuracy: number
  combo: number
  maxCombo: number
  elapsedMs: number
}

export type SessionEvent =
  | { type: 'start' }
  | { type: 'correct'; cellIndex: number; char: string }
  | { type: 'error'; cellIndex: number; expected: string; got: string; code: string }
  | { type: 'hint'; cellIndex: number; reason: 'errors' | 'peek' }
  | { type: 'skip'; cellIndex: number }
  | { type: 'finish' }

export interface TypingSessionApi {
  readonly state: SessionState
  /** Feed one key event. `now` = performance-like ms timestamp. Returns emitted events. */
  handle(input: KeyInput, now: number): SessionEvent[]
  /** Open the hint card for the current char (counts as a peek). */
  peekHint(now: number): SessionEvent[]
  closeHint(): void
  pause(now: number): void
  resume(now: number): void
  /** Called by a timer in test mode; finishes the session when the time limit passes. */
  tick(now: number): SessionEvent[]
  /** Final result (valid after finish, or at any time as a partial result). */
  result(): SessionResult
}

export interface SessionResult {
  im: ImId
  articleId?: string
  durationMs: number
  done: number
  total: number
  errors: number
  hinted: number
  cpm: number
  accuracy: number
  maxCombo: number
  /** char → wrong commits, for the weak-char list. */
  weakChars: Record<string, number>
  errorKeys: Record<ImKey, number>
  timeline: { t: number; done: number; errors: number }[]
}

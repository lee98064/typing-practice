import { defineStore } from 'pinia'
import { computed, reactive, ref, shallowRef } from 'vue'
import type { KeyInput, SessionEvent, SessionState } from '@/core/types'
import { TypingSession } from '@/core/session'
import { isImeComposing, toImKey } from '@/core/keyboard'
import type { HistoryRecord } from '@/lib/db'
import { useSettings } from './settings'
import { useImStore } from './im'
import { useLibrary } from './library'
import { useHistory } from './history'

export type Mode = 'practice' | 'test'

/** Pulse objects let components replay CSS animations on every event (seq changes). */
export interface Pulse {
  seq: number
  cell: number
}

function toInput(e: KeyboardEvent): KeyInput {
  return {
    code: e.code,
    key: e.key,
    shiftKey: e.shiftKey,
    ctrlKey: e.ctrlKey,
    metaKey: e.metaKey,
    altKey: e.altKey,
  }
}

export const useSession = defineStore('session', () => {
  const settings = useSettings()
  const ims = useImStore()
  const lib = useLibrary()
  const history = useHistory()

  const mode = ref<Mode>('practice')
  const session = shallowRef<TypingSession | null>(null)
  const state = computed<SessionState | null>(() => session.value?.state ?? null)
  const result = shallowRef<HistoryRecord | null>(null)
  const imeWarning = ref(false)
  const errorPulse = reactive<Pulse>({ seq: 0, cell: -1 })
  const correctPulse = reactive<Pulse>({ seq: 0, cell: -1 })
  const pressedKey = reactive({ key: '', seq: 0, wrong: false })
  /** Test mode: true once the user pressed "開始" and the countdown ended. */
  const armed = ref(true)
  let timer: ReturnType<typeof setInterval> | null = null

  const started = computed(() => state.value?.startedAt !== undefined)
  const finished = computed(() => state.value?.finishedAt !== undefined)

  function stopTimer() {
    if (timer) clearInterval(timer)
    timer = null
  }

  function startTimer() {
    if (timer) return
    timer = setInterval(() => {
      const s = session.value
      if (!s) return stopTimer()
      apply(s.tick(Date.now()))
    }, 200)
  }

  /** (Re)build the session from the active IM + article. */
  function reset() {
    stopTimer()
    result.value = null
    imeWarning.value = false
    const im = ims.current
    const art = lib.current
    if (!im || !art) {
      session.value = null
      return
    }
    const isTest = mode.value === 'test'
    session.value = new TypingSession({
      im,
      text: art.text,
      punctMode: settings.punctMode,
      hintThreshold: settings.hintThreshold,
      hintsEnabled: !isTest || settings.testHints,
      timeLimitMs: isTest && settings.testMinutes > 0 ? settings.testMinutes * 60_000 : undefined,
      wrap: <T extends object>(s: T) => reactive(s) as T,
    })
    armed.value = !isTest
  }

  function apply(events: SessionEvent[]) {
    for (const ev of events) {
      if (ev.type === 'start') startTimer()
      else if (ev.type === 'error') {
        errorPulse.cell = ev.cellIndex
        errorPulse.seq++
        pressedKey.wrong = true
      } else if (ev.type === 'correct') {
        correctPulse.cell = ev.cellIndex
        correctPulse.seq++
      } else if (ev.type === 'finish') void finish()
    }
  }

  async function finish() {
    stopTimer()
    const s = session.value
    const art = lib.current
    if (!s || !art) return
    const r = s.result()
    const rec: HistoryRecord = {
      ...r,
      articleId: art.id.startsWith('virtual-') ? undefined : art.id,
      articleTitle: art.title,
      mode: mode.value,
      at: Date.now(),
    }
    result.value = r.done > 0 ? await history.add(rec) : rec
  }

  /** Returns true when the event was consumed by the typing engine. */
  function handleKeydown(e: KeyboardEvent): boolean {
    if (isImeComposing(e) || (e.key.length === 1 && /[^\x00-\x7f]/.test(e.key) && !e.ctrlKey && !e.metaKey)) {
      imeWarning.value = true
      return false
    }
    const s = session.value
    if (!s || !armed.value || result.value) return false
    if (e.ctrlKey || e.metaKey || e.altKey) return false
    if (imeWarning.value) imeWarning.value = false
    const k = toImKey(toInput(e))
    if (k !== null && k !== ' ') {
      pressedKey.key = k
      pressedKey.wrong = false
      pressedKey.seq++
    }
    const events = s.handle(toInput(e), Date.now())
    apply(events)
    // Swallow everything typing-related so the page never scrolls on space etc.
    return k !== null || e.key === 'Backspace' || e.key === 'Escape' || e.key === 'Enter' || e.key === 'Tab'
  }

  function peekHint() {
    const s = session.value
    if (!s) return
    if (s.state.hint.open) s.closeHint()
    else apply(s.peekHint(Date.now()))
  }

  function togglePause() {
    const s = session.value
    if (!s || !started.value || finished.value) return
    if (s.state.paused) {
      s.resume(Date.now())
      startTimer()
    } else {
      s.pause(Date.now())
      stopTimer()
    }
  }

  function arm() {
    armed.value = true
  }

  return {
    mode,
    session,
    state,
    result,
    imeWarning,
    errorPulse,
    correctPulse,
    pressedKey,
    armed,
    started,
    finished,
    reset,
    handleKeydown,
    peekHint,
    togglePause,
    arm,
    stopTimer,
  }
})

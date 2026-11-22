<script setup lang="ts">
/**
 * The typing stage: article scroll + in-page IME + stats + root keyboard + 字根卡 drawer.
 * Captures keys through a hidden <textarea> so OS-IME composition can be detected.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useEventListener, useMediaQuery, useResizeObserver } from '@vueuse/core'
import { RotateCcw, BookOpen, Keyboard, Pause, Play } from 'lucide-vue-next'
import ArticleScroll from './ArticleScroll.vue'
import ImePopover from './ImePopover.vue'
import StatsBar from './StatsBar.vue'
import RootKeyboard from './RootKeyboard.vue'
import HintCard from './HintCard.vue'
import ImeWarning from './ImeWarning.vue'
import { useSession } from '@/stores/session'
import { useSettings } from '@/stores/settings'
import { useImStore } from '@/stores/im'
import { useLibrary } from '@/stores/library'
import type { ImKey } from '@/core/types'

const props = defineProps<{ locked?: boolean }>()

const session = useSession()
const settings = useSettings()
const ims = useImStore()
const lib = useLibrary()
const router = useRouter()

const sink = ref<HTMLTextAreaElement | null>(null)
const scrollWrap = ref<HTMLElement | null>(null)
const focused = ref(false)
const caret = ref({ x: 0, y: 0, w: 0, h: 0 })
const frameWidth = ref(600)
const wide = useMediaQuery('(min-width: 900px)')
const coarse = useMediaQuery('(pointer: coarse)')
const sawKey = ref(false)

useResizeObserver(scrollWrap, (e) => (frameWidth.value = e[0]?.contentRect.width ?? 600))

const st = computed(() => session.state)
const im = computed(() => ims.current)
const art = computed(() => lib.current)
const isTest = computed(() => session.mode === 'test')
const fontSize = computed(() => ({ s: 24, m: 29, l: 35 })[settings.textSize])

const currentCell = computed(() => {
  const s = st.value
  return s && s.cursor < s.cells.length ? s.cells[s.cursor] : undefined
})

const hintOpen = computed(() => !!st.value?.hint.open && !!st.value.hint.card)

const progress = computed(() => {
  const s = st.value
  if (!s || !s.stats.total) return 0
  return s.stats.done / s.stats.total
})

/** Which keys should glow on the root keyboard. */
const nextKeys = computed<ImKey[]>(() => {
  const s = st.value
  const cell = currentCell.value
  const method = im.value
  if (!s || !cell || !method || s.paused) return []
  if (isTest.value && !settings.testHints) return []
  if (settings.keyboardHint === 'never') return []
  if (settings.keyboardHint === 'after-error' && cell.errors === 0 && !s.hint.open) return []
  if (cell.kind !== 'cjk' && !(settings.punctMode === 'ime' && cell.kind === 'punct')) return []
  const buf = s.composer.buffer
  const opts = method.codesFor(cell.char, { text: art.value?.text ?? '', index: cell.index, expected: cell.expected })
  for (const o of opts) {
    if (!o.code.startsWith(buf)) continue
    if (o.code.length > buf.length) return [o.code[buf.length]!]
    return [o.selectionKey ?? ' ']
  }
  return []
})

const keyColors = computed<Record<ImKey, number>>(() => {
  const card = st.value?.hint.open ? st.value.hint.card : undefined
  const keys = card?.options[0]?.keys ?? []
  return Object.fromEntries(keys.map((k) => [k.key, k.color]))
})

function focusSink() {
  if (props.locked) return
  sink.value?.focus({ preventScroll: true })
}

function onKeydown(e: KeyboardEvent) {
  sawKey.value = true
  // App shortcuts first
  if ((e.ctrlKey || e.metaKey) && e.key === '/') {
    e.preventDefault()
    if (!isTest.value || settings.testHints) session.peekHint()
    return
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    void router.push('/library')
    return
  }
  if (e.key === 'Escape' && !st.value?.composer.buffer) {
    e.preventDefault()
    if (st.value?.hint.open) session.session?.closeHint()
    else session.togglePause()
    return
  }
  if (st.value?.paused) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      session.togglePause()
    }
    return
  }
  if (session.handleKeydown(e)) e.preventDefault()
}

function onComposition() {
  session.imeWarning = true
}

function onInput() {
  if (sink.value) sink.value.value = ''
}

// Typing anywhere on the page focuses the sink (unless the user is in a real field).
useEventListener(window, 'keydown', (e: KeyboardEvent) => {
  if (props.locked || document.activeElement === sink.value) return
  const t = e.target as HTMLElement | null
  if (t && (t.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]'))) return
  if (e.ctrlKey || e.metaKey || e.altKey || e.key === 'Tab') return
  focusSink()
  onKeydown(e)
})

function restart() {
  session.reset()
  nextTick(focusSink)
}

watch(
  () => props.locked,
  (l) => {
    if (!l) nextTick(focusSink)
  },
)

onMounted(() => nextTick(focusSink))
onBeforeUnmount(() => session.stopTimer())

const veil = computed(() => !focused.value && !props.locked && !session.imeWarning && !st.value?.paused && !session.result)
</script>

<template>
  <section class="stage" :class="{ 'hint-open': hintOpen && wide }" :style="{ '--fs': `${fontSize}px` }">
    <div class="main-col">
      <div class="paper">
        <header class="art-head">
          <div class="art-title">
            <span v-if="art" class="chip">{{ art.category }}</span>
            <h2 v-if="art" class="serif">{{ art.title }}</h2>
            <span v-if="art" class="author">{{ art.author }}<template v-if="art.era"> · {{ art.era }}</template></span>
          </div>
          <StatsBar v-if="st" :stats="st.stats" :time-limit-ms="isTest && settings.testMinutes > 0 ? settings.testMinutes * 60000 : undefined" />
        </header>
        <div class="progress" aria-hidden="true">
          <span :style="{ transform: `scaleX(${progress})` }" />
        </div>

        <div ref="scrollWrap" class="scroll-wrap" @mousedown.prevent="focusSink">
          <ArticleScroll
            v-if="st"
            :cells="st.cells"
            :cursor="st.cursor"
            :error-pulse="session.errorPulse"
            :correct-pulse="session.correctPulse"
            :lines="wide ? 5 : 4"
            :blurred="veil || st.paused || !!locked"
            @caret="caret = $event"
          />
          <div v-else class="loading serif">
            <span v-if="ims.error">{{ ims.error }}</span>
            <span v-else-if="lib.loadError">{{ lib.loadError }}</span>
            <span v-else>研墨中…</span>
          </div>
          <ImePopover
            v-if="st && im"
            :composer="st.composer"
            :meta="im.meta"
            :caret="caret"
            :frame-width="frameWidth"
            :im-id="im.id"
          />

          <Transition name="fade">
            <button v-if="veil && st" class="veil" @click="focusSink">
              <Keyboard :size="18" />
              <span v-if="coarse && !sawKey">需要實體鍵盤才能練習；可以先到「字根」頁查碼</span>
              <span v-else>點一下或直接按鍵開始</span>
            </button>
          </Transition>
          <Transition name="fade">
            <div v-if="st?.paused" class="overlay">
              <div class="pause card">
                <h3>暫停中</h3>
                <p class="muted">計時已停止</p>
                <div class="row">
                  <button class="btn btn-ink" @click="session.togglePause(); focusSink()"><Play :size="16" /> 繼續</button>
                  <button class="btn btn-ghost" @click="restart"><RotateCcw :size="16" /> 重新開始</button>
                  <button class="btn btn-ghost" @click="router.push('/library')"><BookOpen :size="16" /> 換文章</button>
                </div>
              </div>
            </div>
          </Transition>
          <Transition name="fade">
            <div v-if="session.imeWarning" class="overlay">
              <ImeWarning @dismiss="session.imeWarning = false; focusSink()" />
            </div>
          </Transition>
          <slot name="overlay" />
        </div>

        <footer class="foot">
          <div class="shortcuts">
            <span><span class="kbd">Esc</span> 暫停</span>
            <span v-if="!isTest || settings.testHints"><span class="kbd">Ctrl</span><span class="kbd">/</span> 看提示</span>
            <span><span class="kbd">Ctrl</span><span class="kbd">K</span> 文章庫</span>
          </div>
          <div class="actions">
            <button v-if="session.started && !session.finished" class="btn btn-ghost btn-sm" @click="session.togglePause()">
              <Pause :size="15" /> 暫停
            </button>
            <button class="btn btn-ghost btn-sm" @click="restart"><RotateCcw :size="15" /> 重來</button>
            <button class="btn btn-ghost btn-sm" @click="router.push('/library')"><BookOpen :size="15" /> 換文章</button>
          </div>
        </footer>
      </div>

      <Transition name="kb">
        <div v-if="settings.showKeyboard && im" class="kb-wrap">
          <RootKeyboard
            :keys="im.keys"
            :next="nextKeys"
            :colors="keyColors"
            :pressed="session.pressedKey"
          />
        </div>
      </Transition>
    </div>

    <Transition name="drawer">
      <aside v-if="hintOpen && st?.hint.card" class="hint-col" :class="{ sheet: !wide }">
        <HintCard
          :card="st.hint.card"
          :errors="st.cells[st.hint.cellIndex]?.errors"
          :reason="st.hint.reason"
          closable
          :dense="!wide"
          @close="session.session?.closeHint(); focusSink()"
        />
      </aside>
    </Transition>

    <textarea
      ref="sink"
      class="sink"
      aria-label="打字輸入區"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
      @keydown="onKeydown"
      @compositionstart="onComposition"
      @input="onInput"
      @focus="focused = true"
      @blur="focused = false"
    />
  </section>
</template>

<style scoped>
.stage {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 0;
  gap: 0;
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  transition: grid-template-columns var(--t-slow) var(--ease-out), gap var(--t-slow) var(--ease-out);
}
.stage.hint-open {
  grid-template-columns: minmax(0, 1fr) clamp(300px, 30vw, 400px);
  gap: clamp(14px, 2vw, 24px);
}
.main-col {
  display: flex;
  flex-direction: column;
  gap: 22px;
  min-width: 0;
}
.paper {
  position: relative;
  padding: 22px 34px 14px;
  border-radius: var(--r-xl);
  background: var(--paper-card);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-2);
  overflow: hidden;
  isolation: isolate;
}
.paper::before {
  /* faint vertical ruling like 稿紙 — static, no mask (masks force re-raster on every keystroke) */
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: repeating-linear-gradient(90deg, transparent 0 calc(var(--fs) * 1.08 - 1px), var(--line) calc(var(--fs) * 1.08 - 1px) calc(var(--fs) * 1.08));
  opacity: 0.18;
}
.art-head {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}
.art-title {
  display: flex;
  align-items: baseline;
  gap: 12px;
  min-width: 0;
  flex-wrap: wrap;
}
.art-title .chip {
  align-self: center;
}
.art-title h2 {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.author {
  font-size: 13px;
  color: var(--ink-3);
  letter-spacing: 0.12em;
}
.progress {
  position: relative;
  height: 2px;
  margin: 14px 0 6px;
  background: var(--line);
  border-radius: 2px;
  overflow: hidden;
}
.progress span {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, var(--ink-2), var(--ink));
  transform-origin: left;
  transition: transform 400ms var(--ease-out);
  will-change: transform;
}
.scroll-wrap {
  position: relative;
  cursor: text;
}
.loading {
  display: grid;
  place-items: center;
  height: calc(var(--fs) * 2.15 * 4);
  font-size: 20px;
  color: var(--ink-3);
  letter-spacing: 0.3em;
}
.veil {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 22px;
  border-radius: 999px;
  background: var(--ink);
  color: var(--paper);
  font-size: 14px;
  letter-spacing: 0.1em;
  box-shadow: var(--shadow-3);
  max-width: calc(100% - 32px);
}
.overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  z-index: 6;
}
.pause {
  padding: 24px 28px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: var(--shadow-3);
}
.pause .row {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
  justify-content: center;
}
.foot {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
  padding-top: 12px;
  border-top: 1px dashed var(--line-strong);
  flex-wrap: wrap;
}
.shortcuts {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--ink-3);
  letter-spacing: 0.08em;
}
.shortcuts > span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.actions {
  display: flex;
  gap: 6px;
}
.kb-wrap {
  max-width: 920px;
  width: 100%;
  margin: 0 auto;
  padding: 0 8px;
}
.hint-col {
  position: sticky;
  top: 88px;
  align-self: start;
  max-height: calc(100dvh - 108px);
  overflow-y: auto;
  border-radius: var(--r-xl);
  background: var(--paper-card);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-3);
  min-width: 0;
}
.hint-col.sheet {
  position: fixed;
  top: auto;
  left: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 40;
  max-height: 48dvh;
}
.sink {
  position: fixed;
  left: -9999px;
  top: 0;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}
.drawer-enter-active {
  transition: clip-path 520ms var(--ease-ink), opacity 300ms ease, transform 520ms var(--ease-out);
}
.drawer-leave-active {
  transition: clip-path 260ms ease, opacity 200ms ease;
}
.drawer-enter-from {
  clip-path: circle(0% at 0% 0%);
  opacity: 0;
  transform: translateX(12px);
}
.drawer-enter-to {
  clip-path: circle(150% at 0% 0%);
}
.drawer-leave-to {
  opacity: 0;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.kb-enter-active,
.kb-leave-active {
  transition: opacity 240ms ease, transform 240ms var(--ease-out);
}
.kb-enter-from,
.kb-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
@media (max-width: 760px) {
  .paper {
    padding: 16px 16px 12px;
    border-radius: var(--r-lg);
  }
  .art-title h2 {
    font-size: 19px;
  }
  .shortcuts {
    display: none;
  }
}
</style>

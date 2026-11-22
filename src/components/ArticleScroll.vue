<script setup lang="ts">
/**
 * 卷軸 — renders the article as ink on paper and keeps the current line in view.
 *
 * Performance notes (typing must feel instant, also on long articles):
 *  - Cells are plain inline spans with `v-memo`, so a keystroke re-renders only changed cells.
 *  - The caret / halo is ONE absolutely positioned element moved with `transform` and blinking
 *    with `opacity` on its own compositor layer — no per-frame repaint of the text.
 *  - No mask-image on the text layer (fades are separate static overlays).
 *  - Layout is read once per cursor move.
 */
import { nextTick, onMounted, ref, watch } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import type { CharCell } from '@/core/types'
import type { Pulse } from '@/stores/session'

const props = defineProps<{
  cells: CharCell[]
  cursor: number
  errorPulse: Pulse
  correctPulse: Pulse
  lines?: number
  blurred?: boolean
}>()

const emit = defineEmits<{ caret: [rect: { x: number; y: number; w: number; h: number }] }>()

const frame = ref<HTMLElement | null>(null)
const flow = ref<HTMLElement | null>(null)
const shaker = ref<HTMLElement | null>(null)
const offset = ref(0)
const caret = ref({ x: 0, y: 0, w: 0, h: 0, visible: false })
const errIndex = ref(-1)
let lineH = 0
let errTimer: ReturnType<typeof setTimeout> | null = null

function cellEl(i: number): HTMLElement | null {
  return flow.value?.querySelector<HTMLElement>(`[data-i="${i}"]`) ?? null
}

function measureLine() {
  if (flow.value) lineH = parseFloat(getComputedStyle(flow.value).lineHeight) || 48
}

/** Keep the current line as the 2nd visible line; move the caret; emit caret position. */
function follow() {
  const finished = props.cursor >= props.cells.length
  const el = cellEl(Math.min(props.cursor, props.cells.length))
  if (!el) return
  if (!lineH) measureLine()
  const top = el.offsetTop
  const left = el.offsetLeft
  const w = el.offsetWidth
  const h = el.offsetHeight
  offset.value = Math.max(0, top - lineH)
  caret.value = { x: left, y: top, w, h, visible: !finished }
  emit('caret', { x: left, y: top - offset.value, w, h })
}

watch(() => props.cursor, () => nextTick(follow))
watch(() => props.cells, () => nextTick(follow))
onMounted(() => nextTick(() => {
  measureLine()
  follow()
}))
useResizeObserver(frame, () => {
  measureLine()
  follow()
})

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

watch(
  () => props.errorPulse.seq,
  () => {
    errIndex.value = props.errorPulse.cell
    if (errTimer) clearTimeout(errTimer)
    errTimer = setTimeout(() => (errIndex.value = -1), 360)
    if (!reduced()) {
      shaker.value?.animate(
        [
          { transform: 'translateX(0)' },
          { transform: 'translateX(-5px)' },
          { transform: 'translateX(4px)' },
          { transform: 'translateX(-2px)' },
          { transform: 'translateX(0)' },
        ],
        { duration: 260, easing: 'ease-out' },
      )
    }
  },
)
</script>

<template>
  <div ref="frame" class="frame" :class="{ blurred }" :style="{ '--lines': lines ?? 5 }">
    <div ref="flow" class="flow serif" :style="{ transform: `translate3d(0, ${-offset}px, 0)` }">
      <span
        v-show="caret.visible"
        class="caret"
        aria-hidden="true"
        :style="{ transform: `translate3d(${caret.x}px, ${caret.y}px, 0)`, width: `${caret.w}px`, height: `${caret.h}px` }"
      >
        <span ref="shaker" class="caret-inner" :class="{ err: errIndex >= 0 }">
          <span class="halo" />
          <span class="stroke" />
        </span>
      </span>
      <!-- v-memo must sit on the v-for element itself, otherwise all cells share one cache slot -->
      <span
        v-for="c in cells"
        :key="c.index"
        v-memo="[c.status, c.errors > 0, c.hinted, c.index === errIndex]"
        :data-i="c.index"
        class="ch"
        :class="[
          c.kind,
          c.status,
          c.status === 'done' && c.errors > 0 ? 'flawed' : '',
          c.hinted ? 'hinted' : '',
          c.index === errIndex ? 'err' : '',
        ]"
      >{{ c.kind === 'space' ? '\u2002' : c.kind === 'newline' ? '' : c.char }}</span>
      <span class="end" :data-i="cells.length" aria-hidden="true" />
    </div>
    <span class="fade top" aria-hidden="true" />
    <span class="fade bottom" aria-hidden="true" />
  </div>
</template>

<style scoped>
.frame {
  --lh: calc(var(--fs) * 2.15);
  position: relative;
  height: calc(var(--lh) * var(--lines));
  overflow: hidden;
  contain: layout paint;
  transition: filter var(--t-med), opacity var(--t-med);
}
.frame.blurred {
  filter: blur(5px);
  opacity: 0.55;
}
.fade {
  position: absolute;
  left: 0;
  right: 0;
  pointer-events: none;
  z-index: 2;
}
.fade.top {
  top: 0;
  height: calc(var(--lh) * 0.55);
  background: linear-gradient(to bottom, var(--paper-card), transparent);
}
.fade.bottom {
  bottom: 0;
  height: calc(var(--lh) * 1.1);
  background: linear-gradient(to top, var(--paper-card), transparent);
}
.flow {
  position: relative;
  font-size: var(--fs);
  line-height: var(--lh);
  letter-spacing: 0.08em;
  text-align: justify;
  text-justify: inter-character;
  line-break: strict;
  word-break: normal;
  overflow-wrap: anywhere;
  color: var(--ink-3);
  transition: transform 340ms var(--ease-out);
  will-change: transform;
  padding-top: calc(var(--lh) * 0.5);
}
.ch {
  /* inline (not inline-block) so the browser applies CJK line-breaking rules (禁則) */
  position: relative;
}
.ch.newline {
  display: block; /* empty block = paragraph break */
}
.ch.done {
  color: var(--ink);
}
.ch.skipped {
  color: var(--ink-2);
}
.ch.pending.punct,
.ch.pending.latin {
  color: var(--ink-4);
}
.ch.current {
  color: var(--ink);
}
.ch.err {
  color: var(--cinnabar);
}
/* corrected-after-mistakes: a small cinnabar dot like a teacher's mark (static, no animation) */
.ch.flawed::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -0.05em;
  width: 0.2em;
  height: 0.2em;
  margin-left: -0.1em;
  border-radius: 50%;
  background: var(--cinnabar);
  opacity: 0.85;
}
.ch.hinted.done::after {
  background: var(--gamboge);
}

/* ── caret: its own compositor layer ── */
.caret {
  position: absolute;
  left: 0;
  top: 0;
  z-index: -1;
  pointer-events: none;
  will-change: transform;
  transition: transform 110ms var(--ease-out);
}
.caret-inner {
  position: absolute;
  inset: 0;
  will-change: transform;
}
.halo {
  position: absolute;
  inset: -0.08em -0.1em -0.06em;
  border-radius: 0.18em;
  background: radial-gradient(closest-side, var(--azurite-soft), transparent);
}
.stroke {
  position: absolute;
  left: 4%;
  right: 4%;
  bottom: -0.02em;
  height: 0.11em;
  background: var(--azurite);
  border-radius: 2px;
  clip-path: polygon(0 35%, 12% 0, 100% 25%, 96% 100%, 4% 85%);
  will-change: opacity;
  animation: caret 1.1s ease-in-out infinite;
}
.caret-inner.err .stroke {
  background: var(--cinnabar);
}
.caret-inner.err .halo {
  background: radial-gradient(closest-side, var(--cinnabar-soft), transparent);
}
.end {
  display: inline-block;
  width: 1px;
}
@keyframes caret {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}
@media (prefers-reduced-motion: reduce) {
  .stroke {
    animation: none;
  }
}
</style>

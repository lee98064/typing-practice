<script setup lang="ts">
/**
 * The in-page IME window: raw keys become roots (組字), and candidates appear with their
 * selection labels exactly like a real IME — anchored under the current character.
 */
import { computed, ref, watch } from 'vue'
import type { ComposerState, ImMeta } from '@/core/types'
import { keyDisplay } from '@/core/keyboard'

const props = defineProps<{
  composer: ComposerState
  meta: ImMeta
  caret: { x: number; y: number; w: number; h: number }
  frameWidth: number
  imId: string
}>()

const visible = computed(() => props.composer.buffer.length > 0)

const style = computed(() => {
  const width = 420
  const left = Math.max(0, Math.min(props.caret.x - 10, props.frameWidth - width))
  return { left: `${left}px`, top: `${props.caret.y + props.caret.h + 2}px` }
})

const cands = computed(() => props.composer.candidates.slice(0, 10))
const showLabels = computed(() => props.composer.exact && props.imId !== 'zhuyin')

function labelOf(i: number): string {
  return props.meta.selLabels[i] ?? ''
}

/** Re-trigger the little drop animation for each new root. */
const lastLen = ref(0)
watch(
  () => props.composer.buffer.length,
  (n, o) => {
    lastLen.value = n > (o ?? 0) ? n : -1
  },
)
</script>

<template>
  <Transition name="pop">
    <div v-if="visible" class="ime" :style="style" role="status" aria-live="polite">
      <div class="preedit">
        <span
          v-for="(p, i) in composer.preedit"
          :key="i + p.key"
          class="root"
          :class="{ fresh: i === lastLen - 1 }"
        >
          <span class="glyph serif">{{ p.label }}</span>
          <span class="key mono">{{ keyDisplay(p.key) }}</span>
        </span>
        <span class="cursor" />
      </div>
      <div v-if="cands.length" class="cands" :class="{ dim: !composer.exact }">
        <span v-for="(c, i) in cands" :key="i + c" class="cand" :class="{ first: i === 0 && composer.exact }">
          <span v-if="showLabels" class="lab mono">{{ labelOf(i) }}</span>
          <span class="cc serif">{{ c }}</span>
        </span>
      </div>
      <div v-else class="cands empty">{{ imId === 'zhuyin' ? '按聲調鍵或空白鍵送字' : '查無此碼' }}</div>
    </div>
  </Transition>
</template>

<style scoped>
.ime {
  position: absolute;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 420px;
  padding: 5px 12px 5px 6px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--paper-raised) 94%, transparent);
  will-change: transform;
  contain: layout paint style;
  border: 1px solid var(--line-strong);
  box-shadow: var(--shadow-2);
  pointer-events: none;
}
.preedit {
  display: flex;
  align-items: center;
  gap: 3px;
  flex: none;
}
.root {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  min-width: 28px;
  padding: 1px 5px 0;
  border-radius: 8px;
  background: var(--paper-sunk);
  border: 1px solid var(--line);
}
.root.fresh {
  animation: drop 220ms var(--ease-out);
}
.glyph {
  font-size: 18px;
  line-height: 1.15;
  font-weight: 600;
  color: var(--ink);
}
.key {
  font-size: 10px;
  line-height: 1.2;
  color: var(--ink-3);
}
.cursor {
  width: 2px;
  height: 20px;
  margin: 0 0 0 2px;
  background: var(--azurite);
  border-radius: 1px;
  will-change: opacity;
  animation: blink 1s steps(2) infinite;
}
.cands {
  display: flex;
  flex-wrap: nowrap;
  gap: 2px 10px;
  padding-left: 10px;
  border-left: 1px dashed var(--line-strong);
  overflow: hidden;
  white-space: nowrap;
}
.cands.dim {
  opacity: 0.55;
}
.cands.empty {
  font-size: 12px;
  color: var(--ink-3);
  letter-spacing: 0.06em;
  white-space: nowrap;
}
.cand {
  display: inline-flex;
  align-items: baseline;
  gap: 3px;
}
.lab {
  font-size: 10px;
  color: var(--ink-3);
}
.cc {
  font-size: 18px;
  color: var(--ink-2);
}
.cand.first .cc {
  color: var(--ink);
  font-weight: 600;
  text-decoration: underline 2px var(--azurite);
  text-underline-offset: 5px;
}
.pop-enter-active,
.pop-leave-active {
  transition: opacity 140ms, transform 180ms var(--ease-out);
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
@keyframes drop {
  from {
    transform: translateY(-6px);
    opacity: 0;
  }
}
@keyframes blink {
  50% {
    opacity: 0;
  }
}
</style>

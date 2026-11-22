<script setup lang="ts">
/**
 * 字根鍵盤 — the physical keyboard with this IM's roots printed on the caps.
 * The next expected key glows (石青); keys of the hinted code take their part colors.
 */
import { computed, ref, watch } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import type { ImKey, RootKey } from '@/core/types'
import { KEYBOARD_ROWS, KEYBOARD_ROW_OFFSETS, keyDisplay } from '@/core/keyboard'

const props = withDefaults(
  defineProps<{
    keys: RootKey[]
    next?: ImKey[]
    colors?: Record<ImKey, number>
    pressed?: { key: string; seq: number }
    heat?: Record<ImKey, number>
    showSpace?: boolean
    maxUnit?: number
    /** 平板模式: keys are tappable and an action row (退格／空白／清除) is shown. */
    touch?: boolean
    /** Height budget in px (touch layout fits keyboard + article on one screen). */
    maxHeight?: number
  }>(),
  { next: () => [], colors: () => ({}), showSpace: true, maxUnit: 58, touch: false, maxHeight: 0 },
)

const emit = defineEmits<{ pick: [key: RootKey]; press: [key: string] }>()

const wrap = ref<HTMLElement | null>(null)
const unit = ref(48)
const GAP = 6
const WIDTH_UNITS = 14.6

const KEY_H = computed(() => (props.touch ? 0.98 : 0.92))
const width = ref(700)
useResizeObserver(wrap, (entries) => {
  width.value = entries[0]?.contentRect.width ?? 700
  measure()
})
function measure() {
  const byWidth = (width.value - GAP * 13) / WIDTH_UNITS
  // 4 key rows + the action/space row (0.8u) + gaps
  const byHeight = props.maxHeight ? (props.maxHeight - GAP * 5) / (4 * KEY_H.value + 0.8) : Infinity
  unit.value = Math.max(22, Math.min(props.maxUnit, byWidth, byHeight))
}
watch(() => [props.maxHeight, props.touch, props.maxUnit], measure)

const byKey = computed(() => new Map(props.keys.map((k) => [k.key, k])))
const maxHeat = computed(() => Math.max(1, ...Object.values(props.heat ?? {})))

function extraRoots(k: RootKey | undefined): string {
  if (!k) return ''
  return k.roots.filter((r) => r !== k.label).slice(0, 3).join('')
}

const keyEls = new Map<string, HTMLElement>()
function setEl(key: string, el: unknown) {
  if (el instanceof HTMLElement) keyEls.set(key, el)
}

function pressAnim(el: HTMLElement | undefined) {
  if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  el.animate(
    [
      { transform: 'translateY(2px) scale(0.94)', boxShadow: 'none', filter: 'brightness(0.94)' },
      { transform: 'translateY(0) scale(1)' },
    ],
    { duration: 170, easing: 'ease-out' },
  )
}

watch(
  () => props.pressed?.seq,
  () => {
    if (props.touch) return // touch taps animate themselves immediately
    pressAnim(props.pressed && keyEls.get(props.pressed.key))
  },
)

/** Tap handler: pointerdown (not click) so typing on glass feels instant. */
function onPress(key: string, e: PointerEvent) {
  if (!props.touch) return
  e.preventDefault()
  pressAnim(e.currentTarget as HTMLElement)
  emit('press', key)
}

function heatStyle(key: string) {
  const n = props.heat?.[key]
  if (!n) return undefined
  const a = 0.12 + 0.6 * (n / maxHeat.value)
  return { background: `color-mix(in srgb, var(--cinnabar) ${Math.round(a * 100)}%, var(--paper-raised))` }
}
</script>

<template>
  <div
    ref="wrap"
    class="kb"
    :class="{ mini: unit < 34, touch }"
    :style="{ '--u': `${unit}px`, '--gap': `${GAP}px`, '--kh': KEY_H }"
    :role="touch ? 'group' : undefined"
    :aria-label="touch ? '螢幕鍵盤' : undefined"
  >
    <div
      v-for="(row, r) in KEYBOARD_ROWS"
      :key="r"
      class="row"
      :style="{ paddingLeft: `calc(${KEYBOARD_ROW_OFFSETS[r]} * (var(--u) + var(--gap)))` }"
    >
      <button
        v-for="cap in row"
        :key="cap.key"
        :ref="(el) => setEl(cap.key, el)"
        type="button"
        tabindex="-1"
        class="key"
        :class="{
          used: byKey.has(cap.key),
          next: next.includes(cap.key),
          colored: colors[cap.key] !== undefined,
        }"
        :style="[
          colors[cap.key] !== undefined ? { '--slot': `var(--slot-${colors[cap.key]})` } : {},
          heatStyle(cap.key) ?? {},
        ]"
        :title="touch ? undefined : byKey.get(cap.key)?.mnemonic ?? ''"
        :data-key="cap.key"
        :aria-label="touch ? `${keyDisplay(cap.key)} ${byKey.get(cap.key)?.label ?? ''}` : undefined"
        @pointerdown="onPress(cap.key, $event)"
        @click="!touch && byKey.get(cap.key) && emit('pick', byKey.get(cap.key)!)"
      >
        <span class="k mono">{{ keyDisplay(cap.key) }}</span>
        <span v-if="byKey.get(cap.key)" class="lab serif">{{ byKey.get(cap.key)!.label }}</span>
        <span v-if="extraRoots(byKey.get(cap.key))" class="extra serif">{{ extraRoots(byKey.get(cap.key)) }}</span>
        <span v-if="heat?.[cap.key]" class="heat num">{{ heat[cap.key] }}</span>
      </button>
    </div>
    <div v-if="touch" class="row action-row">
      <button type="button" tabindex="-1" class="key action used" data-key="Backspace" aria-label="退格" @pointerdown="onPress('Backspace', $event)">
        <span class="lab-sm">⌫ 退格</span>
      </button>
      <button
        :ref="(el) => setEl(' ', el)"
        type="button"
        tabindex="-1"
        class="key space used"
        data-key=" "
        aria-label="空白鍵送字"
        :class="{ next: next.includes(' ') }"
        @pointerdown="onPress(' ', $event)"
      >
        <span class="lab-sm">空白 · 送字</span>
      </button>
      <button type="button" tabindex="-1" class="key action used" data-key="Escape" aria-label="清除組字" @pointerdown="onPress('Escape', $event)">
        <span class="lab-sm">清除</span>
      </button>
    </div>
    <div v-else-if="showSpace" class="row space-row">
      <button
        :ref="(el) => setEl(' ', el)"
        type="button"
        tabindex="-1"
        class="key space used"
        :class="{ next: next.includes(' ') }"
      >
        <span class="lab-sm">空白 · 送字</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.kb {
  display: flex;
  flex-direction: column;
  gap: var(--gap);
  user-select: none;
  width: 100%;
  contain: layout style;
}
.row {
  display: flex;
  gap: var(--gap);
}
.space-row {
  justify-content: center;
  padding-right: calc(1.4 * var(--u));
}
.key {
  position: relative;
  flex: 0 0 var(--u);
  height: calc(var(--u) * var(--kh, 0.92));
  border-radius: calc(var(--u) * 0.2);
  background: var(--paper-raised);
  border: 1px solid var(--line);
  box-shadow: var(--key-shadow);
  color: var(--ink-4);
  cursor: default;
  transition: background var(--t-med), border-color var(--t-med), color var(--t-med), box-shadow var(--t-med);
  overflow: hidden;
}
.key.used {
  color: var(--ink);
  cursor: pointer;
}
.key:not(.used) {
  background: color-mix(in srgb, var(--paper-raised) 45%, transparent);
  box-shadow: none;
}
.k {
  position: absolute;
  top: calc(var(--u) * 0.06);
  left: calc(var(--u) * 0.1);
  font-size: max(9px, calc(var(--u) * 0.2));
  line-height: 1;
  color: var(--ink-3);
}
.lab {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding-top: calc(var(--u) * 0.08);
  font-size: calc(var(--u) * 0.42);
  font-weight: 600;
  line-height: 1;
}
.extra {
  position: absolute;
  right: calc(var(--u) * 0.08);
  bottom: calc(var(--u) * 0.05);
  font-size: max(8px, calc(var(--u) * 0.17));
  line-height: 1;
  color: var(--ink-3);
  letter-spacing: -0.02em;
}
.heat {
  position: absolute;
  right: 4px;
  top: 3px;
  font-size: 10px;
  color: var(--cinnabar-ink);
  font-weight: 700;
}
.mini .k,
.mini .extra {
  display: none;
}
.mini .lab {
  padding-top: 0;
}
.key.colored {
  background: color-mix(in srgb, var(--slot) 16%, var(--paper-raised));
  border-color: color-mix(in srgb, var(--slot) 55%, transparent);
}
.key.colored .lab {
  color: var(--slot);
}
.key.next {
  border-color: var(--azurite);
  box-shadow: 0 0 0 3px var(--azurite-soft), var(--key-shadow);
  overflow: visible;
}
.key.next::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: inherit;
  box-shadow: 0 0 22px 2px var(--azurite-glow);
  pointer-events: none;
  will-change: opacity;
  animation: glow 1.4s ease-in-out infinite;
}
.key.next .lab,
.key.next .lab-sm {
  color: var(--azurite);
}
.space {
  flex-basis: calc(var(--u) * 6 + var(--gap) * 5);
  height: calc(var(--u) * 0.7);
}
.lab-sm {
  font-size: max(10px, calc(var(--u) * 0.2));
  letter-spacing: 0.3em;
  color: var(--ink-3);
}

/* ── 平板模式 ── */
.kb.touch {
  touch-action: manipulation;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}
.touch .key {
  cursor: pointer;
}
.touch .key:not(.used) {
  /* unused keys still type (e.g. to skip punctuation) — keep them visible */
  background: color-mix(in srgb, var(--paper-raised) 70%, transparent);
  box-shadow: var(--key-shadow);
}
.touch .lab {
  font-size: calc(var(--u) * 0.46);
}
.action-row {
  justify-content: center;
}
.touch .space {
  flex-basis: calc(var(--u) * 7 + var(--gap) * 6);
  height: calc(var(--u) * 0.8);
}
.action {
  flex: 0 0 calc(var(--u) * 2 + var(--gap));
  height: calc(var(--u) * 0.8);
  background: var(--paper-sunk);
}
.action .lab-sm {
  letter-spacing: 0.12em;
  color: var(--ink-2);
  font-size: max(12px, calc(var(--u) * 0.22));
}
@keyframes glow {
  0%,
  100% {
    opacity: 0.35;
  }
  50% {
    opacity: 1;
  }
}
</style>

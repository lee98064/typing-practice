<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import { IM_CATALOG, IM_ORDER } from '@/lib/imCatalog'
import { useSettings } from '@/stores/settings'
import { useImStore } from '@/stores/im'
import type { ImId } from '@/core/types'

const props = withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
const settings = useSettings()
const ims = useImStore()

const root = ref<HTMLElement | null>(null)
const pill = ref({ x: 0, w: 0, ready: false })

function measure() {
  const el = root.value?.querySelector<HTMLElement>(`[data-im="${settings.im}"]`)
  if (!el) return
  pill.value = { x: el.offsetLeft, w: el.offsetWidth, ready: true }
}

onMounted(() => nextTick(measure))
watch(() => [settings.im, props.compact], () => nextTick(measure))
useResizeObserver(root, measure)

const loadingId = computed(() => (ims.loading ? settings.im : null))

function select(id: ImId) {
  settings.im = id
}

function onKey(e: KeyboardEvent) {
  const i = IM_ORDER.indexOf(settings.im)
  if (e.key === 'ArrowRight') select(IM_ORDER[(i + 1) % IM_ORDER.length]!)
  else if (e.key === 'ArrowLeft') select(IM_ORDER[(i + IM_ORDER.length - 1) % IM_ORDER.length]!)
  else return
  e.preventDefault()
  nextTick(() => root.value?.querySelector<HTMLElement>(`[data-im="${settings.im}"]`)?.focus())
}
</script>

<template>
  <div ref="root" class="switch" :class="{ compact }" role="radiogroup" aria-label="輸入法" @keydown="onKey">
    <span
      class="pill"
      :class="{ ready: pill.ready }"
      :style="{ transform: `translateX(${pill.x}px)`, width: `${pill.w}px` }"
      aria-hidden="true"
    />
    <button
      v-for="id in IM_ORDER"
      :key="id"
      :data-im="id"
      class="opt"
      :class="{ active: settings.im === id, loading: loadingId === id }"
      role="radio"
      :aria-checked="settings.im === id"
      :tabindex="settings.im === id ? 0 : -1"
      :title="`${IM_CATALOG[id].name}（${IM_CATALOG[id].version}）`"
      @click="select(id)"
    >
      <span class="full">{{ IM_CATALOG[id].name }}</span>
      <span class="short serif">{{ IM_CATALOG[id].short }}</span>
    </button>
  </div>
</template>

<style scoped>
.switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 4px;
  border-radius: 999px;
  background: var(--paper-sunk);
  border: 1px solid var(--line);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.04) inset;
}
.pill {
  position: absolute;
  top: 4px;
  left: 0;
  height: calc(100% - 8px);
  border-radius: 999px;
  background: var(--ink);
  box-shadow: 0 4px 12px -4px rgb(30 27 24 / 0.5);
  opacity: 0;
  transition: transform var(--t-med) var(--ease-out), width var(--t-med) var(--ease-out);
}
.pill.ready {
  opacity: 1;
}
.opt {
  position: relative;
  z-index: 1;
  height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.06em;
  color: var(--ink-2);
  transition: color var(--t-med);
  white-space: nowrap;
}
.opt:hover {
  color: var(--ink);
}
.opt.active {
  color: var(--paper);
}
.opt.loading::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 3px;
  width: 4px;
  height: 4px;
  margin-left: -2px;
  border-radius: 50%;
  background: currentColor;
  animation: blink 0.9s ease-in-out infinite;
}
.short {
  display: none;
  font-size: 16px;
  font-weight: 600;
}
.compact .opt {
  padding: 0 10px;
}
.compact .full {
  display: none;
}
.compact .short {
  display: inline;
}
@media (max-width: 1100px) {
  .opt {
    padding: 0 10px;
  }
  .full {
    display: none;
  }
  .short {
    display: inline;
  }
}
@keyframes blink {
  50% {
    opacity: 0.2;
  }
}
</style>

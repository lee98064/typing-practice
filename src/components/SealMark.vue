<script setup lang="ts">
/**
 * A cinnabar seal (印章). Rough edges come from an SVG displacement filter so it reads as
 * a real stamp rather than a flat badge. `text` is laid out in columns, right to left.
 */
import { computed, useId } from 'vue'

const props = withDefaults(
  defineProps<{ text?: string; size?: number; variant?: 'solid' | 'outline'; rotate?: number }>(),
  { text: '墨打', size: 40, variant: 'solid', rotate: -4 },
)

const uid = useId()
const glyphs = computed(() => [...props.text])
/** 2 glyphs → one column; 4 glyphs → 2×2 (traditional seal reading order). */
const cells = computed(() => {
  const g = glyphs.value
  if (g.length <= 2) return g.map((ch, i) => ({ ch, x: 50, y: g.length === 1 ? 54 : 32 + i * 40, fs: g.length === 1 ? 62 : 38 }))
  return g.slice(0, 4).map((ch, i) => ({ ch, x: i < 2 ? 70 : 30, y: i % 2 === 0 ? 34 : 74, fs: 34 }))
})
</script>

<template>
  <svg
    class="seal"
    :width="size"
    :height="size"
    viewBox="0 0 100 100"
    :style="{ transform: `rotate(${rotate}deg)` }"
    role="img"
    :aria-label="text"
  >
    <defs>
      <filter :id="`rough-${uid}`" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.2" />
      </filter>
      <filter :id="`wear-${uid}`">
        <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed="11" result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -7 4.7" result="m" />
        <feComposite in="SourceGraphic" in2="m" operator="in" />
      </filter>
    </defs>
    <g :filter="`url(#rough-${uid})`">
      <g :filter="`url(#wear-${uid})`">
        <rect
          v-if="variant === 'solid'"
          x="6" y="6" width="88" height="88" rx="9"
          class="seal-fill"
        />
        <rect
          v-else
          x="8" y="8" width="84" height="84" rx="8"
          class="seal-line" fill="none" stroke-width="6"
        />
        <text
          v-for="(c, i) in cells"
          :key="i"
          :x="c.x"
          :y="c.y"
          :font-size="c.fs"
          text-anchor="middle"
          dominant-baseline="central"
          :class="variant === 'solid' ? 'seal-text' : 'seal-text-ink'"
        >{{ c.ch }}</text>
      </g>
    </g>
  </svg>
</template>

<style scoped>
.seal {
  flex: none;
  overflow: visible;
}
.seal-fill {
  fill: var(--cinnabar);
}
.seal-line {
  stroke: var(--cinnabar);
}
.seal-text {
  fill: var(--paper-raised);
  font-family: var(--font-serif);
  font-weight: 900;
}
.seal-text-ink {
  fill: var(--cinnabar);
  font-family: var(--font-serif);
  font-weight: 900;
}
</style>

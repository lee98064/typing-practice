<script setup lang="ts">
/** Ink-wash speed curve (字/分 over time) with cinnabar marks where mistakes happened. */
import { computed, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    timeline: { t: number; done: number; errors: number }[]
    height?: number
    windowMs?: number
  }>(),
  { height: 140, windowMs: 10_000 },
)

const uid = useId()
const W = 600

const series = computed(() => {
  const tl = props.timeline
  if (tl.length < 2) return []
  const out: { t: number; cpm: number; err: boolean }[] = []
  let j = 0
  for (let i = 0; i < tl.length; i++) {
    const p = tl[i]!
    while (j < i && p.t - tl[j]!.t > props.windowMs) j++
    const q = tl[j === i ? Math.max(0, i - 1) : j]!
    const dt = Math.max(1000, p.t - q.t)
    const cpm = ((p.done - q.done) / dt) * 60_000
    const prev = tl[i - 1]
    out.push({ t: p.t, cpm, err: !!prev && p.errors > prev.errors })
  }
  return out
})

const maxT = computed(() => Math.max(1, ...series.value.map((s) => s.t)))
const maxY = computed(() => Math.max(20, ...series.value.map((s) => s.cpm)) * 1.15)

function x(t: number) {
  return (t / maxT.value) * W
}
function y(v: number) {
  return props.height - (v / maxY.value) * (props.height - 10)
}

/** Smooth path via Catmull-Rom → Bézier. */
const line = computed(() => {
  const pts = series.value.map((s) => [x(s.t), y(s.cpm)] as const)
  if (!pts.length) return ''
  let d = `M${pts[0]![0]},${pts[0]![1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!
    const p1 = pts[i]!
    const p2 = pts[i + 1]!
    const p3 = pts[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`
  }
  return d
})
const area = computed(() => (line.value ? `${line.value} L${W},${props.height} L0,${props.height} Z` : ''))
const errs = computed(() => series.value.filter((s) => s.err))
const peak = computed(() => Math.round(Math.max(0, ...series.value.map((s) => s.cpm))))
</script>

<template>
  <figure class="chart">
    <svg v-if="series.length" :viewBox="`0 0 ${W} ${height}`" preserveAspectRatio="none" :style="{ height: `${height}px` }" role="img" :aria-label="`速度曲線，最高 ${peak} 字/分`">
      <defs>
        <linearGradient :id="`wash-${uid}`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--ink)" stop-opacity="0.22" />
          <stop offset="100%" stop-color="var(--ink)" stop-opacity="0" />
        </linearGradient>
      </defs>
      <line v-for="g in 3" :key="g" x1="0" :x2="W" :y1="(height / 4) * g" :y2="(height / 4) * g" class="grid" />
      <path :d="area" :fill="`url(#wash-${uid})`" />
      <path :d="line" class="line" vector-effect="non-scaling-stroke" />
      <line v-for="(e, i) in errs" :key="i" :x1="x(e.t)" :x2="x(e.t)" :y1="height - 8" :y2="height" class="err" vector-effect="non-scaling-stroke" />
    </svg>
    <div v-else class="empty" :style="{ height: `${height}px` }">資料太少，畫不出曲線</div>
    <figcaption>
      <span>速度（每 10 秒移動平均）</span>
      <span class="num">峰值 {{ peak }} 字/分</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.chart {
  margin: 0;
}
svg {
  display: block;
  width: 100%;
}
.grid {
  stroke: var(--line);
  stroke-dasharray: 3 5;
}
.line {
  fill: none;
  stroke: var(--ink);
  stroke-width: 2.2;
  stroke-linecap: round;
}
.err {
  stroke: var(--cinnabar);
  stroke-width: 2;
}
.empty {
  display: grid;
  place-items: center;
  color: var(--ink-3);
  font-size: 13px;
  border: 1px dashed var(--line-strong);
  border-radius: var(--r-md);
}
figcaption {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 12px;
  color: var(--ink-3);
  letter-spacing: 0.08em;
}
</style>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Target, Trash2 } from 'lucide-vue-next'
import { useHistory } from '@/stores/history'
import { useLibrary } from '@/stores/library'
import { useSession } from '@/stores/session'
import { IM_CATALOG, IM_ORDER } from '@/lib/imCatalog'
import { buildDrillText } from '@/lib/drill'
import type { ImId } from '@/core/types'

const history = useHistory()
const lib = useLibrary()
const session = useSession()
const router = useRouter()
const filter = ref<ImId | 'all'>('all')
const confirming = ref(false)

onMounted(() => void history.init())

const recs = computed(() => history.records.filter((r) => filter.value === 'all' || r.im === filter.value))
const chrono = computed(() => [...recs.value].reverse().slice(-40))

const summary = computed(() => {
  const r = recs.value
  if (!r.length) return null
  const chars = r.reduce((s, x) => s + x.done, 0)
  const ms = r.reduce((s, x) => s + x.durationMs, 0)
  return {
    sessions: r.length,
    chars,
    minutes: Math.round(ms / 60000),
    best: Math.round(Math.max(...r.map((x) => x.cpm))),
    acc: Math.round((r.reduce((s, x) => s + x.accuracy, 0) / r.length) * 1000) / 10,
  }
})

const W = 720
const H = 180
const chart = computed(() => {
  const pts = chrono.value
  if (pts.length < 2) return null
  const maxY = Math.max(20, ...pts.map((p) => p.cpm)) * 1.15
  const step = W / (pts.length - 1)
  const xy = pts.map((p, i) => ({
    x: i * step,
    y: H - (p.cpm / maxY) * (H - 16),
    ay: H - p.accuracy * (H - 16),
    r: p,
  }))
  const line = xy.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ')
  const acc = xy.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.ay}`).join(' ')
  return { xy, line, acc, area: `${line} L${W},${H} L0,${H} Z`, maxY }
})

const weak = computed(() => history.weakChars(filter.value === 'all' ? undefined : filter.value, 40))

function drill() {
  lib.openVirtual('弱字特訓', buildDrillText(weak.value.map((w) => w.char)))
  session.mode = 'practice'
  void router.push('/')
}

function fmt(at: number) {
  return new Date(at).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function clearAll() {
  await history.clear()
  confirming.value = false
}
</script>

<template>
  <main class="hist">
    <header class="head">
      <div>
        <p class="eyebrow">練習紀錄</p>
        <h1 class="serif">每一筆，都是功夫</h1>
      </div>
      <div class="tabs" role="tablist">
        <button class="tab" :class="{ on: filter === 'all' }" role="tab" :aria-selected="filter === 'all'" @click="filter = 'all'">全部</button>
        <button
          v-for="id in IM_ORDER"
          :key="id"
          class="tab"
          :class="{ on: filter === id }"
          role="tab"
          :aria-selected="filter === id"
          @click="filter = id"
        >
          {{ IM_CATALOG[id].name }}
        </button>
      </div>
    </header>

    <section v-if="summary" class="tiles">
      <div class="tile card"><span class="lab">練習次數</span><span class="val num serif">{{ summary.sessions }}</span></div>
      <div class="tile card"><span class="lab">累計字數</span><span class="val num serif">{{ summary.chars.toLocaleString() }}</span></div>
      <div class="tile card"><span class="lab">累計時間</span><span class="val num serif">{{ summary.minutes }}<small> 分</small></span></div>
      <div class="tile card"><span class="lab">最快</span><span class="val num serif">{{ summary.best }}<small> 字/分</small></span></div>
      <div class="tile card"><span class="lab">平均正確率</span><span class="val num serif">{{ summary.acc }}<small>%</small></span></div>
    </section>

    <section v-if="chart" class="trend card">
      <header>
        <h2 class="serif">速度趨勢</h2>
        <span class="legend"><i class="l-ink" /> 字/分 <i class="l-az" /> 正確率</span>
      </header>
      <svg :viewBox="`-8 -8 ${W + 16} ${H + 16}`" preserveAspectRatio="none" role="img" aria-label="速度趨勢圖">
        <defs>
          <linearGradient id="hist-wash" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="var(--ink)" stop-opacity="0.18" />
            <stop offset="1" stop-color="var(--ink)" stop-opacity="0" />
          </linearGradient>
        </defs>
        <line v-for="g in 3" :key="g" x1="0" :x2="W" :y1="(H / 4) * g" :y2="(H / 4) * g" class="grid" />
        <path :d="chart.area" fill="url(#hist-wash)" />
        <path :d="chart.acc" class="acc" vector-effect="non-scaling-stroke" />
        <path :d="chart.line" class="ln" vector-effect="non-scaling-stroke" />
        <circle v-for="(p, i) in chart.xy" :key="i" :cx="p.x" :cy="p.y" r="3.5" class="dot">
          <title>{{ fmt(p.r.at) }} · {{ Math.round(p.r.cpm) }} 字/分 · {{ Math.round(p.r.accuracy * 100) }}%</title>
        </circle>
      </svg>
    </section>

    <div class="cols">
      <section class="list card">
        <header>
          <h2 class="serif">最近紀錄</h2>
          <button v-if="history.count && !confirming" class="btn btn-ghost btn-sm" @click="confirming = true"><Trash2 :size="14" /> 清除</button>
          <span v-if="confirming" class="confirm">
            確定清除全部紀錄？
            <button class="btn btn-cinnabar btn-sm" @click="clearAll">清除</button>
            <button class="btn btn-ghost btn-sm" @click="confirming = false">取消</button>
          </span>
        </header>
        <table v-if="recs.length">
          <thead>
            <tr><th>時間</th><th>文章</th><th>輸入法</th><th class="r">字/分</th><th class="r">正確率</th><th class="r">字數</th></tr>
          </thead>
          <tbody>
            <tr v-for="r in recs.slice(0, 50)" :key="r.id ?? r.at">
              <td class="num muted">{{ fmt(r.at) }}</td>
              <td class="serif">
                {{ r.articleTitle }}
                <span v-if="r.mode === 'test'" class="chip chip-cinnabar">測驗</span>
              </td>
              <td>{{ IM_CATALOG[r.im].name }}</td>
              <td class="r num serif strong">{{ Math.round(r.cpm) }}</td>
              <td class="r num">{{ (r.accuracy * 100).toFixed(1) }}%</td>
              <td class="r num muted">{{ r.done }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="empty muted serif">還沒有紀錄，先去練一篇吧。</p>
      </section>

      <section class="weak card">
        <header>
          <h2 class="serif">常錯字</h2>
          <button v-if="weak.length" class="btn btn-cinnabar btn-sm" @click="drill"><Target :size="14" /> 弱字特訓</button>
        </header>
        <p v-if="weak.length" class="chars serif">
          <RouterLink v-for="w in weak" :key="w.char" class="wc" :to="{ path: '/explore', query: { c: w.char } }" :title="`錯 ${w.count} 次，點我看拆法`">
            {{ w.char }}<sup class="num">{{ w.count }}</sup>
          </RouterLink>
        </p>
        <p v-else class="empty muted serif">沒有常錯字，好樣的。</p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.hist {
  max-width: 1280px;
  margin: 0 auto;
  padding: 36px 28px 64px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  flex-wrap: wrap;
}
.eyebrow {
  font-size: 12px;
  letter-spacing: 0.3em;
  color: var(--cinnabar);
}
h1 {
  font-size: 36px;
  font-weight: 900;
  letter-spacing: 0.12em;
  margin-top: 6px;
}
.tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  background: var(--paper-sunk);
  flex-wrap: wrap;
}
.tab {
  height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 14px;
  color: var(--ink-2);
}
.tab.on {
  background: var(--ink);
  color: var(--paper);
}
.tiles {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
}
.tile {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 18px;
  box-shadow: var(--shadow-1);
}
.lab {
  font-size: 12px;
  letter-spacing: 0.2em;
  color: var(--ink-3);
}
.val {
  font-size: 32px;
  font-weight: 900;
  line-height: 1.1;
}
.val small {
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-3);
}
.trend {
  padding: 20px 22px;
  box-shadow: var(--shadow-1);
}
.trend header,
.list header,
.weak header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
h2 {
  font-size: 19px;
}
.legend {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--ink-3);
}
.legend i {
  display: inline-block;
  width: 14px;
  height: 3px;
  border-radius: 2px;
  margin-left: 8px;
}
.l-ink {
  background: var(--ink);
}
.l-az {
  background: var(--azurite);
}
.trend svg {
  width: 100%;
  height: 200px;
  display: block;
}
.grid {
  stroke: var(--line);
  stroke-dasharray: 3 5;
}
.ln {
  fill: none;
  stroke: var(--ink);
  stroke-width: 2.2;
}
.acc {
  fill: none;
  stroke: var(--azurite);
  stroke-width: 1.5;
  stroke-dasharray: 4 4;
  opacity: 0.7;
}
.dot {
  fill: var(--paper-raised);
  stroke: var(--ink);
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
}
.cols {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}
.list,
.weak {
  padding: 20px 22px;
  box-shadow: var(--shadow-1);
  min-width: 0;
}
.confirm {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--cinnabar-ink);
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
th {
  text-align: left;
  font-weight: 500;
  font-size: 12px;
  letter-spacing: 0.14em;
  color: var(--ink-3);
  padding: 6px 8px;
  border-bottom: 1px solid var(--line);
}
td {
  padding: 9px 8px;
  border-bottom: 1px dashed var(--line);
}
.r {
  text-align: right;
}
.strong {
  font-weight: 700;
  font-size: 16px;
}
.chars {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.wc {
  position: relative;
  display: inline-grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 10px;
  font-size: 24px;
  background: var(--cinnabar-soft);
  color: var(--ink);
  text-decoration: none !important;
  transition: transform var(--t-fast);
}
.wc:hover {
  transform: translateY(-2px);
}
.wc sup {
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 10px;
  color: var(--cinnabar-ink);
  font-family: var(--font-sans);
}
.empty {
  padding: 30px 0;
  text-align: center;
}
@media (max-width: 1000px) {
  .tiles {
    grid-template-columns: repeat(3, 1fr);
  }
  .cols {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 640px) {
  .hist {
    padding: 24px 16px 48px;
  }
  .tiles {
    grid-template-columns: repeat(2, 1fr);
  }
  h1 {
    font-size: 28px;
  }
  .list {
    overflow-x: auto;
  }
  table {
    min-width: 520px;
  }
}
</style>

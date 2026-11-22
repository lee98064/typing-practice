<script setup lang="ts">
/** 成績單 — a paper certificate with a cinnabar grade seal that stamps down. */
import { computed, onMounted, ref } from 'vue'
import { RotateCcw, BookOpen, Target, X } from 'lucide-vue-next'
import SealMark from './SealMark.vue'
import SpeedChart from './SpeedChart.vue'
import RootKeyboard from './RootKeyboard.vue'
import type { HistoryRecord } from '@/lib/db'
import type { RootKey } from '@/core/types'
import { IM_CATALOG } from '@/lib/imCatalog'

const props = defineProps<{ result: HistoryRecord; keys?: RootKey[] }>()
const emit = defineEmits<{ again: []; library: []; drill: [chars: string[]]; close: [] }>()

type Grade = { seal: string; title: string; note: string }

function gradeOf(cpm: number, acc: number): Grade {
  if (cpm >= 70 && acc >= 0.98) return { seal: '甲上', title: '出神入化', note: '又快又準，已是高手手感。' }
  if (cpm >= 50 && acc >= 0.95) return { seal: '甲', title: '行雲流水', note: '節奏穩定，繼續保持。' }
  if (cpm >= 30 && acc >= 0.9) return { seal: '乙', title: '漸入佳境', note: '熟悉字根後速度會再上來。' }
  if (cpm >= 15) return { seal: '丙', title: '初具筆力', note: '先求準、再求快，弱字多練幾輪。' }
  return { seal: '丁', title: '研墨起步', note: '每天十分鐘，字根很快就記熟。' }
}

const grade = computed(() => gradeOf(props.result.cpm, props.result.accuracy))
const weak = computed(() =>
  Object.entries(props.result.weakChars)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 24),
)
const acc = computed(() => (Math.round(props.result.accuracy * 1000) / 10).toFixed(1))
const duration = computed(() => {
  const s = Math.round(props.result.durationMs / 1000)
  return `${Math.floor(s / 60)} 分 ${String(s % 60).padStart(2, '0')} 秒`
})
const dateStr = computed(() =>
  new Date(props.result.at).toLocaleString('zh-TW', { dateStyle: 'medium', timeStyle: 'short' }),
)
const stamped = ref(false)
onMounted(() => setTimeout(() => (stamped.value = true), 380))
const hasHeat = computed(() => Object.keys(props.result.errorKeys).length > 0)
</script>

<template>
  <div class="backdrop" @click.self="emit('close')">
    <article class="cert" role="dialog" aria-modal="true" aria-labelledby="cert-title">
      <button class="btn btn-icon close" aria-label="關閉" @click="emit('close')"><X :size="18" /></button>
      <header class="head">
        <div>
          <p class="eyebrow">{{ result.mode === 'test' ? '測驗成績單' : '練習成績單' }}</p>
          <h2 id="cert-title" class="serif">{{ result.articleTitle }}</h2>
          <p class="sub">{{ IM_CATALOG[result.im].name }} · {{ dateStr }} · {{ duration }}</p>
        </div>
        <div class="seal-slot" :class="{ stamped }">
          <SealMark :text="grade.seal" :size="104" :rotate="-9" />
        </div>
      </header>

      <div class="body" :class="{ split: weak.length || (hasHeat && keys?.length) }">
      <div class="col-a">
      <section class="hero">
        <div class="big">
          <span class="num serif">{{ Math.round(result.cpm) }}</span>
          <span class="unit">字/分</span>
        </div>
        <div class="verdict">
          <p class="vt serif">{{ grade.title }}</p>
          <p class="vn">{{ grade.note }}</p>
        </div>
      </section>

      <dl class="figures">
        <div><dt>正確率</dt><dd class="num serif">{{ acc }}%</dd></div>
        <div><dt>完成字數</dt><dd class="num serif">{{ result.done }}<small> / {{ result.total }}</small></dd></div>
        <div><dt>錯誤</dt><dd class="num serif" :class="{ bad: result.errors }">{{ result.errors }}</dd></div>
        <div><dt>看提示</dt><dd class="num serif">{{ result.hinted }}</dd></div>
        <div><dt>最高連擊</dt><dd class="num serif">{{ result.maxCombo }}</dd></div>
      </dl>

      <SpeedChart :timeline="result.timeline" :height="110" />
      </div>
      <div class="col-b">

      <section v-if="weak.length" class="weak">
        <h3>需要加強的字</h3>
        <p class="chars serif">
          <span v-for="[ch, n] in weak" :key="ch" class="wc" :title="`錯 ${n} 次`">
            {{ ch }}<sup class="num">{{ n }}</sup>
          </span>
        </p>
      </section>

      <section v-if="hasHeat && keys?.length" class="heat">
        <h3>容易按錯的鍵</h3>
        <RootKeyboard :keys="keys" :heat="result.errorKeys" :show-space="false" :max-unit="30" />
      </section>
      </div>
      </div>

      <footer class="actions">
        <button class="btn btn-ink" @click="emit('again')"><RotateCcw :size="16" /> 再來一次</button>
        <button v-if="weak.length" class="btn btn-cinnabar" @click="emit('drill', weak.map(([c]) => c))">
          <Target :size="16" /> 弱字特訓
        </button>
        <button class="btn btn-ghost" @click="emit('library')"><BookOpen :size="16" /> 換篇文章</button>
      </footer>
    </article>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 24px 16px;
  background: rgb(20 16 12 / 0.38);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  overflow-y: auto;
  animation: fade 240ms ease;
}
.cert {
  position: relative;
  width: min(760px, 100%);
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 34px 38px 28px;
  border-radius: 6px;
  background: var(--paper-raised);
  background-image: var(--grain);
  border: 1px solid var(--line-strong);
  box-shadow: var(--shadow-3);
  animation: unfold 520ms var(--ease-out);
}
.cert::before {
  /* double rule border like a certificate */
  content: '';
  position: absolute;
  inset: 10px;
  border: 1px solid color-mix(in srgb, var(--cinnabar) 40%, transparent);
  outline: 3px double color-mix(in srgb, var(--cinnabar) 22%, transparent);
  outline-offset: 3px;
  pointer-events: none;
  border-radius: 2px;
}
.close {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}
.eyebrow {
  font-size: 12px;
  letter-spacing: 0.3em;
  color: var(--cinnabar);
}
.head h2 {
  margin-top: 4px;
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 0.12em;
}
.sub {
  margin-top: 4px;
  font-size: 13px;
  color: var(--ink-3);
  letter-spacing: 0.06em;
}
.seal-slot {
  margin: 6px 26px 0 0;
  opacity: 0;
  transform: scale(1.8) rotate(8deg);
  filter: blur(3px);
}
.seal-slot.stamped {
  animation: stamp 420ms cubic-bezier(0.2, 1.4, 0.4, 1) forwards;
}
.body {
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.col-a,
.col-b {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}
@media (min-width: 1100px) {
  .cert:has(.body.split) {
    width: min(1060px, 100%);
  }
  .body.split {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
    gap: 34px;
  }
  .body.split .col-b {
    padding-left: 30px;
    border-left: 1px dashed var(--line-strong);
  }
}
.hero {
  display: flex;
  align-items: flex-end;
  gap: 28px;
  flex-wrap: wrap;
}
.big {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.big .num {
  font-size: 84px;
  line-height: 0.9;
  font-weight: 900;
  letter-spacing: -0.02em;
}
.unit {
  font-size: 16px;
  color: var(--ink-3);
  letter-spacing: 0.2em;
}
.vt {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.2em;
}
.vn {
  font-size: 14px;
  color: var(--ink-2);
}
.figures {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0;
  margin: 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}
.figures > div {
  padding: 12px 0;
  text-align: center;
}
.figures > div + div {
  border-left: 1px dashed var(--line-strong);
}
dt {
  font-size: 12px;
  letter-spacing: 0.2em;
  color: var(--ink-3);
}
dd {
  margin: 2px 0 0;
  font-size: 24px;
  font-weight: 700;
}
dd small {
  font-size: 0.55em;
  color: var(--ink-3);
}
dd.bad {
  color: var(--cinnabar);
}
h3 {
  font-family: var(--font-sans);
  font-size: 12px;
  letter-spacing: 0.24em;
  color: var(--ink-3);
  font-weight: 600;
  margin-bottom: 10px;
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
  width: 44px;
  height: 44px;
  border-radius: 8px;
  font-size: 24px;
  background: var(--cinnabar-soft);
  color: var(--ink);
}
.wc sup {
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 10px;
  color: var(--cinnabar-ink);
  font-family: var(--font-sans);
}
.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
@media (max-width: 640px) {
  .cert {
    padding: 26px 20px 22px;
  }
  .figures {
    grid-template-columns: repeat(3, 1fr);
  }
  .figures > div:nth-child(4) {
    border-left: 0;
  }
  .big .num {
    font-size: 68px;
  }
  .seal-slot {
    margin-right: 10px;
  }
}
@keyframes stamp {
  0% {
    opacity: 0;
    transform: scale(1.8) rotate(8deg);
    filter: blur(3px);
  }
  70% {
    opacity: 1;
    transform: scale(0.94) rotate(-1deg);
    filter: blur(0);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0);
    filter: blur(0);
  }
}
@keyframes unfold {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.98);
  }
}
@keyframes fade {
  from {
    opacity: 0;
  }
}
</style>

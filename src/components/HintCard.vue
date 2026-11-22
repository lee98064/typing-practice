<script setup lang="ts">
/**
 * 字根卡 — why this character is typed this way.
 * Big char on a 米字格 practice grid, the code as colored key caps with their roots,
 * the decomposition (parts share colors with keys), the taking rule and mnemonics.
 */
import { computed } from 'vue'
import { X, BadgeCheck, Lightbulb } from 'lucide-vue-next'
import type { HintCard } from '@/core/types'
import { keyDisplay } from '@/core/keyboard'
import { IM_CATALOG } from '@/lib/imCatalog'

const props = defineProps<{
  card: HintCard
  errors?: number
  reason?: 'errors' | 'peek'
  closable?: boolean
  dense?: boolean
}>()
const emit = defineEmits<{ close: [] }>()

const primary = computed(() => props.card.options[0])
/** 簡速 only makes sense when a longer full code also exists. */
const hasShort = computed(() => !!primary.value?.tags.includes('簡碼'))
function visibleTags(tags: string[]): string[] {
  const single = props.card.options.length === 1
  return tags.filter((t) => t !== '簡碼' && !(single && t === '完整碼'))
}
const others = computed(() => props.card.options.slice(1, 4))
const imName = computed(() => IM_CATALOG[props.card.im].name)
const decomp = computed(() => props.card.decomposition)
const IDC_NAME: Record<string, string> = {
  '⿰': '左右結構', '⿱': '上下結構', '⿲': '左中右結構', '⿳': '上中下結構', '⿴': '全包圍',
  '⿵': '上包下', '⿶': '下包上', '⿷': '左包右', '⿸': '左上包', '⿹': '右上包', '⿺': '左下包', '⿻': '疊合',
}
const structure = computed(() => {
  const first = decomp.value?.ids ? [...decomp.value.ids][0] : undefined
  return first ? IDC_NAME[first] : undefined
})
/** Display glyph of a part: cangjie 難形 placeholders show as 難. */
function glyph(p: { component: string; root: string }): string {
  if (p.component.endsWith('難形')) return '難'
  return p.component || p.root
}
/** Consecutive parts that came from the same expanded component (e.g. 言 = 卜一一口). */
const partGroups = computed(() => {
  const out: { name?: string; items: NonNullable<typeof decomp.value>['parts'] }[] = []
  for (const p of decomp.value?.parts ?? []) {
    const last = out.at(-1)
    if (last && p.group && last.name === p.group) last.items.push(p)
    else out.push({ name: p.group, items: [p] })
  }
  return out
})
/** 嘸蝦米 簡速字根 involved in this char (the char itself or one of its parts). */
const shortcutHits = computed(() => {
  const forms = new Set([props.card.char, ...(decomp.value?.verified ? decomp.value.parts.map((p) => p.component) : [])])
  const hits: { key: string; root: string }[] = []
  for (const k of primary.value?.keys ?? []) {
    for (const r of k.shortcutRoots ?? []) if (forms.has(r) && !hits.some((h) => h.root === r)) hits.push({ key: k.key, root: r })
  }
  return hits
})
const hasParts = computed(() => !!decomp.value?.verified && decomp.value.parts.some((p) => p.component || p.root))
</script>

<template>
  <article class="hint" :class="{ dense }" aria-label="字根卡">
    <header class="top">
      <div class="title">
        <span class="eyebrow">字根卡 · {{ imName }}</span>
        <span v-if="reason === 'errors' && errors" class="chip chip-cinnabar">已錯 {{ errors }} 次</span>
        <span v-else-if="reason === 'peek'" class="chip">偷看提示</span>
      </div>
      <button v-if="closable" class="btn btn-icon" aria-label="關閉字根卡" @click="emit('close')">
        <X :size="18" />
      </button>
    </header>

    <section class="hero">
      <div class="grid-paper" aria-hidden="false">
        <svg class="mi" viewBox="0 0 100 100" aria-hidden="true">
          <rect x="1.5" y="1.5" width="97" height="97" rx="3" />
          <line x1="50" y1="2" x2="50" y2="98" />
          <line x1="2" y1="50" x2="98" y2="50" />
          <line x1="2" y1="2" x2="98" y2="98" />
          <line x1="98" y1="2" x2="2" y2="98" />
        </svg>
        <span class="big serif">{{ card.char }}</span>
      </div>
      <div class="meta">
        <div v-if="card.reading" class="reading serif">{{ card.reading }}</div>
        <div v-if="primary" class="code-line">
          <span class="code-label">打法</span>
          <span class="code mono">{{ primary.code.toUpperCase() }}</span>
          <span v-if="primary.selectionKey" class="chip chip-azurite">再按 {{ primary.selectionKey }}</span>
          <span v-else class="chip">空白送字</span>
        </div>
        <div v-if="primary" class="tags">
          <span v-if="hasShort" class="chip chip-jade">簡碼 · 最快打法</span>
          <span v-for="t in visibleTags(primary.tags)" :key="t" class="chip">{{ t }}</span>
        </div>
      </div>
    </section>

    <section v-if="primary" class="keys-row" aria-label="編碼">
      <div v-for="(k, i) in primary.keys" :key="i" class="kcol" :style="{ '--slot': `var(--slot-${k.color})` }">
        <span class="kcap">
          <span class="kk mono">{{ keyDisplay(k.key) }}</span>
          <span class="kl serif">{{ k.label }}</span>
        </span>
        <span class="kroots serif" :title="k.roots.join(' ')">{{ k.roots.slice(0, 4).join(' ') }}</span>
      </div>
      <div v-if="primary.selectionKey" class="kcol plus">
        <span class="kcap sel"><span class="kl mono">{{ primary.selectionKey }}</span></span>
        <span class="kroots">選第 {{ primary.selection + 1 }} 字</span>
      </div>
    </section>

    <p v-if="shortcutHits.length" class="shortcut">
      <span class="chip chip-azurite">簡速字根</span>
      <span v-for="h in shortcutHits" :key="h.root">
        「<b class="serif">{{ h.root }}</b>」整字當一個字根，在 <b class="mono">{{ keyDisplay(h.key) }}</b> 鍵
      </span>
    </p>

    <section v-if="others.length" class="alts">
      <h4>其他打法</h4>
      <ul>
        <li v-for="o in others" :key="o.code + o.selection">
          <span class="mono">{{ o.code.toUpperCase() }}</span>
          <span v-if="o.selectionKey" class="muted">＋{{ o.selectionKey }}</span>
          <span v-if="o.tags.includes('簡碼')" class="chip chip-jade">簡碼</span>
          <span v-for="t in visibleTags(o.tags)" :key="t" class="chip">{{ t }}</span>
        </li>
      </ul>
    </section>

    <section v-if="decomp" class="decomp">
      <h4>
        為什麼這樣拆
        <span v-if="decomp.verified" class="verified"><BadgeCheck :size="14" /> 已對照字表驗證</span>
        <span v-else class="ref">參考</span>
      </h4>
      <p v-if="decomp.code && primary && decomp.code !== primary.code" class="note">
        「{{ card.char }}」平常打簡碼 <b class="mono">{{ primary.code.toUpperCase() }}</b>；下面是完整碼
        <b class="mono">{{ decomp.code.toUpperCase() }}</b> 的拆法，學會了就能類推其他字。
      </p>
      <div v-if="hasParts" class="parts">
        <span v-if="structure" class="ids">{{ structure }}</span>
        <span v-for="(g, gi) in partGroups" :key="gi" class="pgroup" :class="{ named: g.name }">
          <span class="pitems">
            <span
              v-for="(p, i) in g.items"
              :key="i"
              class="part"
              :class="{ picked: p.picked }"
              :style="{ '--slot': `var(--slot-${p.color})` }"
            >
              <span class="pg serif">{{ glyph(p) }}</span>
              <span class="pk mono">{{ keyDisplay(p.key) }}</span>
              <span v-if="p.role" class="pr">{{ p.role }}</span>
            </span>
          </span>
          <span v-if="g.name" class="gname serif">{{ g.name }}</span>
        </span>
      </div>
      <ol class="explain">
        <li v-for="(line, i) in decomp.explanation" :key="i">{{ line }}</li>
      </ol>
    </section>

    <section class="rule">
      <h4>取碼規則</h4>
      <p>{{ card.rule }}</p>
    </section>

    <section v-if="card.mnemonics.length" class="mnemo">
      <h4><Lightbulb :size="14" /> 字根記憶</h4>
      <ul>
        <li v-for="m in card.mnemonics" :key="m.key">
          <span class="mk mono">{{ keyDisplay(m.key) }}</span>
          <span class="ml serif">{{ m.label }}</span>
          <span class="mt">{{ m.text }}</span>
        </li>
      </ul>
    </section>

    <section v-if="card.confusables.length" class="conf">
      <h4>同碼字</h4>
      <p class="serif">
        <span v-for="c in card.confusables" :key="c" class="cf">{{ c }}</span>
      </p>
    </section>

    <p v-if="!primary" class="missing">這個字不在{{ imName }}字表裡，可以按任意鍵略過，或到設定匯入自訂字表。</p>
  </article>
</template>

<style scoped>
.hint {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 18px 20px 22px;
}
.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.eyebrow {
  font-size: 12px;
  letter-spacing: 0.24em;
  color: var(--ink-3);
}
.hero {
  display: grid;
  grid-template-columns: 112px 1fr;
  gap: 16px;
  align-items: center;
}
.grid-paper {
  position: relative;
  width: 112px;
  height: 112px;
  display: grid;
  place-items: center;
}
.mi {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  fill: none;
  stroke: var(--cinnabar);
  stroke-width: 0.7;
  opacity: 0.55;
}
.mi line {
  stroke-dasharray: 2.2 2.2;
}
.mi rect {
  stroke-width: 1.4;
}
.big {
  position: relative;
  font-size: 80px;
  line-height: 1;
  font-weight: 600;
  color: var(--ink);
  animation: ink-in 520ms var(--ease-ink);
}
.meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.reading {
  font-size: 18px;
  letter-spacing: 0.2em;
  color: var(--ink-2);
}
.code-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.code-label {
  font-size: 12px;
  color: var(--ink-3);
  letter-spacing: 0.2em;
}
.code {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: var(--ink);
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.keys-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 14px;
  border-radius: var(--r-md);
  background: var(--paper-sunk);
  border: 1px solid var(--line);
}
.kcol {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  animation: rise 360ms var(--ease-out) both;
}
.kcol:nth-child(2) { animation-delay: 60ms; }
.kcol:nth-child(3) { animation-delay: 120ms; }
.kcol:nth-child(4) { animation-delay: 180ms; }
.kcol:nth-child(5) { animation-delay: 240ms; }
.kcap {
  position: relative;
  width: 52px;
  height: 50px;
  border-radius: 11px;
  background: color-mix(in srgb, var(--slot, var(--ink-3)) 14%, var(--paper-raised));
  border: 1.5px solid color-mix(in srgb, var(--slot, var(--ink-3)) 70%, transparent);
  box-shadow: var(--key-shadow);
  display: grid;
  place-items: center;
}
.kcap.sel {
  --slot: var(--azurite);
}
.kk {
  position: absolute;
  top: 3px;
  left: 6px;
  font-size: 10px;
  color: var(--ink-3);
}
.kl {
  font-size: 23px;
  font-weight: 700;
  color: var(--slot, var(--ink));
  padding-top: 4px;
}
.kroots {
  max-width: 64px;
  font-size: 12px;
  color: var(--ink-2);
  text-align: center;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.plus .kroots {
  font-size: 11px;
  color: var(--ink-3);
}
h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.22em;
  color: var(--ink-3);
}
.verified {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  letter-spacing: 0.06em;
  font-weight: 500;
  color: var(--jade);
}
.ref {
  letter-spacing: 0.06em;
  font-weight: 500;
  color: var(--gamboge);
}
.alts ul,
.mnemo ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.alts li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  letter-spacing: 0.1em;
}
.parts {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.ids {
  writing-mode: vertical-rl;
  font-size: 11px;
  letter-spacing: 0.15em;
  color: var(--ink-3);
  padding: 4px 2px;
  border-right: 1px solid var(--line-strong);
  margin-right: 2px;
}
.pgroup {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.pgroup.named {
  padding: 10px 6px 4px;
  border-radius: 12px;
  border-bottom: 2px solid var(--line-strong);
  background: color-mix(in srgb, var(--paper-sunk) 60%, transparent);
}
.pitems {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
}
.gname {
  font-size: 13px;
  color: var(--ink-3);
  letter-spacing: 0.1em;
}
.gname::before {
  content: '「';
}
.gname::after {
  content: '」';
}
.shortcut {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  margin-top: -6px;
  font-size: 13.5px;
  color: var(--ink-2);
}
.shortcut b.serif {
  font-size: 17px;
}
.part {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  min-width: 44px;
  padding: 6px 8px 4px;
  border-radius: 10px;
  border: 1.5px dashed color-mix(in srgb, var(--slot) 45%, transparent);
  color: color-mix(in srgb, var(--slot) 60%, var(--ink-3));
}
.part.picked {
  border-style: solid;
  border-color: var(--slot);
  background: color-mix(in srgb, var(--slot) 10%, transparent);
  color: var(--slot);
}
.pg {
  font-size: 24px;
  line-height: 1.1;
  font-weight: 600;
}
.pk {
  font-size: 10px;
  opacity: 0.8;
}
.pr {
  position: absolute;
  top: -9px;
  right: -6px;
  padding: 0 5px;
  border-radius: 6px;
  font-size: 10px;
  line-height: 16px;
  background: var(--slot);
  color: var(--paper-raised);
}
.part:not(.picked) .pr {
  display: none;
}
.note {
  margin: -2px 0 10px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--ink-2);
  padding: 8px 12px;
  border-radius: 10px;
  background: var(--gamboge-soft);
}
.note b {
  letter-spacing: 0.1em;
}
.explain {
  margin: 0;
  padding-left: 1.3em;
  font-size: 14px;
  line-height: 1.75;
  color: var(--ink-2);
}
.rule p {
  font-size: 14px;
  line-height: 1.7;
  color: var(--ink-2);
}
.mnemo li {
  display: grid;
  grid-template-columns: 26px 26px 1fr;
  align-items: baseline;
  gap: 6px;
  font-size: 13.5px;
  line-height: 1.6;
}
.mk {
  font-size: 12px;
  color: var(--ink-3);
}
.ml {
  font-size: 17px;
  font-weight: 600;
}
.mt {
  color: var(--ink-2);
}
.conf p {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.cf {
  display: inline-grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: var(--paper-sunk);
  font-size: 19px;
  color: var(--ink-2);
}
.missing {
  font-size: 14px;
  color: var(--ink-2);
}
.dense .hero {
  grid-template-columns: 84px 1fr;
}
.dense .grid-paper {
  width: 84px;
  height: 84px;
}
.dense .big {
  font-size: 58px;
}
@keyframes ink-in {
  from {
    opacity: 0;
    filter: blur(6px);
    transform: scale(1.08);
  }
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}
</style>

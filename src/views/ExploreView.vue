<script setup lang="ts">
/**
 * 字根探索 — look up any character in all five IMs side by side, and browse each IM's
 * full root chart (click a key to read its mnemonic). Real text field: OS IME allowed here.
 */
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search } from 'lucide-vue-next'
import HintCard from '@/components/HintCard.vue'
import RootKeyboard from '@/components/RootKeyboard.vue'
import { useImStore } from '@/stores/im'
import { useSettings } from '@/stores/settings'
import { IM_CATALOG, IM_ORDER } from '@/lib/imCatalog'
import type { HintCard as Card, ImId, InputMethod, RootKey } from '@/core/types'
import { keyDisplay } from '@/core/keyboard'

const ims = useImStore()
const settings = useSettings()
const route = useRoute()
const router = useRouter()

const query = ref(typeof route.query.c === 'string' ? route.query.c : '永')
const loaded = shallowRef<Partial<Record<ImId, InputMethod>>>({})
const failed = ref<ImId[]>([])
const chartIm = ref<ImId>(settings.im)
const picked = ref<RootKey | null>(null)

onMounted(async () => {
  const entries = await Promise.all(
    IM_ORDER.map(async (id) => {
      try {
        return [id, await ims.get(id)] as const
      } catch {
        failed.value = [...failed.value, id]
        return [id, undefined] as const
      }
    }),
  )
  loaded.value = Object.fromEntries(entries.filter(([, m]) => m))
})

const chars = computed(() => [...query.value.replace(/\s/g, '')].filter((c) => /\p{Script=Han}/u.test(c)).slice(0, 8))
const focusChar = ref('')
watch(
  chars,
  (c) => {
    if (!c.includes(focusChar.value)) focusChar.value = c[0] ?? ''
    void router.replace({ query: query.value ? { c: query.value } : {} })
  },
  { immediate: true },
)

const cards = computed(() => {
  const ch = focusChar.value
  if (!ch) return []
  return IM_ORDER.map((id) => {
    const m = loaded.value[id]
    let card: Card | undefined
    try {
      card = m?.explain(ch, { text: query.value, index: Math.max(0, [...query.value].indexOf(ch)) })
    } catch {
      card = undefined
    }
    return { id, card }
  })
})

const chartMethod = computed(() => loaded.value[chartIm.value])
const groups = computed(() => chartMethod.value?.roots.groups ?? [])
const rules = computed(() => chartMethod.value?.roots.rules ?? [])
</script>

<template>
  <main class="explore">
    <header class="head">
      <div>
        <p class="eyebrow">字根探索</p>
        <h1 class="serif">一個字，五種拆法</h1>
        <p class="muted">輸入任何字（這裡可以用系統輸入法），比較五種輸入法的編碼與拆字。</p>
      </div>
      <div class="search">
        <Search :size="18" class="si" />
        <input v-model="query" class="input serif" placeholder="輸入想查的字，例如：鬱" aria-label="查字" maxlength="16" />
      </div>
    </header>

    <div v-if="chars.length > 1" class="picker">
      <button v-for="c in chars" :key="c" class="pc serif" :class="{ on: c === focusChar }" @click="focusChar = c">{{ c }}</button>
    </div>

    <section class="cards">
      <div v-for="{ id, card } in cards" :key="id" class="col card">
        <header class="col-head">
          <span class="seal serif">{{ IM_CATALOG[id].short }}</span>
          <span class="nm">{{ IM_CATALOG[id].name }}</span>
          <span class="vr muted">{{ IM_CATALOG[id].version }}</span>
          <span v-if="card?.options[0]" class="code mono">{{ card.options[0].code.toUpperCase() }}</span>
        </header>
        <HintCard v-if="card" :card="card" dense />
        <p v-else-if="failed.includes(id)" class="na muted">字表尚未就緒</p>
        <p v-else class="na muted serif">研墨中…</p>
      </div>
    </section>

    <section class="chart card">
      <header class="chart-head">
        <div>
          <p class="eyebrow">字根表</p>
          <h2 class="serif">{{ IM_CATALOG[chartIm].name }}鍵盤</h2>
        </div>
        <div class="tabs" role="tablist">
          <button
            v-for="id in IM_ORDER"
            :key="id"
            role="tab"
            :aria-selected="chartIm === id"
            class="tab"
            :class="{ on: chartIm === id }"
            @click="chartIm = id; picked = null"
          >
            {{ IM_CATALOG[id].name }}
          </button>
        </div>
      </header>
      <div class="chart-body">
        <div class="kb">
          <RootKeyboard
            v-if="chartMethod"
            :keys="chartMethod.keys"
            :show-space="false"
            :next="picked ? [picked.key] : []"
            :max-unit="64"
            @pick="picked = $event"
          />
        </div>
        <aside class="key-info">
          <template v-if="picked">
            <div class="ki-top">
              <span class="kbd big">{{ keyDisplay(picked.key) }}</span>
              <span class="ki-label serif">{{ picked.label }}</span>
              <span v-if="picked.category" class="chip">{{ picked.category }}</span>
            </div>
            <p v-if="picked.mnemonic" class="ki-mn">{{ picked.mnemonic }}</p>
            <p class="ki-roots serif">
              <span v-for="r in picked.roots" :key="r">{{ r }}</span>
            </p>
            <p v-if="picked.note" class="muted small">{{ picked.note }}</p>
          </template>
          <template v-else>
            <p class="muted">點鍵盤上的任一鍵，看這個鍵有哪些字根、為什麼放在這裡。</p>
            <ul v-if="groups.length" class="groups">
              <li v-for="g in groups" :key="g.name">
                <strong class="serif">{{ g.name }}</strong>
                <span class="mono">{{ g.keys.map(keyDisplay).join(' ') }}</span>
                <span v-if="g.note" class="muted">{{ g.note }}</span>
              </li>
            </ul>
          </template>
        </aside>
      </div>
      <div v-if="rules.length" class="rules">
        <article v-for="r in rules" :key="r.title" class="rule">
          <h3 class="serif">{{ r.title }}</h3>
          <p>{{ r.body }}</p>
          <ul v-if="r.examples?.length">
            <li v-for="ex in r.examples" :key="ex.char + ex.code">
              <span class="ex-ch serif">{{ ex.char }}</span>
              <span class="mono">{{ ex.code.toUpperCase() }}</span>
              <span class="muted">{{ ex.explain }}</span>
            </li>
          </ul>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.explore {
  max-width: 1440px;
  margin: 0 auto;
  padding: 36px 28px 64px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
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
  margin: 6px 0 8px;
}
.search {
  position: relative;
  width: min(360px, 100%);
}
.si {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-3);
}
.search .input {
  width: 100%;
  height: 54px;
  padding-left: 44px;
  font-size: 24px;
  border-radius: 999px;
  letter-spacing: 0.2em;
}
.picker {
  display: flex;
  gap: 8px;
}
.pc {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  font-size: 24px;
  background: var(--paper-card);
  border: 1px solid var(--line);
}
.pc.on {
  background: var(--ink);
  color: var(--paper);
}
.cards {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}
.col {
  min-width: 0;
  box-shadow: var(--shadow-1);
  overflow: hidden;
}
.col-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px 0;
}
.seal {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--cinnabar);
  color: var(--paper-raised);
  font-weight: 900;
  font-size: 16px;
}
.nm {
  font-weight: 600;
  letter-spacing: 0.1em;
}
.vr {
  font-size: 12px;
}
.code {
  margin-left: auto;
  font-weight: 700;
  letter-spacing: 0.12em;
}
.col :deep(.hint) {
  padding: 14px 16px 18px;
}
.col :deep(.hint .top) {
  display: none;
}
.na {
  padding: 30px 16px;
  text-align: center;
}
.chart {
  padding: 24px 26px;
  box-shadow: var(--shadow-1);
}
.chart-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.chart-head h2 {
  font-size: 24px;
  margin-top: 4px;
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
.chart-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 24px;
  align-items: start;
}
.key-info {
  padding: 16px 18px;
  border-radius: var(--r-md);
  background: var(--paper-sunk);
  min-height: 180px;
  font-size: 14px;
  line-height: 1.7;
}
.ki-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.kbd.big {
  font-size: 16px;
  min-width: 34px;
  height: 34px;
}
.ki-label {
  font-size: 32px;
  font-weight: 700;
}
.ki-mn {
  color: var(--ink-2);
}
.ki-roots {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
  font-size: 20px;
}
.ki-roots span {
  display: inline-grid;
  place-items: center;
  min-width: 34px;
  height: 34px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--paper-raised);
  border: 1px solid var(--line);
}
.small {
  font-size: 12px;
  margin-top: 8px;
}
.groups {
  list-style: none;
  padding: 0;
  margin: 12px 0 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.groups li {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  align-items: baseline;
}
.rules {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px dashed var(--line-strong);
}
.rule h3 {
  font-size: 17px;
  margin-bottom: 6px;
}
.rule p {
  font-size: 14px;
  line-height: 1.75;
  color: var(--ink-2);
}
.rule ul {
  list-style: none;
  padding: 0;
  margin: 10px 0 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}
.rule li {
  display: grid;
  grid-template-columns: 28px 64px 1fr;
  gap: 6px;
  align-items: baseline;
}
.ex-ch {
  font-size: 20px;
  font-weight: 600;
}
@media (max-width: 1280px) {
  .cards {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 900px) {
  .cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .chart-body {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 600px) {
  .explore {
    padding: 24px 16px 48px;
  }
  .cards {
    grid-template-columns: 1fr;
  }
  h1 {
    font-size: 28px;
  }
  .chart {
    padding: 18px 14px;
  }
}
</style>

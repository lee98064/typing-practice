<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Plus, Trash2 } from 'lucide-vue-next'
import ImportDialog from '@/components/ImportDialog.vue'
import { useLibrary } from '@/stores/library'
import { useHistory } from '@/stores/history'
import { useSettings } from '@/stores/settings'
import type { ArticleCategory, ArticleMeta } from '@/core/types'

const lib = useLibrary()
const history = useHistory()
const settings = useSettings()
const router = useRouter()

const query = ref('')
const cat = ref<ArticleCategory | '全部'>('全部')
const sort = ref<'default' | 'short' | 'long' | 'easy' | 'hard'>('default')
const importing = ref(false)

onMounted(() => {
  void lib.init()
  void history.init()
})

const CATS: (ArticleCategory | '全部')[] = ['全部', '古文', '詩詞', '近代散文', '法規公文', '原創', '匯入']
const CAT_GLYPH: Record<ArticleCategory, string> = {
  古文: '古',
  詩詞: '詩',
  近代散文: '今',
  法規公文: '法',
  原創: '創',
  匯入: '匯',
}

const visibleCats = computed(() => CATS.filter((c) => c === '全部' || c === '匯入' || (counts.value.get(c) ?? 0) > 0))
const counts = computed(() => {
  const m = new Map<string, number>([['全部', lib.all.length]])
  for (const a of lib.all) m.set(a.category, (m.get(a.category) ?? 0) + 1)
  return m
})

const list = computed<ArticleMeta[]>(() => {
  const q = query.value.trim()
  let arr = lib.all.filter((a) => cat.value === '全部' || a.category === cat.value)
  if (q) arr = arr.filter((a) => a.title.includes(q) || a.author.includes(q) || a.preview.includes(q) || (a.era ?? '').includes(q))
  const s = [...arr]
  if (sort.value === 'short') s.sort((a, b) => a.length - b.length)
  else if (sort.value === 'long') s.sort((a, b) => b.length - a.length)
  else if (sort.value === 'easy') s.sort((a, b) => a.difficulty - b.difficulty)
  else if (sort.value === 'hard') s.sort((a, b) => b.difficulty - a.difficulty)
  return s
})

function back(): string {
  const prev = router.options.history.state.back
  return prev === '/test' ? '/test' : '/'
}

async function pick(a: ArticleMeta) {
  await lib.open(a.id)
  void router.push(back())
}

async function onImported(id: string) {
  importing.value = false
  await lib.open(id)
  void router.push('/')
}

function best(a: ArticleMeta) {
  return history.bestFor(a.id, settings.im)
}
</script>

<template>
  <main class="lib">
    <header class="head">
      <div>
        <p class="eyebrow">文章庫</p>
        <h1 class="serif">挑一篇，研墨開打</h1>
        <p class="muted">{{ lib.builtin.length }} 篇內建文章，皆為公有領域或可自由使用的文本；也可以匯入自己的文章。</p>
      </div>
      <div class="search">
        <Search :size="17" class="si" />
        <input v-model="query" class="input" type="search" placeholder="搜尋篇名、作者或內文…" aria-label="搜尋文章" />
      </div>
    </header>

    <div class="bar">
      <div class="cats" role="tablist" aria-label="分類">
        <button
          v-for="c in visibleCats"
          :key="c"
          role="tab"
          :aria-selected="cat === c"
          class="cat"
          :class="{ on: cat === c }"
          @click="cat = c"
        >
          {{ c }}<span class="n num">{{ counts.get(c) ?? 0 }}</span>
        </button>
      </div>
      <label class="sort">
        <span class="sr-only">排序</span>
        <select v-model="sort" class="input">
          <option value="default">預設排序</option>
          <option value="short">字數少→多</option>
          <option value="long">字數多→少</option>
          <option value="easy">由易到難</option>
          <option value="hard">由難到易</option>
        </select>
      </label>
    </div>

    <p v-if="lib.loadError" class="warn">{{ lib.loadError }}</p>

    <section class="grid">
      <button class="card tile import" @click="importing = true">
        <span class="plus"><Plus :size="26" /></span>
        <span class="serif t">匯入文章</span>
        <span class="muted s">貼上文字或拖入 .txt</span>
      </button>

      <article
        v-for="(a, i) in list"
        :key="a.id"
        class="card tile"
        :class="{ current: lib.current?.id === a.id }"
        :style="{ animationDelay: `${Math.min(i, 16) * 22}ms` }"
        tabindex="0"
        role="button"
        :aria-label="`${a.title}，${a.author}，${a.length} 字`"
        @click="pick(a)"
        @keydown.enter.prevent="pick(a)"
      >
        <span class="glyph serif" aria-hidden="true">{{ CAT_GLYPH[a.category] }}</span>
        <h3 class="serif">{{ a.title }}<span v-if="a.excerpt" class="ex">節選</span></h3>
        <p class="by">{{ a.author }}<template v-if="a.era"> · {{ a.era }}</template></p>
        <p class="pv serif">{{ a.preview }}</p>
        <footer>
          <span class="num len">{{ a.length }} 字</span>
          <span class="diff" :title="`難度 ${a.difficulty}/5`">
            <i v-for="d in 5" :key="d" :class="{ on: d <= a.difficulty }" />
          </span>
          <span v-if="best(a)" class="chip chip-jade num">最佳 {{ Math.round(best(a)!.cpm) }} 字/分</span>
          <button
            v-if="a.category === '匯入'"
            class="btn btn-icon del"
            aria-label="刪除匯入文章"
            @click.stop="lib.removeImported(a.id)"
          >
            <Trash2 :size="15" />
          </button>
        </footer>
      </article>
    </section>

    <p v-if="!list.length && lib.ready" class="empty muted serif">找不到符合的文章</p>

    <ImportDialog v-if="importing" @close="importing = false" @imported="onImported" />
  </main>
</template>

<style scoped>
.lib {
  max-width: 1280px;
  margin: 0 auto;
  padding: 36px 28px 64px;
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
  width: min(380px, 100%);
}
.si {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-3);
}
.search .input {
  width: 100%;
  padding-left: 40px;
  border-radius: 999px;
}
.bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin: 28px 0 20px;
  flex-wrap: wrap;
}
.cats {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.cat {
  height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 14px;
  letter-spacing: 0.08em;
  color: var(--ink-2);
  border: 1px solid var(--line);
  background: var(--paper-card);
}
.cat:hover {
  border-color: var(--ink-4);
}
.cat.on {
  background: var(--ink);
  color: var(--paper);
  border-color: var(--ink);
}
.n {
  margin-left: 6px;
  font-size: 11px;
  opacity: 0.6;
}
.sort select {
  height: 34px;
  border-radius: 999px;
  font-size: 13px;
}
.warn {
  color: var(--cinnabar);
  margin-bottom: 12px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}
.tile {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px 18px 14px;
  min-height: 200px;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  box-shadow: var(--shadow-1);
  transition: transform var(--t-med) var(--ease-out), box-shadow var(--t-med), border-color var(--t-med);
  animation: rise 380ms var(--ease-out) both;
}
.tile:hover,
.tile:focus-visible {
  transform: translateY(-3px);
  box-shadow: var(--shadow-2);
  border-color: var(--line-strong);
}
.tile.current {
  border-color: var(--azurite);
  box-shadow: 0 0 0 3px var(--azurite-soft), var(--shadow-2);
}
.glyph {
  position: absolute;
  right: -6px;
  top: -14px;
  font-size: 92px;
  font-weight: 900;
  line-height: 1;
  color: var(--ink);
  opacity: 0.05;
  pointer-events: none;
}
.tile h3 {
  font-size: 21px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding-right: 30px;
}
.ex {
  margin-left: 8px;
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.1em;
  color: var(--ink-3);
  border: 1px solid var(--line-strong);
  border-radius: 4px;
  padding: 0 4px;
  vertical-align: 3px;
}
.by {
  font-size: 13px;
  color: var(--ink-3);
  letter-spacing: 0.08em;
}
.pv {
  flex: 1;
  margin-top: 4px;
  font-size: 15px;
  line-height: 1.8;
  color: var(--ink-2);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.tile footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--line-strong);
  font-size: 12px;
  color: var(--ink-3);
}
.diff {
  display: inline-flex;
  gap: 3px;
}
.diff i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--ink-5);
}
.diff i.on {
  background: var(--ink-2);
}
.del {
  margin-left: auto;
  width: 28px;
  height: 28px;
}
.import {
  align-items: center;
  justify-content: center;
  text-align: center;
  border-style: dashed;
  border-width: 1.5px;
  background: transparent;
  box-shadow: none;
}
.plus {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: var(--paper-sunk);
  color: var(--ink-2);
  margin-bottom: 6px;
}
.import .t {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.14em;
}
.import .s {
  font-size: 12px;
}
.empty {
  text-align: center;
  padding: 60px 0;
  font-size: 18px;
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
}
@media (max-width: 760px) {
  .lib {
    padding: 24px 16px 48px;
  }
  h1 {
    font-size: 28px;
  }
}
</style>

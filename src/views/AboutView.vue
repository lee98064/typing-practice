<script setup lang="ts">
import { onMounted, shallowRef } from 'vue'
import SealMark from '@/components/SealMark.vue'

interface SourceEntry {
  name: string
  usage: string
  license: string
  url?: string
  notice?: string
}

const sources = shallowRef<SourceEntry[]>([])
onMounted(async () => {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/sources.json`)
    if (res.ok) sources.value = (await res.json()) as SourceEntry[]
  } catch {
    /* offline or not built yet */
  }
})
</script>

<template>
  <main class="about">
    <header>
      <SealMark :size="64" />
      <div>
        <p class="eyebrow">關於</p>
        <h1 class="serif">墨打</h1>
        <p class="lead">
          一個會依你的輸入法給提示的中文打字練習網站。鍵盤保持英文模式，
          由網頁模擬注音、嘸蝦米、行列、大易、倉頡，把每次按鍵變成字根，並在你卡住時解釋這個字為什麼這樣拆。
        </p>
      </div>
    </header>

    <section class="card block">
      <h2 class="serif">非商業用途聲明</h2>
      <p>
        本站為非商業、免費的學習工具，不投放廣告、不收費。內建的嘸蝦米字表授權為「Free for non-commercial use」，
        因此本站及其衍生版本皆不得用於商業目的。
      </p>
    </section>

    <section class="card block">
      <h2 class="serif">資料來源與授權</h2>
      <ul v-if="sources.length" class="src">
        <li v-for="s in sources" :key="s.name">
          <strong class="serif">{{ s.name }}</strong>
          <span class="muted">{{ s.usage }}</span>
          <span class="chip">{{ s.license }}</span>
          <a v-if="s.url" :href="s.url" target="_blank" rel="noopener">{{ s.url }}</a>
          <p v-if="s.notice" class="notice">{{ s.notice }}</p>
        </li>
      </ul>
      <ul v-else class="src">
        <li>
          <strong class="serif">嘸蝦米字表（liu57）</strong>
          <span class="muted">嘸蝦米輸入法字表</span>
          <span class="chip">Free for non-commercial use</span>
          <p class="notice">copyright (c) 行易有限公司 · 社群：蝦米族樂園 · 格式轉換（無附加限制）：趙惟倫，2007</p>
        </li>
      </ul>
    </section>

    <section class="card block">
      <h2 class="serif">內建文章</h2>
      <p>內建文章皆為公有領域作品（作者逝世逾五十年或古籍）、依著作權法第九條不受保護之法令公文，或本站原創並以 CC0 釋出之短文。各篇出處標示於文章資料中。</p>
    </section>
  </main>
</template>

<style scoped>
.about {
  max-width: 860px;
  margin: 0 auto;
  padding: 40px 28px 64px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
header {
  display: flex;
  gap: 22px;
  align-items: flex-start;
  margin-bottom: 10px;
}
.eyebrow {
  font-size: 12px;
  letter-spacing: 0.3em;
  color: var(--cinnabar);
}
h1 {
  font-size: 38px;
  font-weight: 900;
  letter-spacing: 0.2em;
  margin: 4px 0 10px;
}
.lead {
  color: var(--ink-2);
  line-height: 1.9;
}
.block {
  padding: 22px 24px;
  box-shadow: var(--shadow-1);
}
.block h2 {
  font-size: 19px;
  margin-bottom: 10px;
}
.block p {
  color: var(--ink-2);
  line-height: 1.85;
  font-size: 14.5px;
}
.src {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.src li {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px dashed var(--line);
  font-size: 14px;
}
.src a {
  font-size: 12.5px;
  word-break: break-all;
}
.notice {
  width: 100%;
  font-size: 12.5px !important;
  color: var(--ink-3) !important;
}
@media (max-width: 600px) {
  .about {
    padding: 24px 16px 48px;
  }
  header {
    flex-direction: column;
  }
}
</style>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { FileUp, X, Languages } from 'lucide-vue-next'
import { decodeTextFile, looksSimplified, normalizeArticle, toTraditional } from '@/lib/importText'
import { countCjk, useLibrary } from '@/stores/library'

const emit = defineEmits<{ close: []; imported: [id: string] }>()
const lib = useLibrary()

const title = ref('')
const author = ref('')
const text = ref('')
const dragging = ref(false)
const busy = ref(false)
const converting = ref(false)

const cjk = computed(() => countCjk(text.value))
const simplified = computed(() => looksSimplified(text.value))

async function onFile(file: File | undefined) {
  if (!file) return
  text.value = normalizeArticle(await decodeTextFile(file))
  if (!title.value) title.value = file.name.replace(/\.[^.]+$/, '')
}

function onDrop(e: DragEvent) {
  dragging.value = false
  void onFile(e.dataTransfer?.files[0])
}

async function convert() {
  converting.value = true
  try {
    text.value = await toTraditional(text.value)
  } finally {
    converting.value = false
  }
}

async function save() {
  if (!cjk.value) return
  busy.value = true
  const art = await lib.importArticle({ title: title.value, author: author.value, text: normalizeArticle(text.value) })
  busy.value = false
  emit('imported', art.id)
}
</script>

<template>
  <div class="backdrop" @click.self="emit('close')">
    <form class="dialog card" role="dialog" aria-modal="true" aria-labelledby="imp-title" @submit.prevent="save">
      <header>
        <h2 id="imp-title" class="serif">匯入文章</h2>
        <button type="button" class="btn btn-icon" aria-label="關閉" @click="emit('close')"><X :size="18" /></button>
      </header>
      <div class="fields">
        <label>
          <span>標題</span>
          <input v-model="title" class="input" placeholder="例如：我的日記" maxlength="60" />
        </label>
        <label>
          <span>作者（選填）</span>
          <input v-model="author" class="input" placeholder="自訂" maxlength="40" />
        </label>
      </div>
      <label
        class="drop"
        :class="{ dragging }"
        @dragover.prevent="dragging = true"
        @dragleave="dragging = false"
        @drop.prevent="onDrop"
      >
        <textarea v-model="text" class="ta serif" placeholder="把文章貼在這裡，或把 .txt 檔拖進來（支援 UTF-8 與 Big5）" />
        <span class="file">
          <FileUp :size="15" /> 選擇檔案
          <input type="file" accept=".txt,.md,text/plain" @change="onFile(($event.target as HTMLInputElement).files?.[0])" />
        </span>
      </label>
      <div class="info">
        <span class="muted num">{{ cjk }} 個中文字</span>
        <button v-if="simplified" type="button" class="btn btn-ghost btn-sm" :disabled="converting" @click="convert">
          <Languages :size="14" /> {{ converting ? '轉換中…' : '看起來是簡體，轉成繁體' }}
        </button>
      </div>
      <footer>
        <p class="muted note">匯入的文章只存在這台裝置的瀏覽器裡。</p>
        <button type="submit" class="btn btn-ink" :disabled="!cjk || busy">加入文章庫</button>
      </footer>
    </form>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgb(20 16 12 / 0.38);
  backdrop-filter: blur(6px);
}
.dialog {
  width: min(680px, 100%);
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 22px 24px;
  box-shadow: var(--shadow-3);
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
h2 {
  font-size: 22px;
  letter-spacing: 0.12em;
}
.fields {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
}
label > span {
  display: block;
  font-size: 12px;
  letter-spacing: 0.14em;
  color: var(--ink-3);
  margin-bottom: 4px;
}
.input {
  width: 100%;
}
.drop {
  position: relative;
  display: block;
  border-radius: var(--r-md);
  border: 1.5px dashed var(--line-strong);
  transition: border-color var(--t-fast), background var(--t-fast);
}
.drop.dragging {
  border-color: var(--azurite);
  background: var(--azurite-soft);
}
.ta {
  display: block;
  width: 100%;
  min-height: 240px;
  resize: vertical;
  padding: 14px 16px 44px;
  border: 0;
  outline: none;
  background: transparent;
  font-size: 17px;
  line-height: 1.9;
}
.file {
  position: absolute;
  left: 12px;
  bottom: 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 13px;
  letter-spacing: 0.04em;
  color: var(--azurite);
  cursor: pointer;
}
.file input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
.info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
}
footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
.note {
  font-size: 12px;
}
@media (max-width: 560px) {
  .fields {
    grid-template-columns: 1fr;
  }
}
</style>

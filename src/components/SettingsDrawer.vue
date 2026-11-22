<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { X, Upload, RotateCcw } from 'lucide-vue-next'
import ImSwitcher from './ImSwitcher.vue'
import { useSettings, type KeyboardHint, type TextSize, type ThemePref } from '@/stores/settings'
import { useImStore } from '@/stores/im'
import { IM_CATALOG, IM_ORDER } from '@/lib/imCatalog'
import { cinToTableFile } from '@/core/cin'
import { decodeTextFile } from '@/lib/importText'
import type { ImId, PunctMode } from '@/core/types'

const emit = defineEmits<{ close: []; onboarding: [] }>()
const settings = useSettings()
const ims = useImStore()
const cinMsg = ref('')

const PUNCT: { v: PunctMode; t: string; d: string }[] = [
  { v: 'skip', t: '自動跳過', d: '標點、英數自動帶過，只練中文字' },
  { v: 'any-key', t: '按任一鍵帶過', d: '遇到標點時按任意鍵繼續，保留停頓節奏' },
  { v: 'ime', t: '用輸入法打', d: '照輸入法的標點碼輸入，最接近實戰' },
]
const KB: { v: KeyboardHint; t: string }[] = [
  { v: 'always', t: '一直提示' },
  { v: 'after-error', t: '打錯才提示' },
  { v: 'never', t: '不提示' },
]
const THEMES: { v: ThemePref; t: string }[] = [
  { v: 'system', t: '跟隨系統' },
  { v: 'light', t: '宣紙' },
  { v: 'dark', t: '墨夜' },
]
const SIZES: { v: TextSize; t: string }[] = [
  { v: 's', t: '小' },
  { v: 'm', t: '中' },
  { v: 'l', t: '大' },
]

async function importCin(id: ImId, file: File | undefined) {
  if (!file) return
  try {
    const text = await decodeTextFile(file)
    const base = await ims.get(id).catch(() => null)
    const table = cinToTableFile(text, { ...(base?.meta ?? {}), id })
    const n = Object.keys(table.table).length
    if (!n) throw new Error('empty')
    await ims.setOverride(id, table, file.name)
    cinMsg.value = `已套用 ${file.name} 到${IM_CATALOG[id].name}（${n.toLocaleString()} 組碼）`
  } catch {
    cinMsg.value = `無法解析 ${file.name}，請確認是 .cin 格式`
  }
}

async function resetCin(id: ImId) {
  await ims.setOverride(id, null)
  cinMsg.value = `${IM_CATALOG[id].name}已恢復內建字表`
}
</script>

<template>
  <div class="backdrop" @click.self="emit('close')">
    <aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="set-title">
      <header>
        <h2 id="set-title" class="serif">設定</h2>
        <button class="btn btn-icon" aria-label="關閉設定" @click="emit('close')"><X :size="18" /></button>
      </header>

      <section>
        <h3>輸入法</h3>
        <ImSwitcher compact />
      </section>

      <section>
        <h3>標點與英數</h3>
        <div class="radios">
          <label v-for="p in PUNCT" :key="p.v" class="radio" :class="{ on: settings.punctMode === p.v }">
            <input v-model="settings.punctMode" type="radio" name="punct" :value="p.v" />
            <span class="rt">{{ p.t }}</span>
            <span class="rd">{{ p.d }}</span>
          </label>
        </div>
      </section>

      <section>
        <h3>提示</h3>
        <label class="slider">
          <span>同一個字錯 <strong class="num">{{ settings.hintThreshold }}</strong> 次後出現字根卡</span>
          <input v-model.number="settings.hintThreshold" type="range" min="1" max="5" step="1" />
        </label>
        <div class="seg-row">
          <span class="lab">鍵盤發光</span>
          <div class="segs">
            <button v-for="k in KB" :key="k.v" class="seg" :class="{ on: settings.keyboardHint === k.v }" @click="settings.keyboardHint = k.v">{{ k.t }}</button>
          </div>
        </div>
        <label class="switch-row">
          <span class="lab">顯示字根鍵盤</span>
          <input v-model="settings.showKeyboard" type="checkbox" class="sw" />
        </label>
      </section>

      <section>
        <h3>外觀</h3>
        <div class="seg-row">
          <span class="lab">主題</span>
          <div class="segs">
            <button v-for="t in THEMES" :key="t.v" class="seg" :class="{ on: settings.theme === t.v }" @click="settings.theme = t.v">{{ t.t }}</button>
          </div>
        </div>
        <div class="seg-row">
          <span class="lab">字級</span>
          <div class="segs">
            <button v-for="s in SIZES" :key="s.v" class="seg" :class="{ on: settings.textSize === s.v }" @click="settings.textSize = s.v">{{ s.t }}</button>
          </div>
        </div>
      </section>

      <section>
        <h3>自訂字表</h3>
        <p class="hint">可以用自己的 .cin 字表取代內建字表，只存在這台裝置。</p>
        <ul class="cins">
          <li v-for="id in IM_ORDER" :key="id">
            <span class="serif nm">{{ IM_CATALOG[id].name }}</span>
            <label class="btn btn-ghost btn-sm up">
              <Upload :size="14" /> 匯入 .cin
              <input type="file" accept=".cin,.txt" @change="importCin(id, ($event.target as HTMLInputElement).files?.[0])" />
            </label>
            <button class="btn btn-icon reset" :aria-label="`恢復${IM_CATALOG[id].name}內建字表`" @click="resetCin(id)"><RotateCcw :size="14" /></button>
          </li>
        </ul>
        <p v-if="cinMsg" class="msg">{{ cinMsg }}</p>
      </section>

      <footer>
        <button class="btn btn-ghost btn-sm" @click="emit('onboarding')">重看新手導覽</button>
        <RouterLink to="/about" class="about" @click="emit('close')">關於與授權</RouterLink>
      </footer>
    </aside>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 70;
  background: rgb(20 16 12 / 0.28);
  backdrop-filter: blur(3px);
  animation: fade 200ms ease;
}
.drawer {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(420px, 100%);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 22px 24px 28px;
  background: var(--paper-card);
  background-image: var(--grain);
  border-left: 1px solid var(--line);
  box-shadow: var(--shadow-3);
  animation: slide 320ms var(--ease-out);
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
h2 {
  font-size: 24px;
  letter-spacing: 0.16em;
}
h3 {
  font-family: var(--font-sans);
  font-size: 12px;
  letter-spacing: 0.26em;
  color: var(--ink-3);
  font-weight: 600;
  margin-bottom: 10px;
}
.radios {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.radio {
  position: relative;
  display: grid;
  gap: 2px;
  padding: 10px 14px 10px 40px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--paper-raised);
  cursor: pointer;
  transition: border-color var(--t-fast), background var(--t-fast);
}
.radio input {
  position: absolute;
  left: 14px;
  top: 14px;
  accent-color: var(--ink);
}
.radio.on {
  border-color: var(--ink-2);
  background: var(--paper-sunk);
}
.rt {
  font-weight: 600;
  font-size: 14px;
}
.rd {
  font-size: 12.5px;
  color: var(--ink-3);
}
.slider {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 14px;
}
.slider strong {
  color: var(--cinnabar);
  font-size: 16px;
}
.slider input {
  accent-color: var(--cinnabar);
}
.seg-row,
.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.lab {
  font-size: 14px;
}
.segs {
  display: inline-flex;
  padding: 3px;
  border-radius: 999px;
  background: var(--paper-sunk);
  border: 1px solid var(--line);
}
.seg {
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 13px;
  color: var(--ink-2);
}
.seg.on {
  background: var(--ink);
  color: var(--paper);
}
.sw {
  appearance: none;
  width: 42px;
  height: 24px;
  border-radius: 999px;
  background: var(--ink-5);
  position: relative;
  cursor: pointer;
  transition: background var(--t-fast);
}
.sw::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--paper-raised);
  box-shadow: var(--shadow-1);
  transition: transform var(--t-med) var(--ease-out);
}
.sw:checked {
  background: var(--ink);
}
.sw:checked::after {
  transform: translateX(18px);
}
.hint {
  font-size: 13px;
  color: var(--ink-3);
  margin-bottom: 8px;
}
.cins {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.cins li {
  display: flex;
  align-items: center;
  gap: 8px;
}
.nm {
  flex: 1;
  font-size: 15px;
}
.up {
  position: relative;
  overflow: hidden;
}
.up input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
.reset {
  width: 30px;
  height: 30px;
}
.msg {
  margin-top: 8px;
  font-size: 13px;
  color: var(--jade);
}
footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.about {
  font-size: 13px;
}
@keyframes slide {
  from {
    transform: translateX(40px);
    opacity: 0;
  }
}
@keyframes fade {
  from {
    opacity: 0;
  }
}
</style>

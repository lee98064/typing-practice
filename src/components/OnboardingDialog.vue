<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { Check, ArrowRight, ArrowLeft, Keyboard, Lightbulb } from 'lucide-vue-next'
import SealMark from './SealMark.vue'
import { IM_CATALOG, IM_ORDER } from '@/lib/imCatalog'
import { useSettings } from '@/stores/settings'
import { useImStore } from '@/stores/im'
import { isImeComposing, keyDisplay, toImKey } from '@/core/keyboard'

const emit = defineEmits<{ done: [] }>()
const settings = useSettings()
const ims = useImStore()

const step = ref(0)
const probe = ref<HTMLTextAreaElement | null>(null)
const status = ref<'idle' | 'ok' | 'ime'>('idle')
const lastKey = ref('')

const lastRoot = computed(() => {
  if (!lastKey.value || !ims.current) return ''
  return ims.current.preedit(lastKey.value)[0]?.label ?? ''
})

watch(step, (s) => {
  if (s === 1 && !settings.touchMode) nextTick(() => probe.value?.focus())
})

function onProbe(e: KeyboardEvent) {
  if (isImeComposing(e) || (e.key.length === 1 && /[^\x00-\x7f]/.test(e.key))) {
    status.value = 'ime'
    return
  }
  const k = toImKey({ code: e.code, key: e.key, shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, metaKey: e.metaKey, altKey: e.altKey })
  if (k && k !== ' ' && e.key.length === 1) {
    e.preventDefault()
    status.value = 'ok'
    lastKey.value = k
  }
}

function finish() {
  settings.onboarded = true
  emit('done')
}
</script>

<template>
  <div class="backdrop">
    <section class="ob card" role="dialog" aria-modal="true" aria-labelledby="ob-title">
      <div class="steps" aria-hidden="true">
        <span v-for="i in 3" :key="i" :class="{ on: step >= i - 1 }" />
      </div>

      <Transition name="slide" mode="out-in">
        <div v-if="step === 0" key="0" class="pane">
          <SealMark :size="56" />
          <h2 id="ob-title" class="serif">歡迎來到墨打</h2>
          <p class="lead">先選你在用（或想學）的輸入法。打錯時，墨打會告訴你這個字該怎麼拆。</p>
          <div class="ims">
            <button
              v-for="id in IM_ORDER"
              :key="id"
              class="im"
              :class="{ on: settings.im === id }"
              @click="settings.im = id"
            >
              <span class="g serif">{{ IM_CATALOG[id].short }}</span>
              <span class="n">{{ IM_CATALOG[id].name }}</span>
              <span class="v">{{ IM_CATALOG[id].version }}</span>
              <span class="b">{{ IM_CATALOG[id].blurb }}</span>
              <Check v-if="settings.im === id" class="ck" :size="16" />
            </button>
          </div>
        </div>

        <div v-else-if="step === 1 && settings.touchMode" key="1t" class="pane">
          <span class="icon"><Keyboard :size="26" /></span>
          <h2 class="serif">直接點螢幕上的字根鍵盤</h2>
          <p class="lead">
            平板模式下，練習畫面下方會出現{{ IM_CATALOG[settings.im].name }}字根鍵盤，點鍵就能組字；
            最下排有「退格」「空白送字」「清除」。接上實體鍵盤也可以直接打，系統輸入法記得切成英文。
          </p>
          <p class="lead muted">可以在設定的「平板模式」切換。也能把墨打加入主畫面，當成 App 離線使用。</p>
        </div>

        <div v-else-if="step === 1" key="1" class="pane">
          <span class="icon"><Keyboard :size="26" /></span>
          <h2 class="serif">把系統輸入法切成英文</h2>
          <p class="lead">
            墨打自己模擬{{ IM_CATALOG[settings.im].name }}，所以系統要保持在英文模式。
            切好後，在下面框框按任意字母鍵試試看。
          </p>
          <div class="probe" :class="status" @click="probe?.focus()">
            <textarea ref="probe" class="sink" aria-label="輸入法測試區" @keydown="onProbe" @compositionstart="status = 'ime'" @input="($event.target as HTMLTextAreaElement).value = ''" />
            <template v-if="status === 'ok'">
              <span class="pk mono">{{ keyDisplay(lastKey) }}</span>
              <ArrowRight :size="18" class="muted" />
              <span class="pr serif">{{ lastRoot || '—' }}</span>
              <span class="okmsg"><Check :size="16" /> 英文模式，準備好了</span>
            </template>
            <span v-else-if="status === 'ime'" class="bad">偵測到中文輸入法：macOS 按 Caps Lock 或 Control+空白鍵，Windows 按 Shift</span>
            <span v-else class="muted">在這裡按任意字母鍵…</span>
          </div>
        </div>

        <div v-else key="2" class="pane">
          <span class="icon"><Lightbulb :size="26" /></span>
          <h2 class="serif">練習時會發生的事</h2>
          <ul class="how">
            <li><strong>按鍵即時變字根</strong>文章下方會出現像真的輸入法一樣的組字窗和候選字。</li>
            <li v-if="settings.touchMode"><strong>錯三次出現字根卡</strong>同一個字打錯 {{ settings.hintThreshold }} 次，會跳出字根、簡碼和拆法，也可以隨時點「提示」偷看。</li>
            <li v-else><strong>錯三次出現字根卡</strong>同一個字打錯 {{ settings.hintThreshold }} 次，右側會告訴你字根、簡碼和拆法，也可以隨時按 <span class="kbd">Ctrl</span><span class="kbd">/</span> 偷看。</li>
            <li><strong>字根鍵盤會發光</strong>打錯時，下方鍵盤會亮出下一個該按的鍵。</li>
            <li><strong>測驗與紀錄</strong>計時測驗會給成績單，常錯的字可以一鍵特訓。</li>
          </ul>
        </div>
      </Transition>

      <footer>
        <button v-if="step > 0" class="btn btn-ghost" @click="step--"><ArrowLeft :size="16" /> 上一步</button>
        <button v-else class="btn btn-ghost" @click="finish">略過</button>
        <button v-if="step < 2" class="btn btn-ink" @click="step++">下一步 <ArrowRight :size="16" /></button>
        <button v-else class="btn btn-cinnabar" @click="finish">開始練習</button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgb(20 16 12 / 0.42);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.ob {
  width: min(720px, 100%);
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  padding: 26px 30px 22px;
  box-shadow: var(--shadow-3);
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.steps {
  display: flex;
  gap: 6px;
}
.steps span {
  flex: 1;
  height: 3px;
  border-radius: 3px;
  background: var(--line-strong);
  transition: background var(--t-med);
}
.steps span.on {
  background: var(--cinnabar);
}
.pane {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  min-height: 330px;
}
h2 {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 0.12em;
}
.lead {
  color: var(--ink-2);
  line-height: 1.8;
}
.icon {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border-radius: 16px;
  background: var(--azurite-soft);
  color: var(--azurite);
}
.ims {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(118px, 1fr));
  gap: 10px;
  width: 100%;
  margin-top: 6px;
}
.im {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 14px 14px 12px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--paper-raised);
  text-align: left;
  transition: border-color var(--t-fast), transform var(--t-fast), box-shadow var(--t-fast);
}
.im:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-1);
}
.im.on {
  border-color: var(--ink);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ink) 12%, transparent);
}
.g {
  font-size: 30px;
  font-weight: 900;
  line-height: 1.2;
  color: var(--cinnabar);
}
.n {
  font-weight: 700;
  letter-spacing: 0.1em;
}
.v {
  font-size: 12px;
  color: var(--ink-3);
}
.b {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ink-2);
}
.ck {
  position: absolute;
  top: 10px;
  right: 10px;
  color: var(--ink);
}
.probe {
  position: relative;
  width: 100%;
  min-height: 92px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 22px;
  border-radius: var(--r-md);
  border: 1.5px dashed var(--line-strong);
  background: var(--paper-sunk);
  cursor: text;
  flex-wrap: wrap;
}
.probe.ok {
  border-color: var(--jade);
  background: var(--jade-soft);
}
.probe.ime {
  border-color: var(--cinnabar);
  background: var(--cinnabar-soft);
}
.sink {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  pointer-events: none;
}
.pk {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: var(--paper-raised);
  border: 1px solid var(--line-strong);
  font-size: 20px;
  box-shadow: var(--key-shadow);
}
.pr {
  font-size: 40px;
  font-weight: 700;
}
.okmsg {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  color: var(--jade);
  font-weight: 600;
}
.bad {
  color: var(--cinnabar-ink);
  font-size: 14px;
}
.how {
  list-style: none;
  padding: 0;
  margin: 4px 0 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.how li {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: 16px;
  border-left: 3px solid var(--cinnabar-soft);
  color: var(--ink-2);
  line-height: 1.7;
}
.how strong {
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 17px;
}
footer {
  display: flex;
  justify-content: space-between;
}
.slide-enter-active,
.slide-leave-active {
  transition: opacity 200ms, transform 260ms var(--ease-out);
}
.slide-enter-from {
  opacity: 0;
  transform: translateX(16px);
}
.slide-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}
@media (max-width: 560px) {
  .ob {
    padding: 20px 18px 16px;
  }
  h2 {
    font-size: 23px;
  }
}
</style>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Timer, BookOpen, Lightbulb, LightbulbOff } from 'lucide-vue-next'
import TypingStage from '@/components/TypingStage.vue'
import ResultModal from '@/components/ResultModal.vue'
import { useSession } from '@/stores/session'
import { useLibrary } from '@/stores/library'
import { useImStore } from '@/stores/im'
import { useSettings } from '@/stores/settings'
import { useResultActions } from '@/composables/useResultActions'
import { IM_CATALOG } from '@/lib/imCatalog'

const session = useSession()
const lib = useLibrary()
const ims = useImStore()
const settings = useSettings()
const router = useRouter()
const actions = useResultActions()

session.mode = 'test'

const durations = [
  { v: 1, label: '1 分' },
  { v: 3, label: '3 分' },
  { v: 5, label: '5 分' },
  { v: 10, label: '10 分' },
  { v: 0, label: '整篇' },
]

const count = ref<number | null>(null)
const NUMERALS = ['始', '一', '二', '三']
let t: ReturnType<typeof setTimeout> | null = null

function begin() {
  count.value = 3
  const step = () => {
    if (count.value === null) return
    if (count.value === 0) {
      count.value = null
      session.arm()
      return
    }
    count.value--
    t = setTimeout(step, count.value === 0 ? 420 : 700)
  }
  t = setTimeout(step, 700)
}

onMounted(async () => {
  if (!lib.current) await lib.openDefault()
})
onBeforeUnmount(() => {
  if (t) clearTimeout(t)
  session.mode = 'practice'
})

watch(
  () => [ims.current, lib.current, settings.punctMode, settings.testMinutes, settings.testHints, session.mode],
  () => session.reset(),
  { immediate: true },
)

const showSetup = computed(() => !session.armed && count.value === null && !session.result)
</script>

<template>
  <main class="page">
    <TypingStage :locked="!session.armed || !!session.result">
      <template #overlay>
        <Transition name="fade">
          <div v-if="showSetup" class="overlay">
            <div class="setup card">
              <p class="eyebrow">中文打字測驗</p>
              <h2 class="serif">{{ lib.current?.title ?? '尚未選擇文章' }}</h2>
              <p class="muted small">
                {{ IM_CATALOG[settings.im].name }} · {{ lib.current?.length ?? 0 }} 字
                <button class="link" @click="router.push('/library')"><BookOpen :size="13" /> 換文章</button>
              </p>
              <div class="group" role="radiogroup" aria-label="測驗時間">
                <Timer :size="16" class="gi" />
                <button
                  v-for="d in durations"
                  :key="d.v"
                  class="seg"
                  :class="{ on: settings.testMinutes === d.v }"
                  role="radio"
                  :aria-checked="settings.testMinutes === d.v"
                  @click="settings.testMinutes = d.v"
                >
                  {{ d.label }}
                </button>
              </div>
              <button class="toggle" :class="{ on: settings.testHints }" @click="settings.testHints = !settings.testHints">
                <Lightbulb v-if="settings.testHints" :size="16" />
                <LightbulbOff v-else :size="16" />
                {{ settings.testHints ? '允許提示（成績會標註）' : '不顯示提示' }}
              </button>
              <button class="btn btn-cinnabar start" :disabled="!session.state" @click="begin">開始測驗</button>
            </div>
          </div>
        </Transition>
        <div v-if="count !== null" class="overlay">
          <span :key="count" class="count serif">{{ NUMERALS[count] }}</span>
        </div>
      </template>
    </TypingStage>
    <ResultModal
      v-if="session.result"
      :result="session.result"
      :keys="ims.current?.keys"
      @again="actions.again"
      @library="actions.library"
      @drill="actions.drill"
      @close="actions.close"
    />
  </main>
</template>

<style scoped>
.page {
  padding: 28px 28px 40px;
}
.overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  z-index: 7;
}
.setup {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 26px 30px;
  text-align: center;
  box-shadow: var(--shadow-3);
  max-width: calc(100% - 24px);
}
.eyebrow {
  font-size: 12px;
  letter-spacing: 0.3em;
  color: var(--cinnabar);
}
.setup h2 {
  font-size: 26px;
  font-weight: 900;
  letter-spacing: 0.1em;
}
.small {
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--azurite);
  font-size: 13px;
}
.group {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  background: var(--paper-sunk);
  border: 1px solid var(--line);
  margin-top: 6px;
  flex-wrap: wrap;
  justify-content: center;
}
.gi {
  margin: 0 6px 0 8px;
  color: var(--ink-3);
}
.seg {
  height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 14px;
  color: var(--ink-2);
}
.seg.on {
  background: var(--ink);
  color: var(--paper);
}
.toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--ink-3);
  padding: 6px 10px;
  border-radius: 999px;
}
.toggle.on {
  color: var(--gamboge);
}
.start {
  height: 46px;
  padding: 0 34px;
  font-size: 16px;
  letter-spacing: 0.3em;
  margin-top: 4px;
}
.count {
  font-size: 140px;
  font-weight: 900;
  color: var(--ink);
  animation: brush 700ms var(--ease-out);
  text-shadow: 0 6px 30px rgb(0 0 0 / 0.08);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
@keyframes brush {
  0% {
    opacity: 0;
    transform: scale(1.4);
    filter: blur(8px);
  }
  40% {
    opacity: 1;
    filter: blur(0);
  }
  100% {
    opacity: 0.0;
    transform: scale(0.92);
  }
}
@media (max-width: 760px) {
  .page {
    padding: 16px 16px 32px;
  }
}
</style>

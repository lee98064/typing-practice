<script setup lang="ts">
import { computed } from 'vue'
import { Languages } from 'lucide-vue-next'

const emit = defineEmits<{ dismiss: [] }>()
const isMac = computed(() => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent))
</script>

<template>
  <div class="ime-warn card" role="alertdialog" aria-labelledby="ime-warn-title">
    <div class="icon">
      <span class="from serif">中</span>
      <Languages :size="18" class="arrow" />
      <span class="to mono">A</span>
    </div>
    <h3 id="ime-warn-title">請把系統輸入法切成英文</h3>
    <p>墨打會自己模擬你選的輸入法，系統的中文輸入法開著會攔下按鍵。</p>
    <ul>
      <li v-if="isMac"><span class="kbd">Caps Lock</span> 或 <span class="kbd">⌃ Control</span> + <span class="kbd">空白</span></li>
      <li v-else><span class="kbd">Shift</span> 切換中英，或 <span class="kbd">⊞ Win</span> + <span class="kbd">空白</span> 換輸入法</li>
    </ul>
    <button class="btn btn-ink" @click="emit('dismiss')">我切好了，繼續</button>
  </div>
</template>

<style scoped>
.ime-warn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  max-width: 420px;
  padding: 26px 28px 24px;
  text-align: center;
  box-shadow: var(--shadow-3);
  animation: rise 320ms var(--ease-out);
}
.icon {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}
.from,
.to {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  font-size: 22px;
  font-weight: 700;
}
.from {
  background: var(--cinnabar-soft);
  color: var(--cinnabar);
  text-decoration: line-through 2px;
}
.to {
  background: var(--azurite-soft);
  color: var(--azurite);
}
.arrow {
  color: var(--ink-3);
}
h3 {
  font-size: 20px;
}
p {
  font-size: 14px;
  color: var(--ink-2);
  line-height: 1.7;
}
ul {
  list-style: none;
  padding: 0;
  margin: 4px 0 8px;
  font-size: 14px;
  color: var(--ink-2);
}
li {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
}
</style>

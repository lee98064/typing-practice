<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { computed } from 'vue'
import { Moon, Sun, Settings2, PenLine, Timer, BookOpen, Compass, LineChart } from 'lucide-vue-next'
import SealMark from './SealMark.vue'
import ImSwitcher from './ImSwitcher.vue'
import { useSettings } from '@/stores/settings'

const emit = defineEmits<{ settings: [] }>()
const settings = useSettings()
const route = useRoute()

const nav = [
  { to: '/', label: '練習', icon: PenLine },
  { to: '/test', label: '測驗', icon: Timer },
  { to: '/library', label: '文章', icon: BookOpen },
  { to: '/explore', label: '字根', icon: Compass },
  { to: '/history', label: '紀錄', icon: LineChart },
]

const showSwitcher = computed(() => route.path === '/' || route.path === '/test')
</script>

<template>
  <header class="header">
    <RouterLink to="/" class="brand" aria-label="墨打 首頁">
      <SealMark :size="38" />
      <span class="word">
        <span class="name serif">墨打</span>
        <span class="tag">輸入法打字練習</span>
      </span>
    </RouterLink>

    <nav class="nav" aria-label="主要">
      <RouterLink
        v-for="n in nav"
        :key="n.to"
        :to="n.to"
        class="nav-link"
        :class="{ active: route.path === n.to }"
      >
        <component :is="n.icon" :size="16" :stroke-width="1.8" />
        <span>{{ n.label }}</span>
      </RouterLink>
    </nav>

    <div class="tools">
      <ImSwitcher v-if="showSwitcher" />
      <button class="btn-icon btn" :aria-label="settings.isDark ? '切換亮色' : '切換暗色'" @click="settings.cycleTheme()">
        <Sun v-if="settings.isDark" :size="18" :stroke-width="1.8" />
        <Moon v-else :size="18" :stroke-width="1.8" />
      </button>
      <button class="btn-icon btn" aria-label="設定" @click="emit('settings')">
        <Settings2 :size="18" :stroke-width="1.8" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 30;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 24px;
  height: 68px;
  padding: 0 28px;
  background: color-mix(in srgb, var(--paper) 82%, transparent);
  backdrop-filter: blur(14px) saturate(1.2);
  -webkit-backdrop-filter: blur(14px) saturate(1.2);
  border-bottom: 1px solid var(--line);
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--ink);
  text-decoration: none !important;
}
.word {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}
.name {
  font-size: 21px;
  font-weight: 900;
  letter-spacing: 0.18em;
}
.tag {
  font-size: 11px;
  letter-spacing: 0.2em;
  color: var(--ink-3);
}
.nav {
  display: flex;
  justify-content: center;
  gap: 4px;
}
.nav-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  color: var(--ink-2);
  font-size: 14px;
  letter-spacing: 0.08em;
  text-decoration: none !important;
  transition: color var(--t-fast), background var(--t-fast);
}
.nav-link:hover {
  color: var(--ink);
  background: var(--paper-sunk);
}
.nav-link.active {
  color: var(--ink);
  font-weight: 600;
}
.nav-link.active::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 2px;
  width: 18px;
  height: 3px;
  margin-left: -9px;
  border-radius: 3px;
  background: var(--cinnabar);
  /* brush-like taper */
  clip-path: polygon(0 40%, 100% 0, 92% 100%, 6% 90%);
}
.tools {
  display: flex;
  align-items: center;
  gap: 6px;
}
@media (max-width: 1240px) {
  .tag {
    display: none;
  }
  .nav-link span {
    display: none;
  }
  .nav-link {
    padding: 0 11px;
  }
}
@media (max-width: 760px) {
  .header {
    grid-template-columns: auto 1fr;
    height: auto;
    padding: 10px 16px;
    gap: 8px 12px;
  }
  .word {
    display: none;
  }
  .nav {
    justify-content: flex-start;
    overflow-x: auto;
  }
  .tools {
    grid-column: 1 / -1;
    justify-content: space-between;
  }
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import type { LiveStats } from '@/core/types'

const props = defineProps<{ stats: LiveStats; timeLimitMs?: number; compact?: boolean }>()

function mmss(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

const time = computed(() =>
  props.timeLimitMs ? mmss(props.timeLimitMs - props.stats.elapsedMs) : mmss(props.stats.elapsedMs),
)
const lowTime = computed(() => !!props.timeLimitMs && props.timeLimitMs - props.stats.elapsedMs < 15_000)
const acc = computed(() => Math.round(props.stats.accuracy * 1000) / 10)
</script>

<template>
  <dl class="stats" :class="{ compact }">
    <div class="stat main">
      <dt>字/分</dt>
      <dd class="num serif">{{ Math.round(stats.cpm) }}</dd>
    </div>
    <div class="stat">
      <dt>正確率</dt>
      <dd class="num serif">{{ acc }}<small>%</small></dd>
    </div>
    <div class="stat">
      <dt>錯誤</dt>
      <dd class="num serif" :class="{ bad: stats.errors > 0 }">{{ stats.errors }}</dd>
    </div>
    <div class="stat">
      <dt>連擊</dt>
      <dd class="num serif">{{ stats.combo }}</dd>
    </div>
    <div class="stat">
      <dt>{{ timeLimitMs ? '剩餘' : '時間' }}</dt>
      <dd class="num serif" :class="{ bad: lowTime }">{{ time }}</dd>
    </div>
  </dl>
</template>

<style scoped>
.stats {
  display: flex;
  align-items: flex-end;
  gap: 22px;
  margin: 0;
  contain: layout paint;
}
dd {
  min-width: 2ch;
  text-align: right;
}
.stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
}
dt {
  font-size: 11px;
  letter-spacing: 0.2em;
  color: var(--ink-3);
}
dd {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  line-height: 1.1;
  color: var(--ink-2);
}
dd small {
  font-size: 0.6em;
  margin-left: 1px;
}
.main dd {
  font-size: 34px;
  font-weight: 900;
  color: var(--ink);
}
dd.bad {
  color: var(--cinnabar);
}
.compact {
  gap: 14px;
}
.compact dd {
  font-size: 17px;
}
.compact .main dd {
  font-size: 24px;
}
@media (max-width: 640px) {
  .stats {
    gap: 12px;
  }
  dd {
    font-size: 16px;
  }
  .main dd {
    font-size: 24px;
  }
}
</style>

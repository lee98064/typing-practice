<script setup lang="ts">
import { onMounted, watch } from 'vue'
import TypingStage from '@/components/TypingStage.vue'
import ResultModal from '@/components/ResultModal.vue'
import { useSession } from '@/stores/session'
import { useLibrary } from '@/stores/library'
import { useImStore } from '@/stores/im'
import { useSettings } from '@/stores/settings'
import { useResultActions } from '@/composables/useResultActions'

const session = useSession()
const lib = useLibrary()
const ims = useImStore()
const settings = useSettings()
const actions = useResultActions()

session.mode = 'practice'

onMounted(async () => {
  if (!lib.current) await lib.openDefault()
})

watch(
  () => [ims.current, lib.current, settings.punctMode, settings.hintThreshold, session.mode],
  () => session.reset(),
  { immediate: true },
)
</script>

<template>
  <main class="page">
    <TypingStage :locked="!!session.result" />
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
@media (max-width: 760px) {
  .page {
    padding: 16px 16px 32px;
  }
}
</style>

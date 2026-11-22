<script setup lang="ts">
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import SettingsDrawer from './components/SettingsDrawer.vue'
import OnboardingDialog from './components/OnboardingDialog.vue'
import { useSettings } from './stores/settings'

const settings = useSettings()
const showSettings = ref(false)
const showOnboarding = ref(!settings.onboarded)
</script>

<template>
  <AppHeader @settings="showSettings = true" />
  <RouterView v-slot="{ Component, route }">
    <Transition name="page" mode="out-in">
      <component :is="Component" :key="route.path" />
    </Transition>
  </RouterView>
  <SettingsDrawer
    v-if="showSettings"
    @close="showSettings = false"
    @onboarding="showSettings = false; showOnboarding = true"
  />
  <OnboardingDialog v-if="showOnboarding" @done="showOnboarding = false" />
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 180ms ease, transform 220ms var(--ease-out);
}
.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.page-leave-to {
  opacity: 0;
}
</style>

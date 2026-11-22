import { defineStore } from 'pinia'
import { useLocalStorage, useMediaQuery, usePreferredDark } from '@vueuse/core'
import { computed, watchEffect } from 'vue'
import type { ImId, PunctMode } from '@/core/types'

export type ThemePref = 'system' | 'light' | 'dark'
export type KeyboardHint = 'always' | 'after-error' | 'never'
export type TextSize = 's' | 'm' | 'l'
export type TouchPref = 'auto' | 'on' | 'off'

/** Per-viewer conveniences only (localStorage, wrapped by VueUse with try/catch). */
export const useSettings = defineStore('settings', () => {
  const im = useLocalStorage<ImId>('modaa:im', 'boshiamy')
  const theme = useLocalStorage<ThemePref>('modaa:theme', 'system')
  const punctMode = useLocalStorage<PunctMode>('modaa:punct', 'skip')
  const hintThreshold = useLocalStorage<number>('modaa:hint-threshold', 3)
  const keyboardHint = useLocalStorage<KeyboardHint>('modaa:kbd-hint', 'after-error')
  const showKeyboard = useLocalStorage<boolean>('modaa:show-kbd', true)
  const textSize = useLocalStorage<TextSize>('modaa:text-size', 'm')
  const testMinutes = useLocalStorage<number>('modaa:test-minutes', 3)
  const testHints = useLocalStorage<boolean>('modaa:test-hints', false)
  const onboarded = useLocalStorage<boolean>('modaa:onboarded', false)
  const lastArticle = useLocalStorage<string>('modaa:last-article', '')
  /** 平板模式: on-screen tappable root keyboard. 'auto' = touch-only device (no hover). */
  const touchKeyboard = useLocalStorage<TouchPref>('modaa:touch-kbd', 'auto')
  const touchDevice = useMediaQuery('(hover: none) and (pointer: coarse)')
  const touchMode = computed(() =>
    touchKeyboard.value === 'on' || (touchKeyboard.value === 'auto' && touchDevice.value),
  )

  const prefersDark = usePreferredDark()
  const isDark = computed(() =>
    theme.value === 'system' ? prefersDark.value : theme.value === 'dark',
  )

  watchEffect(() => {
    const root = document.documentElement
    if (theme.value === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme.value)
  })

  function cycleTheme() {
    theme.value = isDark.value ? 'light' : 'dark'
  }

  return {
    im,
    theme,
    punctMode,
    hintThreshold,
    keyboardHint,
    showKeyboard,
    textSize,
    testMinutes,
    testHints,
    onboarded,
    lastArticle,
    touchKeyboard,
    touchDevice,
    touchMode,
    isDark,
    cycleTheme,
  }
})

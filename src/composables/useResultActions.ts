import { nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useSession } from '@/stores/session'
import { useLibrary } from '@/stores/library'
import { buildDrillText } from '@/lib/drill'

/** Shared handlers for the 成績單 buttons. */
export function useResultActions() {
  const session = useSession()
  const lib = useLibrary()
  const router = useRouter()

  return {
    again() {
      session.reset()
    },
    library() {
      session.result = null
      void router.push('/library')
    },
    drill(chars: string[]) {
      const source = lib.current?.text ?? ''
      lib.openVirtual('弱字特訓', buildDrillText(chars, source))
      session.mode = 'practice'
      void router.push('/')
      void nextTick(() => session.reset())
    },
    close() {
      session.result = null
    },
  }
}

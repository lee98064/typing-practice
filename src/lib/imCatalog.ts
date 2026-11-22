import type { ImId } from '@/core/types'

export interface ImInfo {
  id: ImId
  name: string
  short: string
  version: string
  /** One-line pitch shown in the switcher / onboarding. */
  blurb: string
  /** Sample "how keys map" for onboarding illustrations. */
  sample: { char: string; keys: string; roots: string }
}

/** Static catalog so the UI can render before any table has loaded. */
export const IM_CATALOG: Record<ImId, ImInfo> = {
  zhuyin: {
    id: 'zhuyin',
    name: '注音',
    short: '注',
    version: '大千鍵盤',
    blurb: '依讀音拼字，聲調鍵送字',
    sample: { char: '我', keys: 'J I 3', roots: 'ㄨ ㄛ ˇ' },
  },
  boshiamy: {
    id: 'boshiamy',
    name: '嘸蝦米',
    short: '嘸',
    version: 'liu57',
    blurb: '字根對應英文字母的形、音、義',
    sample: { char: '明', keys: 'D U E', roots: 'D U E' },
  },
  array: {
    id: 'array',
    name: '行列',
    short: '行',
    version: '行列 30',
    blurb: '以鍵盤行列位置記憶字根',
    sample: { char: '明', keys: '', roots: '' },
  },
  dayi: {
    id: 'dayi',
    name: '大易',
    short: '易',
    version: '大易三碼',
    blurb: '字根依意義歸鍵，最多三碼',
    sample: { char: '明', keys: '', roots: '' },
  },
  cangjie: {
    id: 'cangjie',
    name: '倉頡',
    short: '倉',
    version: '倉頡三代',
    blurb: '哲理、筆畫、人體、字形四類字根',
    sample: { char: '明', keys: 'A B', roots: '日 月' },
  },
}

export const IM_ORDER: ImId[] = ['zhuyin', 'boshiamy', 'array', 'dayi', 'cangjie']

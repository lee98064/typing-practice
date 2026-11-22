import { createRouter, createWebHashHistory } from 'vue-router'
import PracticeView from './views/PracticeView.vue'

/** Hash history: works on any static host (GitHub Pages) and offline without rewrites. */
export const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: PracticeView, meta: { title: '練習' } },
    { path: '/test', component: () => import('./views/TestView.vue'), meta: { title: '測驗' } },
    { path: '/library', component: () => import('./views/LibraryView.vue'), meta: { title: '文章庫' } },
    { path: '/explore', component: () => import('./views/ExploreView.vue'), meta: { title: '字根探索' } },
    { path: '/history', component: () => import('./views/HistoryView.vue'), meta: { title: '紀錄' } },
    { path: '/about', component: () => import('./views/AboutView.vue'), meta: { title: '關於' } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.afterEach((to) => {
  const t = to.meta.title as string | undefined
  document.title = t ? `${t} · 墨打` : '墨打 · 中文打字練習'
})

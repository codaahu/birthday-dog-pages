import { createApp } from 'vue'
import App from './App.vue'
import { createBirthdayRouter } from './core/story/router'
import './shared/theme.css'

const app = createApp(App)
createBirthdayRouter().then(async (router) => {
  app.use(router)
  await router.isReady()
  app.mount('#app')
}).catch((error) => {
  console.error('启动生日网站失败', error)
  const root = document.getElementById('app')
  if (root) {
    root.textContent = '暂时无法打开生日小世界，请刷新后重试。'
  }
})

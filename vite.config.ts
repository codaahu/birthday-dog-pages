import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

// 仅开发服务可读取经命名的预览文件，原图目录保持不可访问
const developerImages = [
  { url: '/__birthday_dev_room.jpg', file: './materials/room-reference.jpg', contentType: 'image/jpeg' },
  { url: '/__birthday_dev_opening/maltese.png', file: './materials/dogs/opening/maltese.png', contentType: 'image/png' },
  { url: '/__birthday_dev_opening/golden.png', file: './materials/dogs/opening/golden.png', contentType: 'image/png' },
  ...['maltese', 'golden'].flatMap((dog) => ['browse', 'arrange', 'wrap', 'gift'].map((mood) => ({
    url: '/__birthday_dev_flower/' + dog + '-' + mood + '.png',
    file: './materials/dogs/flower-shop/' + dog + '-' + mood + '.png',
    contentType: 'image/png',
  }))),
  ...['maltese', 'golden'].flatMap((dog) => ['make', 'ready', 'wish', 'cheer'].map((mood) => ({
    url: '/__birthday_dev_cake/' + dog + '-' + mood + '.png',
    file: './materials/dogs/cake-shop/' + dog + '-' + mood + '.png',
    contentType: 'image/png',
  }))),
  ...['maltese', 'golden'].flatMap((dog) => ['idle', 'play', 'warn', 'result'].map((mood) => ({
    url: '/__birthday_dev_catch/' + dog + '-' + mood + '.png',
    file: './materials/dogs/catch-gifts/' + dog + '-' + mood + '.png',
    contentType: 'image/png',
  }))),
  ...['maltese-host', 'golden-host', 'maltese-think', 'golden-think', 'pair-play', 'pair-warm', 'pair-result'].map((name) => ({
    url: '/__birthday_dev_quiz/' + name + '.png',
    file: './materials/dogs/couple-quiz/' + name + '.png',
    contentType: 'image/png',
  })),
  ...['maltese-idle', 'golden-idle', 'pair-spin', 'pair-open', 'pair-ssr'].map((name) => ({
    url: '/__birthday_dev_gacha/' + name + '.png',
    file: './materials/dogs/gashapon/' + name + '.png',
    contentType: 'image/png',
  })),
  ...['maltese-run', 'golden-run', 'maltese-wait', 'golden-wait'].map((name) => ({
    url: '/__birthday_dev_meeting/' + name + '.png',
    file: './materials/dogs/meeting/' + name + '.png',
    contentType: 'image/png',
  })),
  { url: '/__birthday_dev_ending/pair-celebrate.png', file: './materials/dogs/ending/pair-celebrate.png', contentType: 'image/png' },
  { url: '/__birthday_dev_collection/pair-welcome.png', file: './materials/dogs/collection/pair-welcome.png', contentType: 'image/png' },
] as const

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    {
      name: 'development-reference-images',
      apply: 'serve',
      configureServer(server) {
        for (const image of developerImages) {
          const path = fileURLToPath(new URL(image.file, import.meta.url))
          server.middlewares.use(image.url, async (request, response, next) => {
            if (request.url?.split('?')[0] !== '/') {
              next()
              return
            }
            try {
              const file = await stat(path)
              response.setHeader('Content-Type', image.contentType)
              response.setHeader('Content-Length', file.size)
              response.setHeader('Cache-Control', 'no-store')
              const stream = createReadStream(path)
              stream.on('error', (error) => {
                console.error('读取开发预览图片失败', image.url, error)
                response.destroy(error)
              })
              stream.pipe(response)
            } catch (error) {
              console.error('访问开发预览图片失败', image.url, error)
              response.statusCode = 404
              response.end()
            }
          })
        }
      },
    },
  ],
  server: {
    host: '127.0.0.1',
    port: 5173,
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/materials/**', '**/backups/**', '**/.run/**'] },
  },
  preview: { host: '127.0.0.1', port: 4173 },
  build: { target: 'safari15' },
  test: { setupFiles: ['fake-indexeddb/auto'] },
})

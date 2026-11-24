<script setup lang="ts">
import { onUnmounted, ref } from 'vue'

const props = defineProps<{ artwork: () => SVGSVGElement | undefined; filename: string }>()
const preview = ref('')
const busy = ref(false)
const errorMessage = ref('')
let disposed = false

onUnmounted(() => {
  disposed = true
  if (preview.value) {
    URL.revokeObjectURL(preview.value)
  }
})

/**
 * 将正在显示的矢量成品渲染成 PNG，保持布局与配色
 *
 * @date 2026/11/24 11:45
 */
async function prepare() {
  const svg = props.artwork()
  if (!svg || busy.value) {
    return
  }
  busy.value = true
  errorMessage.value = ''
  let source: string | undefined
  try {
    const copy = svg.cloneNode(true) as SVGSVGElement
    const { width, height } = svg.viewBox.baseVal
    copy.querySelectorAll('[data-editor]').forEach((element) => element.remove())
    copy.setAttribute('width', String(width))
    copy.setAttribute('height', String(height))

    for (const artwork of copy.querySelectorAll('image')) {
      const href = artwork.getAttribute('href')
      if (href && !href.startsWith('data:')) {
        const response = await fetch(href)
        if (!response.ok) {
          throw new Error('无法读取插牌素材')
        }
        const blob = await response.blob()
        const embedded = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result))
          reader.onerror = () => reject(reader.error)
          reader.readAsDataURL(blob)
        })
        artwork.setAttribute('href', embedded)
      }
    }

    // 将页面同一份画面栅格化，保留长按可保存的原尺寸预览
    source = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml;charset=utf-8' }))
    const image = new Image()
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('无法读取作品画面'))
      image.src = source!
    })
    const canvas = document.createElement('canvas')
    canvas.width = width * 3
    canvas.height = height * 3
    const painter = canvas.getContext('2d')
    if (!painter) {
      throw new Error('浏览器未提供 Canvas 绘制环境')
    }
    painter.drawImage(image, 0, 0, canvas.width, canvas.height)
    const png = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('无法编码 PNG'))
        }
      }, 'image/png')
    })
    if (!disposed) {
      if (preview.value) {
        URL.revokeObjectURL(preview.value)
      }
      preview.value = URL.createObjectURL(png)
    }
  } catch (error) {
    console.error('导出作品图片失败', error)
    errorMessage.value = '暂时没能生成图片，请再试一次。'
  } finally {
    if (source) {
      URL.revokeObjectURL(source)
    }
    busy.value = false
  }
}
</script>

<template>
  <button v-if="!preview" type="button" class="secondary" :disabled="busy" @click="prepare">
    {{ busy ? '正在生成图片…' : '保存图片' }}
  </button>
  <p v-if="errorMessage" role="alert">{{ errorMessage }}</p>
  <figure v-if="preview" class="download">
    <img :src="preview" alt="可长按保存的作品 PNG" />
    <figcaption>微信内可长按图片保存。</figcaption>
    <a class="secondary" :href="preview" :download="filename + '.png'">下载 PNG</a>
  </figure>
</template>

<style scoped>
.download { margin: .5rem 0; width: 100%; }
.download img { display: block; width: min(100%, 16rem); border-radius: .75rem; }
figcaption { margin: .35rem 0; font-size: .875rem; }
</style>

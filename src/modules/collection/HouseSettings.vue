<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import type { CollectionControls } from '../../core/story/contract'
import type { BackupService } from '../../core/storage/backup'
import type { Settings } from '../../core/storage/types'

const props = defineProps<{ backup: BackupService; controls: CollectionControls }>()
const emit = defineEmits<{ imported: [] }>()
const prepared = shallowRef<{ text: string; counts: ReturnType<BackupService['preview']> }>()
const error = ref('')
const status = ref('')
const busy = ref(false)

/**
 * 应用音频设置并显示失败提示
 *
 * @date 2026/11/24 19:29
 * @param changes 当前修改项
 */
async function update(changes: Partial<Settings>) {
  error.value = ''
  try {
    await props.controls.updateSettings(changes)
  } catch (cause) {
    console.error('写入生日小屋设置失败', cause)
    error.value = '设置没有保存，请重试。'
  }
}

/**
 * 导出网页可重绘的 JSON 存档
 *
 * @date 2026/11/24 19:29
 */
async function download() {
  error.value = ''
  status.value = ''
  busy.value = true
  try {
    const text = await props.backup.exportJson()
    const browserUrl = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = browserUrl
    link.download = 'birthday-dog-' + new Date().toISOString().slice(0, 10) + '.json'
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(browserUrl), 1000)
  } catch (cause) {
    console.error('导出生日小屋存档失败', cause)
    error.value = '暂时无法导出，请重试。'
  } finally {
    busy.value = false
  }
}

/**
 * 读取所选文件并显示合并预览，暂不写入
 *
 * @date 2026/11/24 19:29
 * @param event 文件输入控件的变更事件
 */
async function preview(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }
  prepared.value = undefined
  error.value = ''
  status.value = ''
  busy.value = true
  try {
    if (file.size > 8 * 1024 * 1024) {
      throw new Error('备份文件超过 8 MB')
    }
    const text = await file.text()
    prepared.value = { text, counts: props.backup.preview(text) }
  } catch (cause) {
    console.error('校验生日小屋备份失败', cause)
    error.value = cause instanceof SyntaxError ? '这个文件不是有效的 JSON 备份。'
      : cause instanceof Error ? cause.message : '无法打开这个备份文件。'
  } finally {
    input.value = ''
    busy.value = false
  }
}

/**
 * 将已预览的备份合并到当前档案，持久化后刷新页面统计
 *
 * @date 2026/11/24 19:29
 */
async function merge() {
  if (!prepared.value || busy.value) {
    return
  }
  error.value = ''
  status.value = ''
  busy.value = true
  try {
    await props.backup.merge(prepared.value.text)
    prepared.value = undefined
    status.value = '存档已合并。'
    emit('imported')
  } catch (cause) {
    console.error('合并生日小屋存档失败', cause)
    error.value = '无法合并这个备份，当前存档已保留。'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section class="settings" aria-labelledby="settings-title">
    <h2 id="settings-title">小屋设置</h2>
    <label><span>背景音乐</span><input type="checkbox" :checked="controls.settings.music"
      @change="update({ music: ($event.target as HTMLInputElement).checked })" /></label>
    <label><span>游戏音效</span><input type="checkbox" :checked="controls.settings.sound"
      @change="update({ sound: ($event.target as HTMLInputElement).checked })" /></label>
    <label><span>音量</span><input type="range" min="0" max="1" step=".05" :value="controls.settings.volume"
      @change="update({ volume: Number(($event.target as HTMLInputElement).value) })" /></label>
    <h3>存档备份</h3>
    <p>备份保存在本机。照片原文件仍放在相册目录。</p>
    <div class="backup-actions">
      <button type="button" :disabled="busy" @click="download">导出存档</button>
      <label class="file-input"><span>选择备份</span><input type="file" accept=".json,application/json" :disabled="busy" @change="preview" /></label>
    </div>
    <div v-if="prepared" class="preview">
      <p>文件里有 {{ prepared.counts.works }} 件作品、{{ prepared.counts.games }} 局游戏、{{ prepared.counts.tickets }} 张券和 {{ prepared.counts.completions }} 次通关。</p>
      <p>确认后合并到现有存档。</p>
      <button type="button" :disabled="busy" @click="merge">确认合并</button>
      <button type="button" :disabled="busy" @click="prepared = undefined">取消</button>
    </div>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="status" role="status">{{ status }}</p>
  </section>
</template>

<style scoped>
.settings { text-align: left; border: 1px solid #ddbb91; border-radius: .75rem; padding: .85rem; background: #fff6e5; color: #654631; }
h2 { text-align: center; margin: 0 0 .5rem; font-size: 1.22rem; } h3 { margin: .6rem 0; }
.settings > label { min-height: 44px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px dashed #dfbd9a; }
input { accent-color: #875d41; }
.backup-actions { display: flex; flex-wrap: wrap; gap: .42rem; }
button, .file-input { min-height: 44px; border: 1px solid #bd895d; border-radius: .54rem; color: inherit; background: #ffebc0; padding: .32rem .65rem; }
.file-input { position: relative; display: inline-flex; align-items: center; cursor: pointer; }
.file-input input { position: absolute; opacity: 0; width: 100%; height: 100%; inset: 0; cursor: pointer; }
.file-input:focus-within { outline: 3px solid #845052; }
.preview { border: 1px dashed #c99669; border-radius: .51rem; margin-top: .65rem; padding: .05rem .53rem .45rem; }
.preview button + button { margin-left: .35rem; }
</style>

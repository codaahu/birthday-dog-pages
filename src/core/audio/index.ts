import { assets, type MusicScene } from '../../config/assets'
import { defaultSettings, type Settings } from '../storage/types'

export class SceneAudio {
  private player?: HTMLAudioElement
  private scene: MusicScene = 'gentle'
  private settings = defaultSettings
  private activated = false

  private readonly visibility = () => {
    if (document.hidden) {
      this.player?.pause()
    } else {
      this.sync()
    }
  }

  /** 监听页面可见性
   * @date 2026/11/24 10:54
   */
  constructor() {
    document.addEventListener('visibilitychange', this.visibility)
  }

  /** 接收首次主动操作后尝试播放
   * @date 2026/11/24 10:54
   */
  activate() {
    this.activated = true
    this.sync()
  }

  /** 应用存档设置并切换背景音乐
   * @date 2026/11/24 10:54
   * @param scene 场景音乐槽位
   * @param settings 已保存的音频偏好
   */
  configure(scene: MusicScene, settings: Settings) {
    this.scene = scene
    this.settings = settings
    this.sync()
  }

  /** 释放播放器和监听器
   * @date 2026/11/24 10:54
   */
  dispose() {
    document.removeEventListener('visibilitychange', this.visibility)
    this.release()
  }

  /** 同步播放器资源及播放状态，遵守主动操作和页面可见性约束
   * @date 2026/11/24 10:54
   */
  private sync() {
    const path = assets.music[this.scene]
    if (!path) {
      this.release()
      return
    }

    const source = new URL(import.meta.env.BASE_URL + path, document.baseURI).href
    if (this.player?.src !== source) {
      this.release()
      this.player = new Audio(source)
      this.player.loop = true
    }
    this.player.volume = this.settings.volume
    if (this.activated && this.settings.music && !document.hidden) {
      if (this.player.paused) {
        this.player.play().catch((error) => console.error('背景音乐未开始播放', error))
      }
    } else {
      this.player.pause()
    }
  }

  /** 释放当前音源
   * @date 2026/11/24 10:54
   */
  private release() {
    if (this.player) {
      this.player.pause()
      this.player.removeAttribute('src')
      this.player.load()
      this.player = undefined
    }
  }
}

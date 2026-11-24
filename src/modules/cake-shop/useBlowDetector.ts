import { onMounted, onUnmounted, ref } from 'vue'

/**
 * 仅在用户主动授权后使用本机麦克风估算吹气音量
 *
 * @date 2026/11/24 11:51
 * @param onBlow 检测到持续气流时调用
 * @return 启动、关闭及状态提示，可与手动吹气并用
 */
export function useBlowDetector(onBlow: () => void) {
  const listening = ref(false)
  const acquiring = ref(false)
  const message = ref('')
  let stream: MediaStream | undefined
  let audio: AudioContext | undefined
  let frame: number | undefined
  let generation = 0

  /** 释放麦克风、音频分析器和 RAF
   * @date 2026/11/24 11:51
   */
  function stop() {
    generation += 1
    if (frame !== undefined) {
      cancelAnimationFrame(frame)
      frame = undefined
    }
    stream?.getTracks().forEach((track) => track.stop())
    stream = undefined
    if (audio) {
      void audio.close().catch((error) => console.error('关闭吹蜡烛音频分析器失败', error))
      audio = undefined
    }
    listening.value = false
    acquiring.value = false
  }

  /** 切后台时立即释放麦克风
   * @date 2026/11/24 11:51
   */
  function onVisibility() {
    if (document.hidden && (listening.value || acquiring.value)) {
      stop()
      message.value = '已关闭麦克风，可以手动吹灭蜡烛。'
    }
  }

  onMounted(() => document.addEventListener('visibilitychange', onVisibility))
  onUnmounted(() => {
    document.removeEventListener('visibilitychange', onVisibility)
    stop()
  })

  /** 请求麦克风权限，仅用临时缓冲区分析音量
   * @date 2026/11/24 11:51
   */
  async function start() {
    if (acquiring.value || listening.value) {
      return
    }
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.AudioContext) {
      message.value = '当前浏览器无法使用麦克风，可以手动吹灭蜡烛。'
      return
    }

    const request = ++generation
    acquiring.value = true
    message.value = ''
    try {
      const session = new AudioContext()
      audio = session
      const activation = session.resume().catch((error) => console.error('激活吹蜡烛音频分析器失败', error))
      const input = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, autoGainControl: false, noiseSuppression: false },
        video: false,
      })
      if (generation !== request) {
        input.getTracks().forEach((track) => track.stop())
        return
      }
      stream = input
      await activation
      if (generation !== request) {
        return
      }

      const meter = session.createAnalyser()
      meter.fftSize = 512
      session.createMediaStreamSource(input).connect(meter)
      const samples = new Uint8Array(meter.fftSize)
      let loudSince: number | undefined
      listening.value = true
      message.value = '对着麦克风吹一口气吧。'

      const measure = (time: number) => {
        meter.getByteTimeDomainData(samples)
        let energy = 0
        for (const sample of samples) {
          energy += ((sample - 128) / 128) ** 2
        }
        if (Math.sqrt(energy / samples.length) > .12) {
          loudSince ??= time
          if (time - loudSince >= 125) {
            stop()
            message.value = ''
            onBlow()
            return
          }
        } else {
          loudSince = undefined
        }
        frame = requestAnimationFrame(measure)
      }
      frame = requestAnimationFrame(measure)
    } catch (error) {
      if (generation === request) {
        console.error('使用麦克风吹蜡烛失败', error)
        stop()
        message.value = '麦克风未开启，可以手动吹灭蜡烛。'
      }
    } finally {
      if (generation === request) {
        acquiring.value = false
      }
    }
  }

  return { listening, acquiring, message, start, stop }
}

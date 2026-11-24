import { personal } from '../../config/personal'

const beijingDay = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric', month: 'numeric', day: 'numeric', timeZone: personal.timeZone,
})
const beijingTime = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric', month: 'numeric', day: 'numeric',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: personal.timeZone,
})

/**
 * 按绝对时间计算倒计时，并用北京时间划分见面当天与次日
 *
 * @date 2026/11/24 18:46
 * @param meetingAt 带时区的约定时间，缺失时只展示邀请
 * @param now 当前时间戳，单位毫秒
 * @return 文案状态及北京时间，等待时附天、时、分、秒
 */
export function meetingMoment(meetingAt: string | undefined, now: number) {
  const target = meetingAt ? Date.parse(meetingAt) : NaN
  if (!Number.isFinite(target)) {
    return { stage: 'waiting', date: null, countdown: null } as const
  }

  const date = beijingTime.format(target)
  if (now >= target) {
    const stage = beijingDay.format(now) === beijingDay.format(target) ? 'arrived' : 'after'
    return { stage, date, countdown: null } as const
  }

  // 不在最后一秒提前显示零，也不在到点后显示负值
  const seconds = Math.ceil((target - now) / 1000)
  return {
    stage: 'waiting',
    date,
    countdown: [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24,
      Math.floor(seconds / 60) % 60, seconds % 60],
  } as const
}

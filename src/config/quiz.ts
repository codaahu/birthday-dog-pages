export interface QuizQuestion {
  id: string
  text: string
  options: readonly (readonly [text: string, feedback: string])[]
  photoId?: string
}

export const quiz = {
  version: 1,
  questions: [
    { id: 'travel-duty', text: '生日派对的小狗助手可以做什么？', options: [
      ['负责拍照', '拍到满意为止！'], ['负责搬礼物', '礼物搬运员已就位！'], ['负责布置会场', '彩旗已经挂好啦！'], ['以上全部', '恭喜解锁全能派对助手！'],
    ] },
    { id: 'bad-photo', text: '派对纪念照拍糊了，应该怎么办？', options: [
      ['再拍一张', '好的，收到！'], ['换个角度再拍', '正在努力寻找角度！'], ['拍到满意为止', '摄影师不敢下班！'], ['以上都是', '小狗表示没有异议！'],
    ] },
    { id: 'birthday-boss', text: '今天谁说了算？', options: [
      ['派对助手', '回答无效，重新判定为寿星大人！'], ['白色小狗', '白色小狗也听寿星的！'], ['金毛小狗', '金毛小狗举双手反对！'], ['寿星大人', '完全正确，今日寿星最大！'],
    ] },
    { id: 'weekend-first', text: '到达小狗派对后，你想先做什么？', options: [
      ['吃好吃的', '美食正在准备中！'], ['收花花', '花花等待签收！'], ['拍纪念照', '摄影师已经就位！'], ['和小狗击掌', '击掌成功！'],
    ] },
  ] satisfies QuizQuestion[],
  extraQuestions: [] as QuizQuestion[],
  result: ['默契度100%', '本次考试最终解释权归寿星大人所有。', '天生一对'],
}

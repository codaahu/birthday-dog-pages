export interface QuizQuestion {
  id: string
  text: string
  options: readonly (readonly [text: string, feedback: string])[]
  photoId?: string
}

export const quiz = {
  version: 1,
  questions: [
    { id: 'travel-duty', text: '和你一起出去旅游，男朋友的主要职责是什么？', options: [
      ['负责拍照', '拍到满意为止！'], ['负责拿东西', '人工行李架已上线！'], ['负责规划路线', '专属导航已就位！'], ['以上全部', '恭喜解锁全能男朋友！'],
    ] },
    { id: 'bad-photo', text: '如果男朋友拍的照片不好看，应该怎么办？', options: [
      ['再拍一张', '好的，收到！'], ['换个角度再拍', '正在努力寻找角度！'], ['拍到满意为止', '摄影师不敢下班！'], ['以上都是', '小狗表示没有异议！'],
    ] },
    { id: 'birthday-boss', text: '今天谁说了算？', options: [
      ['男朋友', '回答无效，重新判定为寿星大人！'], ['白色小狗', '白色小狗也听寿星的！'], ['金毛小狗', '金毛小狗举双手反对！'], ['寿星大人', '完全正确，今日寿星最大！'],
    ] },
    { id: 'weekend-first', text: '周末见面之后，第一件事应该做什么？', options: [
      ['吃好吃的', '美食正在准备中！'], ['收花花', '花花等待签收！'], ['拍合照', '摄影师已经就位！'], ['先抱抱', '抱抱预约成功！'],
    ] },
  ] satisfies QuizQuestion[],
  extraQuestions: [] as QuizQuestion[],
  result: ['默契度100%', '本次考试最终解释权归寿星大人所有。', '天生一对'],
}

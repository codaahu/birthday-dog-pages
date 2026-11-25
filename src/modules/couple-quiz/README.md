# 默契问答

运行 `npm run dev` 后打开 [默契问答独立预览](http://127.0.0.1:5173/#/dev/couple-quiz)。

每题点一个选项，看小白、小金毛的反应和原文反馈，再点下一题。四道题全部回答后可看「默契度 100%」「天生一对」。答题进度与实际选择逐题保存，刷新能继续本轮。结算按轮次 ID 保存，并展示本轮首次解锁的组合成就。历史记录不会随题库更新而变化。

- `Module.vue` 管理单选、进度恢复、收录和主线完成事件
- `QuizStage.vue` 绘制问答场景及小白、小金毛的主持、反应和结算动作
- `config.ts` 定义四道已确认题目和 `extraQuizQuestions` 扩展入口，配置扩展题或修改题库时更新 `quizVersion`
- `quiz.ts` 筛选可用题目并构造答案快照，扩展题的 `photoId` 对应正式照片清单 ID，缺图时跳过
- `module.test.ts` 对照 PRD 题目及反馈原文，并验证缺图和单选快照，可用 `npm run test -- src/modules/couple-quiz` 运行

接礼物和问答共用游乐场章节及一枚奖励币，独立调试与收藏玩法只写历史结果。开发角色图位于 `materials/dogs/couple-quiz/`，可按原文件名替换。正式角色配置见 [素材说明](../../../materials/ASSETS.md)。

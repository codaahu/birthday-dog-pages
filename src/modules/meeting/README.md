# 周末见面站

独立开发预览 [http://127.0.0.1:5173/#/dev/meeting](http://127.0.0.1:5173/#/dev/meeting)。

执行 `npm run dev` 后打开上述地址。[到点预览](http://127.0.0.1:5173/#/dev/meeting?scene=arrived) 从约定时刻起计时，使用独立的开发存档。等候预览随实际时间变化。

- `Module.vue` 是三种运行模式共用的模块入口
- `MeetingScene.vue` 绘制小路和路牌，播放小金毛与小白的入场
- `src/core/story/meetingClock.ts` 按北京时间判断等候、到点及次日状态，与生日小屋共用
- `config.ts` 管理标题、主题、音频场景及实施阶段
- `types.ts` 声明运行上下文与进度草稿
- `module.test.ts` 校验入口和时间边界，可用 `npm run test -- src/modules/meeting` 运行

入场时点「跳过动画」可直接停在见面前一刻。点「领取最后一份生日祝福」查看信件。刷新会恢复动画与信件状态，倒计时继续按约定时间计算。点「完成签收」上报完成，由主线负责进入下一页。

约定时间与北京时间时区在 `src/config/personal.ts`，信件和文案在 `src/config/dialogue.ts`。角色素材的来源和替换路径见 [素材清单](../../../materials/ASSETS.md)。

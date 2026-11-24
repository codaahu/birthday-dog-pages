# 生日开场

运行 `npm run dev` 后打开 [独立预览](http://127.0.0.1:5173/#/dev/opening) 或 [重玩对白](http://127.0.0.1:5173/#/dev/opening?scene=replay)。独立预览会恢复对应场景已有的对白草稿。首次主线从 [剧情开场](http://127.0.0.1:5173/#/story/opening) 进入。

金毛送信入场、白狗探头后，可点信封本体或「点击拆开生日礼物」。蜡封解除、封口翻开和信纸抽出后，按提示逐句对话。跳过动画随时可以继续。当系统启用减少动态效果时，拆信后直接展示第一句。点击两只小狗和爱心可以体验原有彩蛋。

对白角色显示为「小白」和「小金毛」。首次解锁成就会在顶部停留约三秒。

- `Module.vue` 负责对白、阶段切换、彩蛋以及原有草稿写入和完成事件
- `OpeningStage.vue` 负责脚印、角色图层、动作和舞台热区；`OpeningEnvelope.vue` 绘制并打开信封
- 开发版的独立预览和本地主线读取 `materials/dogs/opening/maltese.png` 与 `golden.png`。可直接用自己的透明 PNG 替换同名文件并刷新浏览器。来源及网页授权状态见 `materials/ASSETS.md`
- 确认网页使用权的素材通过 `src/config/assets.ts` 接入 `happy`、`run`、`speak`、`wag`、`lie` 和 `sleep`。缺少动作时使用同一角色的 `happy`，CSS 继续提供入场和对白反馈
- `flow.ts` 保留原对白页码，按页对齐说话角色

验收对照视觉补充包中的原图 01–03 和手机稿 01–02。查看 390×844 的封面、抽信和逐句对白，确认主操作首屏可达，并在 375 和 430 宽复验。导出的实际运行截图在项目 `.run/opening-visual-qa/`。

`npm run test -- src/modules/opening` 验证入口、对白页码恢复与角色顺序。

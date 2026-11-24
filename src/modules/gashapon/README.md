# 小狗扭蛋铺

运行 `npm run dev` 后打开 [小狗扭蛋铺独立预览](http://127.0.0.1:5173/#/dev/gashapon)。默认使用四枚狗狗币测试档，也可打开 [已领取 SSR 的开发场景](http://127.0.0.1:5173/#/dev/gashapon?scene=ssr)。

点投币口、旋钮或底部投币按钮。旋钮转动后扭蛋滚到出蛋口，点扭蛋即可开壳。刷新后可继续开原来的扭蛋，已开完的券可从「我的票夹」查看、保存图片或二次确认兑现。首次主线揭晓四颗后继续，已用券保留盖章记录。

- `Module.vue` 管理投币、开壳动画、券详情、刷新恢复及完成事件
- `GachaMachine.vue` 与 `GachaCast.vue` 绘制机器和角色动作
- `TicketArtwork.vue` 绘制 R、SR、SSR 券面及状态印章，导出复用同一画面
- `tickets.ts` 负责券面文案、状态和北京时间显示，`core/rewards` 负责权威余额、扣币、开壳和兑现记录

运行 `npm run test -- src/modules/gashapon tests/storage.test.ts` 验证券面状态、待揭晓恢复、扣币去重和 SSR 唯一性。开发角色图可按同名文件替换，来源见 [素材说明](../../../materials/ASSETS.md)。

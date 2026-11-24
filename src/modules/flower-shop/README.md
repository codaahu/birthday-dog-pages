# 小狗花店

运行 `npm run dev`，打开 [花店独立预览](http://127.0.0.1:5173/#/dev/flower-shop)。

在贴纸盘点选花材与花瓣色，再点添加，搭配 3–9 枝。直接在工作台拖动花冠，或在「微调花枝」使用方向按钮。包装纸、丝带和贺卡会同步显示。包装后可查看保存在本机的虚拟订单、复制清单或生成 PNG，微信里可以尝试长按同一预览图保存。另做一束会创建新作品 ID。

- `Module.vue` 管理编辑、订单请求、成品预览及模块完成事件
- `BouquetArtwork.vue` 与 `FlowerBloom.vue` 绘制包装和八种手绘花材
- `FlowerCounter.vue` 绘制花店工作台，给小白和小金毛分别切换迎客、选花、包装和送花图层
- `config.ts` 管理可选花材、色彩、包装和贺卡，`bouquet.ts` 管理排花、摆放边界、清单及订单

每次编辑通过公共服务保存草稿。包装时作品和花艺大师成就一次写入 IndexedDB。剧情模式继续后由主控发章和币；开发以及收藏玩法仅保存作品和成就。虚拟订单供参考，留在本机。

`npm run test -- src/modules/flower-shop` 校验添加上限、重复花材、清单和稳定订单号。

本地预览的独立角色 PNG 位于 `materials/dogs/flower-shop/`，可同名替换。正式版角色登记在共享 `assets.dogs` 下的 `flower-browse`、`flower-arrange`、`flower-wrap`、`flower-gift`。素材来源和网页授权状态见 [素材说明](../../../materials/ASSETS.md)。

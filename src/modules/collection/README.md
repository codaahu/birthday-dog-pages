# 永久生日小屋

独立开发预览 [http://127.0.0.1:5173/#/dev/collection](http://127.0.0.1:5173/#/dev/collection)。

执行 `npm run dev` 后打开上述地址。默认使用独立的「生日小屋 · 示例收藏」，可查看样例作品和游戏、切换导航并练习重玩或合并备份。[无素材预览](http://127.0.0.1:5173/#/dev/collection?scene=empty) 便于检查没有照片和作品时的页面。

- `Module.vue` 是正式小屋和开发场景共用入口
- `HouseShelf.vue` 展示收藏、记录及完整生日信，`HouseSticker.vue` 绘制首页贴纸
- `HouseSettings.vue` 处理音频设置、备份导出、导入预览及确认
- `src/core/storage/backup.ts` 统一校验并事务合并备份，`tests/backup.test.ts` 验证往返、唯一发行与错误回滚
- `config.ts` 管理标题、主题、音频场景及实施阶段
- `types.ts` 声明模块接收的运行上下文
- `module.test.ts` 校验独立配置及入口，可用 `npm run test -- src/modules/collection` 运行

首次通关后由主控解锁和进入小屋。作品详情和再次制作复用原工作台，另存时使用新作品 ID。备份导出的 JSON 包含本地历史及可重绘数据，原始照片仍单独管理。周末线下续集等待确认素材，当前入口不显示。角色素材见 [素材清单](../../../materials/ASSETS.md)。

# 素材来源与缺口

| 素材 | 当前状态 | 接入位置 |
| --- | --- | --- |
| 礼物小房间参考原图 | 用户提供的原始文件，开发预览可看，正式包排除 | `materials/room-reference.jpg` |
| 手绘房间图与热区 | 以内置 ImageGen 清理用户提供的 `materials/scenes/memory-room-scene.png`，保留主要物件并按成图校准热区 | `public/assets/room/memory-room-scene.webp` 与 `src/modules/memory-room/room.ts` |
| 回忆小屋页首与欢迎对白 | 按用户提供的整页参考重做布局及线描装饰。对白两侧在本地预览复用下方角色原画，正式版角色通过共享素材配置接入 | `src/modules/memory-room/RoomPageFrame.vue` 与 `src/config/assets.ts` |
| 八类私人照片 | 开发场景可用有标识的示例，狗狗秘密相册的原始照片仍待提供 | `materials/photos/{couple,portrait,travel,daily,engagement,funny,puzzle,pet}/` |
| 开场的线条小狗角色 | U-GENIE 官方角色页面原画 | `materials/dogs/opening/maltese.png`、`golden.png` |
| 花店的线条小狗角色 | Moonlab 官方 LINE 商品页公开预览 PNG，按两只固定角色分别选用四种动作 | `materials/dogs/flower-shop/` |
| 小狗花店工作台和包装效果 | 手绘矢量场景、花材和包装动画 | `src/modules/flower-shop/FlowerCounter.vue`、`BouquetArtwork.vue`、`FlowerBloom.vue` |
| 蛋糕屋的线条小狗角色 | Moonlab 官方 LINE 商品页公开预览 PNG，使用与开场和花店不同的动作图 | `materials/dogs/cake-shop/` |
| 接礼物的线条小狗角色 | Moonlab 官方 LINE 商品页公开预览 PNG，分准备、接礼物、避烦恼、结算四组 | `materials/dogs/catch-gifts/` |
| 接礼物场地、篮子和八种道具 | 手绘矢量场景 | `src/modules/catch-gifts/CatchField.vue`、`CatchProp.vue` |
| 默契问答的小狗主持与反应 | Moonlab 官方 LINE 商品页公开预览 PNG，含双人暖心、逗趣和庆祝姿势 | `materials/dogs/couple-quiz/` |
| 默契问答舞台 | 手绘游乐场布景和结果演出 | `src/modules/couple-quiz/QuizStage.vue` |
| 扭蛋铺的线条小狗角色 | Moonlab 官方 LINE 商品页公开预览 PNG，含迎客、投币、开壳和 SSR 欢呼动作 | `materials/dogs/gashapon/` |
| 小狗扭蛋机和兑奖券 | 手绘机身、球仓、旋钮、蛋壳及三种可导出券面 | `src/modules/gashapon/GachaMachine.vue`、`TicketArtwork.vue` |
| 开场信封、蜡封、信纸和脚印 | 项目自绘 SVG | `src/modules/opening/OpeningEnvelope.vue`、`OpeningStage.vue` |
| 三类音乐及音效 | 当前无音源，等待可使用的音频与授权条件 | `public/audio/` 与 `src/config/assets.ts` |
| 花材、蛋糕和水果装饰 | 阶段三原创矢量道具，直接随组件绘制 | `src/modules/flower-shop/FlowerBloom.vue`、`src/modules/cake-shop/CakeArtwork.vue`、`src/modules/cake-shop/CakePiece.vue` |
| 生日蛋糕屋制作台和暗场 | 手绘矢量场景，制作到许愿渐暗，吹灭后播放礼花 | `src/modules/cake-shop/CakeScene.vue` |
| 线条小狗插牌 | 复用蛋糕屋小金毛庆祝图 | `src/config/assets.ts` |
| 游乐场道具和券卡面 | 由对应关卡阶段实现 | 各模块素材目录 |
| 调试界面信封与照片示例 | 项目自制，照片示例仅随开发入口加载 | `src/dev/` |
| 字体 | 使用当前设备已安装的系统字体 | `src/shared/theme.css` |

## 开场角色图片

两个独立图层来自 [U-GENIE 角色介绍](https://u-genie.com/our_characters/)，角色由 Moonlab Studio 创作。原始宣传画保留在 `materials/dogs/opening/sources/`，仅去除图层外的单色背景和裁切外边距，保留角色原有颜色和线条。

- 白色马尔济斯 `maltese.png`，对应 [原图](https://u-genie.com/wp-content/uploads/2025/07/ourchacard_01.jpg)
- 黄色小金毛 `golden.png`，对应 [原图](https://u-genie.com/wp-content/uploads/2025/07/ourchacard_02.jpg)

2026-11-24 用户确认本文记录的角色素材可用于本生日网站。发布用透明 PNG 位于 `public/assets/dogs/`，由 `src/config/assets.ts` 配置；开场原图仍保存在 `materials/`。

## 小狗花店动作图

花店使用 Moonlab 的 [白色马尔济斯](https://store.line.me/stickershop/product/24856130/en) 与 [黄色小金毛](https://store.line.me/stickershop/product/24856095/en) 公开预览图。开发素材按角色和动作拆分，Vite 仅提供表中对应的本地文件。

| 动作后缀 | 场景 | 马尔济斯预览图 ID | 小金毛预览图 ID |
| --- | --- | --- | --- |
| `browse` | 迎客与初始挑选 | `632135244` | `632134575` |
| `arrange` | 选花、搭配 | `632135241` | `632134581` |
| `wrap` | 包装花束 | `632135255` | `632134586` |
| `gift` | 包装完成、送花 | `632135260` | `632134569` |

替换本地图片时沿用 `maltese-<动作>.png` 或 `golden-<动作>.png`。正式版通过 `src/config/assets.ts` 中对应角色的 `flower-<动作>` 接入可用于网页的素材。

房间图的编辑提示词为「从用户提供的带界面插画中保留完整的圆角礼物盒体，去除盒体之外的标题、按钮及对白，以及室内所有交互标签、虚线、定位圆点和提示符号，补回覆盖区域的相框、相机、复古电视、书架、两只玩偶、餐盘和饮料。保留暖灯、配色、透视及物件布局。」原 PNG 保留在 `materials/scenes/`。

## 生日蛋糕屋动作图

沿用 Moonlab 的 [白色马尔济斯](https://store.line.me/stickershop/product/24856130/en) 与 [黄色小金毛](https://store.line.me/stickershop/product/24856095/en) 两个角色，另外选择下面八张公开预览图。

| 动作后缀 | 场景 | 马尔济斯预览图 ID | 小金毛预览图 ID |
| --- | --- | --- | --- |
| `make` | 装饰蛋糕 | `632135257` | `632134572` |
| `ready` | 端蛋糕、等点灯 | `632135254` | `632134582` |
| `wish` | 烛光许愿 | `632135251` | `632134587` |
| `cheer` | 吹灭后庆祝 | `632135253` | `632134583` |

本地替换使用 `maltese-<动作>.png` 或 `golden-<动作>.png`。蛋糕插牌复用小金毛庆祝图。正式版可在共享素材表配置 `cake-<动作>` 和 `cake-topper`。

## 接礼物动作图

继续使用 Moonlab 的 [白色马尔济斯](https://store.line.me/stickershop/product/24856130/en) 和 [黄色小金毛](https://store.line.me/stickershop/product/24856095/en)，从公开预览中另选四组。

| 动作后缀 | 场景 | 马尔济斯预览图 ID | 小金毛预览图 ID |
| --- | --- | --- | --- |
| `idle` | 准备开局 | `632135239` | `632134567` |
| `play` | 接礼物 | `632135258` | `632134585` |
| `warn` | 接到负分道具 | `632135247` | `632134579` |
| `result` | 结算 | `632135240` | `632134568` |

本地替换沿用 `maltese-<动作>.png`、`golden-<动作>.png`，正式版通过共享角色表中的 `catch-<动作>` 配置。

## 默契问答动作图

使用 Moonlab 的 [白色马尔济斯](https://store.line.me/stickershop/product/24856130/en) 和 [黄色小金毛](https://store.line.me/stickershop/product/24856095/en) 两个固定角色，按状态选用以下不同图层。

| 本地文件 | 场景 | 公开预览图 ID | 正式素材登记键 |
| --- | --- | --- | --- |
| `maltese-host.png` | 小白主持 | `632135256` | `dogs.maltese['quiz-host']` |
| `golden-host.png` | 小金毛主持 | `632134588` | `dogs.golden['quiz-host']` |
| `maltese-think.png` | 小白思考 | `632135245` | `dogs.maltese['quiz-think']` |
| `golden-think.png` | 小金毛思考 | `632134573` | `dogs.golden['quiz-think']` |
| `pair-play.png` | 两只狗的逗趣反应 | `632135246` | `dogs.maltese['quiz-play-pair']` |
| `pair-warm.png` | 两只狗的暖心反应 | `632135242` | `dogs.maltese['quiz-warm-pair']` |
| `pair-result.png` | 两只狗拥抱庆祝 | `632134580` | `dogs.golden['quiz-result-pair']` |

双人图同时呈现小白和小金毛。可同名替换本地预览图，正式构建仅接入共享素材表中已配置的网页可用素材。

## 小狗扭蛋铺动作图

继续使用 Moonlab 的 [白色马尔济斯](https://store.line.me/stickershop/product/24856130/en) 和 [黄色小金毛](https://store.line.me/stickershop/product/24856095/en) 两个固定角色。

| 文件 | 动作 | 公开预览图 ID | 正式素材登记键 |
| --- | --- | --- | --- |
| `maltese-idle.png` | 小白守在扭蛋机旁 | `632135238` | `dogs.maltese['gacha-idle']` |
| `golden-idle.png` | 小金毛守在扭蛋机旁 | `632134566` | `dogs.golden['gacha-idle']` |
| `pair-spin.png` | 投币和落蛋 | `632134574` | `dogs.golden['gacha-spin-pair']` |
| `pair-open.png` | 等待开壳 | `632135243` | `dogs.maltese['gacha-open-pair']` |
| `pair-ssr.png` | SSR 揭晓庆祝 | `632134570` | `dogs.golden['gacha-ssr-pair']` |

## 周末见面站动作图

`materials/dogs/meeting/` 使用 Moonlab 的 LINE STORE 公开预览图。可同名替换预览图，正式网页素材通过 `src/config/assets.ts` 登记。

| 文件 | 动作 | 公开预览图 ID | 来源 | 正式素材登记键 |
| --- | --- | --- | --- | --- |
| `maltese-run.png` | 小白迎上 | `674196275` | [Couple doggy 4 (Maltese)](https://store.line.me/stickershop/product/26566102/en) | `dogs.maltese['meeting-run']` |
| `maltese-wait.png` | 小白站定 | `772773375` | [Couple doggy 6 (Maltese)](https://store.line.me/stickershop/product/30618075/en) | `dogs.maltese['meeting-wait']` |
| `golden-run.png` | 小金毛带花入场 | `772773799` | [Couple doggy 6 (retriever)](https://store.line.me/stickershop/product/30618102/en) | `dogs.golden['meeting-run']` |
| `golden-wait.png` | 小金毛停在小白面前 | `674196129` | [Couple doggy 4 (retriever)](https://store.line.me/stickershop/product/26566096/en) | `dogs.golden['meeting-wait']` |

场景和花束独立绘制，入场与停止的动画由 CSS 控制。

## 通关结算庆祝图

`materials/dogs/ending/pair-celebrate.png` 是 Moonlab 的 [Couple doggy 6 (Maltese)](https://store.line.me/stickershop/product/30618075/en) 公开预览图，贴图 ID `772773372`。小白与小金毛以贴贴姿势出场。可同名替换预览图；正式网页素材在 `src/config/assets.ts` 的 `dogs.maltese['ending-celebrate-pair']` 登记。

## 永久生日小屋欢迎图

`materials/dogs/collection/pair-welcome.png` 源自 Moonlab 的 [Couple doggy 6 (Maltese)](https://store.line.me/stickershop/product/30618075/en)，公开预览图 ID `772773382`。可同名替换预览图；正式版本使用 `src/config/assets.ts` 的 `dogs.maltese['collection-welcome-pair']`。

## 添加照片

将照片放入对应分类，可沿用原文件名。运行 `npm run prepare:assets` 生成最长边 1600px 的 WebP、最长边 360px 的缩略图和 `public/photos/manifest.json`。输出会去掉 EXIF，并按原图方向校正。原素材保留，同一分类内相同内容去重，文件更名不会改变照片 ID。

手写元数据使用 `materials/photo-metadata.json`，可参考 [示例](./photo-metadata.example.json)。键可以用生成的照片 ID，也可以用 `分类/原文件名`。需要在改名后继续使用同一条手写元数据时，使用照片 ID 作为键。字段支持 `order`、`title`、`note`、`date`、`location`，缺少的字段保持空白。命令不会重写手写文件。

如果某张 HEIC 无法解码，命令会指出文件并以非零状态退出。可用原设备的兼容格式导出 JPEG 或 PNG，再执行一次。后续有私人照片时，构建产物也包含对应图片和用户填写的元数据。

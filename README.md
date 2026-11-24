# 小狗生日派对

这是可公开体验的生日网站演示版。生日、信件、问答和派对时间均为演示内容。相册初始为空。

## 本地运行

使用 Node.js 24。

```sh
npm ci
npm run dev
npm test
npm run typecheck
npm run build
npm run preview
```

开发调试台在 http://127.0.0.1:5173/#/dev 。生产构建预览在 http://127.0.0.1:4173/ 。

## GitHub Pages

在仓库的 Settings → Pages 下选择 GitHub Actions。部署工作流会在 main 分支更新后验证项目并发布 dist，也可在 Actions 中手动运行。

站点和仓库内容可公开访问。请仅提交可公开的内容，并保持此副本的相册为空。角色资源说明见 materials/ASSETS.md。

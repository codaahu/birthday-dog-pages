# 小狗生日派对

这是生日网站的 GitHub Pages 发布副本，页面和相册可公开访问。

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

相册的网页用 WebP、缩略图和清单由私有素材仓库提供。更新素材仓库后，在 Actions 手动运行 Deploy GitHub Pages。原图和相册文件不要提交到这个公开仓库。角色资源说明见 materials/ASSETS.md。

import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const inputRoot = join(projectRoot, 'materials', 'photos')
const outputRoot = join(projectRoot, 'public', 'photos')
const metadataPath = join(projectRoot, 'materials', 'photo-metadata.json')
const categories = ['couple', 'portrait', 'travel', 'daily', 'engagement', 'funny', 'puzzle', 'pet']
const extensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'])
const metadataFields = ['title', 'note', 'date', 'location']
const generatedName = /^photo-[0-9a-f]{24}(?:-thumb)?\.webp$/

/**
 * 读取可选的手写照片元数据
 *
 * @date 2026/11/24 10:54
 * @return 按照片 ID 或分类及原文件名组织的元数据，缺失时为空
 */
async function readMetadata() {
  try {
    const metadata = JSON.parse(await readFile(metadataPath, 'utf8'))
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      throw new Error('照片元数据顶层必须是对象')
    }
    return metadata
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {}
    }
    console.error('读取手写照片元数据失败', error)
    throw error
  }
}

/**
 * 扫描照片，按分类和原图内容生成稳定 ID 及网页文件
 *
 * @date 2026/11/24 10:54
 */
async function prepare() {
  const metadata = await readMetadata()
  const photos = []
  const seen = new Set()
  const outputs = new Set()
  let skipped = 0
  await mkdir(outputRoot, { recursive: true })

  for (const category of categories) {
    const directory = join(inputRoot, category)
    await mkdir(directory, { recursive: true })
    const entries = await readdir(directory, { withFileTypes: true })
    entries.sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))
    for (const entry of entries) {
      const extension = extname(entry.name).toLowerCase()
      if (!entry.isFile() || !extensions.has(extension)) {
        continue
      }

      try {
        // 文件更名不改变 ID；同分类内相同内容只生成一条记录
        const input = await readFile(join(directory, entry.name))
        const digest = createHash('sha256').update(category + '\0').update(input).digest('hex').slice(0, 24)
        const id = 'photo-' + digest
        if (seen.has(id)) {
          continue
        }
        const imageName = id + '.webp'
        const thumbnailName = id + '-thumb.webp'
        const photo = sharp(input).autoOrient()
        const image = await photo.clone().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 84 }).toBuffer({ resolveWithObject: true })
        const thumbnail = await photo.resize({ width: 360, height: 360, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 76 }).toBuffer()
        // Sharp 默认不复制 EXIF；按原图方向旋转后再输出
        await writeFile(join(outputRoot, imageName), image.data)
        await writeFile(join(outputRoot, thumbnailName), thumbnail)

        const fields = metadata[id] ?? metadata[category + '/' + entry.name] ?? {}
        const record = {
          id, category, image: 'photos/' + imageName, thumbnail: 'photos/' + thumbnailName,
          width: image.info.width, height: image.info.height,
        }
        for (const key of metadataFields) {
          if (typeof fields[key] === 'string' && fields[key].trim()) {
            record[key] = fields[key]
          }
        }
        if (Number.isFinite(fields.order)) {
          record.order = fields.order
        }
        photos.push(record)
        seen.add(id)
        outputs.add(imageName)
        outputs.add(thumbnailName)
      } catch (error) {
        skipped += 1
        console.error('无法处理照片 ' + category + '/' + entry.name, error)
        if (extension === '.heic' || extension === '.heif') {
          console.error('当前图片解码器可能不支持此 HEIC/HEIF 编码。请从原设备导出兼容的 JPEG 或 PNG，再重新运行。')
        }
      }
    }
  }

  // 仅清理本脚本命名规则下、且已离开 manifest 的派生文件
  const manifest = join(outputRoot, 'manifest.json')
  const temporary = manifest + '.tmp'
  photos.sort((left, right) => (left.order ?? Infinity) - (right.order ?? Infinity))
  await writeFile(temporary, JSON.stringify({ photos }, null, 2) + '\n')
  await rename(temporary, manifest)
  for (const name of await readdir(outputRoot)) {
    if (generatedName.test(name) && !outputs.has(name)) {
      await rm(join(outputRoot, name))
    }
  }
  const empty = categories.filter((category) => !photos.some((photo) => photo.category === category))
  console.info('生成 ' + photos.length + ' 张照片；空分类：' + (empty.join('、') || '无'))
  if (skipped) {
    console.error('有 ' + skipped + ' 张照片处理失败，请修正后重试。已生成可用照片清单。')
    process.exitCode = 1
  }
}

prepare().catch((error) => {
  console.error('生成照片素材失败', error)
  process.exitCode = 1
})

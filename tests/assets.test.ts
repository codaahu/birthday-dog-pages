import { execFileSync } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import sharp from 'sharp'
import { expect, it } from 'vitest'
import type { PhotoManifest } from '../src/config/photos'

it('生成空清单，并在添加照片时去除 EXIF、保留元数据和稳定 ID', async () => {
  const base = resolve('.run')
  await mkdir(base, { recursive: true })
  const root = await mkdtemp(join(base, 'assets-test-'))

  try {
    // 使用隔离目录，只处理本测试生成的图片
    const scripts = join(root, 'scripts')
    const photos = join(root, 'materials', 'photos', 'couple')
    const output = join(root, 'public', 'photos')
    const metadata = join(root, 'materials', 'photo-metadata.json')
    await mkdir(scripts, { recursive: true })
    await mkdir(photos, { recursive: true })
    const script = join(scripts, 'prepare-assets.mjs')
    await copyFile(resolve('scripts/prepare-assets.mjs'), script)
    const prepare = () => execFileSync(process.execPath, [script], { encoding: 'utf8' })
    const manifest = async () => JSON.parse(await readFile(join(output, 'manifest.json'), 'utf8')) as PhotoManifest

    prepare()
    expect(await manifest()).toEqual({ photos: [] })

    const original = join(photos, 'test.jpg')
    await sharp({ create: { width: 480, height: 320, channels: 3, background: '#fff9f0' } })
      .jpeg().withExif({ IFD0: { Artist: 'Synthetic test' } }).toFile(original)
    const originalBytes = await readFile(original)
    expect((await sharp(originalBytes).metadata()).exif).toBeDefined()
    await writeFile(metadata, '{"couple/test.jpg":{"title":"素材测试","order":2}}', 'utf8')
    prepare()
    const [photo] = (await manifest()).photos
    expect(photo).toMatchObject({ category: 'couple', width: 480, height: 320, title: '素材测试', order: 2 })
    const image = join(root, 'public', photo.image)
    const thumbnail = join(root, 'public', photo.thumbnail)
    expect((await sharp(await readFile(image)).metadata()).exif).toBeUndefined()
    expect((await sharp(await readFile(thumbnail)).metadata()).width).toBe(360)
    expect(await readFile(original)).toEqual(originalBytes)

    const renamed = join(photos, 'renamed.jpg')
    const metadataText = JSON.stringify({ [photo.id]: { title: '素材测试' } })
    await writeFile(metadata, metadataText, 'utf8')
    await rename(original, renamed)
    prepare()
    expect((await manifest()).photos[0]).toMatchObject({ id: photo.id, title: photo.title })
    expect(await readFile(metadata, 'utf8')).toBe(metadataText)
    await rm(renamed)
    prepare()
    expect(await manifest()).toEqual({ photos: [] })
    await expect(readFile(image)).rejects.toMatchObject({ code: 'ENOENT' })

    const pets = join(root, 'materials', 'photos', 'pet')
    await writeFile(join(pets, 'pet-test.jpg'), originalBytes)
    prepare()
    expect((await manifest()).photos).toMatchObject([{ category: 'pet', width: 480 }])
  } finally {
    await rm(root, { recursive: true, force: true, maxRetries: 3 })
  }
}, 15000)

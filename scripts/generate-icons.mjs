import sharp from 'sharp'
import { readFileSync } from 'fs'

const input = './public/icon-512.jpg'
const buffer = readFileSync(input)

// 192x192
await sharp(buffer)
  .resize(192, 192, { fit: 'cover' })
  .toFile('./public/icon-192.png')

// 512x512 (copy as PNG)
await sharp(buffer)
  .resize(512, 512, { fit: 'cover' })
  .toFile('./public/icon-512.png')

// maskable: shrink original to ~70% and place on white canvas 512x512
// This ensures the peach/lightning stays within Android's safe zone
const img = sharp(buffer).resize(360, 360, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
await sharp({
  create: { width: 512, height: 512, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
})
  .composite([{ input: await img.toBuffer(), gravity: 'center' }])
  .toFile('./public/icon-maskable.png')

console.log('Icons generated: icon-192.png, icon-512.png, icon-maskable.png')

import { copyFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const distIndexPath = new URL('../dist/index.html', import.meta.url)
const dist404Path = new URL('../dist/404.html', import.meta.url)

await mkdir(dirname(fileURLToPath(dist404Path)), { recursive: true })
await copyFile(fileURLToPath(distIndexPath), fileURLToPath(dist404Path))

import { describe, expect, it } from 'vite-plus/test'
import { MAX_FILE_BYTES, formatBytes, resolveMimeType, validateFile } from '../upload'

describe('upload domain', () => {
  it('accepts supported types and rejects others', () => {
    expect(validateFile({ name: 'a.jpg', type: 'image/jpeg', size: 10 })).toBeNull()
    expect(validateFile({ name: 'a.mov', type: 'video/quicktime', size: 10 })).toBeNull()
    expect(validateFile({ name: 'a.gif', type: 'image/gif', size: 10 })).toBe(
      'Unsupported file type',
    )
  })

  it('falls back to the extension when the browser gives no type', () => {
    expect(resolveMimeType({ name: 'clip.MOV', type: '' })).toBe('video/quicktime')
    expect(validateFile({ name: 'clip.mp4', type: '', size: 10 })).toBeNull()
    expect(validateFile({ name: 'x.bin', type: '', size: 10 })).toBe('Unsupported file type')
  })

  it('enforces size limits', () => {
    expect(validateFile({ name: 'a.png', type: 'image/png', size: 0 })).toBe('File is empty')
    expect(validateFile({ name: 'a.png', type: 'image/png', size: MAX_FILE_BYTES + 1 })).toBe(
      'File is larger than 4 GB',
    )
  })

  it('formats bytes', () => {
    expect(formatBytes(500)).toBe('500 B')
    expect(formatBytes(1886553)).toBe('1.8 MB')
    expect(formatBytes(4 * 1024 ** 3)).toBe('4.0 GB')
  })
})
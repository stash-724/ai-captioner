// Mirrors the backend's src/constants/caption.js
export const TONES = [
  { value: 'witty', label: 'Witty', hint: 'Playful wordplay' },
  { value: 'formal', label: 'Formal', hint: 'Polished' },
  { value: 'poetic', label: 'Poetic', hint: 'Vivid imagery' },
  { value: 'descriptive', label: 'Descriptive', hint: 'Plain facts' },
]

export const LENGTHS = [
  { value: 'short', label: 'Short', hint: 'Up to 8 words' },
  { value: 'medium', label: 'Medium', hint: 'One sentence' },
  { value: 'long', label: 'Long', hint: '2–3 sentences' },
]

export const DEFAULT_TONE = 'witty'
export const DEFAULT_LENGTH = 'short'

// Mirrors the backend's upload limits
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export function validateImage(file) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'Please choose a JPEG, PNG or WebP image.'
  if (file.size > MAX_IMAGE_BYTES) return 'That image is over 5 MB. Please choose a smaller one.'
  return null
}

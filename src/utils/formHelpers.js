/**
 * Canonical YES/NO → boolean converter for all field responder forms.
 * Use this instead of writing === 'YES' inline anywhere in submit handlers.
 */
export function yesNoToBoolean(value) {
  return value === 'YES'
}

/**
 * Simple UUID v4 generator (no crypto dependency).
 */
export function generateUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

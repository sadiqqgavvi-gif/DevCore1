export const BOOT_KEY = 'devcore-booted'

export function alreadyBooted() {
  try { return window.sessionStorage.getItem(BOOT_KEY) === '1' } catch { return false }
}

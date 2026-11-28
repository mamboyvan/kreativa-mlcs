// Hachage des mots de passe côté client (PBKDF2-SHA256, 120 000 itérations).
// En production, ce calcul doit être effectué côté serveur (Argon2id / bcrypt)
// avec stockage en base de données et sessions signées.

const enc = new TextEncoder()

const toHex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')

export const genSalt = () => {
  const a = new Uint8Array(16)
  crypto.getRandomValues(a)
  return Array.from(a).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 120000, hash: 'SHA-256' },
    key,
    256,
  )
  return toHex(bits)
}

export async function verifyPassword(password: string, salt: string, hash: string): Promise<boolean> {
  const h = await hashPassword(password, salt)
  // comparaison à temps constant
  if (h.length !== hash.length) return false
  let diff = 0
  for (let i = 0; i < h.length; i++) diff |= h.charCodeAt(i) ^ hash.charCodeAt(i)
  return diff === 0
}

export const uid = (prefix = 'id') => {
  const a = new Uint8Array(8)
  crypto.getRandomValues(a)
  return prefix + '_' + Array.from(a).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export const refCommande = () => {
  const a = new Uint8Array(3)
  crypto.getRandomValues(a)
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `KRV-${ymd}-${Array.from(a).map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()}`
}

export function validerFichier(nom: string): { ok: boolean; message?: string } {
  const autorises = ['pdf', 'epub', 'zip', 'mp3', 'wav', 'mp4', 'mov', 'png', 'jpg', 'jpeg', 'svg', 'psd', 'ai', 'docx', 'xlsx', 'pptx', 'csv']
  const interdits = ['exe', 'bat', 'sh', 'apk', 'msi', 'js', 'php', 'dll', 'cmd']
  const ext = nom.split('.').pop()?.toLowerCase() ?? ''
  if (!ext || !nom.includes('.')) return { ok: false, message: 'Le fichier doit avoir une extension valide.' }
  if (interdits.includes(ext)) return { ok: false, message: `Extension .${ext} interdite pour des raisons de sécurité.` }
  if (!autorises.includes(ext)) return { ok: false, message: `Extension .${ext} non prise en charge. Formats acceptés : ${autorises.join(', ')}.` }
  return { ok: true }
}

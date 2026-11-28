// ---------------------------------------------------------------------------
// KREATIVA — Suivi d'activité (couche d'événements)
//
// Principes appliqués :
//  • Collecte minimale : aucun mot de passe, aucune donnée bancaire, aucune
//    frappe clavier, aucun contenu de message privé n'est enregistré.
//  • Session pseudonymisée : identifiant aléatoire, non réversible, sans IP.
//  • Consentement et conservation configurables depuis l'espace administrateur.
//  • Dans l'architecture cible, ces écritures passent par une API serveur
//    authentifiée ; la lecture est réservée aux administrateurs autorisés.
// ---------------------------------------------------------------------------

export type EventType =
  | 'page_vue'
  | 'recherche'
  | 'produit_vu'
  | 'boutique_vue'
  | 'panier_ajout'
  | 'panier_retrait'
  | 'checkout_debut'
  | 'commande_creee'
  | 'paiement_confirme'
  | 'paiement_echoue'
  | 'compte_cree'
  | 'connexion'
  | 'connexion_echouee'
  | 'deconnexion'
  | 'support_contact'
  | 'remboursement_demande'
  | 'acces_refuse'
  | 'erreur'
  | 'admin_action'

export type Appareil = 'ordinateur' | 'tablette' | 'telephone'

export type Evt = {
  id: string
  type: EventType
  ts: number
  sid: string
  userId: string | null
  shopId?: string
  productId?: string
  source: string
  appareil: Appareil
  region?: string
  chemin?: string
  meta?: Record<string, string | number>
}

export type SessionRec = {
  sid: string
  debut: number
  derniere: number
  pages: number
  chemin: string
  source: string
  appareil: Appareil
  region?: string
  userId: string | null
  dernierProduit?: string
  derniereCategorie?: string
}

export type AnalyticsSettings = {
  collecte: boolean
  conservationJours: number
  consentement: 'implicite' | 'explicite'
  masquage: boolean
  relanceAuto: boolean
}

const K_EVT = 'kreativa.analytics.events.v1'
const K_SESS = 'kreativa.analytics.sessions.v1'
const K_SET = 'kreativa.analytics.settings.v1'
const K_SID = 'kreativa.analytics.sid'
const MAX_EVENTS = 4000
export const FENETRE_ACTIVE = 5 * 60 * 1000 // 5 minutes

export const PARAMS_DEFAUT: AnalyticsSettings = {
  collecte: true,
  conservationJours: 90,
  consentement: 'implicite',
  masquage: true,
  relanceAuto: false,
}

// --------------------------------------------------------------- utilitaires

const alea = (n = 6) => {
  const a = new Uint8Array(n)
  crypto.getRandomValues(a)
  return Array.from(a).map((b) => b.toString(16).padStart(2, '0')).join('')
}

const lire = <T,>(k: string, defaut: T): T => {
  try {
    const raw = localStorage.getItem(k)
    return raw ? (JSON.parse(raw) as T) : defaut
  } catch {
    return defaut
  }
}

const ecrire = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v))
  } catch {
    /* quota dépassé : on ignore silencieusement */
  }
}

export const lireParametres = (): AnalyticsSettings => ({ ...PARAMS_DEFAUT, ...lire(K_SET, {}) })
export const ecrireParametres = (p: Partial<AnalyticsSettings>) => {
  const next = { ...lireParametres(), ...p }
  ecrire(K_SET, next)
  return next
}

export function detecterAppareil(): Appareil {
  const ua = navigator.userAgent
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return 'tablette'
  if (/Mobi|Android|iPhone|iPod|Opera Mini|IEMobile/i.test(ua)) return 'telephone'
  if (window.innerWidth < 640) return 'telephone'
  if (window.innerWidth < 1024) return 'tablette'
  return 'ordinateur'
}

export function detecterSource(): string {
  try {
    const utm = new URLSearchParams(window.location.search).get('utm_source')
    if (utm) return `Campagne : ${utm.slice(0, 24)}`
    const ref = document.referrer
    if (!ref) return 'Lien direct'
    const host = new URL(ref).hostname.replace(/^www\./, '')
    if (host === window.location.hostname) return 'Navigation interne'
    if (/google|bing|yahoo|duckduckgo|qwant|ecosia|yandex/i.test(host)) return 'Moteur de recherche'
    if (/facebook|instagram|tiktok|twitter|x\.com|linkedin|whatsapp|youtube|snapchat|telegram|pinterest/i.test(host))
      return 'Réseaux sociaux'
    return `Site référent : ${host}`
  } catch {
    return 'Source inconnue'
  }
}

// Région approximative déduite du fuseau horaire du navigateur.
// Aucune géolocalisation, aucune adresse IP n'est collectée ni stockée.
export function detecterRegion(): string | undefined {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!tz) return undefined
    const ville = tz.split('/')[1]?.replace(/_/g, ' ')
    const zone = tz.split('/')[0]
    const pays: Record<string, string> = {
      Abidjan: "Côte d'Ivoire", Dakar: 'Sénégal', Lome: 'Togo', Porto_Novo: 'Bénin',
      Ouagadougou: 'Burkina Faso', Bamako: 'Mali', Douala: 'Cameroun', Conakry: 'Guinée',
      Niamey: 'Niger', Paris: 'France', Brussels: 'Belgique',
    }
    const nom = pays[tz.split('/')[1] ?? ''] ?? ville
    return nom ? `${nom} (approx. · ${zone})` : undefined
  } catch {
    return undefined
  }
}

// ------------------------------------------------------------------ sessions

let sidMemoire: string | null = null

export function sessionCourante(): string {
  try {
    let sid = window.sessionStorage.getItem(K_SID)
    if (!sid) {
      sid = 'sess_' + alea(8)
      window.sessionStorage.setItem(K_SID, sid)
    }
    return sid
  } catch {
    // Certains navigateurs ou modes privés bloquent sessionStorage.
    if (!sidMemoire) sidMemoire = 'sess_' + alea(8)
    return sidMemoire
  }
}

export const masquerSid = (sid: string) => (sid.length > 11 ? sid.slice(0, 11) + '••••' : sid)

let utilisateurCourant: string | null = null
export const definirUtilisateurCourant = (id: string | null) => {
  utilisateurCourant = id
  const sid = sessionCourante()
  const sessions = lireSessions()
  const s = sessions.find((x) => x.sid === sid)
  if (s) {
    s.userId = id
    s.derniere = Date.now()
    ecrire(K_SESS, sessions)
  }
}

export const lireSessions = (): SessionRec[] => lire<SessionRec[]>(K_SESS, [])
export const lireEvenements = (): Evt[] => lire<Evt[]>(K_EVT, [])

export const sessionsActives = (sessions = lireSessions()) =>
  sessions.filter((s) => Date.now() - s.derniere < FENETRE_ACTIVE).sort((a, b) => b.derniere - a.derniere)

function majSession(patch: Partial<SessionRec>) {
  const sid = sessionCourante()
  const sessions = lireSessions()
  let s = sessions.find((x) => x.sid === sid)
  if (!s) {
    s = {
      sid,
      debut: Date.now(),
      derniere: Date.now(),
      pages: 0,
      chemin: window.location.pathname,
      source: detecterSource(),
      appareil: detecterAppareil(),
      region: detecterRegion(),
      userId: utilisateurCourant,
    }
    sessions.push(s)
  }
  Object.assign(s, patch, { derniere: Date.now(), userId: patch.userId ?? utilisateurCourant ?? s.userId })
  // conservation : on ne garde que les sessions récentes
  const limite = Date.now() - lireParametres().conservationJours * 86400000
  ecrire(K_SESS, sessions.filter((x) => x.derniere >= limite).slice(-400))
}

// -------------------------------------------------------------------- track

export function track(
  type: EventType,
  data: Partial<Pick<Evt, 'shopId' | 'productId' | 'chemin' | 'meta' | 'userId'>> = {},
) {
  const params = lireParametres()
  if (!params.collecte) return

  const sid = sessionCourante()
  const evt: Evt = {
    id: 'ev_' + alea(6),
    type,
    ts: Date.now(),
    sid,
    userId: data.userId !== undefined ? data.userId : utilisateurCourant,
    shopId: data.shopId,
    productId: data.productId,
    source: detecterSource(),
    appareil: detecterAppareil(),
    region: detecterRegion(),
    chemin: data.chemin ?? window.location.pathname,
    meta: data.meta,
  }

  const limite = Date.now() - params.conservationJours * 86400000
  const evts = lireEvenements().filter((e) => e.ts >= limite)
  evts.push(evt)
  ecrire(K_EVT, evts.slice(-MAX_EVENTS))

  const patch: Partial<SessionRec> = { chemin: evt.chemin ?? '/' }
  if (type === 'page_vue') patch.pages = (lireSessions().find((s) => s.sid === sid)?.pages ?? 0) + 1
  if (data.productId) patch.dernierProduit = data.productId
  if (typeof data.meta?.categorie === 'string') patch.derniereCategorie = data.meta.categorie
  majSession(patch)
}

let battement: number | null = null
export function demarrerBattement() {
  if (battement !== null) return
  majSession({})
  battement = window.setInterval(() => majSession({}), 20000)
  window.addEventListener('beforeunload', () => majSession({}))
}

// ------------------------------------------------------- outils d'agrégation

export const purgerEvenements = (jours?: number) => {
  const limite = Date.now() - (jours ?? lireParametres().conservationJours) * 86400000
  ecrire(K_EVT, lireEvenements().filter((e) => e.ts >= limite))
  ecrire(K_SESS, lireSessions().filter((s) => s.derniere >= limite))
}

export const toutSupprimer = () => {
  localStorage.removeItem(K_EVT)
  localStorage.removeItem(K_SESS)
}

export const compterPar = <T extends string>(items: T[]) => {
  const m = new Map<T, number>()
  items.forEach((i) => m.set(i, (m.get(i) ?? 0) + 1))
  return [...m.entries()].sort((a, b) => b[1] - a[1])
}

export const LIBELLE_EVT: Record<EventType, string> = {
  page_vue: 'Page consultée',
  recherche: 'Recherche effectuée',
  produit_vu: 'Fiche produit consultée',
  boutique_vue: 'Boutique consultée',
  panier_ajout: 'Ajout au panier',
  panier_retrait: 'Retrait du panier',
  checkout_debut: 'Début de commande',
  commande_creee: 'Commande créée',
  paiement_confirme: 'Paiement confirmé',
  paiement_echoue: 'Paiement échoué',
  compte_cree: 'Création de compte',
  connexion: 'Connexion',
  connexion_echouee: 'Échec de connexion',
  deconnexion: 'Déconnexion',
  support_contact: 'Contact support',
  remboursement_demande: 'Demande de remboursement',
  acces_refuse: 'Accès refusé',
  erreur: 'Erreur applicative',
  admin_action: 'Action administrateur',
}

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity, Radio, Route, UserSearch, Search, ShoppingCart, Receipt, BarChart3,
  ShieldAlert, Lock, Download, Trash2, RefreshCw, Monitor, Tablet, Smartphone,
  TrendingDown, Eye, AlertTriangle, CheckCircle2, Info, KeyRound, ChevronRight,
} from 'lucide-react'
import { useStore } from '../../lib/store'
import { Badge, Btn, Field, Panel, Select } from '../../components/ui'
import { useToast } from '../../components/Toast'
import { verifyPassword } from '../../lib/crypto'
import { dateHeureFr, fcfa } from '../../lib/format'
import { catNom, STATUT_LABEL } from '../../lib/constants'
import {
  lireEvenements, lireSessions, sessionsActives, masquerSid, lireParametres, ecrireParametres,
  purgerEvenements, toutSupprimer, track, LIBELLE_EVT,
  type Evt, type EventType, type SessionRec, type AnalyticsSettings,
} from '../../lib/analytics'

// ---------------------------------------------------------------- utilitaires

const SOUS_MENUS = [
  { id: 'apercu', l: 'Vue d’ensemble', i: Activity },
  { id: 'direct', l: 'Visiteurs en direct', i: Radio },
  { id: 'parcours', l: 'Parcours des visiteurs', i: Route },
  { id: 'clients', l: 'Activités des clients', i: UserSearch },
  { id: 'recherches', l: 'Recherches effectuées', i: Search },
  { id: 'paniers', l: 'Paniers abandonnés', i: ShoppingCart },
  { id: 'commandes', l: 'Commandes et achats', i: Receipt },
  { id: 'rapports', l: 'Rapports et statistiques', i: BarChart3 },
  { id: 'alertes', l: 'Alertes de sécurité', i: ShieldAlert },
  { id: 'confidentialite', l: 'Paramètres de confidentialité', i: Lock },
]

const JOUR = 86400000
const heure = (ts: number) => new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(ts)
const jourCourt = (ts: number) => new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' }).format(ts)

const depuis = (ts: number) => {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `il y a ${s} s`
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`
  return `il y a ${Math.floor(s / 86400)} j`
}

const masquerId = (id: string | null | undefined, actif: boolean) => {
  if (!id) return '—'
  return actif && id.length > 6 ? id.slice(0, 6) + '••••' : id
}

function exporterCsv(nom: string, lignes: (string | number)[][]) {
  const csv = lignes.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
  const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nom
  a.click()
  URL.revokeObjectURL(url)
}

const IconeAppareil = ({ a }: { a: string }) =>
  a === 'telephone' ? <Smartphone size={14} /> : a === 'tablette' ? <Tablet size={14} /> : <Monitor size={14} />

// ------------------------------------------------------------------ graphiques

function Courbe({ points, hauteur = 150 }: { points: { l: string; v: number }[]; hauteur?: number }) {
  const max = Math.max(1, ...points.map((p) => p.v))
  const w = 100
  const coords = points.map((p, i) => {
    const x = points.length === 1 ? w / 2 : (i / (points.length - 1)) * w
    const y = 100 - (p.v / max) * 92
    return `${x},${y}`
  })
  return (
    <div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ height: hauteur }} className="w-full">
        {[0, 25, 50, 75, 100].map((g) => (
          <line key={g} x1="0" y1={g} x2="100" y2={g} stroke="rgba(246,241,231,0.08)" strokeWidth="0.4" />
        ))}
        <polygon points={`0,100 ${coords.join(' ')} 100,100`} fill="url(#grad-or)" opacity="0.28" />
        <polyline points={coords.join(' ')} fill="none" stroke="#C9A227" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => {
          const x = points.length === 1 ? w / 2 : (i / (points.length - 1)) * w
          const y = 100 - (p.v / max) * 92
          return <circle key={i} cx={x} cy={y} r="1.1" fill="#C9A227" vectorEffect="non-scaling-stroke" />
        })}
        <defs>
          <linearGradient id="grad-or" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C9A227" />
            <stop offset="100%" stopColor="#C9A227" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <div className="mt-2 flex justify-between text-[10.5px] text-cream/35">
        {points.filter((_, i) => i % Math.ceil(points.length / 7) === 0 || i === points.length - 1).map((p, i) => (
          <span key={i}>{p.l}</span>
        ))}
      </div>
      <p className="mt-1 text-[11px] text-cream/30">Maximum sur la période : {max}</p>
    </div>
  )
}

function Barres({ data, unite = '' }: { data: [string, number][]; unite?: string }) {
  if (data.length === 0) return <p className="text-[13px] text-cream/40">Aucune donnée enregistrée sur la période.</p>
  const max = Math.max(1, ...data.map((d) => d[1]))
  return (
    <div className="space-y-3">
      {data.map(([l, v]) => (
        <div key={l}>
          <div className="mb-1.5 flex justify-between gap-3 text-[13px]">
            <span className="line-clamp-1 text-cream/75">{l}</span>
            <span className="shrink-0 text-cream/50">{v}{unite}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ink-3">
            <div className="h-full rounded-full bg-gradient-to-r from-sable to-mandarine" style={{ width: `${(v / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function Kpi({ l, v, s, i: I, ton = 'or' }: { l: string; v: string | number; s?: string; i: any; ton?: 'or' | 'vert' | 'rouge' }) {
  const c = ton === 'vert' ? 'text-emeraude-soft' : ton === 'rouge' ? 'text-red-300' : 'text-sable'
  return (
    <div className="rounded-2xl border border-line bg-ink-2/60 p-4">
      <I size={17} className={c} />
      <p className="display mt-2.5 text-2xl font-extrabold">{v}</p>
      <p className="text-[12px] leading-tight text-cream/45">{l}</p>
      {s && <p className="mt-1 text-[11px] text-cream/30">{s}</p>}
    </div>
  )
}

const Vide = ({ t, d }: { t: string; d: string }) => (
  <div className="rounded-2xl border border-dashed border-line px-6 py-12 text-center">
    <Info size={22} className="mx-auto mb-3 text-cream/30" />
    <p className="display font-bold">{t}</p>
    <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-cream/45">{d}</p>
  </div>
)

// ------------------------------------------------------------------ composant

export default function Activites() {
  const { db } = useStore()
  const toast = useToast()
  const [sous, setSous] = useState('apercu')
  const [tick, setTick] = useState(0)
  const [chargement, setChargement] = useState(true)
  const [periode, setPeriode] = useState<'jour' | 'semaine' | 'mois' | 'perso'>('semaine')
  const [debutPerso, setDebutPerso] = useState('')
  const [finPerso, setFinPerso] = useState('')
  const [params, setParams] = useState<AnalyticsSettings>(lireParametres())

  useEffect(() => {
    const t = window.setTimeout(() => setChargement(false), 260)
    const i = window.setInterval(() => setTick((x) => x + 1), 5000)
    return () => { window.clearTimeout(t); window.clearInterval(i) }
  }, [])

  const tousEvts = useMemo(() => lireEvenements(), [tick])
  const sessions = useMemo(() => lireSessions(), [tick])
  const actives = useMemo(() => sessionsActives(sessions), [sessions])

  const bornes = useMemo(() => {
    const fin = periode === 'perso' && finPerso ? new Date(finPerso).getTime() + JOUR : Date.now()
    const debut =
      periode === 'jour' ? new Date(new Date().setHours(0, 0, 0, 0)).getTime()
      : periode === 'semaine' ? Date.now() - 7 * JOUR
      : periode === 'mois' ? Date.now() - 30 * JOUR
      : debutPerso ? new Date(debutPerso).getTime() : Date.now() - 7 * JOUR
    return { debut, fin }
  }, [periode, debutPerso, finPerso])

  const evts = useMemo(() => tousEvts.filter((e) => e.ts >= bornes.debut && e.ts <= bornes.fin), [tousEvts, bornes])
  const de = (t: EventType) => evts.filter((e) => e.type === t)
  const sids = (t: EventType) => new Set(de(t).map((e) => e.sid))

  // ----------------------------------------------------------------- agrégats
  const sessionsPeriode = useMemo(
    () => sessions.filter((s) => s.derniere >= bornes.debut && s.debut <= bornes.fin),
    [sessions, bornes],
  )
  const pagesVues = de('page_vue').length
  const visiteursUniquesJour = new Set(
    tousEvts.filter((e) => e.ts >= new Date(new Date().setHours(0, 0, 0, 0)).getTime()).map((e) => e.sid),
  ).size
  const sessionsAvecCommande = sids('commande_creee')
  const tauxConversion = sessionsPeriode.length
    ? (sessionsAvecCommande.size / sessionsPeriode.length) * 100
    : 0

  const topProduits = useMemo(() => {
    const m = new Map<string, number>()
    de('produit_vu').forEach((e) => e.productId && m.set(e.productId, (m.get(e.productId) ?? 0) + 1))
    return [...m.entries()]
      .map(([id, n]) => ({ id, n, titre: db.products.find((p) => p.id === id)?.titre ?? 'Produit retiré' }))
      .sort((a, b) => b.n - a.n)
  }, [evts, db.products])

  const topCategories = useMemo(() => {
    const m = new Map<string, number>()
    de('produit_vu').forEach((e) => {
      const c = (e.meta?.categorie as string) ?? db.products.find((p) => p.id === e.productId)?.categorie
      if (c) m.set(c, (m.get(c) ?? 0) + 1)
    })
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [evts, db.products])

  const sources = useMemo(() => {
    const m = new Map<string, Set<string>>()
    sessionsPeriode.forEach((s) => {
      if (!m.has(s.source)) m.set(s.source, new Set())
      m.get(s.source)!.add(s.sid)
    })
    return [...m.entries()].map(([s, set]) => [s, set.size] as [string, number]).sort((a, b) => b[1] - a[1])
  }, [sessionsPeriode])

  const serieTemps = useMemo(() => {
    const pts: { l: string; v: number }[] = []
    if (periode === 'jour') {
      for (let h = 0; h < 24; h++) {
        const d0 = new Date(); d0.setHours(h, 0, 0, 0)
        const d1 = d0.getTime() + 3600000
        pts.push({ l: `${String(h).padStart(2, '0')}h`, v: evts.filter((e) => e.type === 'page_vue' && e.ts >= d0.getTime() && e.ts < d1).length })
      }
    } else {
      const n = periode === 'mois' ? 30 : periode === 'semaine' ? 7 : Math.max(1, Math.min(60, Math.round((bornes.fin - bornes.debut) / JOUR)))
      for (let i = n - 1; i >= 0; i--) {
        const d0 = new Date(bornes.fin - i * JOUR); d0.setHours(0, 0, 0, 0)
        const d1 = d0.getTime() + JOUR
        pts.push({ l: jourCourt(d0.getTime()), v: evts.filter((e) => e.type === 'page_vue' && e.ts >= d0.getTime() && e.ts < d1).length })
      }
    }
    return pts
  }, [evts, periode, bornes])

  // ------------------------------------------------------------------ paniers
  const paniers = useMemo(() => {
    const parSession = new Map<string, { sid: string; userId: string | null; produits: Map<string, number>; derniere: number; commande: number | null }>()
    evts.forEach((e) => {
      if (!['panier_ajout', 'panier_retrait', 'commande_creee'].includes(e.type)) return
      if (!parSession.has(e.sid))
        parSession.set(e.sid, { sid: e.sid, userId: e.userId, produits: new Map(), derniere: e.ts, commande: null })
      const p = parSession.get(e.sid)!
      p.derniere = Math.max(p.derniere, e.ts)
      if (e.userId) p.userId = e.userId
      if (e.type === 'panier_ajout' && e.productId) p.produits.set(e.productId, (p.produits.get(e.productId) ?? 0) + 1)
      if (e.type === 'panier_retrait' && e.productId) {
        const n = (p.produits.get(e.productId) ?? 0) - 1
        if (n > 0) p.produits.set(e.productId, n); else p.produits.delete(e.productId)
      }
      if (e.type === 'commande_creee') p.commande = e.ts
    })
    return [...parSession.values()]
      .map((p) => {
        const lignes = [...p.produits.entries()].map(([id, q]) => ({
          id, q, titre: db.products.find((x) => x.id === id)?.titre ?? 'Produit retiré',
          prix: db.products.find((x) => x.id === id)?.prix ?? 0,
        }))
        const montant = lignes.reduce((s, l) => s + l.prix * l.q, 0)
        const converti = p.commande !== null
        const inactif = Date.now() - p.derniere > 30 * 60000
        return {
          ...p, lignes, montant,
          statut: converti ? 'converti' : inactif ? 'sans_suite' : 'actif',
        }
      })
      .filter((p) => p.lignes.length > 0 || p.commande)
      .sort((a, b) => b.derniere - a.derniere)
  }, [evts, db.products])

  const paniersSansSuite = paniers.filter((p) => p.statut === 'sans_suite')
  const recuperes = paniers.filter((p) => p.statut === 'converti' && p.lignes.length > 0).length

  // ------------------------------------------------------------------ alertes
  const alertes = useMemo(() => {
    const out: { id: string; niveau: 'haute' | 'moyenne' | 'info'; titre: string; detail: string; ts: number }[] = []
    const echecs = de('connexion_echouee')
    const parCompte = new Map<string, Evt[]>()
    echecs.forEach((e) => {
      const k = (e.meta?.compte as string) ?? e.sid
      parCompte.set(k, [...(parCompte.get(k) ?? []), e])
    })
    parCompte.forEach((list, k) => {
      if (list.length >= 3) {
        out.push({
          id: 'auth_' + k, niveau: 'haute',
          titre: 'Tentatives de connexion répétées et échouées',
          detail: `${list.length} échecs enregistrés pour ${masquerId(k, params.masquage)} · dernier motif : ${list[list.length - 1].meta?.motif ?? 'non précisé'}. À vérifier avant toute conclusion : un oubli de mot de passe produit le même signal.`,
          ts: list[list.length - 1].ts,
        })
      }
    })
    de('acces_refuse').forEach((e) =>
      out.push({
        id: e.id, niveau: 'moyenne',
        titre: 'Tentative d’accès à une fonction non autorisée',
        detail: `Chemin « ${e.chemin} » · rôle du compte : ${e.meta?.role ?? '—'} · rôle requis : ${e.meta?.requis ?? '—'}. Le contrôle de permissions a bloqué la requête.`,
        ts: e.ts,
      }),
    )
    de('paiement_echoue').forEach((e) =>
      out.push({
        id: e.id, niveau: 'moyenne',
        titre: 'Échec de paiement signalé',
        detail: `Commande ${e.meta?.reference} · ${fcfa(Number(e.meta?.montant ?? 0))} · motif transmis : ${e.meta?.motif ?? 'non précisé'}.`,
        ts: e.ts,
      }),
    )
    const erreurs = de('erreur')
    if (erreurs.length >= 2)
      out.push({
        id: 'err_groupe', niveau: 'haute',
        titre: 'Erreurs répétées lors du traitement des commandes',
        detail: `${erreurs.length} rejets de notification enregistrés (montant, devise ou idempotence). Vérifier la configuration du prestataire ${db.settings.prestataire}.`,
        ts: erreurs[erreurs.length - 1].ts,
      })
    else erreurs.forEach((e) =>
      out.push({ id: e.id, niveau: 'moyenne', titre: 'Anomalie de fonctionnement', detail: `${e.meta?.contexte ?? 'application'} · ${e.meta?.motif ?? 'non précisé'}${e.meta?.commande ? ` · commande ${e.meta.commande}` : ''}.`, ts: e.ts }),
    )
    sessionsPeriode.forEach((s) => {
      const duree = s.derniere - s.debut
      if (s.pages >= 40 && duree < 5 * 60000)
        out.push({
          id: 'rythme_' + s.sid, niveau: 'moyenne',
          titre: 'Activité inhabituelle sur une session',
          detail: `${s.pages} pages en moins de 5 minutes pour la session ${masquerSid(s.sid)}. Peut correspondre à un robot d’indexation : à confirmer, une anomalie isolée ne prouve pas une fraude.`,
          ts: s.derniere,
        })
    })
    return out.sort((a, b) => b.ts - a.ts)
  }, [evts, sessionsPeriode, params.masquage])

  // --------------------------------------------------------------- recherches
  const recherches = useMemo(() => {
    const m = new Map<string, { n: number; resultats: number; derniere: number }>()
    de('recherche').forEach((e) => {
      const t = String(e.meta?.terme ?? '').toLowerCase()
      if (!t) return
      const prev = m.get(t)
      m.set(t, {
        n: (prev?.n ?? 0) + 1,
        resultats: Number(e.meta?.resultats ?? 0),
        derniere: Math.max(prev?.derniere ?? 0, e.ts),
      })
    })
    return [...m.entries()].sort((a, b) => b[1].n - a[1].n)
  }, [evts])

  const journalAdmin = useMemo(() => tousEvts.filter((e) => e.type === 'admin_action').slice().reverse(), [tousEvts])

  if (chargement)
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-ink-2/50 px-5 py-10">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-sable" />
        <p className="text-sm text-cream/50">Chargement des événements enregistrés…</p>
      </div>
    )

  const filtrePeriode = () => (
    <div className="flex flex-wrap items-center gap-2">
      {[
        { id: 'jour', l: 'Aujourd’hui' },
        { id: 'semaine', l: '7 jours' },
        { id: 'mois', l: '30 jours' },
        { id: 'perso', l: 'Personnalisée' },
      ].map((p) => (
        <button
          key={p.id}
          onClick={() => setPeriode(p.id as any)}
          className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition ${
            periode === p.id ? 'border-sable bg-sable/15 text-sable' : 'border-line text-cream/55 hover:text-cream'
          }`}
        >
          {p.l}
        </button>
      ))}
      {periode === 'perso' && (
        <span className="flex items-center gap-2">
          <input type="date" value={debutPerso} onChange={(e) => setDebutPerso(e.target.value)} className="rounded-lg border border-line bg-ink-2 px-2.5 py-1.5 text-[12.5px] text-cream" />
          <span className="text-cream/35">→</span>
          <input type="date" value={finPerso} onChange={(e) => setFinPerso(e.target.value)} className="rounded-lg border border-line bg-ink-2 px-2.5 py-1.5 text-[12.5px] text-cream" />
        </span>
      )}
      <span className="ml-auto flex items-center gap-1.5 text-[11.5px] text-cream/35">
        <RefreshCw size={12} className="pulse-soft" /> actualisation automatique · 5 s
      </span>
    </div>
  )

  return (
    <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
      {/* menu latéral */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-3 px-1 text-[11.5px] font-semibold uppercase tracking-wider text-cream/35">Activités du site</p>
        <nav className="flex gap-1.5 overflow-x-auto lg:flex-col lg:overflow-visible">
          {SOUS_MENUS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSous(m.id)}
              className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition lg:w-full ${
                sous === m.id ? 'bg-sable/15 text-sable' : 'text-cream/55 hover:bg-cream/5 hover:text-cream'
              }`}
            >
              <m.i size={15} className="shrink-0" />
              <span className="flex-1 whitespace-nowrap lg:whitespace-normal">{m.l}</span>
              {m.id === 'alertes' && alertes.length > 0 && (
                <span className="rounded-full bg-red-500/20 px-1.5 text-[10.5px] font-bold text-red-300">{alertes.length}</span>
              )}
              {m.id === 'direct' && actives.length > 0 && (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emeraude-soft pulse-soft" />
              )}
            </button>
          ))}
        </nav>
        <p className="mt-4 hidden rounded-xl border border-line bg-ink-2/50 p-3 text-[11px] leading-relaxed text-cream/35 lg:block">
          Données issues uniquement des événements réellement enregistrés sur la plateforme. Aucune statistique n’est
          estimée ni simulée.
        </p>
      </aside>

      <div className="min-w-0">
        {/* ---------------------------------------------------------- APERÇU */}
        {sous === 'apercu' && (
          <div className="space-y-6">
            {filtrePeriode()}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi i={Radio} ton="vert" l="Visiteurs actifs maintenant" v={actives.length} s="fenêtre de 5 minutes" />
              <Kpi i={Eye} l="Visiteurs uniques aujourd’hui" v={visiteursUniquesJour} s="sessions pseudonymisées" />
              <Kpi i={Activity} l="Pages consultées" v={pagesVues} s="sur la période" />
              <Kpi i={TrendingDown} l="Taux de conversion" v={`${tauxConversion.toFixed(1)} %`} s={`${sessionsAvecCommande.size} session(s) avec commande`} />
              <Kpi i={ShoppingCart} l="Paniers créés" v={paniers.filter((p) => p.lignes.length > 0 || p.commande).length} />
              <Kpi i={ShoppingCart} ton="rouge" l="Paniers sans commande" v={paniersSansSuite.length} s="inactifs depuis plus de 30 min" />
              <Kpi i={Receipt} l="Commandes créées" v={de('commande_creee').length} />
              <Kpi i={CheckCircle2} ton="vert" l="Paiements confirmés" v={de('paiement_confirme').length} s="après vérification serveur" />
            </div>

            <Panel>
              <h3 className="display mb-4 text-lg font-bold">Pages consultées — {periode === 'jour' ? 'par heure' : 'par jour'}</h3>
              {pagesVues === 0 ? (
                <Vide t="Aucune consultation sur la période" d="Les courbes se construisent au fil des visites réelles. Naviguez sur le site public ou élargissez la période pour voir apparaître des données." />
              ) : (
                <Courbe points={serieTemps} />
              )}
            </Panel>

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel>
                <h3 className="display mb-4 text-lg font-bold">Produits les plus consultés</h3>
                <Barres data={topProduits.slice(0, 6).map((p) => [p.titre, p.n])} unite=" vues" />
              </Panel>
              <Panel>
                <h3 className="display mb-4 text-lg font-bold">Catégories les plus populaires</h3>
                <Barres data={topCategories.slice(0, 6).map(([c, n]) => [catNom(c), n])} unite=" vues" />
              </Panel>
              <Panel className="lg:col-span-2">
                <h3 className="display mb-4 text-lg font-bold">Sources de trafic</h3>
                <Barres data={sources} unite=" session(s)" />
                <p className="mt-4 text-[11.5px] leading-relaxed text-cream/35">
                  Source déduite du référent du navigateur et des paramètres de campagne. Aucune adresse IP, aucun
                  traceur publicitaire tiers n’est utilisé.
                </p>
              </Panel>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------- DIRECT */}
        {sous === 'direct' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="display text-xl font-bold">Visiteurs en direct</h3>
                <p className="text-[13px] text-cream/45">
                  {actives.length} session(s) active(s) · mise à jour automatique sans rechargement de la page.
                </p>
              </div>
              <Badge tone="ok"><span className="h-1.5 w-1.5 rounded-full bg-emeraude-soft pulse-soft" /> en direct</Badge>
            </div>

            {actives.length === 0 ? (
              <Vide t="Aucune session active actuellement" d="Une session est considérée comme active lorsqu’une activité a été enregistrée au cours des 5 dernières minutes. Ouvrez le site public dans un autre onglet pour voir une session apparaître ici." />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-line">
                <table className="w-full min-w-[760px] text-left text-[13px]">
                  <thead className="bg-ink-3/60 text-[11.5px] uppercase tracking-wider text-cream/45">
                    <tr>
                      {['Session', 'Début', 'Dernière activité', 'Page actuelle', 'Pages', 'Produit / catégorie', 'Source', 'Appareil', 'Région'].map((h) => (
                        <th key={h} className="px-3.5 py-3 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {actives.map((s) => {
                      const prod = s.dernierProduit ? db.products.find((p) => p.id === s.dernierProduit) : null
                      return (
                        <tr key={s.sid} className="border-t border-line hover:bg-cream/[0.03]">
                          <td className="px-3.5 py-3 font-mono text-[12px]">{masquerSid(s.sid)}</td>
                          <td className="px-3.5 py-3 text-cream/60">{heure(s.debut)}</td>
                          <td className="px-3.5 py-3"><span className="text-emeraude-soft">{depuis(s.derniere)}</span></td>
                          <td className="px-3.5 py-3 text-cream/70">{s.chemin}</td>
                          <td className="px-3.5 py-3">{s.pages}</td>
                          <td className="px-3.5 py-3 text-cream/60">{prod ? prod.titre.slice(0, 28) : s.derniereCategorie ? catNom(s.derniereCategorie) : '—'}</td>
                          <td className="px-3.5 py-3 text-cream/60">{s.source}</td>
                          <td className="px-3.5 py-3"><span className="inline-flex items-center gap-1.5 text-cream/60"><IconeAppareil a={s.appareil} /> {s.appareil}</span></td>
                          <td className="px-3.5 py-3 text-cream/50">{s.region ?? 'non disponible'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <Panel className="border-sable/25 bg-sable/5">
              <p className="text-[12.5px] leading-relaxed text-cream/60">
                <strong className="text-sable">Limite volontaire.</strong> Les sessions sont pseudonymisées et ne
                permettent pas d’identifier une personne anonyme. Aucun mot de passe, aucune donnée bancaire, aucun
                contenu privé n’est affiché ici. La région est approximative (fuseau horaire du navigateur) et
                n’est présentée que lorsqu’elle est disponible.
              </p>
            </Panel>
          </div>
        )}

        {/* --------------------------------------------------------- PARCOURS */}
        {sous === 'parcours' && (
          <Parcours
            evts={evts}
            sessionsPeriode={sessionsPeriode}
            topProduits={topProduits}
            paniersSansSuite={paniersSansSuite.length}
            alertesErreurs={de('erreur').length + de('acces_refuse').length}
            sources={sources}
            filtre={filtrePeriode()}
          />
        )}

        {/* ---------------------------------------------------------- CLIENTS */}
        {sous === 'clients' && <ActivitesClients evts={tousEvts} masquage={params.masquage} />}

        {/* ------------------------------------------------------- RECHERCHES */}
        {sous === 'recherches' && (
          <div className="space-y-5">
            {filtrePeriode()}
            <div className="grid gap-3 sm:grid-cols-3">
              <Kpi i={Search} l="Recherches effectuées" v={de('recherche').length} />
              <Kpi i={Search} l="Termes distincts" v={recherches.length} />
              <Kpi i={AlertTriangle} ton="rouge" l="Recherches sans résultat" v={recherches.filter(([, v]) => v.resultats === 0).length} />
            </div>
            {recherches.length === 0 ? (
              <Vide t="Aucune recherche enregistrée" d="Les termes saisis dans le moteur de recherche du catalogue apparaîtront ici, avec le nombre de résultats obtenus. Aucune frappe clavier n’est enregistrée en dehors de la requête validée." />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-line">
                <table className="w-full min-w-[560px] text-left text-[13px]">
                  <thead className="bg-ink-3/60 text-[11.5px] uppercase tracking-wider text-cream/45">
                    <tr>{['Terme recherché', 'Occurrences', 'Résultats obtenus', 'Dernière recherche', 'État'].map((h) => <th key={h} className="px-3.5 py-3 font-semibold">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {recherches.map(([t, v]) => (
                      <tr key={t} className="border-t border-line hover:bg-cream/[0.03]">
                        <td className="px-3.5 py-3 font-semibold">« {t} »</td>
                        <td className="px-3.5 py-3">{v.n}</td>
                        <td className="px-3.5 py-3">{v.resultats}</td>
                        <td className="px-3.5 py-3 text-cream/55">{dateHeureFr(v.derniere)}</td>
                        <td className="px-3.5 py-3">
                          {v.resultats === 0
                            ? <Badge tone="bad">offre manquante</Badge>
                            : <Badge tone="ok">couverte</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {recherches.some(([, v]) => v.resultats === 0) && (
              <Panel className="border-mandarine/25 bg-mandarine/5">
                <p className="text-[13px] leading-relaxed text-cream/65">
                  <strong className="text-mandarine">Opportunité commerciale.</strong> Des visiteurs cherchent des
                  produits absents du catalogue. Proposez ces thèmes à vos vendeurs les plus actifs.
                </p>
              </Panel>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------- PANIERS */}
        {sous === 'paniers' && (
          <div className="space-y-5">
            {filtrePeriode()}
            <div className="grid gap-3 sm:grid-cols-4">
              <Kpi i={ShoppingCart} l="Paniers enregistrés" v={paniers.length} />
              <Kpi i={ShoppingCart} ton="rouge" l="Sans commande" v={paniersSansSuite.length} />
              <Kpi i={CheckCircle2} ton="vert" l="Paniers convertis" v={recuperes} />
              <Kpi i={Receipt} l="Montant en attente" v={fcfa(paniersSansSuite.reduce((s, p) => s + p.montant, 0))} />
            </div>

            {paniers.length === 0 ? (
              <Vide t="Aucun panier enregistré sur la période" d="Un panier apparaît ici dès qu’un produit y est ajouté. L’état est déduit des événements réellement enregistrés." />
            ) : (
              <div className="space-y-3">
                {paniers.map((p) => (
                  <div key={p.sid} className="rounded-2xl border border-line bg-ink-2/60 p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-[12.5px] text-cream/70">{masquerSid(p.sid)}</span>
                      {p.userId && <Badge>compte {masquerId(p.userId, params.masquage)}</Badge>}
                      <Badge tone={p.statut === 'converti' ? 'ok' : p.statut === 'actif' ? 'accent' : 'warn'}>
                        {p.statut === 'converti' ? 'converti en commande' : p.statut === 'actif' ? 'panier actif' : 'sans commande enregistrée'}
                      </Badge>
                      <span className="ml-auto display text-lg font-extrabold">{fcfa(p.montant)}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {p.lignes.length === 0
                        ? <span className="text-[12.5px] text-cream/40">Panier vidé puis commandé.</span>
                        : p.lignes.map((l) => (
                          <span key={l.id} className="rounded-full border border-line px-2.5 py-1 text-[12px] text-cream/65">
                            {l.titre.slice(0, 34)} × {l.q} · {fcfa(l.prix)}
                          </span>
                        ))}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3 text-[12px] text-cream/45">
                      <span>Dernière activité : {dateHeureFr(p.derniere)} ({depuis(p.derniere)})</span>
                      <button
                        onClick={() => {
                          if (!params.relanceAuto)
                            return toast('Relance impossible : la relance commerciale est désactivée dans les paramètres de confidentialité.', 'err')
                          if (!p.userId)
                            return toast('Relance impossible : aucun compte rattaché à ce panier, donc aucune préférence de communication connue.', 'err')
                          track('admin_action', { meta: { action: 'relance panier préparée', panier: p.sid } })
                          toast('Relance préparée. Elle ne sera envoyée qu’après configuration d’un canal et vérification du consentement du client.', 'info')
                        }}
                        className="ml-auto rounded-full border border-line px-3 py-1 text-[12px] text-cream/60 hover:border-sable/50 hover:text-sable"
                      >
                        Préparer une relance
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Panel className="border-sable/25 bg-sable/5">
              <p className="text-[12.5px] leading-relaxed text-cream/60">
                <strong className="text-sable">Lecture prudente.</strong> Un panier sans commande n’est pas la preuve
                d’un abandon intentionnel : le visiteur peut comparer, revenir plus tard ou avoir été interrompu. Aucune
                relance automatique n’est envoyée : elle nécessite un canal configuré, le consentement du client et le
                respect de ses préférences de communication.
              </p>
            </Panel>
          </div>
        )}

        {/* -------------------------------------------------------- COMMANDES */}
        {sous === 'commandes' && <CommandesAchats evts={evts} filtre={filtrePeriode()} masquage={params.masquage} />}

        {/* --------------------------------------------------------- RAPPORTS */}
        {sous === 'rapports' && (
          <div className="space-y-5">
            {filtrePeriode()}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="display text-xl font-bold">Rapports et statistiques</h3>
                <p className="text-[13px] text-cream/45">Synthèse de la période sélectionnée · {evts.length} événement(s) analysé(s).</p>
              </div>
              <Btn
                size="sm"
                onClick={() => {
                  const lignes: (string | number)[][] = [
                    ['Rapport KREATIVA — activités du site'],
                    ['Période', `${new Date(bornes.debut).toLocaleDateString('fr-FR')} au ${new Date(bornes.fin).toLocaleDateString('fr-FR')}`],
                    ['Données masquées', params.masquage ? 'oui' : 'non'],
                    [],
                    ['Indicateur', 'Valeur'],
                    ['Sessions', sessionsPeriode.length],
                    ['Pages consultées', pagesVues],
                    ['Recherches', de('recherche').length],
                    ['Produits consultés', de('produit_vu').length],
                    ['Ajouts au panier', de('panier_ajout').length],
                    ['Commandes créées', de('commande_creee').length],
                    ['Paiements confirmés', de('paiement_confirme').length],
                    ['Taux de conversion (%)', tauxConversion.toFixed(2)],
                    [],
                    ['Type d’événement', 'Occurrences'],
                    ...(Object.keys(LIBELLE_EVT) as EventType[])
                      .map((t) => [LIBELLE_EVT[t], de(t).length] as (string | number)[])
                      .filter((l) => Number(l[1]) > 0),
                    [],
                    ['Journal des événements (identifiants masqués)'],
                    ['Horodatage', 'Type', 'Session', 'Compte', 'Chemin'],
                    ...evts.slice(-300).map((e) => [
                      dateHeureFr(e.ts), LIBELLE_EVT[e.type], masquerSid(e.sid),
                      masquerId(e.userId, params.masquage), e.chemin ?? '',
                    ]),
                  ]
                  exporterCsv(`kreativa-rapport-${Date.now()}.csv`, lignes)
                  track('admin_action', { meta: { action: 'export du rapport d’activité', evenements: evts.length } })
                  toast('Rapport exporté. Les identifiants sensibles sont masqués selon vos paramètres.', 'ok')
                }}
              >
                <Download size={15} /> Exporter en CSV
              </Btn>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel>
                <h4 className="display mb-4 text-[15px] font-bold">Répartition des événements</h4>
                <Barres data={(Object.keys(LIBELLE_EVT) as EventType[]).map((t) => [LIBELLE_EVT[t], de(t).length] as [string, number]).filter((d) => d[1] > 0)} />
              </Panel>
              <Panel>
                <h4 className="display mb-4 text-[15px] font-bold">Appareils utilisés</h4>
                <Barres data={(['ordinateur', 'tablette', 'telephone'] as const).map((a) => [a, sessionsPeriode.filter((s) => s.appareil === a).length] as [string, number]).filter((d) => d[1] > 0)} unite=" session(s)" />
                <h4 className="display mb-3 mt-6 text-[15px] font-bold">Commandes par source</h4>
                <Barres
                  data={[...new Set(de('commande_creee').map((e) => e.source))]
                    .map((s) => [s, de('commande_creee').filter((e) => e.source === s).length] as [string, number])
                    .sort((a, b) => b[1] - a[1])}
                />
              </Panel>
            </div>

            <Panel>
              <h4 className="display mb-4 text-[15px] font-bold">Chiffres de la boutique sur la période</h4>
              <div className="grid gap-3 sm:grid-cols-3">
                <Kpi i={Receipt} l="Commandes enregistrées" v={db.orders.filter((o) => o.createdAt >= bornes.debut && o.createdAt <= bornes.fin).length} />
                <Kpi i={CheckCircle2} ton="vert" l="Volume encaissé" v={fcfa(db.orders.filter((o) => o.statut === 'payee' && o.updatedAt >= bornes.debut).reduce((s, o) => s + o.total, 0))} />
                <Kpi i={BarChart3} l="Commission plateforme" v={fcfa(db.orders.filter((o) => o.statut === 'payee' && o.updatedAt >= bornes.debut).reduce((s, o) => s + o.commission, 0))} />
              </div>
            </Panel>
          </div>
        )}

        {/* ---------------------------------------------------------- ALERTES */}
        {sous === 'alertes' && (
          <div className="space-y-5">
            {filtrePeriode()}
            <div className="grid gap-3 sm:grid-cols-3">
              <Kpi i={ShieldAlert} ton="rouge" l="Alertes de priorité haute" v={alertes.filter((a) => a.niveau === 'haute').length} />
              <Kpi i={AlertTriangle} l="Alertes à surveiller" v={alertes.filter((a) => a.niveau === 'moyenne').length} />
              <Kpi i={CheckCircle2} ton="vert" l="Échecs de connexion" v={de('connexion_echouee').length} s="sur la période" />
            </div>

            {alertes.length === 0 ? (
              <Vide t="Aucune alerte sur la période" d="Les tentatives de connexion répétées, les accès refusés, les échecs de paiement et les anomalies de traitement apparaîtront ici dès qu’ils seront enregistrés." />
            ) : (
              <div className="space-y-3">
                {alertes.map((a) => (
                  <div key={a.id} className={`rounded-2xl border p-4 ${a.niveau === 'haute' ? 'border-red-500/30 bg-red-500/5' : 'border-sable/25 bg-sable/5'}`}>
                    <div className="flex flex-wrap items-center gap-3">
                      <ShieldAlert size={17} className={a.niveau === 'haute' ? 'text-red-300' : 'text-sable'} />
                      <p className="display font-bold">{a.titre}</p>
                      <Badge tone={a.niveau === 'haute' ? 'bad' : 'warn'}>{a.niveau === 'haute' ? 'priorité haute' : 'à surveiller'}</Badge>
                      <span className="ml-auto text-[12px] text-cream/40">{dateHeureFr(a.ts)}</span>
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-cream/60">{a.detail}</p>
                  </div>
                ))}
              </div>
            )}

            <Panel className="border-line">
              <p className="text-[12.5px] leading-relaxed text-cream/55">
                <strong className="text-cream/80">Méthode.</strong> Chaque alerte repose sur des événements vérifiables
                et horodatés, consultables dans les rapports. Une anomalie isolée ne permet jamais de conclure à une
                fraude : croisez toujours plusieurs signaux avant de suspendre un compte.
              </p>
            </Panel>
          </div>
        )}

        {/* -------------------------------------------------- CONFIDENTIALITÉ */}
        {sous === 'confidentialite' && (
          <div className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <Panel>
                <h3 className="display mb-4 text-lg font-bold">Paramètres de collecte</h3>
                <div className="space-y-3.5">
                  {[
                    { k: 'collecte' as const, l: 'Collecte des événements activée', d: 'Désactiver interrompt immédiatement tout enregistrement.' },
                    { k: 'masquage' as const, l: 'Masquage des identifiants dans les rapports et exports', d: 'Recommandé : limite l’exposition des identifiants de compte.' },
                    { k: 'relanceAuto' as const, l: 'Relance commerciale des paniers autorisée', d: 'Nécessite un canal configuré et le consentement du client.' },
                  ].map((o) => (
                    <label key={o.k} className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-ink/40 p-3.5">
                      <input
                        type="checkbox"
                        checked={params[o.k] as boolean}
                        onChange={(e) => {
                          const next = ecrireParametres({ [o.k]: e.target.checked } as any)
                          setParams(next)
                          track('admin_action', { meta: { action: `paramètre de confidentialité « ${o.k} » = ${e.target.checked}` } })
                          toast('Paramètre enregistré.', 'ok')
                        }}
                        className="mt-0.5 h-4 w-4 accent-[#C9A227]"
                      />
                      <span>
                        <span className="block text-[13.5px] font-semibold">{o.l}</span>
                        <span className="block text-[12px] text-cream/45">{o.d}</span>
                      </span>
                    </label>
                  ))}

                  <Select
                    label="Mode de recueil du consentement"
                    value={params.consentement}
                    onChange={(e) => { const n = ecrireParametres({ consentement: e.target.value as any }); setParams(n); toast('Paramètre enregistré.', 'ok') }}
                  >
                    <option value="implicite">Mesure d’audience strictement nécessaire (information claire)</option>
                    <option value="explicite">Consentement explicite requis avant toute mesure</option>
                  </Select>

                  <Field
                    label="Durée de conservation (jours)"
                    type="number" min={7} max={365}
                    value={params.conservationJours}
                    onChange={(e) => { const n = ecrireParametres({ conservationJours: Math.max(7, Number(e.target.value) || 90) }); setParams(n) }}
                    hint="Les événements plus anciens sont supprimés automatiquement à chaque écriture."
                  />

                  <div className="flex flex-wrap gap-2">
                    <Btn size="sm" variant="outline" onClick={() => { purgerEvenements(); setTick((t) => t + 1); track('admin_action', { meta: { action: 'purge des événements expirés' } }); toast('Événements expirés supprimés.', 'ok') }}>
                      <RefreshCw size={14} /> Appliquer la purge maintenant
                    </Btn>
                    <Btn size="sm" variant="danger" onClick={() => { if (confirm('Supprimer définitivement tous les événements et sessions enregistrés ?')) { toutSupprimer(); setTick((t) => t + 1); toast('Toutes les données d’activité ont été supprimées.', 'ok') } }}>
                      <Trash2 size={14} /> Tout supprimer
                    </Btn>
                  </div>
                </div>
              </Panel>

              <div className="space-y-5">
                <Panel>
                  <h3 className="display mb-3 text-lg font-bold">Données collectées</h3>
                  <ul className="space-y-2 text-[13px] leading-relaxed text-cream/60">
                    {[
                      'Identifiant de session pseudonymisé, non réversible, renouvelé à chaque visite.',
                      'Type d’événement, horodatage, chemin de la page.',
                      'Identifiant de boutique ou de produit concerné, lorsque applicable.',
                      'Type d’appareil et source de provenance (référent).',
                      'Région approximative déduite du fuseau horaire du navigateur.',
                      'Identifiant de compte, uniquement pour les actions réalisées en étant connecté.',
                    ].map((t) => <li key={t} className="flex gap-2"><ChevronRight size={14} className="mt-0.5 shrink-0 text-sable" /> {t}</li>)}
                  </ul>
                  <h4 className="display mb-2 mt-5 text-[14px] font-bold text-red-300">Jamais collecté</h4>
                  <ul className="space-y-2 text-[13px] leading-relaxed text-cream/60">
                    {[
                      'Mots de passe, frappes clavier, contenu des messages privés.',
                      'Numéros de carte, codes PIN Mobile Money, données bancaires.',
                      'Adresse IP, identifiants publicitaires, traceurs tiers.',
                      'Toute tentative d’identification d’un visiteur anonyme.',
                    ].map((t) => <li key={t} className="flex gap-2"><ChevronRight size={14} className="mt-0.5 shrink-0 text-red-300" /> {t}</li>)}
                  </ul>
                </Panel>

                <Panel>
                  <h3 className="display mb-3 text-lg font-bold">Droits et cadre applicable</h3>
                  <p className="text-[12.5px] leading-relaxed text-cream/55">
                    Les personnes concernées disposent d’un droit d’accès, de rectification, d’opposition et de
                    suppression de leurs données, exerçable depuis le centre d’aide. Le traitement se limite à la mesure
                    d’audience et à la sécurité de la plateforme, conformément à la loi ivoirienne n° 2013-450 relative
                    à la protection des données à caractère personnel et aux recommandations de l’ARTCI. Un vendeur n’a
                    accès à aucune activité des clients d’une autre boutique ; l’administrateur n’accède qu’aux données
                    nécessaires à ses fonctions.
                  </p>
                </Panel>
              </div>
            </div>

            <Panel>
              <h3 className="display mb-4 text-lg font-bold">Journal des actions administrateur</h3>
              {journalAdmin.length === 0 ? (
                <p className="text-[13px] text-cream/40">Aucune action administrateur enregistrée pour le moment.</p>
              ) : (
                <ol className="space-y-2.5">
                  {journalAdmin.slice(0, 25).map((e) => (
                    <li key={e.id} className="flex gap-3 border-b border-line pb-2.5 text-[13px] last:border-0">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sable" />
                      <span className="flex-1">
                        <span className="block text-cream/75">{e.meta?.action ?? 'Action administrateur'}</span>
                        <span className="block text-[11.5px] text-cream/35">
                          {dateHeureFr(e.ts)} · compte {masquerId(e.userId, params.masquage)} · session {masquerSid(e.sid)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
          </div>
        )}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ PARCOURS

function Parcours({ evts, sessionsPeriode, topProduits, paniersSansSuite, alertesErreurs, sources, filtre }: any) {
  const { db } = useStore()
  const sidsDe = (t: EventType) => new Set(evts.filter((e: Evt) => e.type === t).map((e: Evt) => e.sid))

  const etapes = [
    { l: 'Visite du site', n: new Set(sessionsPeriode.map((s: SessionRec) => s.sid)).size },
    { l: 'Consultation d’une boutique', n: sidsDe('boutique_vue').size },
    { l: 'Consultation d’un produit', n: sidsDe('produit_vu').size },
    { l: 'Ajout au panier', n: sidsDe('panier_ajout').size },
    { l: 'Passage à la commande', n: sidsDe('checkout_debut').size },
    { l: 'Commande créée', n: sidsDe('commande_creee').size },
    { l: 'Achat confirmé', n: sidsDe('paiement_confirme').size },
  ]
  const depart = Math.max(1, etapes[0].n)

  const vusSansAchat = topProduits
    .map((p: any) => {
      const achats = evts.filter((e: Evt) => e.type === 'paiement_confirme').length
      const panier = evts.filter((e: Evt) => e.type === 'panier_ajout' && e.productId === p.id).length
      return { ...p, panier, achats }
    })
    .filter((p: any) => p.n >= 2 && p.panier === 0)
    .slice(0, 5)

  const sourcesCommandes = [...new Set(evts.filter((e: Evt) => e.type === 'commande_creee').map((e: Evt) => e.source))]
    .map((s) => [s as string, evts.filter((e: Evt) => e.type === 'commande_creee' && e.source === s).length] as [string, number])
    .sort((a, b) => b[1] - a[1])

  const recos: { t: string; d: string; ton: 'warn' | 'bad' | 'ok' }[] = []
  if (etapes[0].n > 0 && etapes[2].n === 0)
    recos.push({ t: 'Les visiteurs n’atteignent pas les fiches produits', d: 'Aucune consultation de fiche produit sur la période alors que des visites ont été enregistrées. Mettez en avant des produits dès la page d’accueil.', ton: 'bad' })
  if (etapes[2].n > 0 && etapes[3].n === 0)
    recos.push({ t: 'Aucun ajout au panier après consultation', d: `${etapes[2].n} session(s) ont consulté une fiche produit sans jamais ajouter au panier. Vérifiez la clarté du prix, de la description et du bouton d’achat.`, ton: 'warn' })
  if (etapes[4].n > 0 && etapes[6].n < etapes[4].n)
    recos.push({ t: 'Perte entre la commande et le paiement confirmé', d: `${etapes[4].n - etapes[6].n} session(s) ont démarré une commande sans paiement confirmé. Cette étape dépend de l’activation du compte marchand ${db.settings.prestataire}.`, ton: 'warn' })
  if (paniersSansSuite > 0)
    recos.push({ t: 'Paniers restés sans commande', d: `${paniersSansSuite} panier(s) inactifs depuis plus de 30 minutes. Consultez la section « Paniers abandonnés » avant toute conclusion.`, ton: 'warn' })
  if (vusSansAchat.length > 0)
    recos.push({ t: 'Produits consultés mais jamais mis au panier', d: vusSansAchat.map((p: any) => p.titre).join(' · ') + ' — retravaillez le titre, le prix ou la couverture.', ton: 'warn' })
  if (alertesErreurs > 0)
    recos.push({ t: 'Erreurs rencontrées dans le tunnel', d: `${alertesErreurs} erreur(s) ou accès refusé(s) enregistrés. Détail dans « Alertes de sécurité ».`, ton: 'bad' })
  if (sourcesCommandes.length > 0)
    recos.push({ t: 'Source la plus performante', d: `${sourcesCommandes[0][0]} génère ${sourcesCommandes[0][1]} commande(s). Concentrez vos efforts sur ce canal.`, ton: 'ok' })

  return (
    <div className="space-y-5">
      {filtre}
      <Panel>
        <h3 className="display mb-1 text-lg font-bold">Parcours d’achat</h3>
        <p className="mb-5 text-[13px] text-cream/45">Nombre de sessions distinctes ayant atteint chaque étape.</p>
        {etapes[0].n === 0 ? (
          <Vide t="Aucun parcours enregistré" d="Le tunnel se construit à partir des sessions réelles. Aucune donnée n’est extrapolée." />
        ) : (
          <div className="space-y-3.5">
            {etapes.map((e, i) => {
              const pct = (e.n / depart) * 100
              const perte = i > 0 ? etapes[i - 1].n - e.n : 0
              return (
                <div key={e.l}>
                  <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[13px]">
                    <span className="font-semibold text-cream/80">{i + 1}. {e.l}</span>
                    <span className="text-cream/45">{e.n} session(s) · {pct.toFixed(0)} %</span>
                    {perte > 0 && <Badge tone="bad"><TrendingDown size={11} /> −{perte} à cette étape</Badge>}
                  </div>
                  <div className="h-7 overflow-hidden rounded-lg bg-ink-3">
                    <div className="flex h-full items-center justify-end rounded-lg bg-gradient-to-r from-sable/70 to-mandarine px-2.5 text-[11.5px] font-bold text-ink" style={{ width: `${Math.max(pct, 3)}%` }}>
                      {e.n}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <h4 className="display mb-4 text-[15px] font-bold">Recommandations fondées sur les données</h4>
          {recos.length === 0 ? (
            <p className="text-[13px] text-cream/40">Pas encore assez d’événements pour formuler une recommandation fiable.</p>
          ) : (
            <ul className="space-y-3">
              {recos.map((r) => (
                <li key={r.t} className="rounded-xl border border-line bg-ink/40 p-3.5">
                  <p className="flex items-center gap-2 text-[13.5px] font-semibold">
                    <span className={`h-1.5 w-1.5 rounded-full ${r.ton === 'bad' ? 'bg-red-400' : r.ton === 'ok' ? 'bg-emeraude-soft' : 'bg-sable'}`} />
                    {r.t}
                  </p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-cream/55">{r.d}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel>
          <h4 className="display mb-4 text-[15px] font-bold">Sources générant le plus de commandes</h4>
          <Barres data={sourcesCommandes} unite=" commande(s)" />
          <h4 className="display mb-3 mt-6 text-[15px] font-bold">Sessions par source</h4>
          <Barres data={sources} unite=" session(s)" />
        </Panel>
      </div>
    </div>
  )
}

// --------------------------------------------------- ACTIVITÉS DES CLIENTS

function ActivitesClients({ evts, masquage }: { evts: Evt[]; masquage: boolean }) {
  const { db, user } = useStore()
  const toast = useToast()
  const CLE = 'kreativa.analytics.unlock'
  const [debloque, setDebloque] = useState(() => Number(sessionStorage.getItem(CLE) ?? 0) > Date.now())
  const [mdp, setMdp] = useState('')
  const [verif, setVerif] = useState(false)
  const [erreur, setErreur] = useState('')

  const [client, setClient] = useState('')
  const [type, setType] = useState('')
  const [du, setDu] = useState('')
  const [au, setAu] = useState('')

  const deverrouiller = async () => {
    setVerif(true)
    setErreur('')
    const ok = await verifyPassword(mdp, user!.salt, user!.hash)
    setVerif(false)
    if (!ok) {
      setErreur('Mot de passe administrateur incorrect.')
      track('connexion_echouee', { meta: { motif: 'authentification renforcée refusée', compte: user!.id } })
      return
    }
    sessionStorage.setItem(CLE, String(Date.now() + 15 * 60000))
    setDebloque(true)
    setMdp('')
    track('admin_action', { meta: { action: 'accès à l’historique d’activité client (authentification renforcée)' } })
  }

  if (!debloque)
    return (
      <Panel className="mx-auto max-w-md">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sable/15 text-sable"><KeyRound size={20} /></span>
        <h3 className="display mt-4 text-xl font-bold">Authentification renforcée requise</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-cream/55">
          La consultation de l’historique d’activité d’un compte client est une fonction sensible. Confirmez votre mot
          de passe administrateur pour y accéder. L’accès est valable 15 minutes et chaque consultation est journalisée.
        </p>
        <div className="mt-5 space-y-3">
          <Field label="Mot de passe administrateur" type="password" value={mdp} onChange={(e) => setMdp(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && deverrouiller()} />
          {erreur && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-[13px] text-red-300">{erreur}</p>}
          <Btn full onClick={deverrouiller} disabled={verif || !mdp}>{verif ? 'Vérification…' : 'Déverrouiller'}</Btn>
        </div>
      </Panel>
    )

  const resultats = evts
    .filter((e) => e.userId)
    .filter((e) => {
      if (client) {
        const u = db.users.find((x) => x.id === e.userId)
        const q = client.toLowerCase()
        if (!(e.userId!.toLowerCase().includes(q) || u?.nom.toLowerCase().includes(q) || u?.email.toLowerCase().includes(q))) return false
      }
      if (type && e.type !== type) return false
      if (du && e.ts < new Date(du).getTime()) return false
      if (au && e.ts > new Date(au).getTime() + JOUR) return false
      return true
    })
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 300)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="display text-xl font-bold">Activités des clients</h3>
          <p className="text-[13px] text-cream/45">Événements rattachés à un compte connecté · {resultats.length} résultat(s).</p>
        </div>
        <Badge tone="ok"><Lock size={11} /> session déverrouillée · 15 min</Badge>
      </div>

      <Panel>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Client (nom, e-mail ou identifiant)" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Recherche rapide…" />
          <Select label="Type d’événement" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Tous les types</option>
            {(Object.keys(LIBELLE_EVT) as EventType[]).map((t) => <option key={t} value={t}>{LIBELLE_EVT[t]}</option>)}
          </Select>
          <Field label="Du" type="date" value={du} onChange={(e) => setDu(e.target.value)} />
          <Field label="Au" type="date" value={au} onChange={(e) => setAu(e.target.value)} />
        </div>
      </Panel>

      {resultats.length === 0 ? (
        <Vide t="Aucun événement correspondant" d="Affinez ou réinitialisez les filtres. Seuls les événements réalisés en étant connecté sont rattachés à un compte ; les visites anonymes restent pseudonymisées." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[820px] text-left text-[13px]">
            <thead className="bg-ink-3/60 text-[11.5px] uppercase tracking-wider text-cream/45">
              <tr>{['Date et heure', 'Client', 'Événement', 'Détails utiles', 'Session', 'Appareil'].map((h) => <th key={h} className="px-3.5 py-3 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {resultats.map((e) => {
                const u = db.users.find((x) => x.id === e.userId)
                const prod = e.productId ? db.products.find((p) => p.id === e.productId) : null
                const shop = e.shopId ? db.shops.find((s) => s.id === e.shopId) : null
                const details = [
                  prod && `Produit : ${prod.titre}`,
                  shop && `Boutique : ${shop.nom}`,
                  e.meta?.reference && `Commande ${e.meta.reference}`,
                  e.meta?.montant && fcfa(Number(e.meta.montant)),
                  e.meta?.terme && `Terme « ${e.meta.terme} »`,
                  e.meta?.motif && `Motif : ${e.meta.motif}`,
                  !prod && !shop && !e.meta && e.chemin,
                ].filter(Boolean).join(' · ')
                return (
                  <tr key={e.id} className="border-t border-line hover:bg-cream/[0.03]">
                    <td className="whitespace-nowrap px-3.5 py-3 text-cream/60">{dateHeureFr(e.ts)}</td>
                    <td className="px-3.5 py-3">
                      <span className="block font-semibold">{u?.nom ?? 'Compte supprimé'}</span>
                      <span className="block text-[11.5px] text-cream/35">{masquerId(e.userId, masquage)}</span>
                    </td>
                    <td className="px-3.5 py-3"><Badge tone={e.type.includes('echou') || e.type === 'acces_refuse' ? 'bad' : e.type === 'paiement_confirme' ? 'ok' : 'neutral'}>{LIBELLE_EVT[e.type]}</Badge></td>
                    <td className="px-3.5 py-3 text-cream/60">{details || '—'}</td>
                    <td className="px-3.5 py-3 font-mono text-[11.5px] text-cream/45">{masquerSid(e.sid)}</td>
                    <td className="px-3.5 py-3"><span className="inline-flex items-center gap-1.5 text-cream/55"><IconeAppareil a={e.appareil} /> {e.appareil}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Panel className="border-sable/25 bg-sable/5">
        <p className="text-[12.5px] leading-relaxed text-cream/60">
          <strong className="text-sable">Périmètre.</strong> Seuls les événements nécessaires au suivi commercial et à
          la sécurité sont consultables. Aucun mot de passe, aucune donnée de paiement confidentielle, aucun contenu de
          message privé n’est enregistré ni affiché. Chaque consultation de cet écran est inscrite au journal des
          actions administrateur.
        </p>
      </Panel>
    </div>
  )
}

// ----------------------------------------------------- COMMANDES ET ACHATS

function CommandesAchats({ evts, filtre, masquage }: { evts: Evt[]; filtre: any; masquage: boolean }) {
  const { db } = useStore()
  const [statut, setStatut] = useState('')
  const [q, setQ] = useState('')

  const commandes = db.orders
    .filter((o) => (statut ? o.statut === statut : true))
    .filter((o) => {
      if (!q) return true
      const u = db.users.find((x) => x.id === o.buyerId)
      const t = q.toLowerCase()
      return o.reference.toLowerCase().includes(t) || (u?.nom.toLowerCase().includes(t) ?? false)
    })

  const sourceDe = (ref: string) => evts.find((e) => e.type === 'commande_creee' && e.meta?.reference === ref)?.source ?? '—'
  const tons = { en_attente: 'warn', payee: 'ok', echouee: 'bad', annulee: 'neutral' } as const

  return (
    <div className="space-y-5">
      {filtre}
      <div className="grid gap-3 sm:grid-cols-4">
        <Kpi i={Receipt} l="Commandes totales" v={db.orders.length} />
        <Kpi i={CheckCircle2} ton="vert" l="Payées" v={db.orders.filter((o) => o.statut === 'payee').length} />
        <Kpi i={AlertTriangle} l="En attente" v={db.orders.filter((o) => o.statut === 'en_attente').length} />
        <Kpi i={TrendingDown} ton="rouge" l="Échouées ou annulées" v={db.orders.filter((o) => o.statut === 'echouee' || o.statut === 'annulee').length} />
      </div>

      <Panel>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Recherche rapide" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Référence ou nom du client…" />
          <Select label="Statut" value={statut} onChange={(e) => setStatut(e.target.value)}>
            <option value="">Tous les statuts</option>
            {Object.entries(STATUT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </div>
      </Panel>

      {commandes.length === 0 ? (
        <Vide t="Aucune commande correspondante" d="Aucune commande ne correspond à ces critères. Les commandes apparaissent ici dès leur création par un acheteur." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[820px] text-left text-[13px]">
            <thead className="bg-ink-3/60 text-[11.5px] uppercase tracking-wider text-cream/45">
              <tr>{['Référence', 'Client', 'Articles', 'Montant', 'Commission', 'Moyen', 'Source', 'Statut', 'Créée le'].map((h) => <th key={h} className="px-3.5 py-3 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {commandes.map((o) => {
                const u = db.users.find((x) => x.id === o.buyerId)
                return (
                  <tr key={o.id} className="border-t border-line hover:bg-cream/[0.03]">
                    <td className="px-3.5 py-3"><Link to={`/commande/${o.id}`} className="font-mono text-[12.5px] font-semibold hover:text-sable">{o.reference}</Link></td>
                    <td className="px-3.5 py-3">
                      <span className="block">{u?.nom ?? '—'}</span>
                      <span className="block text-[11px] text-cream/35">{masquerId(o.buyerId, masquage)}</span>
                    </td>
                    <td className="px-3.5 py-3 text-cream/60">{o.items.length}</td>
                    <td className="px-3.5 py-3 font-semibold">{fcfa(o.total)}</td>
                    <td className="px-3.5 py-3 text-cream/55">{fcfa(o.commission)}</td>
                    <td className="px-3.5 py-3 text-cream/55">{o.methode}</td>
                    <td className="px-3.5 py-3 text-cream/55">{sourceDe(o.reference)}</td>
                    <td className="px-3.5 py-3"><Badge tone={tons[o.statut]}>{STATUT_LABEL[o.statut]}</Badge></td>
                    <td className="whitespace-nowrap px-3.5 py-3 text-cream/50">{dateHeureFr(o.createdAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Panel className="border-line">
        <p className="text-[12.5px] leading-relaxed text-cream/55">
          Les montants proviennent des commandes réellement enregistrées. Une commande n’est comptée comme payée
          qu’après vérification serveur du montant, de la devise et de l’unicité de la transaction.
        </p>
      </Panel>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Store, Package, Receipt, Flag, Settings as Cog, ShieldCheck, Ban, BadgeCheck,
  CheckCircle2, XCircle, RotateCcw, Wallet, Activity,
} from 'lucide-react'
import { useStore } from '../lib/store'
import { Badge, Btn, Empty, Field, Panel, Section, Select } from '../components/ui'
import { useToast } from '../components/Toast'
import { dateFr, dateHeureFr, fcfa } from '../lib/format'
import { catNom, STATUT_LABEL } from '../lib/constants'
import Activites from './admin/Activites'

export default function Admin() {
  const {
    db, confirmerPaiement, marquerEchec, basculerSuspension, verifierBoutique,
    majParametres, traiterSignalement, supprimerProduit, reinitialiserDemo,
  } = useStore()
  const toast = useToast()
  const [onglet, setOnglet] = useState('bord')
  const [tx, setTx] = useState<Record<string, string>>({})
  const [commission, setCommission] = useState(String(db.settings.commission))
  const [prestataire, setPrestataire] = useState(db.settings.prestataire)
  const [mode, setMode] = useState(db.settings.modePaiement)

  const payees = db.orders.filter((o) => o.statut === 'payee')
  const ca = payees.reduce((s, o) => s + o.total, 0)
  const revenus = payees.reduce((s, o) => s + o.commission, 0)
  const signalementsOuverts = db.signalements.filter((s) => !s.traite)

  const tons = { en_attente: 'warn', payee: 'ok', echouee: 'bad', annulee: 'neutral' } as const

  const onglets = [
    { id: 'bord', l: 'Vue d’ensemble', i: ShieldCheck },
    { id: 'activites', l: 'Activités du site', i: Activity },
    { id: 'users', l: `Comptes (${db.users.length})`, i: Users },
    { id: 'shops', l: `Boutiques (${db.shops.length})`, i: Store },
    { id: 'produits', l: `Produits (${db.products.length})`, i: Package },
    { id: 'commandes', l: `Commandes (${db.orders.length})`, i: Receipt },
    { id: 'signal', l: `Signalements (${signalementsOuverts.length})`, i: Flag },
    { id: 'params', l: 'Paramètres', i: Cog },
  ]

  return (
    <Section className="py-12">
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mandarine/15 text-mandarine"><ShieldCheck size={26} /></span>
        <div>
          <h1 className="text-3xl font-extrabold">Administration</h1>
          <p className="text-[13.5px] text-cream/45">Gestion et sécurité de la plateforme KREATIVA</p>
        </div>
        <Btn variant="danger" size="sm" className="ml-auto" onClick={() => { if (confirm('Réinitialiser toutes les données de démonstration ?')) { reinitialiserDemo(); toast('Données réinitialisées.', 'ok') } }}>
          <RotateCcw size={15} /> Réinitialiser la démo
        </Btn>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { l: 'Volume encaissé', v: fcfa(ca), i: Wallet },
          { l: `Revenus plateforme (${db.settings.commission} %)`, v: fcfa(revenus), i: Receipt },
          { l: 'Commandes payées', v: `${payees.length} / ${db.orders.length}`, i: CheckCircle2 },
          { l: 'Signalements ouverts', v: signalementsOuverts.length, i: Flag },
        ].map((s) => (
          <Panel key={s.l}>
            <s.i size={19} className="text-mandarine" />
            <p className="display mt-3 text-2xl font-extrabold">{s.v}</p>
            <p className="text-[12.5px] text-cream/45">{s.l}</p>
          </Panel>
        ))}
      </div>

      <div className="mt-9 flex gap-2 overflow-x-auto border-b border-line pb-px">
        {onglets.map((t) => (
          <button
            key={t.id}
            onClick={() => setOnglet(t.id)}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-[13.5px] font-semibold transition ${
              onglet === t.id ? 'border-mandarine text-cream' : 'border-transparent text-cream/45 hover:text-cream/75'
            }`}
          >
            <t.i size={15} /> {t.l}
          </button>
        ))}
      </div>

      <div className="mt-7">
        {onglet === 'activites' && <Activites />}

        {onglet === 'bord' && (
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel>
              <h2 className="display mb-4 text-lg font-bold">Répartition des comptes</h2>
              {(['acheteur', 'vendeur', 'admin'] as const).map((r) => {
                const n = db.users.filter((u) => u.role === r).length
                return (
                  <div key={r} className="mb-3">
                    <div className="mb-1.5 flex justify-between text-[13.5px]"><span className="capitalize">{r}s</span><span className="text-cream/50">{n}</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-ink-3">
                      <div className="h-full bg-gradient-to-r from-mandarine to-sable" style={{ width: `${(n / Math.max(1, db.users.length)) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </Panel>
            <Panel>
              <h2 className="display mb-4 text-lg font-bold">État de l’intégration paiement</h2>
              <ul className="space-y-2.5 text-[14px]">
                <li className="flex justify-between border-b border-line pb-2.5"><span className="text-cream/55">Prestataire</span><span className="font-semibold">{db.settings.prestataire}</span></li>
                <li className="flex justify-between border-b border-line pb-2.5"><span className="text-cream/55">Mode</span><span className="font-semibold">{db.settings.modePaiement === 'non_connecte' ? 'Non connecté' : 'Environnement de test'}</span></li>
                <li className="flex justify-between border-b border-line pb-2.5"><span className="text-cream/55">Clés marchandes</span><span className="font-semibold text-sable">Stockées côté serveur uniquement</span></li>
                <li className="flex justify-between"><span className="text-cream/55">Vérification</span><span className="font-semibold">Montant + devise + idempotence</span></li>
              </ul>
              <p className="mt-4 text-[12.5px] leading-relaxed text-cream/45">
                Aucune clé secrète n’est présente dans le frontend. Tant que le compte marchand n’est pas activé, les
                commissions et reversements affichés ne sont pas considérés comme opérationnels.
              </p>
            </Panel>
          </div>
        )}

        {onglet === 'users' && (
          <div className="space-y-3">
            {db.users.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-ink-2/60 p-4">
                <div className="min-w-[200px] flex-1">
                  <p className="font-semibold">{u.nom}</p>
                  <p className="text-[12.5px] text-cream/45">{u.email} · inscrit le {dateFr(u.createdAt)}</p>
                </div>
                <Badge tone={u.role === 'admin' ? 'accent' : u.role === 'vendeur' ? 'ok' : 'neutral'}>{u.role}</Badge>
                {u.suspendu && <Badge tone="bad">suspendu</Badge>}
                <Btn size="sm" variant={u.suspendu ? 'outline' : 'danger'} onClick={() => { const r = basculerSuspension(u.id); toast(r.message ?? '', r.ok ? 'ok' : 'err') }}>
                  <Ban size={14} /> {u.suspendu ? 'Réactiver' : 'Suspendre'}
                </Btn>
              </div>
            ))}
          </div>
        )}

        {onglet === 'shops' && (
          <div className="space-y-3">
            {db.shops.map((s) => {
              const owner = db.users.find((u) => u.id === s.ownerId)
              const n = db.products.filter((p) => p.shopId === s.id).length
              return (
                <div key={s.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-ink-2/60 p-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl text-xl" style={{ background: `linear-gradient(135deg, ${s.couleur}33, #1C1917)` }}>{s.logo}</span>
                  <div className="min-w-[180px] flex-1">
                    <Link to={`/boutique/${s.slug}`} className="font-semibold hover:text-mandarine">{s.nom}</Link>
                    <p className="text-[12.5px] text-cream/45">{owner?.nom} · {n} produits · {catNom(s.categorie)}</p>
                  </div>
                  {s.verifiee && <Badge tone="ok"><BadgeCheck size={12} /> vérifiée</Badge>}
                  <Btn size="sm" variant="outline" onClick={() => { const r = verifierBoutique(s.id); toast(r.message ?? '', r.ok ? 'ok' : 'err') }}>
                    {s.verifiee ? 'Retirer la certification' : 'Certifier'}
                  </Btn>
                </div>
              )
            })}
          </div>
        )}

        {onglet === 'produits' && (
          <div className="space-y-3">
            {db.products.map((p) => {
              const s = db.shops.find((x) => x.id === p.shopId)
              return (
                <div key={p.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-ink-2/60 p-3.5">
                  <img src={p.image} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-[180px] flex-1">
                    <Link to={`/produit/${p.id}`} className="font-semibold hover:text-mandarine">{p.titre}</Link>
                    <p className="text-[12.5px] text-cream/45">{s?.nom} · {catNom(p.categorie)} · {p.ventes} ventes</p>
                  </div>
                  <span className="display font-extrabold">{fcfa(p.prix)}</span>
                  <Badge tone={p.statut === 'publie' ? 'ok' : 'warn'}>{p.statut}</Badge>
                  <Btn size="sm" variant="danger" onClick={() => { if (confirm('Retirer ce produit de la plateforme ?')) { const r = supprimerProduit(p.id); toast(r.message ?? '', r.ok ? 'ok' : 'err') } }}>
                    Retirer
                  </Btn>
                </div>
              )
            })}
          </div>
        )}

        {onglet === 'commandes' && (
          db.orders.length === 0 ? (
            <Empty titre="Aucune commande" texte="Les commandes créées par les acheteurs apparaîtront ici avec leur statut de paiement." />
          ) : (
            <div className="space-y-4">
              <Panel className="border-sable/30 bg-sable/5">
                <p className="text-[13px] leading-relaxed text-cream/65">
                  <strong className="text-sable">Traitement des notifications de paiement.</strong> Cet écran représente le
                  point d’entrée serveur du webhook {db.settings.prestataire}. Une commande ne passe au statut « payée »
                  qu’après vérification de l’identifiant de transaction (idempotence), du montant exact et de la devise XOF.
                  Aucune confirmation automatique n’est effectuée côté navigateur.
                </p>
              </Panel>

              {db.orders.map((o) => {
                const buyer = db.users.find((u) => u.id === o.buyerId)
                return (
                  <div key={o.id} className="rounded-2xl border border-line bg-ink-2/60 p-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="min-w-[200px] flex-1">
                        <Link to={`/commande/${o.id}`} className="font-mono text-[13.5px] font-semibold hover:text-mandarine">{o.reference}</Link>
                        <p className="text-[12.5px] text-cream/45">{buyer?.nom} · {o.items.length} article(s) · {o.methode}</p>
                        <p className="text-[12px] text-cream/35">{dateHeureFr(o.createdAt)}</p>
                      </div>
                      <Badge tone={tons[o.statut]}>{STATUT_LABEL[o.statut]}</Badge>
                      <div className="text-right">
                        <p className="display text-lg font-extrabold">{fcfa(o.total)}</p>
                        <p className="text-[11.5px] text-cream/40">commission {fcfa(o.commission)}</p>
                      </div>
                    </div>

                    {o.statut === 'en_attente' && (
                      <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-line pt-4">
                        <div className="min-w-[220px] flex-1">
                          <Field
                            label="Identifiant de transaction reçu"
                            value={tx[o.id] ?? ''}
                            onChange={(e) => setTx({ ...tx, [o.id]: e.target.value })}
                            placeholder="ex. CP-TX-998271"
                          />
                        </div>
                        <Btn
                          size="md"
                          onClick={() => {
                            const r = confirmerPaiement(o.id, { transactionId: (tx[o.id] ?? '').trim(), montant: o.total, devise: 'XOF' })
                            toast(r.message ?? '', r.ok ? 'ok' : 'err')
                          }}
                          disabled={!(tx[o.id] ?? '').trim()}
                        >
                          <CheckCircle2 size={15} /> Valider la notification
                        </Btn>
                        <Btn size="md" variant="danger" onClick={() => { const r = marquerEchec(o.id, 'notification d’échec reçue du prestataire'); toast(r.message ?? '', r.ok ? 'ok' : 'err') }}>
                          <XCircle size={15} /> Marquer échouée
                        </Btn>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        )}

        {onglet === 'signal' && (
          db.signalements.length === 0 ? (
            <Empty titre="Aucun signalement" texte="Les signalements envoyés par les utilisateurs depuis les fiches produits arriveront ici." />
          ) : (
            <div className="space-y-3">
              {db.signalements.map((s) => {
                const p = db.products.find((x) => x.id === s.productId)
                const u = db.users.find((x) => x.id === s.userId)
                return (
                  <div key={s.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-ink-2/60 p-4">
                    <div className="min-w-[220px] flex-1">
                      <p className="font-semibold">{p?.titre ?? 'Produit supprimé'}</p>
                      <p className="text-[13px] text-cream/60">« {s.motif} »</p>
                      <p className="text-[12px] text-cream/35">Signalé par {u?.nom} · {dateHeureFr(s.createdAt)}</p>
                    </div>
                    <Badge tone={s.traite ? 'ok' : 'warn'}>{s.traite ? 'traité' : 'ouvert'}</Badge>
                    {!s.traite && (
                      <Btn size="sm" variant="outline" onClick={() => { const r = traiterSignalement(s.id); toast(r.message ?? '', r.ok ? 'ok' : 'err') }}>
                        Marquer traité
                      </Btn>
                    )}
                  </div>
                )
              })}
            </div>
          )
        )}

        {onglet === 'params' && (
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel>
              <h2 className="display mb-4 text-lg font-bold">Paramètres de la plateforme</h2>
              <div className="space-y-4">
                <Field label="Taux de commission (%)" type="number" min={0} max={30} value={commission} onChange={(e) => setCommission(e.target.value)} hint="Appliqué sur chaque nouvelle commande créée." />
                <Select label="Prestataire de paiement" value={prestataire} onChange={(e) => setPrestataire(e.target.value as any)}>
                  <option value="CinetPay">CinetPay</option>
                  <option value="PayDunya">PayDunya</option>
                </Select>
                <Select label="État de l’intégration" value={mode} onChange={(e) => setMode(e.target.value as any)}>
                  <option value="non_connecte">Non connectée (aucun encaissement possible)</option>
                  <option value="sandbox">Environnement de test</option>
                </Select>
                <Btn onClick={() => { const r = majParametres({ commission: Number(commission), prestataire, modePaiement: mode }); toast(r.message ?? '', r.ok ? 'ok' : 'err') }}>
                  Enregistrer les paramètres
                </Btn>
              </div>
            </Panel>

            <Panel>
              <h2 className="display mb-4 text-lg font-bold">Règles de sécurité appliquées</h2>
              <ul className="space-y-2.5 text-[13.5px] leading-relaxed text-cream/60">
                {[
                  'Mots de passe hachés (PBKDF2-SHA256, 120 000 itérations, sel unique).',
                  'Aucune clé secrète de paiement présente dans le frontend.',
                  'Aucun paiement n’est marqué « payé » sans notification vérifiée.',
                  'Le code PIN Mobile Money n’est jamais demandé par la plateforme.',
                  'Vérification du montant exact et de la devise XOF avant déblocage.',
                  'Idempotence : un identifiant de transaction ne peut être traité deux fois.',
                  'Cloisonnement : un vendeur ne peut modifier que sa boutique et ses produits.',
                  'Téléchargement réservé aux commandes au statut « payée ».',
                  'Validation des extensions de fichiers à la publication.',
                ].map((r) => (
                  <li key={r} className="flex gap-2"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-emeraude-soft" /> {r}</li>
                ))}
              </ul>
            </Panel>
          </div>
        )}
      </div>
    </Section>
  )
}

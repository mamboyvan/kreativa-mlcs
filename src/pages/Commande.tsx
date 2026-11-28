import { Link, useParams } from 'react-router-dom'
import { Clock, CheckCircle2, XCircle, Download, ArrowLeft, Smartphone, ShieldAlert } from 'lucide-react'
import { useStore } from '../lib/store'
import { Badge, Btn, Empty, Panel, Section } from '../components/ui'
import { useToast } from '../components/Toast'
import { dateHeureFr, fcfa } from '../lib/format'
import { STATUT_LABEL } from '../lib/constants'
import { track } from '../lib/analytics'

export default function Commande() {
  const { id } = useParams()
  const { db, user, annulerCommande } = useStore()
  const toast = useToast()

  const o = db.orders.find((x) => x.id === id)
  if (!o || !user || (o.buyerId !== user.id && user.role !== 'admin'))
    return (
      <Section className="py-24">
        <Empty titre="Commande introuvable" texte="Cette commande n’existe pas ou ne vous appartient pas." action={<Btn to="/compte">Mes commandes</Btn>} />
      </Section>
    )

  const tons = { en_attente: 'warn', payee: 'ok', echouee: 'bad', annulee: 'neutral' } as const
  const Icone = o.statut === 'payee' ? CheckCircle2 : o.statut === 'en_attente' ? Clock : XCircle

  return (
    <Section className="py-12">
      <Link to="/compte" className="mb-6 inline-flex items-center gap-2 text-sm text-cream/50 hover:text-mandarine">
        <ArrowLeft size={15} /> Mes commandes
      </Link>

      <div className="flex flex-wrap items-center gap-4">
        <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${o.statut === 'payee' ? 'bg-emeraude/15 text-emeraude-soft' : o.statut === 'en_attente' ? 'bg-sable/15 text-sable' : 'bg-red-500/10 text-red-300'}`}>
          <Icone size={26} />
        </span>
        <div>
          <h1 className="text-3xl font-extrabold">Commande {o.reference}</h1>
          <p className="mt-1 text-[13.5px] text-cream/45">Créée le {dateHeureFr(o.createdAt)} · {o.methode}</p>
        </div>
        <span className="ml-auto"><Badge tone={tons[o.statut]}>{STATUT_LABEL[o.statut]}</Badge></span>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-5">
          <Panel>
            <h2 className="display mb-4 text-lg font-bold">Articles ({o.items.length})</h2>
            <div className="space-y-3">
              {o.items.map((i) => (
                <div key={i.productId} className="flex items-center gap-4 rounded-xl border border-line bg-ink/40 p-3">
                  <img src={i.image} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/produit/${i.productId}`} className="line-clamp-1 font-semibold hover:text-mandarine">{i.titre}</Link>
                    <p className="text-[12.5px] text-cream/45">{fcfa(i.prix)}</p>
                  </div>
                  {o.statut === 'payee' ? (
                    <Btn size="sm" variant="soft" onClick={() => toast('Lien de téléchargement sécurisé généré pour votre compte.', 'ok')}>
                      <Download size={14} /> Télécharger
                    </Btn>
                  ) : (
                    <span className="text-[12px] text-cream/35">Verrouillé</span>
                  )}
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <h2 className="display mb-4 text-lg font-bold">Journal de la commande</h2>
            <ol className="space-y-3">
              {o.journal.map((j, k) => (
                <li key={k} className="flex gap-3 text-[13.5px]">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-mandarine" />
                  <span>
                    <span className="block text-cream/75">{j.message}</span>
                    <span className="block text-[12px] text-cream/35">{dateHeureFr(j.at)}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Panel>
            <h2 className="display mb-4 text-lg font-bold">Paiement</h2>
            <div className="space-y-2 text-[14px] text-cream/60">
              <div className="flex justify-between"><span>Référence</span><span className="font-mono text-[13px] text-cream">{o.reference}</span></div>
              <div className="flex justify-between"><span>Moyen choisi</span><span className="text-cream">{o.methode}</span></div>
              <div className="flex justify-between"><span>Devise</span><span className="text-cream">XOF</span></div>
              {o.transactionId && <div className="flex justify-between"><span>Transaction</span><span className="font-mono text-[12px] text-cream">{o.transactionId}</span></div>}
              <div className="flex justify-between border-t border-line pt-3 text-lg font-bold text-cream">
                <span>Total</span><span className="text-mandarine">{fcfa(o.total)}</span>
              </div>
            </div>

            {o.statut === 'en_attente' && (
              <>
                <div className="mt-5 rounded-xl border border-sable/30 bg-sable/8 p-3.5 text-[12.5px] leading-relaxed text-cream/65">
                  <p className="mb-2 flex items-center gap-2 font-semibold text-sable"><Smartphone size={14} /> Paiement en attente</p>
                  {db.settings.modePaiement === 'non_connecte'
                    ? `L’intégration ${db.settings.prestataire} n’est pas encore active sur ce compte marchand. Votre commande reste enregistrée : elle passera au statut « payée » dès qu’une notification de paiement vérifiée sera reçue par le serveur.`
                    : `Finalisez le paiement sur l’interface ${db.settings.prestataire}. Le statut sera mis à jour automatiquement à réception de la notification signée.`}
                </div>
                <Btn full variant="danger" className="mt-3" onClick={() => { const r = annulerCommande(o.id); toast(r.message ?? '', r.ok ? 'ok' : 'err') }}>
                  Annuler la commande
                </Btn>
              </>
            )}

            {o.statut === 'payee' && (
              <>
                <div className="mt-5 rounded-xl border border-emeraude/30 bg-emeraude/8 p-3.5 text-[12.5px] leading-relaxed text-cream/70">
                  Paiement vérifié (montant et devise conformes). Vos fichiers sont débloqués dans votre espace acheteur.
                </div>
                <Btn
                  full
                  variant="outline"
                  className="mt-3"
                  onClick={() => {
                    track('remboursement_demande', {
                      userId: o.buyerId,
                      meta: { reference: o.reference, montant: o.total },
                    })
                    toast('Demande de remboursement enregistrée. Le support vous répond sous 48 h ouvrées.', 'ok')
                  }}
                >
                  Demander un remboursement
                </Btn>
              </>
            )}
          </Panel>

          <Panel>
            <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-cream/50">
              <ShieldAlert size={15} className="mt-0.5 shrink-0 text-mandarine" />
              KREATIVA ne vous demandera jamais votre code PIN Mobile Money, ni par téléphone, ni par message. En cas de
              doute, contactez le support depuis le centre d’aide.
            </p>
          </Panel>
        </div>
      </div>
    </Section>
  )
}

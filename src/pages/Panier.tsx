import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, ShieldCheck, ArrowRight, Info } from 'lucide-react'
import { useStore } from '../lib/store'
import { Badge, Btn, Empty, Panel, Section } from '../components/ui'
import { useToast } from '../components/Toast'
import { fcfa } from '../lib/format'
import { MOYENS_PAIEMENT } from '../lib/constants'

export default function Panier() {
  const { panier, retirerDuPanier, viderPanier, creerCommande, user, db } = useStore()
  const toast = useToast()
  const nav = useNavigate()
  const [methode, setMethode] = useState(MOYENS_PAIEMENT[0].nom)
  const [charge, setCharge] = useState(false)

  const total = panier.reduce((s, p) => s + p.prix, 0)

  const commander = () => {
    if (!user) return nav('/connexion?suite=/panier')
    setCharge(true)
    const r = creerCommande(methode)
    setCharge(false)
    if (!r.ok) return toast(r.message ?? 'Erreur', 'err')
    toast(`Commande ${r.data.reference} créée.`, 'ok')
    nav(`/commande/${r.data.id}`)
  }

  if (panier.length === 0)
    return (
      <Section className="py-20">
        <h1 className="mb-8 text-4xl font-extrabold">Mon panier</h1>
        <Empty titre="Votre panier est vide" texte="Parcourez le catalogue et ajoutez des produits numériques à télécharger immédiatement." action={<Btn to="/produits">Explorer le catalogue</Btn>} />
      </Section>
    )

  return (
    <Section className="py-12">
      <h1 className="text-4xl font-extrabold sm:text-5xl">Mon panier</h1>
      <p className="mt-2 text-cream/55">{panier.length} produit{panier.length > 1 ? 's' : ''} numérique{panier.length > 1 ? 's' : ''} · livraison instantanée après paiement.</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-3">
          {panier.map((p) => {
            const shop = db.shops.find((s) => s.id === p.shopId)
            return (
              <div key={p.id} className="flex gap-4 rounded-2xl border border-line bg-ink-2/60 p-3.5">
                <Link to={`/produit/${p.id}`} className="h-24 w-32 shrink-0 overflow-hidden rounded-xl">
                  <img src={p.image} alt={p.titre} className="h-full w-full object-cover" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link to={`/produit/${p.id}`} className="display line-clamp-2 font-bold hover:text-mandarine">{p.titre}</Link>
                  <p className="mt-0.5 text-[12.5px] text-cream/45">{shop?.logo} {shop?.nom}</p>
                  <p className="mt-0.5 text-[12px] text-cream/35">{p.fichierNom} · {p.fichierTaille}</p>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="display text-lg font-extrabold">{fcfa(p.prix)}</span>
                    <button
                      onClick={() => { retirerDuPanier(p.id); toast('Produit retiré du panier.', 'info') }}
                      className="flex items-center gap-1.5 text-[12.5px] text-cream/40 hover:text-red-300"
                    >
                      <Trash2 size={14} /> Retirer
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
          <button onClick={() => { viderPanier(); toast('Panier vidé.', 'info') }} className="text-[13px] text-cream/40 hover:text-red-300">
            Vider le panier
          </button>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <Panel>
            <h2 className="display text-xl font-extrabold">Récapitulatif</h2>
            <div className="mt-4 space-y-2 text-[14px]">
              <div className="flex justify-between text-cream/60"><span>Sous-total</span><span>{fcfa(total)}</span></div>
              <div className="flex justify-between text-cream/60"><span>Frais de livraison</span><span className="text-emeraude-soft">0 FCFA (numérique)</span></div>
              <div className="flex justify-between border-t border-line pt-3 text-lg font-bold">
                <span>Total à payer</span><span className="text-mandarine">{fcfa(total)}</span>
              </div>
              <p className="text-[12px] text-cream/35">Devise : FCFA (XOF)</p>
            </div>

            <div className="mt-6">
              <p className="mb-2.5 text-[12.5px] font-semibold uppercase tracking-wider text-cream/55">Moyen de paiement</p>
              <div className="space-y-2">
                {MOYENS_PAIEMENT.map((m) => (
                  <label
                    key={m.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-[14px] transition ${
                      methode === m.nom ? 'border-mandarine bg-mandarine/10' : 'border-line hover:border-cream/25'
                    }`}
                  >
                    <input type="radio" name="paiement" checked={methode === m.nom} onChange={() => setMethode(m.nom)} className="accent-[#FF6A1F]" />
                    <span>{m.emoji}</span>
                    <span className="flex-1">{m.nom}</span>
                  </label>
                ))}
              </div>
            </div>

            <Btn full size="lg" className="mt-5" onClick={commander} disabled={charge}>
              Passer la commande <ArrowRight size={17} />
            </Btn>

            {!user && <p className="mt-2 text-center text-[12.5px] text-cream/45">Vous serez invité à vous connecter.</p>}

            <div className="mt-5 space-y-3 border-t border-line pt-5 text-[12.5px] leading-relaxed text-cream/50">
              <p className="flex items-start gap-2">
                <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emeraude-soft" />
                Aucun code PIN Mobile Money ne vous sera jamais demandé sur KREATIVA. La saisie se fait uniquement sur
                l’interface sécurisée de l’opérateur.
              </p>
              <p className="flex items-start gap-2">
                <Info size={15} className="mt-0.5 shrink-0 text-sable" />
                {db.settings.modePaiement === 'non_connecte'
                  ? `L’intégration ${db.settings.prestataire} n’est pas encore connectée : votre commande sera enregistrée au statut « en attente de paiement ».`
                  : `Environnement de test ${db.settings.prestataire} : seule une notification vérifiée côté serveur peut passer la commande au statut « payée ».`}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              <Badge>SSL</Badge>
              <Badge>Devise XOF</Badge>
              <Badge tone="ok">Fichiers protégés</Badge>
            </div>
          </Panel>
        </div>
      </div>
    </Section>
  )
}

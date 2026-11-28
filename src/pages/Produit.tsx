import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  BadgeCheck, Download, Flag, Lock, ShieldCheck, ShoppingBag, FileText, ArrowLeft, Check,
} from 'lucide-react'
import { useStore } from '../lib/store'
import { Badge, Btn, Empty, Panel, Section, Area } from '../components/ui'
import { useToast } from '../components/Toast'
import { catEmoji, catNom, MOYENS_PAIEMENT } from '../lib/constants'
import { dateFr, fcfa } from '../lib/format'
import ProductCard from '../components/ProductCard'
import { track } from '../lib/analytics'

export default function Produit() {
  const { id } = useParams()
  const { db, user, ajouterAuPanier, panier, aAcces, signaler } = useStore()
  const toast = useToast()
  const nav = useNavigate()
  const [motif, setMotif] = useState('')
  const [formSignal, setFormSignal] = useState(false)

  const p = db.products.find((x) => x.id === id)

  useEffect(() => {
    if (p && p.statut === 'publie')
      track('produit_vu', { productId: p.id, shopId: p.shopId, meta: { categorie: p.categorie, prix: p.prix, titre: p.titre } })
  }, [p?.id])

  if (!p)
    return (
      <Section className="py-24">
        <Empty titre="Produit introuvable" texte="Ce produit n’existe plus ou a été retiré de la vente." action={<Btn to="/produits">Retour au catalogue</Btn>} />
      </Section>
    )

  const shop = db.shops.find((s) => s.id === p.shopId)!
  const estProprio = user?.id === shop.ownerId
  const brouillon = p.statut === 'brouillon'

  if (brouillon && !estProprio && user?.role !== 'admin')
    return (
      <Section className="py-24">
        <Empty titre="Produit non disponible" texte="Ce produit n’est pas publié. Seul son vendeur peut le consulter." action={<Btn to="/produits">Voir le catalogue</Btn>} />
      </Section>
    )

  const possede = aAcces(p.id)
  const dansPanier = panier.some((x) => x.id === p.id)
  const similaires = db.products.filter((x) => x.statut === 'publie' && x.categorie === p.categorie && x.id !== p.id).slice(0, 3)

  const ajouter = () => {
    const r = ajouterAuPanier(p.id)
    toast(r.message ?? '', r.ok ? 'ok' : 'err')
  }

  const acheter = () => {
    if (!user) return nav(`/connexion?suite=/produit/${p.id}`)
    const r = ajouterAuPanier(p.id)
    if (!r.ok && !dansPanier) return toast(r.message ?? '', 'err')
    nav('/panier')
  }

  return (
    <Section className="py-10">
      <Link to="/produits" className="mb-6 inline-flex items-center gap-2 text-sm text-cream/50 hover:text-mandarine">
        <ArrowLeft size={15} /> Retour au catalogue
      </Link>

      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="relative overflow-hidden rounded-3xl border border-line">
            <img src={p.image} alt={p.titre} className="aspect-[16/10] w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
            <span className="absolute left-4 top-4 rounded-full bg-ink/85 px-3 py-1.5 text-[12.5px] font-semibold backdrop-blur">
              {catEmoji(p.categorie)} {catNom(p.categorie)}
            </span>
            {brouillon && <span className="absolute right-4 top-4 rounded-full bg-sable px-3 py-1.5 text-[12px] font-bold text-ink">Brouillon — visible par vous seul</span>}
          </div>

          <h1 className="mt-7 text-3xl font-extrabold leading-tight sm:text-[40px]">{p.titre}</h1>

          <Link to={`/boutique/${shop.slug}`} className="mt-4 inline-flex items-center gap-3 rounded-2xl border border-line bg-ink-2/60 px-4 py-3 transition hover:border-mandarine/40">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl text-2xl" style={{ background: `linear-gradient(135deg, ${shop.couleur}33, #1C1917)` }}>
              {shop.logo}
            </span>
            <span>
              <span className="flex items-center gap-1.5 font-bold">
                {shop.nom} {shop.verifiee && <BadgeCheck size={14} className="text-emeraude-soft" />}
              </span>
              <span className="block text-[12.5px] text-cream/45">Voir la boutique du créateur</span>
            </span>
          </Link>

          <div className="mt-8">
            <h2 className="display mb-3 text-lg font-bold">Description</h2>
            <p className="whitespace-pre-wrap text-[15.5px] leading-relaxed text-cream/65">{p.description}</p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Panel>
              <h3 className="display mb-3 text-[15px] font-bold">Détails du fichier</h3>
              <ul className="space-y-2 text-[14px] text-cream/60">
                <li className="flex items-center gap-2"><FileText size={15} className="text-mandarine" /> {p.fichierNom}</li>
                <li className="flex items-center gap-2"><Download size={15} className="text-mandarine" /> Taille : {p.fichierTaille}</li>
                <li className="flex items-center gap-2"><ShieldCheck size={15} className="text-emeraude-soft" /> Accès à vie après paiement</li>
              </ul>
            </Panel>
            <Panel>
              <h3 className="display mb-3 text-[15px] font-bold">Informations</h3>
              <ul className="space-y-2 text-[14px] text-cream/60">
                <li>Publié le {dateFr(p.createdAt)}</li>
                <li>{p.ventes} téléchargements vendus</li>
                <li>Devise : FCFA (XOF)</li>
              </ul>
            </Panel>
          </div>

          <div className="mt-8">
            {!formSignal ? (
              <button onClick={() => setFormSignal(true)} className="inline-flex items-center gap-2 text-[13px] text-cream/40 hover:text-mandarine">
                <Flag size={13} /> Signaler ce produit
              </button>
            ) : (
              <Panel>
                <Area label="Motif du signalement" rows={3} value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Expliquez le problème (contenu trompeur, piratage, etc.)" />
                <div className="mt-3 flex gap-2">
                  <Btn
                    size="sm"
                    onClick={() => {
                      const r = signaler(p.id, motif)
                      toast(r.message ?? '', r.ok ? 'ok' : 'err')
                      if (r.ok) { setMotif(''); setFormSignal(false) }
                    }}
                  >
                    Envoyer
                  </Btn>
                  <Btn size="sm" variant="ghost" onClick={() => setFormSignal(false)}>Annuler</Btn>
                </div>
              </Panel>
            )}
          </div>
        </div>

        {/* COLONNE ACHAT */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Panel>
            <p className="text-[12.5px] uppercase tracking-wider text-cream/45">Prix</p>
            <p className="display mt-1 text-4xl font-extrabold">{p.prix === 0 ? 'Gratuit' : fcfa(p.prix)}</p>
            <p className="mt-1 text-[13px] text-cream/45">Téléchargement immédiat après confirmation du paiement.</p>

            <div className="mt-6 space-y-2.5">
              {possede ? (
                <>
                  <Badge tone="ok"><Check size={12} /> Vous avez accès à ce produit</Badge>
                  <Btn full size="lg" variant="soft" onClick={() => toast('Lien de téléchargement sécurisé généré pour votre compte.', 'ok')}>
                    <Download size={17} /> Télécharger le fichier
                  </Btn>
                  <Btn full variant="ghost" to="/compte">Voir mes achats</Btn>
                </>
              ) : estProprio ? (
                <>
                  <Badge tone="accent">Vous êtes le vendeur de ce produit</Badge>
                  <Btn full to="/vendeur" variant="soft">Modifier ce produit</Btn>
                </>
              ) : (
                <>
                  <Btn full size="lg" onClick={acheter}>
                    <ShoppingBag size={17} /> Acheter maintenant
                  </Btn>
                  <Btn full variant="outline" onClick={ajouter} disabled={dansPanier}>
                    {dansPanier ? 'Déjà dans le panier' : 'Ajouter au panier'}
                  </Btn>
                </>
              )}
            </div>

            <div className="mt-6 border-t border-line pt-5">
              <p className="mb-3 text-[12.5px] font-semibold uppercase tracking-wider text-cream/45">Moyens de paiement prévus</p>
              <div className="flex flex-wrap gap-1.5">
                {MOYENS_PAIEMENT.map((m) => (
                  <span key={m.id} className="rounded-full border border-line px-2.5 py-1 text-[11.5px] text-cream/55">
                    {m.emoji} {m.nom}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-ink-3/70 p-3.5 text-[12.5px] leading-relaxed text-cream/50">
              <Lock size={15} className="mt-0.5 shrink-0 text-emeraude-soft" />
              Le fichier n’est jamais accessible publiquement. Le lien de téléchargement est généré uniquement pour une
              commande au statut « payée », après vérification du montant et de la devise côté serveur.
            </div>
          </Panel>
        </div>
      </div>

      {similaires.length > 0 && (
        <div className="mt-20">
          <h2 className="mb-6 text-2xl font-extrabold">Dans la même catégorie</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similaires.map((s, i) => <ProductCard key={s.id} p={s} index={i} />)}
          </div>
        </div>
      )}
    </Section>
  )
}
